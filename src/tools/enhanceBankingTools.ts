import { TransferService } from '../services/transferService.js';
import { ReasoningService } from '../services/reasoningService.js';
import { mockAPI } from '../services/mockApi.js';
import { bankingTools, handleToolCall } from './bankingTools.js'; // Fixed import

const transferService = new TransferService();
const reasoningService = new ReasoningService();

export const enhancedBankingTools = [
  {
    name: "smartTransferFunds",
    description: "Intelligent transfer with context analysis, elicitation, and pre-condition checking",
    inputSchema: {
      type: "object",
      properties: {
        userInput: {
          type: "string",
          description: "The user's original request or intent"
        },
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
      required: ["userInput"]
    }
  },
  {
    name: "analyzeTransferIntent",
    description: "Analyze incomplete transfer requests and provide elicitation prompts",
    inputSchema: {
      type: "object",
      properties: {
        userInput: {
          type: "string",
          description: "The user's transfer request"
        },
        providedArgs: {
          type: "object",
          description: "Any arguments already provided"
        }
      },
      required: ["userInput"]
    }
  },
  {
    name: "intelligentAccountCheck",
    description: "Smart account analysis with contextual recommendations",
    inputSchema: {
      type: "object",
      properties: {
        userInput: {
          type: "string",
          description: "User's request about account information"
        },
        accountId: {
          type: "string",
          description: "Account ID to analyze (optional - will infer if not provided)"
        }
      },
      required: ["userInput"]
    }
  },
  // Include original tools for backward compatibility
  ...bankingTools
];

export async function handleEnhancedToolCall(name: string, args: any): Promise<any> {
  console.log(`Handling enhanced tool: ${name}`);
  
  try {
    switch (name) {
      case "smartTransferFunds":
        return await executeSmartTransfer(args);
        
      case "analyzeTransferIntent":
        return await analyzeTransferIntent(args);
        
      case "intelligentAccountCheck":
        return await executeIntelligentAccountCheck(args);
        
      default:
        // Fall back to original tool handlers
        console.log(`Falling back to original tool handler for: ${name}`);
        return await handleToolCall(name, args);
    }
  } catch (error) {
    console.error(`Error in handleEnhancedToolCall for ${name}:`, error);
    throw error;
  }
}

/**
 * AGENTIC THINKING: Execute smart transfer with comprehensive reasoning
 */
async function executeSmartTransfer(args: any): Promise<any> {
  console.log("Executing smart transfer with reasoning");
  const { userInput, ...transferArgs } = args;
  
  try {
    // Step 1: ELICITATION - Analyze intent and missing information
    console.log("Step 1: Analyzing user intent");
    const reasoningContext = await reasoningService.analyzeUserIntent(userInput, transferArgs);
    
    // If critical information is missing, return elicitation prompts
    if (reasoningContext.requiresElicitation) {
      const highPriorityPrompts = reasoningContext.elicitationPrompts.filter(p => p.priority === 'high');
      
      if (highPriorityPrompts.length > 0) {
        console.log("Returning elicitation prompts");
        return {
          needsElicitation: true,
          intent: reasoningContext.userIntent,
          missingInfo: reasoningContext.missingInfo,
          questions: highPriorityPrompts,
          context: "I need some additional information to process your transfer safely.",
          suggestedActions: reasoningContext.recommendations
        };
      }
    }
    
    // Step 2: AGENTIC THINKING - Determine required pre-checks
    console.log("Step 2: Determining pre-checks");
    const requiredPreChecks = await reasoningService.determineRequiredPreChecks(
      reasoningContext.userIntent, 
      transferArgs
    );
    
    console.log(`Determined required pre-checks: ${requiredPreChecks.join(', ')}`);
    
    // Step 3: Execute pre-checks
    console.log("Step 3: Executing pre-checks");
    const preCheckResults = await reasoningService.executePreChecks(requiredPreChecks, transferArgs);
    
    // Step 4: Analyze pre-check results and decide on action
    console.log("Step 4: Analyzing pre-check results");
    const criticalFailures = Object.entries(preCheckResults).filter(([check, result]: [string, any]) => {
      if (check === 'validate_account_status') return !result.valid;
      if (check === 'check_balance_sufficiency') return !result.sufficient;
      if (check === 'verify_transfer_limits') return !result.valid;
      return false;
    });
    
    if (criticalFailures.length > 0) {
      console.log("Critical failures detected, cannot proceed");
      return {
        canProceed: false,
        reason: "Pre-condition checks failed",
        failures: criticalFailures.map(([check, result]) => ({
          check,
          issues: result.issues || [result.reason]
        })),
        suggestions: generateFailureRecoveryOptions(criticalFailures, transferArgs),
        preCheckResults
      };
    }
    
    // Step 5: If all checks pass, execute the transfer
    console.log("Step 5: All checks passed, executing transfer");
    const transferResult = await transferService.executeTransfer(transferArgs);
    
    return {
      success: transferResult.success,
      transfer: transferResult,
      reasoning: {
        intent: reasoningContext.userIntent,
        preChecksExecuted: requiredPreChecks,
        risks: reasoningContext.risks,
        recommendations: reasoningContext.recommendations
      },
      preCheckResults
    };
    
  } catch (error) {
    console.error("Error in executeSmartTransfer:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      toolName: 'smartTransferFunds'
    };
  }
}

/**
 * ELICITATION: Analyze incomplete requests and provide guidance
 */
async function analyzeTransferIntent(args: any): Promise<any> {
  console.log("Analyzing transfer intent");
  const { userInput, providedArgs = {} } = args;
  
  try {
    const reasoningContext = await reasoningService.analyzeUserIntent(userInput, providedArgs);
    
    return {
      analysis: {
        detectedIntent: reasoningContext.userIntent,
        confidence: reasoningContext.userIntent !== 'unclear' ? 'high' : 'low',
        missingInformation: reasoningContext.missingInfo,
        identifiedRisks: reasoningContext.risks
      },
      elicitation: {
        required: reasoningContext.requiresElicitation,
        prompts: reasoningContext.elicitationPrompts,
        priorityOrder: reasoningContext.elicitationPrompts
          .sort((a, b) => {
            const priority: { [key: string]: number } = { high: 3, medium: 2, low: 1 };
            return priority[b.priority] - priority[a.priority];
          })
      },
      recommendations: reasoningContext.recommendations,
      nextSteps: generateNextSteps(reasoningContext)
    };
  } catch (error) {
    console.error("Error in analyzeTransferIntent:", error);
    return {
      error: error instanceof Error ? error.message : 'Unknown error',
      toolName: 'analyzeTransferIntent'
    };
  }
}

/**
 * INTELLIGENT ACCOUNT CHECKING: Context-aware account analysis
 */
async function executeIntelligentAccountCheck(args: any): Promise<any> {
  console.log("Executing intelligent account check");
  const { userInput, accountId } = args;
  
  try {
    // AGENTIC THINKING: Determine what the user really wants to know
    const intent = extractAccountIntent(userInput);
    let targetAccountId = accountId;
    
    // If no account specified, try to infer from context
    if (!targetAccountId) {
      targetAccountId = await inferAccountFromContext(userInput);
    }
    
    // Still no account? Provide elicitation
    if (!targetAccountId) {
      const allAccounts = await mockAPI.getAllAccounts();
      return {
        needsElicitation: true,
        question: "Which account would you like me to analyze?",
        options: allAccounts.map(acc => ({
          id: acc.id,
          display: `${acc.currency} Account (Balance: ${acc.balance})`
        })),
        detectedIntent: intent
      };
    }
    
    const account = await mockAPI.getAccount(targetAccountId);
    if (!account) {
      return {
        error: `Account ${targetAccountId} not found`,
        availableAccounts: (await mockAPI.getAllAccounts()).map(acc => acc.id)
      };
    }
    
    // AGENTIC REASONING: Provide contextual analysis based on intent
    const analysis = await generateContextualAccountAnalysis(account, intent);
    
    return {
      account,
      analysis,
      intent,
      recommendations: await generateAccountRecommendations(account, intent)
    };
  } catch (error) {
    console.error("💥 Error in executeIntelligentAccountCheck:", error);
    return {
      error: error instanceof Error ? error.message : 'Unknown error',
      toolName: 'intelligentAccountCheck'
    };
  }
}

// Helper functions for reasoning and elicitation

function generateFailureRecoveryOptions(failures: any[], transferArgs: any): string[] {
  const suggestions = [];
  
  for (const [check, result] of failures) {
    if (check === 'check_balance_sufficiency') {
      suggestions.push(`Consider transferring ${result.available} instead of ${transferArgs.amount}`);
    }
    if (check === 'verify_transfer_limits') {
      if (result.dailyRemaining) {
        suggestions.push(`Transfer up to ${result.dailyRemaining} today, or wait until tomorrow`);
      }
    }
  }
  
  return suggestions;
}

function generateNextSteps(context: any): string[] {
  const steps = [];
  
  if (context.requiresElicitation) {
    const highPriority = context.elicitationPrompts.filter((p: any) => p.priority === 'high');
    if (highPriority.length > 0) {
      steps.push(`Please provide: ${highPriority.map((p: any) => p.question).join(', ')}`);
    }
  }
  
  if (context.risks.length > 0) {
    steps.push("Review the identified risks before proceeding");
  }
  
  if (steps.length === 0) {
    steps.push("Ready to execute transfer with provided information");
  }
  
  return steps;
}

function extractAccountIntent(userInput: string): string {
  const input = userInput.toLowerCase();
  
  if (input.includes('balance')) return 'check_balance';
  if (input.includes('limit') || input.includes('transfer')) return 'check_limits';
  if (input.includes('status')) return 'check_status';
  if (input.includes('history') || input.includes('transaction')) return 'check_history';
  
  return 'general_info';
}

async function inferAccountFromContext(userInput: string): Promise<string | null> {
  const input = userInput.toLowerCase();
  
  // Try to extract currency from user input
  if (input.includes('aud')) return 'AUD-account';
  if (input.includes('usd')) return 'USD-account';
  if (input.includes('eur')) return 'EUR-account';
  
  return null;
}

async function generateContextualAccountAnalysis(account: any, intent: string): Promise<any> {
  const analysis: any = {
    healthScore: calculateAccountHealth(account),
    utilizationAnalysis: calculateUtilization(account)
  };
  
  switch (intent) {
    case 'check_balance':
      analysis.balanceAnalysis = {
        current: account.balance,
        trend: "stable", // Would be calculated from historical data
        comparative: await compareToOtherAccounts(account)
      };
      break;
      
    case 'check_limits':
      analysis.limitAnalysis = {
        daily: {
          limit: account.dailyTransferLimit,
          used: account.transfersToday,
          remaining: account.dailyTransferLimit - account.transfersToday,
          utilizationPercentage: (account.transfersToday / account.dailyTransferLimit) * 100
        },
        monthly: {
          limit: account.monthlyTransferLimit,
          used: account.transfersThisMonth,
          remaining: account.monthlyTransferLimit - account.transfersThisMonth,
          utilizationPercentage: (account.transfersThisMonth / account.monthlyTransferLimit) * 100
        }
      };
      break;
  }
  
  return analysis;
}

async function generateAccountRecommendations(account: any, intent: string): Promise<string[]> {
  const recommendations = [];
  
  if (account.balance < 1000) {
    recommendations.push("Consider maintaining a higher balance for better account flexibility");
  }
  
  if (account.transfersThisMonth > account.monthlyTransferLimit * 0.8) {
    recommendations.push("Approaching monthly transfer limit - plan upcoming transfers carefully");
  }
  
  if (account.currency === 'AUD') {
    recommendations.push("Consider diversifying into other currencies if you have international exposure");
  }
  
  return recommendations;
}

function calculateAccountHealth(account: any): number {
  let score = 100;
  
  if (account.balance < 500) score -= 20;
  else if (account.balance < 1000) score -= 10;
  
  const monthlyUtilization = account.transfersThisMonth / account.monthlyTransferLimit;
  if (monthlyUtilization > 0.9) score -= 30;
  else if (monthlyUtilization > 0.7) score -= 15;
  
  if (account.status !== 'active') score -= 50;
  
  return Math.max(score, 0);
}

function calculateUtilization(account: any): any {
  return {
    dailyTransferUtilization: (account.transfersToday / account.dailyTransferLimit) * 100,
    monthlyTransferUtilization: (account.transfersThisMonth / account.monthlyTransferLimit) * 100,
    balanceUtilization: "N/A"
  };
}

async function compareToOtherAccounts(account: any): Promise<any> {
  const allAccounts = await mockAPI.getAllAccounts();
  const otherAccounts = allAccounts.filter(acc => acc.id !== account.id);
  
  if (otherAccounts.length === 0) return null;
  
  const avgBalance = otherAccounts.reduce((sum, acc) => sum + acc.balance, 0) / otherAccounts.length;
  
  return {
    compared_to_average: account.balance > avgBalance ? "above" : "below",
    difference: Math.abs(account.balance - avgBalance),
    percentile: calculatePercentile(account.balance, otherAccounts.map(acc => acc.balance))
  };
}

function calculatePercentile(value: number, values: number[]): number {
  const sorted = values.sort((a, b) => a - b);
  const index = sorted.findIndex(v => v >= value);
  return index === -1 ? 100 : (index / sorted.length) * 100;
}