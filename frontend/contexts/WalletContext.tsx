'use client';

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
  useRef,
} from 'react';
import { ethers } from 'ethers';
import dynamic from 'next/dynamic';

// Lazy load modal to avoid SSR issues
const WalletErrorModal = dynamic(() => import('@/components/WalletErrorModal'), {
  ssr: false,
});

// Cache Farcaster SDK
let farcasterSDK: any = null;
async function loadFarcasterSDK() {
  if (!farcasterSDK) {
    farcasterSDK = await import('@farcaster/miniapp-sdk');
  }
  return farcasterSDK;
}

interface WalletContextType {
  address: string | null;
  provider: ethers.BrowserProvider | null;
  chainId: number | null;
  isConnected: boolean;
  isConnecting: boolean;
  connectFarcaster: () => Promise<void>;
  connectBase: () => Promise<void>;
  disconnect: () => void;
  ensureBaseMainnet: () => Promise<void>;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export function WalletProvider({ children }: { children: ReactNode }) {
  const [address, setAddress] = useState<string | null>(null);
  const [provider, setProvider] = useState<ethers.BrowserProvider | null>(null);
  const [chainId, setChainId] = useState<number | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const connectingRef = useRef(false);

  /////////////////////////////////////////////////////////////
  // 1. BASE MINI APP LOGIN (MetaMask/Coinbase via window.ethereum)
  /////////////////////////////////////////////////////////////
  const connectBase = async () => {
    if (connectingRef.current) return;
    connectingRef.current = true;
    setIsConnecting(true);

    try {
      const anyWindow = window as any;
      if (!anyWindow.ethereum) {
        alert('No wallet detected. Install MetaMask or open inside Base App.');
        return;
      }

      const evm = new ethers.BrowserProvider(anyWindow.ethereum);
      const accounts = await evm.send('eth_requestAccounts', []);
      const signer = await evm.getSigner();

      setAddress(await signer.getAddress());
      setProvider(evm);

      const net = await evm.getNetwork();
      setChainId(Number(net.chainId));

      localStorage.setItem('wallet_type', 'base');
    } catch (err: any) {
      console.error('Base Connect Error:', err);
      setError(err.message || 'Connection failed');
    }

    connectingRef.current = false;
    setIsConnecting(false);
  };

  /////////////////////////////////////////////////////////////
  // 2. FARCASTER MINI APP LOGIN — OFFICIAL WORKFLOW
  /////////////////////////////////////////////////////////////
  const connectFarcaster = async () => {
    if (connectingRef.current) return;

    connectingRef.current = true;
    setIsConnecting(true);

    try {
      const { sdk } = await loadFarcasterSDK();

      // REQUIRED
      await sdk.actions.ready();

      // Get signer provider from Warpcast/Base Mini App
      const ethProvider = await sdk.wallet.getEthereumProvider();
      if (!ethProvider) {
        alert('Farcaster signer unavailable. Open inside Warpcast.');
        return;
      }

      const evm = new ethers.BrowserProvider(ethProvider);
      const accounts = await evm.send('eth_requestAccounts', []);
      const signer = await evm.getSigner();

      setAddress(await signer.getAddress());
      setProvider(evm);

      const net = await evm.getNetwork();
      setChainId(Number(net.chainId));

      localStorage.setItem('wallet_type', 'farcaster');
    } catch (err: any) {
      console.error('Farcaster Connect Error:', err);
      alert('Farcaster login failed. Open inside Warpcast mini app.');
      setError(err.message);
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
  // 5. AUTO-RESTORE CONNECTION
  /////////////////////////////////////////////////////////////
  useEffect(() => {
    const reconnect = async () => {
      const saved = localStorage.getItem('wallet_type');
      if (!saved) return;

      if (saved === 'farcaster') connectFarcaster();
      if (saved === 'base') connectBase();
    };
    reconnect();
  }, []);

  return (
    <WalletContext.Provider
      value={{
        address,
        provider,
        chainId,
        isConnected: !!address,
        isConnecting,
        connectFarcaster,
        connectBase,
        disconnect,
        ensureBaseMainnet,
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
