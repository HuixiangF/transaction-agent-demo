// // src/client.ts
// import { Client } from "@modelcontextprotocol/sdk/client/index.js";
// import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
// import OpenAI from 'openai';
// import dotenv from 'dotenv';

// // 加载环境变量
// dotenv.config();

// // 初始化 OpenRouter 客户端
// let openai: OpenAI | null = null;
// if (process.env.OPENROUTER_API_KEY) {
//   openai = new OpenAI({
//     baseURL: 'https://openrouter.ai/api/v1',
//     apiKey: process.env.OPENROUTER_API_KEY,
//     defaultHeaders: {
//       'HTTP-Referer': process.env.SITE_URL || 'http://localhost:3000',
//       'X-Title': process.env.SITE_NAME || 'Banking MCP Client',
//     },
//   });
//   console.log("🤖 OpenRouter API initialized");
// } else {
//   console.log("⚠️  No OPENROUTER_API_KEY found. Running without AI integration.");
// }

// async function runClient() {
//   const transport = new StdioClientTransport({
//     command: "tsx",         
//     args: ["src/banking-mcp-server.ts"],  
//   });

//   const client = new Client({
//     name: "banking-client",
//     version: "1.0.0",
//   });

//   await client.connect(transport);
//   console.log("🏦 Connected to banking MCP server");

//   try {
//     // 调用 transferFunds 工具
//     console.log("\n--- Testing Transfer Funds ---");
//     const transferResult = await client.callTool({
//       name: "transferFunds",
//       arguments: {
//         amount: 800,
//         fromAccount: "AUD-account",
//         fxThreshold: 0.7,
//       },
//     });

//     console.log("Transfer Result:", JSON.stringify(transferResult, null, 2));

//     // 调用 getAccountDetails 工具
//     console.log("\n--- Testing Account Details ---");
//     const accountResult = await client.callTool({
//       name: "getAccountDetails",
//       arguments: {
//         accountId: "AUD-account",
//       },
//     });

//     console.log("Account Details Result:", JSON.stringify(accountResult, null, 2));

//     // 测试 prompts 功能
//     console.log("\n--- Testing Prompts ---");
//     const promptsList = await client.listPrompts();
//     console.log("Available Prompts:", JSON.stringify(promptsList, null, 2));

//     // 如果有可用的 prompts，尝试调用第一个
//     if (promptsList.prompts && promptsList.prompts.length > 0) {
//       const firstPrompt = promptsList.prompts[0];
//       console.log(`\n--- Testing Prompt: ${firstPrompt.name} ---`);
      
//       try {
//         const promptResult = await client.getPrompt({
//           name: firstPrompt.name,
//           arguments: {
//             accountId: "AUD-account", 
//           }
//         });
//         console.log("Prompt Result:", JSON.stringify(promptResult, null, 2));
//       } catch (error) {
//         console.log("Prompt execution failed:", error.message);
//       }
//     }

//     // 测试工具列表
//     console.log("\n--- Testing Tools ---");
//     const toolsList = await client.listTools();
//     console.log("Available Tools:", JSON.stringify(toolsList, null, 2));

//     // === OpenRouter AI 集成部分 ===
//     if (openai) {
//       console.log("\n" + "=".repeat(50));
//       console.log("🤖 AI ANALYSIS VIA OPENROUTER");
//       console.log("=".repeat(50));

//       // 1. 让 AI 分析转账结果
//       console.log("\n--- AI Analysis: Transfer Result ---");
//       const transferAnalysis = await analyzeWithAI(
//         `Please analyze this bank transfer result and provide insights:
        
// Transfer Details: ${JSON.stringify(transferResult, null, 2)}

// Please provide:
// 1. Transaction success assessment
// 2. Any potential risks or concerns
// 3. Recommendations for future transfers`
//       );
//       console.log("AI Transfer Analysis:");
//       console.log(transferAnalysis);

//       // 2. 让 AI 分析账户详情
//       console.log("\n--- AI Analysis: Account Details ---");
//       const accountAnalysis = await analyzeWithAI(
//         `Please analyze this bank account information:
        
// Account Details: ${JSON.stringify(accountResult, null, 2)}

// Please provide:
// 1. Account health assessment
// 2. Risk evaluation
// 3. Optimization suggestions
// 4. Any red flags or concerns`
//       );
//       console.log("AI Account Analysis:");
//       console.log(accountAnalysis);

//       // 3. 综合分析
//       console.log("\n--- AI Analysis: Overall Financial Health ---");
//       const overallAnalysis = await analyzeWithAI(
//         `As a financial advisor, please provide a comprehensive analysis based on this banking data:

// Transfer Result: ${JSON.stringify(transferResult, null, 2)}
// Account Details: ${JSON.stringify(accountResult, null, 2)}
// Available Tools: ${JSON.stringify(toolsList.tools?.map(t => ({name: t.name, description: t.description})), null, 2)}

// Please provide:
// 1. Overall financial health score (1-10)
// 2. Key strengths and weaknesses
// 3. Immediate action items
// 4. Long-term strategy recommendations
// 5. Risk management suggestions

// Be specific and actionable in your recommendations.`
//       );
//       console.log("AI Overall Financial Analysis:");
//       console.log(overallAnalysis);

//       // 4. 多模型比较分析（使用不同的模型）
//       console.log("\n--- Multi-Model Analysis Comparison ---");
      
//       const models = [
//         'anthropic/claude-3-sonnet',
//         'openai/gpt-4o',
//         'meta-llama/llama-3.1-8b-instruct'
//       ];

//       const analysisPrompt = `In one paragraph, what's the most important insight about this banking situation?
      
// Account: ${JSON.stringify(accountResult, null, 2)}
// Transfer: ${JSON.stringify(transferResult, null, 2)}`;

//       for (const model of models) {
//         try {
//           console.log(`\n🔍 ${model} says:`);
//           const modelAnalysis = await analyzeWithAI(analysisPrompt, model);
//           console.log(modelAnalysis);
//         } catch (error) {
//           console.log(`❌ ${model} failed: ${error.message}`);
//         }
//       }

//       // 5. 智能对话式分析
//       console.log("\n--- Interactive AI Q&A ---");
//       const conversationQuestions = [
//         "What would happen if I transferred twice this amount?",
//         "How risky is my current financial position?", 
//         "Should I diversify my currency holdings?",
//         "What's one thing I should do immediately?"
//       ];

//       for (const question of conversationQuestions) {
//         console.log(`\n❓ Question: ${question}`);
//         const answer = await analyzeWithAI(
//           `Context: Account Details: ${JSON.stringify(accountResult, null, 2)}
// Transfer Result: ${JSON.stringify(transferResult, null, 2)}

// Question: ${question}

// Please provide a concise, actionable answer based on the banking data provided.`
//         );
//         console.log(`🤖 AI: ${answer}`);
//       }

//       // 6. 基于分析的自动化建议
//       console.log("\n--- Automated Recommendations ---");
      
//       const shouldCheckOtherAccounts = overallAnalysis.toLowerCase().includes('usd') || 
//                                       overallAnalysis.toLowerCase().includes('diversif');
      
//       if (shouldCheckOtherAccounts) {
//         console.log("🔍 AI suggests checking other accounts...");
//         try {
//           const usdAccountResult = await client.callTool({
//             name: "getAccountDetails", 
//             arguments: {
//               accountId: "USD-account",
//             },
//           });
//           console.log("USD Account Details:", JSON.stringify(usdAccountResult, null, 2));

//           // 比较分析
//           const comparisonAnalysis = await analyzeWithAI(
//             `Compare these two accounts and provide currency allocation advice:
            
// AUD Account: ${JSON.stringify(accountResult, null, 2)}
// USD Account: ${JSON.stringify(usdAccountResult, null, 2)}
// Recent Transfer: ${JSON.stringify(transferResult, null, 2)}

// What's the optimal currency split? Should I rebalance?`
//           );
//           console.log("AI Currency Allocation Analysis:");
//           console.log(comparisonAnalysis);

//         } catch (error) {
//           console.log("Could not retrieve USD account:", error.message);
//         }
//       }
//     }

//     console.log("\n✅ All tests completed successfully!");

//   } catch (error) {
//     console.error("❌ Error during client execution:", error);
//   } finally {
//     await client.close();
//     console.log("🔌 Client connection closed");
//   }
// }

// // Helper function to call OpenRouter API
// async function analyzeWithAI(prompt: string, model: string = 'anthropic/claude-3-sonnet'): Promise<string> {
//   if (!openai) {
//     return "AI API not available (no API key provided)";
//   }

//   try {
//     const completion = await openai.chat.completions.create({
//       model: model,
//       messages: [
//         {
//           role: 'user',
//           content: prompt,
//         },
//       ],
//       max_tokens: 1500,
//       temperature: 0.7,
//     });

//     return completion.choices[0]?.message?.content || "No response received";
//   } catch (error) {
//     console.error(`AI API error with model ${model}:`, error);
//     return `Error calling AI API: ${error.message}`;
//   }
// }

// // Enhanced error handling
// process.on('unhandledRejection', (reason, promise) => {
//   console.error('Unhandled Rejection at:', promise, 'reason:', reason);
// });

// process.on('uncaughtException', (error) => {
//   console.error('Uncaught Exception:', error);
//   process.exit(1);
// });

// // Graceful shutdown
// process.on('SIGINT', () => {
//   console.log('\n👋 Shutting down gracefully...');
//   process.exit(0);
// });

// runClient().catch((err) => {
//   console.error("Client error:", err);
//   process.exit(1);
// });


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
      'X-Title': process.env.SITE_NAME || 'Enhanced Banking MCP Client',
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
    name: "enhanced-banking-client", 
    version: "1.0.0",
  });

  await client.connect(transport);
  console.log("🏦 Connected to enhanced banking MCP server");

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