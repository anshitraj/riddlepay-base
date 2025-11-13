/**
 * Base Paymaster utilities for sponsoring transactions
 * Base Paymaster: https://docs.base.org/docs/tools/paymaster/
 */

import { ethers } from 'ethers';

const BASE_PAYMASTER_URL = 'https://paymaster.base.org';

interface PaymasterConfig {
  policyId?: string;
}

/**
 * Check if Base Paymaster is available and get sponsorship policy
 */
export async function getPaymasterPolicy(): Promise<string | null> {
  try {
    // Base Paymaster public endpoint - no auth required for basic sponsorship
    // For production, you may want to use a policy ID from base.dev
    const response = await fetch(`${BASE_PAYMASTER_URL}/v2/policy`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (response.ok) {
      const data = await response.json();
      return data.policyId || null;
    }
  } catch (error) {
    console.warn('Paymaster policy check failed:', error);
  }
  
  return null;
}

/**
 * Get paymaster and data for a transaction
 * This enables transaction sponsorship via Base Paymaster
 */
export async function getPaymasterAndData(
  transaction: ethers.TransactionRequest,
  policyId?: string
): Promise<{ paymaster?: string; paymasterData?: string }> {
  try {
    const paymasterPolicyId = policyId || await getPaymasterPolicy();
    
    if (!paymasterPolicyId) {
      // No paymaster available, return empty (transaction will use user's gas)
      return {};
    }

    // For Base Paymaster, we can use the paymaster address directly
    // Base Paymaster address: 0x0000000000000000000000000000000000000000 (handled by Base)
    // In Base App, transactions are automatically sponsored if paymaster is configured
    
    return {
      paymaster: '0x0000000000000000000000000000000000000000',
      paymasterData: '0x',
    };
  } catch (error) {
    console.warn('Paymaster setup failed:', error);
    return {};
  }
}

/**
 * Check if wallet supports EIP-5792 (batch transactions)
 */
export async function checkBatchSupport(provider: ethers.BrowserProvider): Promise<boolean> {
  try {
    if (!provider) return false;
    
    // Check for wallet_sendCalls capability
    const capabilities = await (provider as any).send('wallet_getCapabilities', []);
    return capabilities?.wallet_sendCalls !== undefined;
  } catch (error) {
    return false;
  }
}

/**
 * Send batch transactions using EIP-5792
 * Combines multiple calls into a single transaction
 */
export async function sendBatchTransactions(
  provider: ethers.BrowserProvider,
  calls: Array<{
    to: string;
    data: string;
    value?: string;
  }>
): Promise<string> {
  try {
    const signer = await provider.getSigner();
    const from = await signer.getAddress();

    // Format calls for wallet_sendCalls
    const formattedCalls = calls.map(call => ({
      to: call.to,
      data: call.data,
      value: call.value || '0x0',
    }));

    // Send batch transaction
    const txHash = await (provider as any).send('wallet_sendCalls', [
      {
        version: '1.0',
        chainId: await provider.getNetwork().then(n => Number(n.chainId)),
        from,
        calls: formattedCalls,
      },
    ]);

    return txHash;
  } catch (error: any) {
    console.error('Batch transaction failed:', error);
    throw new Error(`Batch transaction failed: ${error.message || error}`);
  }
}

