import { Account, FXRate } from '../types.js';

class MockBankingAPI {
  private accounts: Map<string, Account> = new Map();
  private fxRates: Map<string, FXRate> = new Map();

  constructor() {
    this.initializeAccounts();
    this.initializeFXRates();
  }

  private initializeAccounts() {
    const accounts: Account[] = [
      {
        id: 'AUD-account',
        currency: 'AUD',
        balance: 5000,
        status: 'active',
        dailyTransferLimit: 10000,
        monthlyTransferLimit: 50000,
        transfersToday: 0,
        transfersThisMonth: 2500
      },
      {
        id: 'USD-account',
        currency: 'USD',
        balance: 3200,
        status: 'active',
        dailyTransferLimit: 8000,
        monthlyTransferLimit: 40000,
        transfersToday: 500,
        transfersThisMonth: 1800
      },
      {
        id: 'EUR-account',
        currency: 'EUR',
        balance: 2800,
        status: 'active',
        dailyTransferLimit: 7000,
        monthlyTransferLimit: 35000,
        transfersToday: 0,
        transfersThisMonth: 1200
      }
    ];

    accounts.forEach(account => {
      this.accounts.set(account.id, account);
    });
  }

  private initializeFXRates() {
    const rates: FXRate[] = [
      { from: 'AUD', to: 'USD', rate: 0.65, timestamp: Date.now() },
      { from: 'AUD', to: 'EUR', rate: 0.60, timestamp: Date.now() },
      { from: 'USD', to: 'AUD', rate: 1.54, timestamp: Date.now() },
      { from: 'USD', to: 'EUR', rate: 0.92, timestamp: Date.now() },
      { from: 'EUR', to: 'AUD', rate: 1.67, timestamp: Date.now() },
      { from: 'EUR', to: 'USD', rate: 1.09, timestamp: Date.now() }
    ];

    rates.forEach(rate => {
      this.fxRates.set(`${rate.from}-${rate.to}`, rate);
    });
  }

  async getAccount(accountId: string): Promise<Account | null> {
    return this.accounts.get(accountId) || null;
  }

  async getAllAccounts(): Promise<Account[]> {
    return Array.from(this.accounts.values());
  }

  async getFXRate(from: string, to: string): Promise<FXRate | null> {
    return this.fxRates.get(`${from}-${to}`) || null;
  }

  async updateAccountBalance(accountId: string, newBalance: number): Promise<boolean> {
    const account = this.accounts.get(accountId);
    if (!account) return false;
    
    account.balance = newBalance;
    this.accounts.set(accountId, account);
    return true;
  }

  async updateTransferCounts(accountId: string, amount: number): Promise<boolean> {
    const account = this.accounts.get(accountId);
    if (!account) return false;
    
    account.transfersToday += amount;
    account.transfersThisMonth += amount;
    this.accounts.set(accountId, account);
    return true;
  }
}

export const mockAPI = new MockBankingAPI();