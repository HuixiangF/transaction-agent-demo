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
  console.log("🤖 OpenRouter API initialized");
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
  console.log("🏦 Connected to transaction banking MCP server");

  try {
    // Test intelligent transfer (user didn't specify target account)
    console.log("\n=== INTELLIGENT TRANSFER TEST ===");
    console.log("🎯 User request: 'Transfer 800 AUD from my AUD account if FX below 0.7'");
    
    const intelligentTransfer = await client.callTool({
      name: "transferFunds",
      arguments: {
        amount: 800,
        fromAccount: "AUD-account",
        fxThreshold: 0.7,
        preferredCurrency: "USD" // AI could infer this from context
      },
    });

    console.log("🔄 Transfer Result:", JSON.stringify(intelligentTransfer, null, 2));

    // Validate before transfer
    console.log("\n=== PRE-CONDITION VALIDATION TEST ===");
    const validation = await client.callTool({
      name: "validateTransfer",
      arguments: {
        amount: 15000, // This should exceed limits
        fromAccount: "AUD-account"
      },
    });

    console.log("✅ Validation Result:", JSON.stringify(validation, null, 2));

    // Get FX rates
    console.log("\n=== FX RATES TEST ===");
    const fxRate = await client.callTool({
      name: "getFXRate", 
      arguments: {
        from: "AUD",
        to: "USD"
      },
    });

    console.log("💱 FX Rate:", JSON.stringify(fxRate, null, 2));

    // Portfolio overview
    console.log("\n=== PORTFOLIO OVERVIEW ===");
    const allAccounts = await client.callTool({
      name: "getAllAccounts",
      arguments: {}
    });

    console.log("💼 All Accounts:", JSON.stringify(allAccounts, null, 2));

    // Test advanced prompts
    console.log("\n=== SMART PROMPTS TEST ===");
    const promptsList = await client.listPrompts();
    console.log("📝 Available Prompts:", JSON.stringify(promptsList, null, 2));

    if (promptsList.prompts && promptsList.prompts.length > 0) {
      const transferAdvisor = await client.getPrompt({
        name: "transfer_advisor",
        arguments: {
          fromAccount: "AUD-account",
          amount: "800"
        }
      });

      console.log("🎯 Transfer Advisor Prompt:", JSON.stringify(transferAdvisor, null, 2));

      // Use AI to analyze the prompt if available
      if (openai && transferAdvisor.messages && transferAdvisor.messages[0]) {
        console.log("\n🤖 AI ANALYSIS OF TRANSFER RECOMMENDATION:");
        const aiAdvice = await analyzeWithAI(transferAdvisor.messages[0].content.text as string);
        console.log(aiAdvice);
      }
    }

    // Real-world scenario testing
    console.log("\n=== REAL-WORLD SCENARIO SIMULATION ===");
    
    // Scenario 1: User says "I want to move some money to USD"
    console.log("\n📱 User: 'I want to move some money to USD'");
    const scenarioTransfer = await client.callTool({
      name: "transferFunds",
      arguments: {
        amount: 1000,
        fromAccount: "AUD-account", 
        preferredCurrency: "USD"
        // Note: no toAccount specified, no fxThreshold
      },
    });
    console.log("🎯 Smart Transfer:", JSON.stringify(scenarioTransfer, null, 2));

    // Scenario 2: Check what would happen with different amounts
    console.log("\n📱 User: 'What if I transferred 5000 instead?'");
    const bigTransferValidation = await client.callTool({
      name: "validateTransfer",
      arguments: {
        amount: 5000,
        fromAccount: "AUD-account",
        preferredCurrency: "USD"
      },
    });
    console.log("⚖️ Validation for larger amount:", JSON.stringify(bigTransferValidation, null, 2));

    console.log("\n✅ Enhanced client testing completed!");

  } catch (error) {
    console.error("❌ Error during enhanced client execution:", error);
  } finally {
    await client.close();
    console.log("🔌 Enhanced client connection closed");
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
      max_tokens: 1000,
      temperature: 0.7,
    });

    return completion.choices[0]?.message?.content || "No response received";
  } catch (error) {
    console.error(`AI API error:`, error);
    return `Error calling AI API: ${error instanceof Error ? error.message : 'Unknown error'}`;
  }
}

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n👋 Shutting down enhanced client gracefully...');
  process.exit(0);
});

runEnhancedClient().catch((err) => {
  console.error("Enhanced client error:", err);
  process.exit(1);
});