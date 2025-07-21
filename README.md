# Transaction Agent Demo

## Overview

This project is a demo of an intelligent banking agent system, featuring a Model Context Protocol (MCP) server and a client with AI-powered analysis and smart transfer logic. It simulates banking operations such as account management, fund transfers, FX rate queries, and portfolio analysis, with support for advanced prompt-based recommendations and OpenRouter AI integration.

## Features

- **MCP Server**: Handles banking tools and prompts via a standard protocol.
- **Client**: Connects to the server, runs banking operations, and can leverage OpenRouter AI for analysis.
- **Mock Banking API**: Simulates accounts, balances, FX rates, and transfer logic.
- **Intelligent Transfer**: Auto-selects the best target account and validates pre-conditions.
- **Prompt System**: Provides advanced banking prompts for account analysis, transfer advice, and portfolio overview.
- **AI Integration**: (Optional) Uses OpenRouter API for deep analysis and recommendations.
- **TypeScript**: Fully typed for safety and clarity.

## Installation

1. **Clone the repository:**
   ```bash
   git clone <your-repo-url>
   cd transaction-agent-demo
   ```
2. **Install dependencies:**
   ```bash
   npm install
   ```

## Usage

### Development Mode
Run the client in development mode (starts the MCP server automatically):
```bash
npm run dev
```

### Run Tests
Execute the test suite:
```bash
npm run test
```

### Available Scripts
- `npm run dev`   — Start the client in development mode
- `npm run server` — Start the MCP server only
- `npm run build`  — Compile TypeScript
- `npm run start`  — Run compiled client
- `npm run test`   — Run tests

## Environment Variables

To enable OpenRouter AI integration, create a `.env` file in the project root:
```
OPENROUTER_API_KEY=your_openrouter_api_key
SITE_URL=http://localhost:3000
SITE_NAME=Banking MCP Client
```
If `OPENROUTER_API_KEY` is not set, the client will run without AI features.

## API Summary

### Tools
| Name              | Description                                               | Required Arguments                |
|-------------------|-----------------------------------------------------------|-----------------------------------|
| transferFunds     | Transfer funds between accounts (intelligent selection)   | amount, fromAccount               |
| getAccountDetails | Get detailed info about an account                        | accountId                         |
| getAllAccounts    | Get summary of all user accounts                          | (none)                            |
| getFXRate         | Get FX rate between two currencies                        | from, to                          |
| validateTransfer  | Validate a transfer request (no execution)                | amount, fromAccount               |

### Prompts
| Name               | Description                                         | Arguments                      |
|--------------------|-----------------------------------------------------|-------------------------------|
| account_analysis   | Analyze account health and recommendations          | accountId                     |
| transfer_advisor   | Intelligent transfer recommendations                | fromAccount, amount           |
| portfolio_overview | Portfolio analysis and optimization suggestions     | (none)                        |

## Example Usage

**Transfer Funds:**
```js
await client.callTool({
  name: "transferFunds",
  arguments: {
    amount: 800,
    fromAccount: "AUD-account",
    fxThreshold: 0.7
  }
});
```

**Get Account Details:**
```js
await client.callTool({
  name: "getAccountDetails",
  arguments: { accountId: "AUD-account" }
});
```

**Use a Prompt:**
```js
await client.getPrompt({
  name: "account_analysis",
  arguments: { accountId: "AUD-account" }
});
```

## Type Definitions

See [`src/types.ts`](src/types.ts) for all type definitions, including `Account`, `TransferRequest`, `TransferResult`, and `FXRate`.

## License

MIT 
>>>>>>> f96796a (initial commit)
