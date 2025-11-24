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
function isInMiniApp(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return !!(
      (window as any).farcaster ||
      (window as any).parent?.farcaster ||
      window.location?.href?.includes('farcaster.xyz') ||
      window.location?.href?.includes('warpcast.com') ||
      window.location?.href?.includes('base.org') ||
      window.location?.href?.includes('base.xyz')
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
  // UNIFIED CONNECT FUNCTION - Auto-detects environment
  /////////////////////////////////////////////////////////////
  const connect = async () => {
    if (connectingRef.current) return;
    connectingRef.current = true;
    setIsConnecting(true);

    try {
      const ethersLib = await loadEthers();
      const inMiniApp = isInMiniApp();

      if (inMiniApp) {
        // In Farcaster/Base mini app - use Farcaster SDK
        try {
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
          throw new Error('Farcaster login failed. Open inside Warpcast or Base app.');
        }
      } else {
        // In browser - use MetaMask/window.ethereum
        const anyWindow = window as any;
        if (!anyWindow.ethereum) {
          throw new Error('No wallet detected. Please install MetaMask.');
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
      }
    } catch (err: any) {
      console.error('Connect Error:', err);
      setError(err.message || 'Connection failed');
    }

    connectingRef.current = false;
    setIsConnecting(false);
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
      // Detect environment
      const inMiniApp = isInMiniApp();
      setIsInMiniAppEnv(inMiniApp);

      // Auto-connect if we haven't already connected
      if (!hasAutoConnectedRef.current && !address) {
        const saved = localStorage.getItem('wallet_type');
        
        // If in Farcaster/Base mini app, always try to auto-connect
        // (Farcaster provides wallet automatically, so we should connect)
        if (inMiniApp) {
          hasAutoConnectedRef.current = true;
          // Small delay to ensure SDK is ready
          setTimeout(() => {
            connect().catch((err) => {
              console.log('Auto-connect in Farcaster:', err);
              // If auto-connect fails, user can still manually connect
            });
          }, 1000); // Slightly longer delay for Farcaster SDK to initialize
        } 
        // If we have a saved connection (from previous session), auto-connect
        else if (saved) {
          hasAutoConnectedRef.current = true;
          // Small delay to ensure SDK is ready
          setTimeout(() => {
            connect().catch(console.error);
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
