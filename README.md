# Transaction Agent Demo

## Assignment Overview

This project demonstrates the deployment of a Model Context Protocol (MCP) server and client using the [TypeScript MCP SDK](https://github.com/modelcontextprotocol/typescript-sdk). It showcases advanced reasoning skills—elicitation and agentic thinking—within a realistic banking scenario, where a user transfers funds between accounts via a prompt interface. The system is built in TypeScript and is ready for extension or integration with LLMs such as Claude.

---

## Key Features

- **MCP Server:**
  - Exposes banking tools and prompts via the MCP standard protocol.
  - Handles user requests, elicits missing information, and performs agentic pre-condition checks.
- **MCP Client (Prompt Input):**
  - Connects to the MCP server and allows user prompt input (can be integrated with Claude or other LLMs).
  - Demonstrates reasoning, elicitation, and agentic workflows.
- **Mock Banking API:**
  - Simulates accounts, balances, FX rates, and transfer logic (no hardcoded values; all data is mock-API driven).
- **Reasoning Service:**
  - Analyzes user intent, elicits missing info, checks pre-conditions, and provides recommendations.
- **Elicitation & Agentic Thinking:**
  - Prompts user for missing or vague information.
  - Checks all relevant pre-conditions (e.g., account status, balance, FX rates) before executing actions.
- **Extensible Tools & Prompts:**
  - Easily add new tools/resources or adapt to other scenarios.

---

## Sample Scenario: Banking Transfer

> **User prompt:**
> 
> "Transfer 800 AUD from my AUD account if FX below 0.7"

- The user has not specified the target account (elicitation required).
- The user has not mentioned pre-conditions, but the agent must check them (agentic thinking):
  - Is the source account active?
  - Is there sufficient balance?
  - Are transfer limits respected?
  - Is the FX rate below the threshold?

The system will prompt for missing info, check all pre-conditions, and only proceed if safe.

---

## Quick Start

### 1. Clone and Install

```bash
git clone https://github.com/HuixiangF/transaction-agent-demo.git
cd transaction-agent-demo
npm install
```

### 2. Environment Variables (Optional for AI Integration)

To enable OpenRouter AI (for LLM analysis), create a `.env` file:

```
OPENROUTER_API_KEY=your_openrouter_api_key
SITE_URL=http://localhost:3000
SITE_NAME=Banking MCP Client
```

If not set, the system runs without AI features.

### 3. Run the Demo

- **Development mode (client + server, with prompt tests):**
  ```bash
  npm run dev
  ```
- **Run only the MCP server:**
  ```bash
  npm run server
  ```
- **Run tests:**
  ```bash
  npm run test
  ```
- **Build:**
  ```bash
  npm run build
  ```
- **Run compiled client:**
  ```bash
  npm run start
  ```

---

## MCP SDK Integration

- Uses [`@modelcontextprotocol/sdk`](https://github.com/modelcontextprotocol/typescript-sdk) for both server and client.
- Server: see [`src/banking-mcp-server.ts`](src/banking-mcp-server.ts)
- Client: see [`src/client.ts`](src/client.ts)
- Tools and prompts are defined in [`src/tools/enhanceBankingTools.ts`](src/tools/enhanceBankingTools.ts) and [`src/prompts/bankingPrompts.ts`](src/prompts/bankingPrompts.ts)

---

## Tools & Prompts

### Tools
| Name                    | Description                                               |
|-------------------------|-----------------------------------------------------------|
| smartTransferFunds      | Intelligent transfer with reasoning, elicitation, pre-checks |
| analyzeTransferIntent   | Analyze user intent, elicit missing info, recommend next steps |
| intelligentAccountCheck | Smart account analysis with contextual recommendations    |
| transferFunds           | (Legacy) Transfer funds between accounts                  |
| getAccountDetails       | Get detailed info about an account                        |
| getAllAccounts          | List all user accounts                                   |
| getFXRate               | Get FX rate between two currencies                       |
| validateTransfer        | Validate a transfer request (no execution)               |

### Prompts
| Name               | Description                                         |
|--------------------|-----------------------------------------------------|
| account_analysis   | Analyze account health and recommendations          |
| transfer_advisor   | Intelligent transfer recommendations                |
| portfolio_overview | Portfolio analysis and optimization suggestions     |

---

## Example Usage

**Smart Transfer with Reasoning:**
```js
await client.callTool({
  name: "smartTransferFunds",
  arguments: {
    userInput: "Transfer 800 AUD from my AUD account if FX below 0.7",
    amount: 800,
    fromAccount: "AUD-account",
    fxThreshold: 0.7
  }
});
```

**Analyze Transfer Intent:**
```js
await client.callTool({
  name: "analyzeTransferIntent",
  arguments: {
    userInput: "I want to move 800 to USD if the rate is good",
    providedArgs: { amount: 800, preferredCurrency: "USD" }
  }
});
```

**Elicitation Example:**
- If the user omits the target account, the system will prompt:
  > "Which account would you like to transfer to?"

**Agentic Thinking Example:**
- Even if all required fields are provided, the system will check:
  - Account status
  - Sufficient balance
  - Transfer limits
  - FX rate threshold

---

## Type Definitions

See [`src/types.ts`](src/types.ts) for all type definitions, including `Account`, `TransferRequest`, `TransferResult`, and `FXRate`.

---

## Reasoning, Elicitation, and Agentic Features

- **Elicitation:** Prompts user for missing or vague information (e.g., missing amount or target account).
- **Agentic Thinking:** Checks all relevant pre-conditions before executing any action (e.g., transfer).
- **Reasoning Service:** Analyzes user intent, detects risks, and recommends next steps.


