// src/services/reasoningService.ts
import { Account, TransferRequest } from '../types.js';
import { mockAPI } from './mockApi.js';

export interface ElicitationPrompt {
  question: string;
  context: string;
  suggestedOptions?: string[];
  priority: 'high' | 'medium' | 'low';
}

export interface ReasoningContext {
  userIntent: string;
  missingInfo: string[];
  risks: string[];
  recommendations: string[];
  requiresElicitation: boolean;
  elicitationPrompts: ElicitationPrompt[];
}

export class ReasoningService {
  
  /**
   * ELICITATION: Analyze incomplete user input and generate clarifying questions
   */
  async analyzeUserIntent(userInput: string, providedArgs: any): Promise<ReasoningContext> {
    const context: ReasoningContext = {
      userIntent: this.extractIntent(userInput),
      missingInfo: [],
      risks: [],
      recommendations: [],
      requiresElicitation: false,
      elicitationPrompts: []
    };

    // Check for missing critical information
    await this.checkMissingInformation(context, userInput, providedArgs);
    
    // Assess risks based on provided information
    await this.assessRisks(context, providedArgs);
    
    // Generate recommendations
    await this.generateRecommendations(context, providedArgs);

    return context;
  }

  private extractIntent(userInput: string): string {
    const input = userInput.toLowerCase();
    
    if (input.includes('transfer') || input.includes('move') || input.includes('send')) {
      return 'transfer_funds';
    }
    if (input.includes('balance') || input.includes('account') || input.includes('check')) {
      return 'check_account';
    }
    if (input.includes('rate') || input.includes('exchange') || input.includes('fx')) {
      return 'check_fx_rate';
    }
    if (input.includes('all') || input.includes('portfolio') || input.includes('overview')) {
      return 'portfolio_overview';
    }
    
    return 'unclear';
  }

  private async checkMissingInformation(context: ReasoningContext, userInput: string, args: any): Promise<void> {
    const input = userInput.toLowerCase();

    // For transfer intent, check what's missing
    if (context.userIntent === 'transfer_funds') {
      if (!args.amount && !this.extractAmountFromText(input)) {
        context.missingInfo.push('amount');
        context.elicitationPrompts.push({
          question: "How much would you like to transfer?",
          context: "I need to know the transfer amount to proceed safely.",
          priority: 'high'
        });
      }

      if (!args.fromAccount && !this.extractAccountFromText(input)) {
        const accounts = await mockAPI.getAllAccounts();
        context.missingInfo.push('fromAccount');
        context.elicitationPrompts.push({
          question: "Which account would you like to transfer from?",
          context: "Please specify the source account for the transfer.",
          suggestedOptions: accounts.map(acc => `${acc.currency} account (${acc.id})`),
          priority: 'high'
        });
      }

      // Smart elicitation for target account
      if (!args.toAccount && !args.preferredCurrency) {
        const accounts = await mockAPI.getAllAccounts();
        const currencies = [...new Set(accounts.map(acc => acc.currency))];
        context.elicitationPrompts.push({
          question: "Which currency or account would you prefer for the destination?",
          context: "I can suggest the best target account, but knowing your preference helps.",
          suggestedOptions: currencies.map(curr => `${curr} account`),
          priority: 'medium'
        });
      }

      // Contextual elicitation for FX threshold
      if (args.fromAccount && !args.fxThreshold) {
        const fromAccount = await mockAPI.getAccount(args.fromAccount);
        if (fromAccount && await this.involvesCurrencyConversion(fromAccount, args)) {
          context.elicitationPrompts.push({
            question: "Do you have a maximum acceptable exchange rate for this transfer?",
            context: "This transfer involves currency conversion. Setting a threshold can protect you from unfavorable rates.",
            priority: 'low'
          });
        }
      }
    }

    context.requiresElicitation = context.elicitationPrompts.length > 0;
  }

  private async assessRisks(context: ReasoningContext, args: any): Promise<void> {
    if (!args.fromAccount || !args.amount) return;

    const fromAccount = await mockAPI.getAccount(args.fromAccount);
    if (!fromAccount) return;

    // High transfer amount risk
    if (args.amount > fromAccount.balance * 0.8) {
      context.risks.push("Large transfer amount (>80% of account balance)");
    }

    // Daily limit risk
    if (fromAccount.transfersToday + args.amount > fromAccount.dailyTransferLimit * 0.9) {
      context.risks.push("Approaching daily transfer limit");
    }

    // Monthly limit risk
    if (fromAccount.transfersThisMonth + args.amount > fromAccount.monthlyTransferLimit * 0.8) {
      context.risks.push("Approaching monthly transfer limit");
    }

    // FX rate risk (if no threshold set)
    if (!args.fxThreshold && await this.involvesCurrencyConversion(fromAccount, args)) {
      context.risks.push("No FX rate protection set for currency conversion");
    }
  }

  private async generateRecommendations(context: ReasoningContext, args: any): Promise<void> {
    if (!args.fromAccount) return;

    const fromAccount = await mockAPI.getAccount(args.fromAccount);
    const allAccounts = await mockAPI.getAllAccounts();
    
    if (!fromAccount) return;

    // Recommend optimal target account
    if (!args.toAccount && args.amount) {
      const suggestedTarget = await this.suggestOptimalTarget(fromAccount, allAccounts, args.amount);
      if (suggestedTarget) {
        context.recommendations.push(`Consider transferring to ${suggestedTarget.currency} account for better diversification`);
      }
    }

    // Recommend transfer timing
    if (await this.involvesCurrencyConversion(fromAccount, args)) {
      context.recommendations.push("Consider monitoring FX rates over the next few days for better conversion rates");
    }

    // Recommend amount optimization
    if (args.amount && args.amount < 100) {
      context.recommendations.push("Small transfers may have proportionally higher fees. Consider consolidating smaller amounts.");
    }
  }

  /**
   * AGENTIC THINKING: Determine what pre-checks are needed based on context
   */
  async determineRequiredPreChecks(intent: string, args: any): Promise<string[]> {
    const preChecks: string[] = [];

    switch (intent) {
      case 'transfer_funds':
        preChecks.push('validate_account_status');
        preChecks.push('check_balance_sufficiency');
        preChecks.push('verify_transfer_limits');
        
        if (await this.involvesCurrencyConversion(await mockAPI.getAccount(args.fromAccount), args)) {
          preChecks.push('check_fx_rates');
          preChecks.push('assess_fx_risk');
        }
        
        if (args.amount > 5000) {
          preChecks.push('verify_large_transfer_authorization');
        }
        break;

      case 'check_account':
        preChecks.push('verify_account_access');
        break;

      case 'portfolio_overview':
        preChecks.push('aggregate_account_data');
        preChecks.push('calculate_portfolio_metrics');
        break;
    }

    return preChecks;
  }

  /**
   * Execute intelligent pre-checks based on context
   */
  async executePreChecks(preChecks: string[], args: any): Promise<{ [key: string]: any }> {
    const results: { [key: string]: any } = {};

    for (const check of preChecks) {
      switch (check) {
        case 'validate_account_status':
          results[check] = await this.validateAccountStatus(args.fromAccount, args.toAccount);
          break;
        
        case 'check_balance_sufficiency':
          results[check] = await this.checkBalanceSufficiency(args.fromAccount, args.amount);
          break;
        
        case 'verify_transfer_limits':
          results[check] = await this.verifyTransferLimits(args.fromAccount, args.amount);
          break;
        
        case 'check_fx_rates':
          results[check] = await this.checkFXRates(args);
          break;
        
        case 'assess_fx_risk':
          results[check] = await this.assessFXRisk(args);
          break;
        
        case 'verify_large_transfer_authorization':
          results[check] = await this.verifyLargeTransferAuth(args.amount);
          break;
      }
    }

    return results;
  }

  // Helper methods for pre-checks
  private async validateAccountStatus(fromAccountId?: string, toAccountId?: string): Promise<any> {
    const results = { valid: true, issues: [] };
    
    if (fromAccountId) {
      const fromAccount = await mockAPI.getAccount(fromAccountId);
      if (!fromAccount) {
        results.valid = false;
        results.issues.push(`Source account ${fromAccountId} not found`);
      } else if (fromAccount.status !== 'active') {
        results.valid = false;
        results.issues.push(`Source account is ${fromAccount.status}`);
      }
    }

    if (toAccountId) {
      const toAccount = await mockAPI.getAccount(toAccountId);
      if (!toAccount) {
        results.valid = false;
        results.issues.push(`Target account ${toAccountId} not found`);
      } else if (toAccount.status !== 'active') {
        results.valid = false;
        results.issues.push(`Target account is ${toAccount.status}`);
      }
    }

    return results;
  }

  private async checkBalanceSufficiency(accountId: string, amount: number): Promise<any> {
    const account = await mockAPI.getAccount(accountId);
    if (!account) {
      return { sufficient: false, reason: 'Account not found' };
    }

    const sufficient = account.balance >= amount;
    return {
      sufficient,
      available: account.balance,
      required: amount,
      reason: sufficient ? null : 'Insufficient funds'
    };
  }

  private async verifyTransferLimits(accountId: string, amount: number): Promise<any> {
    const account = await mockAPI.getAccount(accountId);
    if (!account) return { valid: false, reason: 'Account not found' };

    const issues = [];
    
    if (amount > account.dailyTransferLimit) {
      issues.push(`Exceeds daily limit of ${account.dailyTransferLimit}`);
    }
    
    if (account.transfersToday + amount > account.dailyTransferLimit) {
      issues.push(`Would exceed daily limit (used: ${account.transfersToday})`);
    }
    
    if (account.transfersThisMonth + amount > account.monthlyTransferLimit) {
      issues.push(`Would exceed monthly limit (used: ${account.transfersThisMonth})`);
    }

    return {
      valid: issues.length === 0,
      issues,
      dailyRemaining: account.dailyTransferLimit - account.transfersToday,
      monthlyRemaining: account.monthlyTransferLimit - account.transfersThisMonth
    };
  }

  private async checkFXRates(args: any): Promise<any> {
    const fromAccount = await mockAPI.getAccount(args.fromAccount);
    if (!fromAccount) return null;

    let targetCurrency = args.preferredCurrency;
    if (args.toAccount) {
      const toAccount = await mockAPI.getAccount(args.toAccount);
      targetCurrency = toAccount?.currency;
    }

    if (!targetCurrency || fromAccount.currency === targetCurrency) {
      return { required: false };
    }

    const rate = await mockAPI.getFXRate(fromAccount.currency, targetCurrency);
    return {
      required: true,
      rate: rate?.rate,
      timestamp: rate?.timestamp,
      pair: `${fromAccount.currency}/${targetCurrency}`
    };
  }

  private async assessFXRisk(args: any): Promise<any> {
    const fxInfo = await this.checkFXRates(args);
    if (!fxInfo.required) return { risk: 'none' };

    const risks = [];
    if (!args.fxThreshold) {
      risks.push('No rate threshold set');
    }

    return {
      risk: risks.length > 0 ? 'medium' : 'low',
      issues: risks,
      currentRate: fxInfo.rate
    };
  }

  private async verifyLargeTransferAuth(amount: number): Promise<any> {
    // Simulate authorization check for large transfers
    return {
      required: amount > 10000,
      authorized: true, // In real system, this would check actual authorization
      threshold: 10000
    };
  }

  // Utility methods
  private extractAmountFromText(input: string): number | null {
    const amountMatch = input.match(/(\d+(?:\.\d+)?)/);
    return amountMatch ? parseFloat(amountMatch[1]) : null;
  }

  private extractAccountFromText(input: string): string | null {
    const accountMatch = input.match(/(aud|usd|eur|gbp)[\s\-]?account/i);
    return accountMatch ? `${accountMatch[1].toUpperCase()}-account` : null;
  }

  private async involvesCurrencyConversion(fromAccount: Account | null, args: any): Promise<boolean> {
    if (!fromAccount) return false;
    
    if (args.toAccount) {
      const toAccount = await mockAPI.getAccount(args.toAccount);
      return toAccount ? fromAccount.currency !== toAccount.currency : false;
    }
    
    return args.preferredCurrency && fromAccount.currency !== args.preferredCurrency;
  }

  private async suggestOptimalTarget(fromAccount: Account, allAccounts: Account[], amount: number): Promise<Account | null> {
    const targetAccounts = allAccounts.filter(acc => 
      acc.id !== fromAccount.id && 
      acc.status === 'active'
    );

    if (targetAccounts.length === 0) return null;

    // Find account with different currency and capacity for the transfer
    const differentCurrency = targetAccounts.filter(acc => 
      acc.currency !== fromAccount.currency
    );

    if (differentCurrency.length > 0) {
      // Prefer account with lower balance for diversification
      return differentCurrency.reduce((min, acc) => 
        acc.balance < min.balance ? acc : min
      );
    }

    return targetAccounts[0];
  }
}