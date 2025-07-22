import { 
  CallToolRequestSchema, 
  CallToolResultSchema,
  ListPromptsRequestSchema,
  GetPromptRequestSchema,
  ListToolsRequestSchema
} from "@modelcontextprotocol/sdk/types.js";

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
// Import enhanced tools instead of basic ones
import { enhancedBankingTools, handleEnhancedToolCall } from './tools/enhanceBankingTools.js';
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

// Tool handlers - now using enhanced tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
  console.log("Listing tools:", enhancedBankingTools.map(t => t.name));
  return { tools: enhancedBankingTools };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;
  console.log(`Tool call: ${name}`, JSON.stringify(args, null, 2));
  
  try {
    const result = await handleEnhancedToolCall(name, args);
    console.log(`Tool result for ${name}:`, JSON.stringify(result, null, 2));
    
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(result, null, 2)
        }
      ]
    };
  } catch (error) {
    console.error(`Tool error for ${name}:`, error);
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify({
            error: error instanceof Error ? error.message : 'Unknown error',
            toolName: name,
            arguments: args
          }, null, 2)
        }
      ]
    };
  }
});

// Prompt handlers  
server.setRequestHandler(ListPromptsRequestSchema, async () => {
  console.log("Listing prompts");
  return { prompts: bankingPrompts };
});

server.setRequestHandler(GetPromptRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;
  console.log(`Prompt call: ${name}`, args);
  
  try {
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
  } catch (error) {
    console.error(`Prompt error for ${name}:`, error);
    throw error;
  }
});

// Start server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.log("Enhanced Banking Agent MCP Server running on stdio with reasoning capabilities");
  console.log("Available enhanced tools:", enhancedBankingTools.map(t => t.name).join(', '));
}

main().catch((error) => {
  console.error("Server startup error:", error);
  process.exit(1);
});