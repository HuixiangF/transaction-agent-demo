import { TransferService } from '../services/transferService.js';
import { mockAPI } from '../services/mockApi.js';

const transferService = new TransferService();

export const bankingTools = [
  {
    name: "transferFunds",
    description: "Transfer funds between accounts with intelligent target selection and pre-condition validation",
    inputSchema: {
      type: "object",
      properties: {
        amount: {
          type: "number",
          description: "Amount to transfer"
        },
        fromAccount: {
          type: "string", 
          description: "Source account ID"
        },
        toAccount: {
          type: "string",
          description: "Target account ID (optional - will auto-select if not provided)"
        },
        fxThreshold: {
          type: "number",
          description: "Maximum acceptable FX rate (optional)"
        },
        preferredCurrency: {
          type: "string",
          description: "Preferred target currency (USD, EUR, GBP) when auto-selecting target"
        }
      },
      required: ["amount", "fromAccount"]
    }
  },
  {
    name: "getAccountDetails",
    description: "Get detailed information about a specific account",
    inputSchema: {
      type: "object",
      properties: {
        accountId: {
          type: "string",
          description: "Account ID to retrieve details for"
        }
      },
      required: ["accountId"]
    }
  },
  {
    name: "getAllAccounts", 
    description: "Get summary of all user accounts",
    inputSchema: {
      type: "object",
      properties: {},
      required: []
    }
  },
  {
    name: "getFXRate",
    description: "Get current foreign exchange rate between two currencies",
    inputSchema: {
      type: "object",
      properties: {
        from: {
          type: "string",
          description: "Source currency (AUD, USD, EUR, GBP)"
        },
        to: {
          type: "string", 
          description: "Target currency (AUD, USD, EUR, GBP)"
        }
      },
      required: ["from", "to"]
    }
  },
  {
    name: "validateTransfer",
    description: "Validate a transfer request without executing it",
    inputSchema: {
      type: "object",
      properties: {
        amount: { type: "number" },
        fromAccount: { type: "string" },
        toAccount: { type: "string" },
        fxThreshold: { type: "number" }
      },
      required: ["amount", "fromAccount"]
    }
  }
];

export async function handleToolCall(name: string, arg: any): Promise<any> {
  switch (name) {
    case "transferFunds":
      return await transferService.executeTransfer(arg);
      
    case "getAccountDetails":
      const account = await mockAPI.getAccount(arg.accountId);
      if (!account) {
        return { error: `Account ${arg.accountId} not found` };
      }
      return account;
      
    case "getAllAccounts":
      return await mockAPI.getAllAccounts();
      
    case "getFXRate":
      const rate = await mockAPI.getFXRate(arg.from, arg.to);
      if (!rate) {
        return { error: `FX rate not available for ${arg.from} to ${arg.to}` };
      }
      return rate;
      
    case "validateTransfer":
      const validation = await transferService.validatePreConditions(arg);
      return {
        valid: validation.valid,
        errors: validation.errors,
        suggestedTarget: validation.valid ? null : await transferService.findBestTargetAccount(arg.fromAccount)
      };
      
    default:
      return { error: `Unknown tool: ${name}` };
  }
}