/**
 * XP System for RiddlePay Leaderboard
 * Users earn XP for various actions
 */

export interface XPTransaction {
  address: string;
  action: 'send' | 'claim' | 'solve_riddle' | 'bulk_send';
  xp: number;
  timestamp: number;
}

// XP values for different actions
export const XP_VALUES = {
  SEND_AIRDROP: 10,
  CLAIM_AIRDROP: 5,
  SOLVE_RIDDLE: 15,
  BULK_SEND: 25, // Bonus for bulk operations
};

/**
 * Calculate XP for an action
 */
export function calculateXP(action: XPTransaction['action'], isRiddle: boolean = false): number {
  switch (action) {
    case 'send':
      return isRiddle ? XP_VALUES.SEND_AIRDROP + XP_VALUES.SOLVE_RIDDLE : XP_VALUES.SEND_AIRDROP;
    case 'claim':
      return XP_VALUES.CLAIM_AIRDROP;
    case 'solve_riddle':
      return XP_VALUES.SOLVE_RIDDLE;
    case 'bulk_send':
      return XP_VALUES.BULK_SEND;
    default:
      return 0;
  }
}

/**
 * Get user's total XP from localStorage
 */
export function getUserXP(address: string): number {
  if (typeof window === 'undefined') return 0;
  
  const stored = localStorage.getItem(`xp_${address.toLowerCase()}`);
  return stored ? parseInt(stored, 10) : 0;
}

/**
 * Add XP for a user action
 */
export function addXP(address: string, action: XPTransaction['action'], isRiddle: boolean = false): number {
  if (typeof window === 'undefined') return 0;
  
  const xpGained = calculateXP(action, isRiddle);
  const currentXP = getUserXP(address);
  const newXP = currentXP + xpGained;
  
  localStorage.setItem(`xp_${address.toLowerCase()}`, newXP.toString());
  
  // Store transaction history
  const transactions = getXPTransactions(address);
  transactions.push({
    address,
    action,
    xp: xpGained,
    timestamp: Date.now(),
  });
  localStorage.setItem(`xp_tx_${address.toLowerCase()}`, JSON.stringify(transactions));
  
  return newXP;
}

/**
 * Get XP transaction history for a user
 */
export function getXPTransactions(address: string): XPTransaction[] {
  if (typeof window === 'undefined') return [];
  
  const stored = localStorage.getItem(`xp_tx_${address.toLowerCase()}`);
  return stored ? JSON.parse(stored) : [];
}

/**
 * Get leaderboard sorted by XP
 */
export function getXPLeaderboard(): Array<{ address: string; xp: number }> {
  if (typeof window === 'undefined') return [];
  
  const leaderboard: Array<{ address: string; xp: number }> = [];
  const addresses = new Set<string>();
  
  // Collect all addresses from XP storage
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key?.startsWith('xp_') && !key.startsWith('xp_tx_')) {
      const address = key.replace('xp_', '');
      addresses.add(address);
    }
  }
  
  // Build leaderboard
  addresses.forEach(address => {
    const xp = getUserXP(address);
    if (xp > 0) {
      leaderboard.push({ address, xp });
    }
  });
  
  // Sort by XP descending
  return leaderboard.sort((a, b) => b.xp - a.xp);
}

/**
 * Get user's rank
 */
export function getUserRank(address: string): number {
  const leaderboard = getXPLeaderboard();
  const index = leaderboard.findIndex(entry => entry.address.toLowerCase() === address.toLowerCase());
  return index === -1 ? leaderboard.length + 1 : index + 1;
}

