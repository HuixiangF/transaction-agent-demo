import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import OpenAI from 'openai';
import dotenv from 'dotenv';

dotenv.config();

let openai: OpenAI | null = null;
if (process.env.OPENROUTER_API_KEY) {
  openai = new OpenAI({
    baseURL: 'https://openrouter.ai/api/v1',
    apiKey: process.env.OPENROUTER_API_KEY,
    defaultHeaders: {
      'HTTP-Referer': process.env.SITE_URL || 'http://localhost:3000',
      'X-Title': process.env.SITE_NAME || 'Transaction Banking Agent MCP',
    },
  });
  console.log("OpenRouter API initialized");
}

async function runEnhancedClient() {
  const transport = new StdioClientTransport({
    command: "tsx",
    args: ["src/banking-mcp-server.ts"],
  });

  const client = new Client({
    name: "transaction-banking-agent-mcp", 
    version: "1.0.0",
  });

  await client.connect(transport);
  console.log("Connected to enhanced banking MCP server");

  try {
    // First, list available tools to verify connection
    console.log("\n=== AVAILABLE TOOLS ===");
    const tools = await client.listTools();
    console.log("Available tools:", tools.tools?.map(t => t.name) || []);

    // Test 1: Smart Transfer Intent Analysis
    console.log("\n=== INTENT ANALYSIS TEST ===");
    console.log("User says: 'I want to move 800 to USD if the rate is good'");
    
    const intentAnalysis = await client.callTool({
      name: "analyzeTransferIntent",
      arguments: {
        userInput: "I want to move 800 to USD if the rate is good",
        providedArgs: {
          amount: 800,
          preferredCurrency: "USD"
        }
      }
    });
    
    console.log("Intent Analysis:", JSON.stringify(intentAnalysis, null, 2));

    // Test 2: Smart Transfer with Reasoning
    console.log("\n=== SMART TRANSFER TEST ===");
    console.log("User request: 'Transfer 800 AUD to USD account'");
    
    const smartTransfer = await client.callTool({
      name: "smartTransferFunds",
      arguments: {
        userInput: "Transfer 800 AUD to USD account",
        amount: 800,
        fromAccount: "AUD-account",
        preferredCurrency: "USD"
      }
    });

    console.log("Smart Transfer Result:", JSON.stringify(smartTransfer, null, 2));

    // Test 3: Incomplete Request (should trigger elicitation)
    console.log("\n=== ELICITATION TEST ===");
    console.log("User says: 'I want to move some money'");
    
    const incompleteTransfer = await client.callTool({
      name: "smartTransferFunds",
      arguments: {
        userInput: "I want to move some money"
        // Note: no amount, no accounts specified
      }
    });

    console.log("Elicitation Response:", JSON.stringify(incompleteTransfer, null, 2));

    // Test 4: Intelligent Account Check
    console.log("\n=== INTELLIGENT ACCOUNT CHECK ===");
    console.log("User asks: 'How's my AUD account doing?'");
    
    const accountCheck = await client.callTool({
      name: "intelligentAccountCheck",
      arguments: {
        userInput: "How's my AUD account doing?",
        accountId: "AUD-account"
      }
    });

    console.log("Account Analysis:", JSON.stringify(accountCheck, null, 2));

    // Test 5: Transfer with Pre-condition Failures
    console.log("\n=== PRE-CONDITION FAILURE TEST ===");
    console.log("User tries to transfer too much money");
    
    const failureTest = await client.callTool({
      name: "smartTransferFunds",
      arguments: {
        userInput: "Transfer all my money to USD",
        amount: 50000, // This should exceed limits
        fromAccount: "AUD-account",
        preferredCurrency: "USD"
      }
    });

    console.log("Failure Handling:", JSON.stringify(failureTest, null, 2));

    // Test 6: Traditional tool still works
    console.log("\n=== BACKWARD COMPATIBILITY TEST ===");
    const traditionalTransfer = await client.callTool({
      name: "validateTransfer", // Original tool
      arguments: {
        amount: 1000,
        fromAccount: "AUD-account"
      }
    });

    console.log("Traditional Tool:", JSON.stringify(traditionalTransfer, null, 2));

    // Test 7: Account inference test
    console.log("\n=== ACCOUNT INFERENCE TEST ===");
    const inferenceTest = await client.callTool({
      name: "intelligentAccountCheck",
      arguments: {
        userInput: "Check my USD balance"
        // No accountId specified - should infer from "USD" mention
      }
    });

    console.log("Account Inference:", JSON.stringify(inferenceTest, null, 2));

    // Test 8: Get all accounts for context
    console.log("\n=== PORTFOLIO OVERVIEW ===");
    const allAccounts = await client.callTool({
      name: "getAllAccounts",
      arguments: {}
    });

    console.log("All Accounts:", JSON.stringify(allAccounts, null, 2));

    // Test 9: Real-world scenario with AI analysis
    console.log("\n=== REAL-WORLD SCENARIO WITH AI ===");
    if (openai) {
      const scenarioAnalysis = await client.callTool({
        name: "analyzeTransferIntent",
        arguments: {
          userInput: "I'm worried about the exchange rate, should I transfer my AUD to USD now or wait?",
          providedArgs: {
            fromAccount: "AUD-account"
          }
        }
      });

      console.log("AI-Ready Analysis:", JSON.stringify(scenarioAnalysis, null, 2));

      // Use AI to provide advice based on the analysis
      if (Array.isArray(scenarioAnalysis.content)) {
        for (const item of scenarioAnalysis.content) {
          if (item?.text) {
            const aiAdvice = await analyzeWithAI(
              `Based on this banking analysis: ${item.text}\n\nProvide practical advice for the user about whether to transfer AUD to USD now or wait.`
            );
            console.log("AI Advice:", aiAdvice);
          }
        }
      }
    }

    console.log("\nEnhanced client testing completed successfully!");

  } catch (error) {
    console.error("Error during client execution:", error);
    
    // Enhanced error reporting
    if (error instanceof Error) {
      console.error("Error details:", {
        name: error.name,
        message: error.message,
        stack: error.stack?.split('\n').slice(0, 5).join('\n') // First 5 lines of stack
      });
    }
  } finally {
    await client.close();
    console.log("Client connection closed");
  }
}

async function analyzeWithAI(prompt: string, model: string = 'anthropic/claude-3-sonnet'): Promise<string> {
  if (!openai) {
    return "AI analysis not available (no API key provided)";
  }

  try {
    const completion = await openai.chat.completions.create({
      model: model,
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 700,
      temperature: 0.7,
    });

    return completion.choices[0]?.message?.content || "No response received";
  } catch (error) {
    console.error(`AI API error:`, error);
    return `Error calling AI API: ${error instanceof Error ? error.message : 'Unknown error'}`;
  }
}

// Enhanced shutdown handling
process.on('SIGINT', () => {
  console.log('\nGracefully shutting down client...');
  process.exit(0);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Add some debugging environment info
console.log("Debug Info:");
console.log("- Node version:", process.version);
console.log("- Working directory:", process.cwd());
console.log("- OpenRouter API key present:", !!process.env.OPENROUTER_API_KEY);

runEnhancedClient().catch((err) => {
  console.error("Client startup error:", err);
  console.error("Stack trace:", err.stack);
  process.exit(1);
});