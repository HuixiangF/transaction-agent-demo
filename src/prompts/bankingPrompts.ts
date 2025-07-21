export const bankingPrompts = [
  {
    name: "account_analysis",
    description: "Analyze account health and provide recommendations",
    arguments: [
      {
        name: "accountId",
        description: "Account ID to analyze",
        required: true
      }
    ]
  },
  {
    name: "transfer_advisor",
    description: "Get intelligent transfer recommendations based on current portfolio",
    arguments: [
      {
        name: "fromAccount", 
        description: "Source account for transfer analysis",
        required: true
      },
      {
        name: "amount",
        description: "Amount considering for transfer",
        required: true
      }
    ]
  },
  {
    name: "portfolio_overview",
    description: "Get comprehensive portfolio analysis and optimization suggestions",
    arguments: []
  }
];

export async function handlePromptCall(name: string, args: any): Promise<any> {
  const { mockAPI } = await import('../services/mockApi.js');
  
  switch (name) {
    case "account_analysis":
      const account = await mockAPI.getAccount(args.accountId);
      if (!account) {
        return { error: `Account ${args.accountId} not found` };
      }
      
      return {
        prompt: `Analyze this account and provide recommendations:
        
Account: ${account.id}
Currency: ${account.currency} 
Balance: ${account.balance}
Status: ${account.status}
Daily Limit: ${account.dailyTransferLimit} (Used today: ${account.transfersToday})
Monthly Limit: ${account.monthlyTransferLimit} (Used this month: ${account.transfersThisMonth})

Please assess:
1. Account health and utilization
2. Risk factors
3. Optimization opportunities
4. Recommended actions`
      };
      
    case "transfer_advisor":
      const fromAccount = await mockAPI.getAccount(args.fromAccount);
      const allAccounts = await mockAPI.getAllAccounts();
      
      if (!fromAccount) {
        return { error: `Account ${args.fromAccount} not found` };
      }
      
      return {
        prompt: `Provide transfer recommendations for:

Source Account: ${JSON.stringify(fromAccount, null, 2)}
Proposed Amount: ${args.amount}
All Accounts: ${JSON.stringify(allAccounts, null, 2)}

Recommend:
1. Best target account and reasoning
2. Optimal transfer amount
3. FX considerations
4. Risk assessment
5. Alternative strategies`
      };
      
    case "portfolio_overview":
      const portfolio = await mockAPI.getAllAccounts();
      const totalBalance = portfolio.reduce((sum, acc) => sum + acc.balance, 0);
      
      return {
        prompt: `Analyze this complete portfolio:

${JSON.stringify(portfolio, null, 2)}

Total Portfolio Value: ${totalBalance}

Provide:
1. Currency allocation analysis
2. Risk assessment
3. Diversification recommendations  
4. Rebalancing suggestions
5. Performance optimization tips`
      };
      
    default:
      return { error: `Unknown prompt: ${name}` };
  }
}