/**
 * Formats token amounts with appropriate decimal places
 * For small amounts (< 0.01), shows more decimal places to avoid showing 0.00
 */
export function formatAmount(amount: string, tokenAddress: string): string {
  const isETH = tokenAddress === '0x0000000000000000000000000000000000000000';
  const numAmount = BigInt(amount);
  
  if (isETH) {
    // ETH: always show 6 decimal places
    const ethAmount = Number(numAmount) / 1e18;
    return `${ethAmount.toFixed(6)} ETH`;
  } else {
    // USDC: show more decimal places for small amounts
    const usdcAmount = Number(numAmount) / 1e6;
    
    if (usdcAmount === 0) {
      return '0.00 USDC';
    }
    
    // For amounts less than 0.01, show up to 6 decimal places (remove trailing zeros)
    if (usdcAmount < 0.01) {
      // Format with 6 decimals, then remove trailing zeros
      let formatted = usdcAmount.toFixed(6);
      // Remove trailing zeros, but keep the decimal point if there are non-zero digits
      formatted = formatted.replace(/0+$/, '').replace(/\.$/, '');
      // If we removed everything, it means it was exactly 0 (already handled above)
      return `${formatted} USDC`;
    }
    
    // For amounts >= 0.01, show 2 decimal places
    return `${usdcAmount.toFixed(2)} USDC`;
  }
}

/**
 * Formats amount for display in stats/dashboard (always 2 decimals for USDC)
 */
export function formatAmountShort(amount: string, tokenAddress: string): string {
  const isETH = tokenAddress === '0x0000000000000000000000000000000000000000';
  const numAmount = BigInt(amount);
  
  if (isETH) {
    const ethAmount = Number(numAmount) / 1e18;
    return `${ethAmount.toFixed(4)} ETH`;
  } else {
    const usdcAmount = Number(numAmount) / 1e6;
    return `${usdcAmount.toFixed(2)} USDC`;
  }
}

