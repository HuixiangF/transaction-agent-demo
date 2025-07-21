import { Account, TransferRequest, TransferResult, FXRate } from '../types.js';
import { mockAPI } from './mockApi.js';

export class TransferService {
  
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

  async validatePreConditions(request: TransferRequest): Promise<{ valid: boolean; errors: string[] }> {
    const errors: string[] = [];

    // Get source account
    const fromAccount = await mockAPI.getAccount(request.fromAccount);
    if (!fromAccount) {
      errors.push(`Source account ${request.fromAccount} not found`);
      return { valid: false, errors };
    }

    // Resolve target account if not specified
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

    // Account status checks
    if (fromAccount.status !== 'active') {
      errors.push(`Source account is ${fromAccount.status}`);
    }
    if (toAccount.status !== 'active') {
      errors.push(`Target account is ${toAccount.status}`);
    }

    // Balance check
    if (fromAccount.balance < request.amount) {
      errors.push(`Insufficient funds. Available: ${fromAccount.balance}, Required: ${request.amount}`);
    }

    // Transfer limits
    if (request.amount > fromAccount.dailyTransferLimit) {
      errors.push(`Amount exceeds daily transfer limit of ${fromAccount.dailyTransferLimit}`);
    }

    if (fromAccount.transfersToday + request.amount > fromAccount.dailyTransferLimit) {
      errors.push(`Transfer would exceed daily limit. Today's transfers: ${fromAccount.transfersToday}`);
    }

    if (fromAccount.transfersThisMonth + request.amount > fromAccount.monthlyTransferLimit) {
      errors.push(`Transfer would exceed monthly limit. This month's transfers: ${fromAccount.transfersThisMonth}`);
    }

    // FX threshold check if different currencies
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

  async executeTransfer(request: TransferRequest): Promise<TransferResult> {
    // Pre-condition validation
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

    // Handle currency conversion
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