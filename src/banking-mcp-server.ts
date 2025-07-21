// import { Server } from "@modelcontextprotocol/sdk/server/index.js";
// import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
// import { z } from "zod";
import { 
  CallToolRequestSchema, 
  CallToolResultSchema,
  ListPromptsRequestSchema,
  GetPromptRequestSchema,
  ListToolsRequestSchema
} from "@modelcontextprotocol/sdk/types.js";
// import { readFileSync } from "fs";
// import { join, dirname } from "path";
// import { fileURLToPath } from "url";

// // 获取当前文件的目录路径（ES 模块兼容）
// const __filename = fileURLToPath(import.meta.url);
// const __dirname = dirname(__filename);

// // 模拟账户和汇率的简单“Mock API”
// async function getFxRate(from: string, to: string): Promise<number> {
//   if (from === "AUD" && to === "USD") return 0.65;
//   return 1;
// }

// async function getAccountBalance(accountId: string): Promise<number> {
//   if (accountId === "AUD-account") return 1000;
//   if (accountId === "USD-account") return 500;
//   return 0;
// }

// async function transferFunds(fromAccountId: string, toAccountId: string, amount: number): Promise<boolean> {
//   console.log(`Transferring ${amount} from ${fromAccountId} to ${toAccountId}`);
//   return true;
// }

// async function getAccountDetails(accountId: string): Promise<{
//   balance: number;
//   currency: string;
//   status: string;
//   lastTransaction: string;
// }> {
//   const balance = await getAccountBalance(accountId);
//   return {
//     balance,
//     currency: accountId.includes("AUD") ? "AUD" : "USD",
//     status: "active",
//     lastTransaction: new Date().toISOString()
//   };
// }

// async function main() {
//   const server = new Server({
//     name: "banking-agent",
//     version: "1.0.0"
//   });

//   // 处理工具调用
//   server.setRequestHandler(CallToolRequestSchema, async (request) => {
//     if (request.params.name === "transferFunds") {
//       const { amount, fromAccount, toAccount, fxThreshold } = request.params.arguments as {
//         amount: number;
//         fromAccount: string;
//         toAccount?: string;
//         fxThreshold?: number;
//       };
      
//       const targetAccount = toAccount || "USD-account";
//       const fx = await getFxRate("AUD", "USD");

//       if (fxThreshold !== undefined && fx > fxThreshold) {
//         return { content: [{ type: "text", text: `FX rate ${fx} is above threshold ${fxThreshold}, abort transfer.` }] };
//       }

//       const balance = await getAccountBalance(fromAccount);
//       if (balance < amount) {
//         return { content: [{ type: "text", text: `Insufficient balance in account ${fromAccount}.` }] };
//       }

//       const success = await transferFunds(fromAccount, targetAccount, amount);
//       if (!success) {
//         return { content: [{ type: "text", text: `Transfer failed due to system error.` }] };
//       }

//       return { content: [{ type: "text", text: `Successfully transferred ${amount} from ${fromAccount} to ${targetAccount} at FX rate ${fx}.` }] };
//     }
    
//     if (request.params.name === "getAccountDetails") {
//       const { accountId } = request.params.arguments as {
//         accountId: string;
//       };
      
//       const details = await getAccountDetails(accountId);
//       return { 
//         content: [{ 
//           type: "text", 
//           text: `Account Details for ${accountId}:\nBalance: ${details.balance} ${details.currency}\nStatus: ${details.status}\nLast Transaction: ${details.lastTransaction}` 
//         }] 
//       };
//     }
    
//     throw new Error(`Unknown tool: ${request.params.name}`);
//   });

//   // 处理工具列表请求
//   server.setRequestHandler(ListToolsRequestSchema, async () => {
//     return {
//       tools: [
//         {
//           name: "transferFunds",
//           description: "Transfers funds between accounts with pre-condition checks",
//           inputSchema: {
//             type: "object",
//             properties: {
//               amount: { type: "number", description: "Amount to transfer" },
//               fromAccount: { type: "string", description: "Source account ID" },
//               toAccount: { type: "string", description: "Target account ID (optional, defaults to USD-account)" },
//               fxThreshold: { type: "number", description: "FX rate threshold (optional)" }
//             },
//             required: ["amount", "fromAccount"]
//           }
//         },
//         {
//           name: "getAccountDetails",
//           description: "Get detailed information about an account",
//           inputSchema: {
//             type: "object",
//             properties: {
//               accountId: { type: "string", description: "Account ID to get details for" }
//             },
//             required: ["accountId"]
//           }
//         }
//       ]
//     };
//   });

//   // 处理 prompts 列表请求
//   server.setRequestHandler(ListPromptsRequestSchema, async () => {
//     return {
//       prompts: [
//         {
//           name: "banking-risk-assessment",
//           description: "Assesses risk for banking transactions",
//           arguments: [
//             {
//               name: "user",
//               description: "User name",
//               schema: { type: "string" }
//             },
//             {
//               name: "activity", 
//               description: "Transaction activity description",
//               schema: { type: "string" }
//             }
//           ]
//         }
//       ]
//     };
//   });

//   // 处理 prompt 读取请求
//   server.setRequestHandler(GetPromptRequestSchema, async (request) => {
//     if (request.params.name === "banking-risk-assessment") {
//       try {
//         const promptContent = readFileSync(join(__dirname, "prompts", "banking-prompt.text"), "utf-8");
//         return {
//           prompt: {
//             name: "banking-risk-assessment",
//             description: "Assesses risk for banking transactions",
//             arguments: [
//               {
//                 name: "user",
//                 description: "User name",
//                 schema: { type: "string" }
//               },
//               {
//                 name: "activity", 
//                 description: "Transaction activity description",
//                 schema: { type: "string" }
//               }
//             ],
//             messages: [
//               {
//                 role: "user",
//                 content: [
//                   {
//                     type: "text",
//                     text: promptContent
//                   }
//                 ]
//               }
//             ]
//           }
//         };
//       } catch (error) {
//         throw new Error(`Failed to read prompt: ${error}`);
//       }
//     }
    
//     throw new Error(`Unknown prompt: ${request.params.name}`);
//   });

//   const transport = new StdioServerTransport();
//   await server.connect(transport);
//   console.log("✅ MCP server connected and running...");
// }

// main().catch(err => {
//   console.error("Error starting MCP server:", err);
// });

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { bankingTools, handleToolCall } from './tools/bankingTools.js';
import { bankingPrompts, handlePromptCall } from './prompts/bankingPrompts.js';

const server = new Server(
  {
    name: "banking-mcp-server",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
      prompts: {},
    },
  }
);

// Tool handlers
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return { tools: bankingTools };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;
  return {
    content: [
      {
        type: "text",
        text: JSON.stringify(await handleToolCall(name, args), null, 2)
      }
    ]
  };
});

// Prompt handlers  
server.setRequestHandler(ListPromptsRequestSchema, async () => {
  return { prompts: bankingPrompts };
});

server.setRequestHandler(GetPromptRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;
  const result = await handlePromptCall(name, args || {});
  
  return {
    description: `Generated prompt for ${name}`,
    messages: [
      {
        role: "user",
        content: {
          type: "text", 
          text: result.prompt || JSON.stringify(result)
        }
      }
    ]
  };
});

// Start server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Transaction Banking Agent MCP Server running on stdio");
}

main().catch((error) => {
  console.error("Server error:", error);
  process.exit(1);
});