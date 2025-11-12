/**
 * Get the block explorer URL for a transaction based on chain ID
 */
export function getBlockExplorerUrl(chainId: number | null, txHash: string): string {
  if (!chainId) {
    // Default to mainnet if chainId is not available
    return `https://basescan.org/tx/${txHash}`;
  }

  // Base Mainnet: 8453
  if (chainId === 8453) {
    return `https://basescan.org/tx/${txHash}`;
  }

  // Base Sepolia: 84532
  if (chainId === 84532) {
    return `https://sepolia.basescan.org/tx/${txHash}`;
  }

  // Default to mainnet
  return `https://basescan.org/tx/${txHash}`;
}

/**
 * Get the network name based on chain ID
 */
export function getNetworkName(chainId: number | null): string {
  if (!chainId) {
    return 'Unknown Network';
  }

  if (chainId === 8453) {
    return 'Base Mainnet';
  }

  if (chainId === 84532) {
    return 'Base Sepolia';
  }

  return `Chain ${chainId}`;
}

