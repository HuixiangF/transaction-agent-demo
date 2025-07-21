import { mockAPI } from './services/mockApi.js';
import { TransferService } from './services/transferService.js';

async function runTests() {
  console.log("Running Banking MCP Tests\n");

  const transferService = new TransferService();

  // Test 1: Account retrieval
  console.log("Test 1: Account Retrieval");
  const account = await mockAPI.getAccount('AUD-account');
  console.log(account ? "PASS" : "FAIL");

  // Test 2: FX Rate retrieval  
  console.log("\nTest 2: FX Rate Retrieval");
  const rate = await mockAPI.getFXRate('AUD', 'USD');
  console.log(rate ? "PASS" : "FAIL");

  // Test 3: Target account auto-selection
  console.log("\nTest 3: Target Account Auto-Selection");
  const targetAccount = await transferService.findBestTargetAccount('AUD-account', 'USD');
  console.log(targetAccount === 'USD-account' ? "PASS" : "FAIL");

  // Test 4: Pre-condition validation (should pass)
  console.log("\nTest 4: Valid Transfer Pre-conditions");
  const validTransfer = await transferService.validatePreConditions({
    amount: 500,
    fromAccount: 'AUD-account',
    toAccount: 'USD-account'
  });
  console.log(validTransfer.valid ? "PASS" : "FAIL");

  // Test 5: Execute transfer
  console.log("\nTest 5: Execute Transfer");
  const transferResult = await transferService.executeTransfer({
    amount: 100,
    fromAccount: 'AUD-account',
    toAccount: 'USD-account'
  });
  console.log(transferResult.success ? "PASS" : "FAIL");
  if (transferResult.success) {
    console.log(`Transaction ID: ${transferResult.transactionId}`);
    console.log(`Message: ${transferResult.message}`);
  }

  console.log("\n All tests completed!");
}

// 运行测试
runTests().catch(console.error);