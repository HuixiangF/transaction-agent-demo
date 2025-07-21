// src/types.ts
export interface Account {
    id: string;
    currency: 'AUD' | 'USD' | 'EUR' | 'GBP';
    balance: number;
    status: 'active' | 'frozen' | 'closed';
    dailyTransferLimit: number;
    monthlyTransferLimit: number;
    transfersToday: number;
    transfersThisMonth: number;
}

export interface TransferRequest {
    amount: number;
    fromAccount: string;
    toAccount?: string;
    fxThreshold?: number;
    currency?: string;
}

export interface TransferResult {
    success: boolean;
    transactionId?: string;
    message: string;
    details?: {
        fromAccount: string;
        toAccount: string;
        amount: number;
        exchangeRate?: number;
        fee: number;
        finalAmount: number;
    };
}

export interface FXRate {
from: string;
to: string;
rate: number;
timestamp: number;
}