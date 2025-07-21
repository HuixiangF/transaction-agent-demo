import { 
  CallToolRequestSchema, 
  CallToolResultSchema,
  ListPromptsRequestSchema,
  GetPromptRequestSchema,
  ListToolsRequestSchema
} from "@modelcontextprotocol/sdk/types.js";

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