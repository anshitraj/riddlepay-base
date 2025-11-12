/**
 * Formats token amounts with appropriate decimal places
 * For small amounts (< 0.01), shows more decimal places to avoid showing 0.00
 * Handles both decimal strings (from forms) and BigInt strings (from contracts)
 */
export function formatAmount(amount: string, tokenAddress: string): string {
  const isETH = tokenAddress === '0x0000000000000000000000000000000000000000';
  
  // Check if amount is a decimal string (contains a dot) or BigInt string
  let numAmount: bigint;
  let isDecimal = amount.includes('.');
  
  if (isDecimal) {
    // Handle decimal string (e.g., "0.001" from form input)
    const decimalAmount = parseFloat(amount);
    if (isNaN(decimalAmount)) {
      return '0.00 ' + (isETH ? 'ETH' : 'USDC');
    }
    
    if (isETH) {
      // Convert ETH decimal to wei (BigInt)
      const weiAmount = BigInt(Math.floor(decimalAmount * 1e18));
      const ethAmount = Number(weiAmount) / 1e18;
      return `${ethAmount.toFixed(6)} ETH`;
    } else {
      // Convert USDC decimal to smallest unit (BigInt)
      const usdcSmallestUnit = BigInt(Math.floor(decimalAmount * 1e6));
      const usdcAmount = Number(usdcSmallestUnit) / 1e6;
      
      if (usdcAmount === 0) {
        return '0.00 USDC';
      }
      
      // For amounts less than 0.01, show up to 6 decimal places (remove trailing zeros)
      if (usdcAmount < 0.01) {
        let formatted = usdcAmount.toFixed(6);
        formatted = formatted.replace(/0+$/, '').replace(/\.$/, '');
        return `${formatted} USDC`;
      }
      
      return `${usdcAmount.toFixed(2)} USDC`;
    }
  } else {
    // Handle BigInt string (from contract)
    try {
      numAmount = BigInt(amount);
    } catch (e) {
      console.error('Invalid BigInt amount:', amount);
      return '0.00 ' + (isETH ? 'ETH' : 'USDC');
    }
    
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
        let formatted = usdcAmount.toFixed(6);
        formatted = formatted.replace(/0+$/, '').replace(/\.$/, '');
        return `${formatted} USDC`;
      }
      
      // For amounts >= 0.01, show 2 decimal places
      return `${usdcAmount.toFixed(2)} USDC`;
    }
  }
}

/**
 * Formats amount for display in stats/dashboard (always 2 decimals for USDC)
 * Handles both decimal strings (from forms) and BigInt strings (from contracts)
 */
export function formatAmountShort(amount: string, tokenAddress: string): string {
  const isETH = tokenAddress === '0x0000000000000000000000000000000000000000';
  
  // Check if amount is a decimal string (contains a dot) or BigInt string
  let numAmount: bigint;
  let isDecimal = amount.includes('.');
  
  if (isDecimal) {
    // Handle decimal string (e.g., "0.001" from form input)
    const decimalAmount = parseFloat(amount);
    if (isNaN(decimalAmount)) {
      return '0.00 ' + (isETH ? 'ETH' : 'USDC');
    }
    
    if (isETH) {
      const ethAmount = decimalAmount;
      return `${ethAmount.toFixed(4)} ETH`;
    } else {
      const usdcAmount = decimalAmount;
      return `${usdcAmount.toFixed(2)} USDC`;
    }
  } else {
    // Handle BigInt string (from contract)
    try {
      numAmount = BigInt(amount);
    } catch (e) {
      console.error('Invalid BigInt amount:', amount);
      return '0.00 ' + (isETH ? 'ETH' : 'USDC');
    }
    
    if (isETH) {
      const ethAmount = Number(numAmount) / 1e18;
      return `${ethAmount.toFixed(4)} ETH`;
    } else {
      const usdcAmount = Number(numAmount) / 1e6;
      return `${usdcAmount.toFixed(2)} USDC`;
    }
  }
}

