import { ethers } from 'ethers';

/**
 * Creates a hybrid RPC provider with fallback support
 * Primary: Alchemy RPC (fast, reliable)
 * Fallback: Base Public RPC (backup if Alchemy fails)
 */
export function createHybridRpcProvider(): ethers.JsonRpcProvider | null {
  const alchemyRpc = process.env.NEXT_PUBLIC_BASE_RPC_ALCHEMY;
  const publicRpc = process.env.NEXT_PUBLIC_BASE_RPC_PUBLIC || 'https://mainnet.base.org';
  
  // Legacy support: if only NEXT_PUBLIC_BASE_RPC is set, use it
  const legacyRpc = process.env.NEXT_PUBLIC_BASE_RPC;
  
  if (!alchemyRpc && !legacyRpc) {
    console.warn('⚠️ No RPC URL configured. Using public Base RPC as fallback.');
    try {
      return new ethers.JsonRpcProvider(publicRpc);
    } catch (err) {
      console.error('❌ Failed to create public RPC provider:', err);
      return null;
    }
  }

  // If we have Alchemy RPC, create fallback provider
  if (alchemyRpc) {
    try {
      // Primary: Alchemy
      const primaryProvider = new ethers.JsonRpcProvider(alchemyRpc);
      console.log('✅ Primary RPC (Alchemy) configured');
      
      // Fallback: Public Base RPC
      const fallbackProviderInstance = new ethers.JsonRpcProvider(publicRpc);
      console.log('✅ Fallback RPC (Base Public) configured');
      
      // Create a wrapper provider that tries primary first, then fallback
      const hybridProvider = new Proxy(primaryProvider, {
        get(target, prop) {
          const value = (target as any)[prop];
          if (typeof value === 'function') {
            return async function(...args: any[]) {
              try {
                return await value.apply(target, args);
              } catch (err: any) {
                // If primary fails, try fallback
                console.warn('⚠️ Primary RPC failed, trying fallback:', err.message);
                const fallbackValue = (fallbackProviderInstance as any)[prop];
                if (typeof fallbackValue === 'function') {
                  return await fallbackValue.apply(fallbackProviderInstance, args);
                }
                throw err;
              }
            };
          }
          return value;
        }
      });
      
      console.log('✅ Hybrid RPC provider created with fallback support');
      return hybridProvider as ethers.JsonRpcProvider;
    } catch (err) {
      console.error('❌ Failed to create hybrid RPC provider:', err);
      // Fallback to single provider
      try {
        return new ethers.JsonRpcProvider(alchemyRpc);
      } catch (fallbackErr) {
        console.error('❌ Failed to create single RPC provider:', fallbackErr);
        return null;
      }
    }
  }
  
  // Legacy: single RPC provider
  if (legacyRpc) {
    try {
      return new ethers.JsonRpcProvider(legacyRpc);
    } catch (err) {
      console.error('❌ Failed to create legacy RPC provider:', err);
      return null;
    }
  }
  
  return null;
}

/**
 * Throttle function to prevent rate limiting
 * Adds a delay between requests
 */
export async function throttle(ms: number = 200): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Cache for frequently accessed data
 */
const cache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL = 5000; // 5 seconds

export function getCached<T>(key: string): T | null {
  const cached = cache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data as T;
  }
  return null;
}

export function setCached<T>(key: string, data: T): void {
  cache.set(key, { data, timestamp: Date.now() });
}

export function clearCache(): void {
  cache.clear();
}

