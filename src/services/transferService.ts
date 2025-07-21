import { Account, TransferRequest, TransferResult, FXRate } from '../types.js';
import { mockAPI } from './mockApi.js';

export class TransferService {
  
  /**
   * Elicitation: If the user does not specify a target account, the system will try to infer the best one.
   * This is an example of prompting for missing information in an agentic way.
   */
  async findBestTargetAccount(fromAccountId: string, preferredCurrency?: string): Promise<string | null> {
    const fromAccount = await mockAPI.getAccount(fromAccountId);
    if (!fromAccount) return null;

    const allAccounts = await mockAPI.getAllAccounts();
    const targetAccounts = allAccounts.filter(acc => 
      acc.id !== fromAccountId && 
      acc.status === 'active'
    );

    if (targetAccounts.length === 0) return null;

    // If preferred currency specified, try to find it
    if (preferredCurrency) {
      const preferred = targetAccounts.find(acc => acc.currency === preferredCurrency);
      if (preferred) return preferred.id;
    }

    // Otherwise, find account with different currency and lowest balance (diversification)
    const differentCurrency = targetAccounts.filter(acc => acc.currency !== fromAccount.currency);
    if (differentCurrency.length > 0) {
      return differentCurrency.reduce((min, acc) => 
        acc.balance < min.balance ? acc : min
      ).id;
    }

    // Fallback to any available account
    return targetAccounts[0].id;
  }

  /**
   * Agentic thinking: Before executing a transfer, the system checks all relevant pre-conditions.
   * This includes account existence, status, balance, transfer limits, and FX rate thresholds.
   * If any condition fails, the system returns detailed errors instead of proceeding blindly.
   */
  async validatePreConditions(request: TransferRequest): Promise<{ valid: boolean; errors: string[] }> {
    const errors: string[] = [];

    // Get source account
    const fromAccount = await mockAPI.getAccount(request.fromAccount);
    if (!fromAccount) {
      errors.push(`Source account ${request.fromAccount} not found`);
      return { valid: false, errors };
    }

    // Elicitation: If toAccount is missing, try to infer it automatically
    if (!request.toAccount) {
        const bestAccount = await this.findBestTargetAccount(request.fromAccount);
        request.toAccount = bestAccount ?? undefined;
        if (!request.toAccount) {
          errors.push('No suitable target account found');
          return { valid: false, errors };
        }
      }

    const toAccount = await mockAPI.getAccount(request.toAccount);
    if (!toAccount) {
      errors.push(`Target account ${request.toAccount} not found`);
      return { valid: false, errors };
    }

    // Agentic: Check account status
    if (fromAccount.status !== 'active') {
      errors.push(`Source account is ${fromAccount.status}`);
    }
    if (toAccount.status !== 'active') {
      errors.push(`Target account is ${toAccount.status}`);
    }

    // Agentic: Check balance
    if (fromAccount.balance < request.amount) {
      errors.push(`Insufficient funds. Available: ${fromAccount.balance}, Required: ${request.amount}`);
    }

    // Agentic: Check transfer limits
    if (request.amount > fromAccount.dailyTransferLimit) {
      errors.push(`Amount exceeds daily transfer limit of ${fromAccount.dailyTransferLimit}`);
    }

    if (fromAccount.transfersToday + request.amount > fromAccount.dailyTransferLimit) {
      errors.push(`Transfer would exceed daily limit. Today's transfers: ${fromAccount.transfersToday}`);
    }

    if (fromAccount.transfersThisMonth + request.amount > fromAccount.monthlyTransferLimit) {
      errors.push(`Transfer would exceed monthly limit. This month's transfers: ${fromAccount.transfersThisMonth}`);
    }

    // Agentic: FX threshold check if different currencies
    if (fromAccount.currency !== toAccount.currency && request.fxThreshold) {
      const fxRate = await mockAPI.getFXRate(fromAccount.currency, toAccount.currency);
      if (!fxRate) {
        errors.push(`FX rate not available for ${fromAccount.currency} to ${toAccount.currency}`);
      } else if (fxRate.rate > request.fxThreshold) {
        errors.push(`FX rate ${fxRate.rate} exceeds threshold ${request.fxThreshold}`);
      }
    }

    return { valid: errors.length === 0, errors };
  }

  /**
   * Agentic thinking: Only execute the transfer if all pre-conditions are satisfied.
   * Otherwise, return a detailed error message.
   */
  async executeTransfer(request: TransferRequest): Promise<TransferResult> {
    // Pre-condition validation (agentic thinking)
    const validation = await this.validatePreConditions(request);
    if (!validation.valid) {
      return {
        success: false,
        message: `Transfer failed: ${validation.errors.join(', ')}`
      };
    }


    const fromAccount = await mockAPI.getAccount(request.fromAccount);
    const toAccount = await mockAPI.getAccount(request.toAccount!);

    if (!fromAccount || !toAccount) {
    return {
        success: false,
        message: "One of the accounts could not be found."
    };
    }

    let finalAmount = request.amount;
    let exchangeRate = 1;
    let fee = 0;

    // Agentic: Handle currency conversion and FX fee if needed
    if (fromAccount.currency !== toAccount.currency) {
      const fxRate = await mockAPI.getFXRate(fromAccount.currency, toAccount.currency);
      if (!fxRate) {
        return {
          success: false,
          message: `FX rate not available for ${fromAccount.currency} to ${toAccount.currency}`
        };
      }
      
      exchangeRate = fxRate.rate;
      finalAmount = request.amount * exchangeRate;
      fee = finalAmount * 0.001; // 0.1% FX fee
      finalAmount -= fee;
    }

    // Execute the transfer
    const newFromBalance = fromAccount.balance - request.amount;
    const newToBalance = toAccount.balance + finalAmount;

    await mockAPI.updateAccountBalance(request.fromAccount, newFromBalance);
    await mockAPI.updateAccountBalance(request.toAccount!, newToBalance);
    await mockAPI.updateTransferCounts(request.fromAccount, request.amount);

    const transactionId = `TXN-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

    return {
      success: true,
      transactionId,
      message: `Transfer completed successfully`,
      details: {
        fromAccount: request.fromAccount,
        toAccount: request.toAccount!,
        amount: request.amount,
        exchangeRate: exchangeRate !== 1 ? exchangeRate : undefined,
        fee,
        finalAmount
      }
    };
  }
}