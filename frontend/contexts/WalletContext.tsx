'use client';

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
  useRef,
} from 'react';
import dynamic from 'next/dynamic';

// Lazy load modal to avoid SSR issues
const WalletErrorModal = dynamic(() => import('@/components/WalletErrorModal'), {
  ssr: false,
});

// Load ethers from CDN if available, otherwise use import
let ethers: any = null;
async function loadEthers() {
  if (!ethers) {
    try {
      // Try to use CDN first (if available in window)
      if (typeof window !== 'undefined' && (window as any).ethers) {
        ethers = (window as any).ethers;
      } else {
        // Fallback to npm package
        ethers = await import('ethers');
      }
    } catch (err) {
      // Final fallback
      ethers = await import('ethers');
    }
  }
  return ethers;
}

// Cache Farcaster SDK
let farcasterSDK: any = null;
async function loadFarcasterSDK() {
  if (!farcasterSDK) {
    farcasterSDK = await import('@farcaster/miniapp-sdk');
  }
  return farcasterSDK;
}

// Detect if we're in Farcaster/Base mini app environment
// This function tries multiple methods to detect Farcaster environment
async function isInMiniApp(): Promise<boolean> {
  if (typeof window === 'undefined') return false;
  
  try {
    // Method 1: Try to load and initialize Farcaster SDK
    // If SDK.ready() succeeds, we're definitely in Farcaster
    try {
      const { sdk } = await import('@farcaster/miniapp-sdk');
      await sdk.actions.ready();
      console.log('✅ Detected Farcaster via SDK');
      return true;
    } catch (sdkError) {
      // SDK failed, continue to other checks
      console.log('SDK check failed, trying other methods...');
    }

    // Method 2: Check for Farcaster window objects
    if ((window as any).farcaster || (window as any).parent?.farcaster) {
      console.log('✅ Detected Farcaster via window object');
      return true;
    }

    // Method 3: Check URL patterns
    const href = window.location?.href || '';
    if (
      href.includes('farcaster.xyz') ||
      href.includes('warpcast.com') ||
      href.includes('base.org') ||
      href.includes('base.xyz') ||
      href.includes('farcaster') ||
      href.includes('warpcast')
    ) {
      console.log('✅ Detected Farcaster via URL');
      return true;
    }

    // Method 4: Check if we're in an iframe (common for mini apps)
    if (window.self !== window.top) {
      // We're in an iframe, might be Farcaster
      // Try to access parent window (with try-catch for cross-origin)
      try {
        if ((window.parent as any).farcaster || (window.parent as any).location?.href?.includes('farcaster')) {
          console.log('✅ Detected Farcaster via iframe check');
          return true;
        }
      } catch (e) {
        // Cross-origin, can't access parent
      }
    }

    return false;
  } catch (error) {
    console.error('Error detecting Farcaster environment:', error);
    return false;
  }
}

// Synchronous fallback for immediate checks (less reliable)
function isInMiniAppSync(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return !!(
      (window as any).farcaster ||
      (window as any).parent?.farcaster ||
      window.location?.href?.includes('farcaster.xyz') ||
      window.location?.href?.includes('warpcast.com') ||
      window.location?.href?.includes('base.org') ||
      window.location?.href?.includes('base.xyz') ||
      window.location?.href?.includes('farcaster') ||
      window.location?.href?.includes('warpcast')
    );
  } catch {
    return false;
  }
}

interface WalletContextType {
  address: string | null;
  provider: any | null;
  chainId: number | null;
  isConnected: boolean;
  isConnecting: boolean;
  connect: () => Promise<void>;
  connectFarcaster: () => Promise<void>;
  connectMetaMask: () => Promise<void>;
  disconnect: () => void;
  ensureBaseMainnet: () => Promise<void>;
  isInMiniApp: boolean;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export function WalletProvider({ children }: { children: ReactNode }) {
  const [address, setAddress] = useState<string | null>(null);
  const [provider, setProvider] = useState<any | null>(null);
  const [chainId, setChainId] = useState<number | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isInMiniAppEnv, setIsInMiniAppEnv] = useState(false);

  const connectingRef = useRef(false);
  const hasAutoConnectedRef = useRef(false);

  /////////////////////////////////////////////////////////////
  // CONNECT FARCASTER
  /////////////////////////////////////////////////////////////
  const connectFarcaster = async () => {
    if (connectingRef.current) return;
    connectingRef.current = true;
    setIsConnecting(true);

    try {
      const ethersLib = await loadEthers();
      const { sdk } = await loadFarcasterSDK();
      await sdk.actions.ready();

      const ethProvider = await sdk.wallet.getEthereumProvider();
      if (!ethProvider) {
        throw new Error('Farcaster signer unavailable. Open inside Warpcast or Base app.');
      }

      const evm = new ethersLib.BrowserProvider(ethProvider);
      const accounts = await evm.send('eth_requestAccounts', []);
      const signer = await evm.getSigner();

      const addr = await signer.getAddress();
      setAddress(addr);
      setProvider(evm);

      const net = await evm.getNetwork();
      setChainId(Number(net.chainId));

      localStorage.setItem('wallet_type', 'farcaster');
    } catch (err: any) {
      console.error('Farcaster Connect Error:', err);
      setError(err.message || 'Farcaster login failed. Open inside Warpcast or Base app.');
    }

    connectingRef.current = false;
    setIsConnecting(false);
  };

  /////////////////////////////////////////////////////////////
  // CONNECT METAMASK/BASE
  /////////////////////////////////////////////////////////////
  const connectMetaMask = async () => {
    if (connectingRef.current) return;
    connectingRef.current = true;
    setIsConnecting(true);

    try {
      const ethersLib = await loadEthers();
      const anyWindow = window as any;
      if (!anyWindow.ethereum) {
        throw new Error('No wallet detected. Please install MetaMask or open inside Base App.');
      }

      const evm = new ethersLib.BrowserProvider(anyWindow.ethereum);
      const accounts = await evm.send('eth_requestAccounts', []);
      const signer = await evm.getSigner();

      const addr = await signer.getAddress();
      setAddress(addr);
      setProvider(evm);

      const net = await evm.getNetwork();
      setChainId(Number(net.chainId));

      localStorage.setItem('wallet_type', 'metamask');
    } catch (err: any) {
      console.error('MetaMask Connect Error:', err);
      setError(err.message || 'Connection failed. Please install MetaMask.');
    }

    connectingRef.current = false;
    setIsConnecting(false);
  };

  /////////////////////////////////////////////////////////////
  // UNIFIED CONNECT FUNCTION - Auto-detects environment (for backward compatibility)
  /////////////////////////////////////////////////////////////
  const connect = async () => {
    const inMiniApp = await isInMiniApp();
    if (inMiniApp) {
      await connectFarcaster();
    } else {
      await connectMetaMask();
    }
  };

  /////////////////////////////////////////////////////////////
  // 3. ENSURE BASE MAINNET
  /////////////////////////////////////////////////////////////
  const ensureBaseMainnet = async () => {
    if (!provider) return;
    try {
      await provider.send('wallet_switchEthereumChain', [
        { chainId: '0x2105' }, // 8453
      ]);
    } catch (err) {
      console.error('Switch to Base Mainnet failed:', err);
    }
  };

  /////////////////////////////////////////////////////////////
  // 4. DISCONNECT WALLET
  /////////////////////////////////////////////////////////////
  const disconnect = () => {
    setAddress(null);
    setProvider(null);
    setChainId(null);
    localStorage.removeItem('wallet_type');
  };

  /////////////////////////////////////////////////////////////
  // AUTO-DETECT ENVIRONMENT AND AUTO-CONNECT
  /////////////////////////////////////////////////////////////
  useEffect(() => {
    const init = async () => {
      // First, set initial state based on sync check (for immediate UI updates)
      const initialCheck = isInMiniAppSync();
      setIsInMiniAppEnv(initialCheck);

      // Then do async detection (more reliable)
      const inMiniApp = await isInMiniApp();
      setIsInMiniAppEnv(inMiniApp);

      console.log('🔍 Environment detection:', { inMiniApp, initialCheck });

      // Auto-connect if we haven't already connected
      if (!hasAutoConnectedRef.current && !address) {
        const saved = localStorage.getItem('wallet_type');
        
        // If in Farcaster/Base mini app, always try to auto-connect with Farcaster
        // (Farcaster provides wallet automatically, so we should connect)
        if (inMiniApp) {
          hasAutoConnectedRef.current = true;
          console.log('🚀 Auto-connecting in Farcaster...');
          // Small delay to ensure SDK is ready
          setTimeout(() => {
            connectFarcaster().catch((err) => {
              console.error('❌ Auto-connect in Farcaster failed:', err);
              // If auto-connect fails, user can still manually connect
            });
          }, 1500); // Longer delay to ensure Farcaster SDK is fully initialized
        } 
        // If we have a saved connection (from previous session), auto-connect
        else if (saved) {
          hasAutoConnectedRef.current = true;
          console.log('🔄 Auto-connecting with saved wallet type:', saved);
          // Small delay to ensure SDK is ready
          setTimeout(() => {
            if (saved === 'farcaster') {
              connectFarcaster().catch(console.error);
            } else {
              connectMetaMask().catch(console.error);
            }
          }, 500);
        }
      }
    };

    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [address]);

  return (
    <WalletContext.Provider
      value={{
        address,
        provider,
        chainId,
        isConnected: !!address,
        isConnecting,
        connect,
        connectFarcaster,
        connectMetaMask,
        disconnect,
        ensureBaseMainnet,
        isInMiniApp: isInMiniAppEnv,
      }}
    >
      {children}

      <WalletErrorModal
        isOpen={!!error}
        onClose={() => setError(null)}
        error={error ?? undefined}
      />
    </WalletContext.Provider>
  );
}

export function useWallet() {
  const ctx = useContext(WalletContext);
  if (!ctx) throw new Error('useWallet must be used inside WalletProvider');
  return ctx;
}
