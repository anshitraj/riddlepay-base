'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { ethers } from 'ethers';

interface WalletContextType {
  address: string | null;
  provider: ethers.BrowserProvider | null;
  connect: () => Promise<void>;
  disconnect: () => void;
  switchWallet: () => Promise<void>;
  isConnected: boolean;
  ensureBaseSepolia: () => Promise<void>;
  ensureBaseMainnet: () => Promise<void>;
  chainId: number | null;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export function WalletProvider({ children }: { children: ReactNode }) {
  const [address, setAddress] = useState<string | null>(null);
  const [provider, setProvider] = useState<ethers.BrowserProvider | null>(null);
  const [chainId, setChainId] = useState<number | null>(null);

  // Helper to check if running in Farcaster
  const isFarcaster = () => {
    try {
      if (typeof window === 'undefined') return false;
      return (
        window.location?.href?.includes('farcaster.xyz') || 
        window.location?.href?.includes('warpcast.com') ||
        !!(window as any).farcaster ||
        !!(window as any).parent?.farcaster
      );
    } catch (error) {
      console.error('Error checking Farcaster environment:', error);
      return false;
    }
  };

  // Helper to get Ethereum provider (Farcaster SDK wallet or window.ethereum)
  const getEvmProvider = async (): Promise<ethers.BrowserProvider | null> => {
    try {
      if (typeof window === 'undefined') return null;

      // 1. Try Farcaster Mini App wallet first (Base App / Farcaster)
      try {
        const { sdk } = await import('@farcaster/miniapp-sdk');
        const ethProvider = await sdk.wallet.getEthereumProvider();
        
        if (ethProvider) {
          console.log('[RiddlePay] Using Farcaster Mini App wallet provider');
          return new ethers.BrowserProvider(ethProvider as any);
        }
      } catch (err) {
        console.log('[RiddlePay] Not running as Farcaster Mini App, falling back', err);
      }

      // 2. Fall back to browser-injected provider (MetaMask, Coinbase, etc.)
      const anyWindow = window as any;
      if (anyWindow.ethereum) {
        console.log('[RiddlePay] Using window.ethereum provider');
        return new ethers.BrowserProvider(anyWindow.ethereum as any);
      }

      // 3. No wallet anywhere
      console.warn('[RiddlePay] No Ethereum wallet available (Mini App or browser)');
      return null;
    } catch (error) {
      console.error('[RiddlePay] Error getting wallet provider:', error);
      return null;
    }
  };

  // Helper to get raw wallet provider (for direct requests)
  const getWalletProvider = async () => {
    try {
      if (typeof window === 'undefined') return null;

      // 1. Try Farcaster Mini App wallet first
      try {
        const { sdk } = await import('@farcaster/miniapp-sdk');
        const ethProvider = await sdk.wallet.getEthereumProvider();
        
        if (ethProvider) {
          console.log('[RiddlePay] Using Farcaster Mini App wallet provider (raw)');
          return ethProvider;
        }
      } catch (err) {
        console.log('[RiddlePay] Not running as Farcaster Mini App, falling back', err);
      }

      // 2. Fall back to window.ethereum
      if (window.ethereum) {
        console.log('[RiddlePay] Using window.ethereum provider (raw)');
        return window.ethereum;
      }

      return null;
    } catch (error) {
      console.error('[RiddlePay] Error getting wallet provider:', error);
      return null;
    }
  };

  useEffect(() => {
    // Auto-connect wallet if available
    const initWallet = async () => {
      try {
        const provider = await getEvmProvider();
        if (!provider) return;

        // Only check for existing connection if we don't have a stored disconnect state
        const wasDisconnected = localStorage.getItem('wallet_disconnected') === 'true';
        const isBaseApp = isFarcaster();
        
        // In Farcaster/Base App, always try to auto-connect
        // In normal browser, only auto-connect if not explicitly disconnected
        if (wasDisconnected && !isBaseApp) return;

        // Check for existing accounts
        const accounts = await provider.send('eth_accounts', []);
        if (accounts && accounts.length > 0) {
          setProvider(provider);
          setAddress(accounts[0]);
          
          // Get current chain ID
          const network = await provider.getNetwork();
          const networkChainId = Number(network.chainId);
          setChainId(networkChainId);
          console.log('[RiddlePay] Auto-connected wallet:', accounts[0], 'Chain:', networkChainId);
        }
      } catch (error) {
        console.error('[RiddlePay] Error initializing wallet:', error);
      }
    };

    initWallet();
  }, []);

  const switchToBaseMainnet = async () => {
    const walletProvider = await getWalletProvider();
    if (!walletProvider) {
      throw new Error('Wallet provider not available');
    }

    const BASE_MAINNET_CHAIN_ID = '0x2105'; // 8453 in hex
    const BASE_MAINNET_NETWORK = {
      chainId: BASE_MAINNET_CHAIN_ID,
      chainName: 'Base',
      nativeCurrency: {
        name: 'Ether',
        symbol: 'ETH',
        decimals: 18,
      },
      rpcUrls: ['https://mainnet.base.org'],
      blockExplorerUrls: ['https://basescan.org'],
    };

    try {
      // Try to switch to Base Mainnet
      await walletProvider.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: BASE_MAINNET_CHAIN_ID }],
      });
    } catch (switchError: any) {
      // This error code indicates that the chain has not been added
      if (switchError.code === 4902) {
        try {
          // Add Base Mainnet network
          await walletProvider.request({
            method: 'wallet_addEthereumChain',
            params: [BASE_MAINNET_NETWORK],
          });
        } catch (addError) {
          console.error('Error adding Base Mainnet network:', addError);
          throw new Error('Failed to add Base Mainnet network.');
        }
      } else {
        console.error('Error switching to Base Mainnet:', switchError);
        throw new Error('Failed to switch to Base Mainnet network.');
      }
    }
  };

  const switchToBaseSepolia = async () => {
    const walletProvider = await getWalletProvider();
    if (!walletProvider) {
      throw new Error('Wallet provider not available');
    }

    const BASE_SEPOLIA_CHAIN_ID = '0x14a34'; // 84532 in hex
    const BASE_SEPOLIA_NETWORK = {
      chainId: BASE_SEPOLIA_CHAIN_ID,
      chainName: 'Base Sepolia',
      nativeCurrency: {
        name: 'Ether',
        symbol: 'ETH',
        decimals: 18,
      },
      rpcUrls: ['https://sepolia.base.org'],
      blockExplorerUrls: ['https://sepolia.basescan.org'],
    };

    try {
      // Try to switch to Base Sepolia
      await walletProvider.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: BASE_SEPOLIA_CHAIN_ID }],
      });
    } catch (switchError: any) {
      // This error code indicates that the chain has not been added
      if (switchError.code === 4902) {
        try {
          // Add Base Sepolia network
          await walletProvider.request({
            method: 'wallet_addEthereumChain',
            params: [BASE_SEPOLIA_NETWORK],
          });
        } catch (addError) {
          console.error('Error adding Base Sepolia network:', addError);
          throw new Error('Failed to add Base Sepolia network.');
        }
      } else {
        console.error('Error switching to Base Sepolia:', switchError);
        throw new Error('Failed to switch to Base Sepolia network.');
      }
    }
  };

  const connect = async () => {
    try {
      // Clear disconnect state to allow reconnection
      localStorage.removeItem('wallet_disconnected');
      
      // Get the appropriate provider (Farcaster SDK or window.ethereum)
      const provider = await getEvmProvider();
      
      if (!provider) {
        // Only show alert in normal browser, not in Farcaster
        if (!isFarcaster()) {
          alert('Please install MetaMask or another Web3 wallet');
        } else {
          console.error('[RiddlePay] Farcaster wallet not available');
        }
        return;
      }

      // Request accounts explicitly - this ensures wallet popup opens
      await provider.send('eth_requestAccounts', []);
      const signer = await provider.getSigner();
      const address = await signer.getAddress();
      
      setProvider(provider);
      setAddress(address);

      // Get current chain ID and ensure we're on Base
      const network = await provider.getNetwork();
      const networkChainId = Number(network.chainId);
      setChainId(networkChainId);
      
      console.log('[RiddlePay] Connected wallet:', address, 'Chain:', networkChainId);

      // In normal browser (not Farcaster), ensure we're on Base Mainnet
      if (!isFarcaster() && networkChainId !== 8453) {
        await switchToBaseMainnet();
        // Reload to get updated chain ID
        window.location.reload();
        return;
      }

      // Listen for account changes
      const walletProvider = await getWalletProvider();
      if (walletProvider && typeof walletProvider.on === 'function') {
        walletProvider.on('accountsChanged', (accounts: string[]) => {
          if (accounts.length > 0) {
            setAddress(accounts[0]);
          } else {
            disconnect();
          }
        });

        // Listen for chain changes
        walletProvider.on('chainChanged', (chainId: string) => {
          const parsedChainId = typeof chainId === 'string' ? parseInt(chainId, 16) : Number(chainId);
          console.log('[RiddlePay] Chain changed to:', parsedChainId);
          setChainId(parsedChainId);
          window.location.reload();
        });
      }
    } catch (error: any) {
      console.error('[RiddlePay] Error connecting wallet:', error);
      // If user rejects, set disconnect state
      if (error.code === 4001) {
        localStorage.setItem('wallet_disconnected', 'true');
      }
      // Don't show alert in Farcaster - errors are handled by the platform
      if (!isFarcaster()) {
        alert('Failed to connect wallet: ' + (error.message || 'Unknown error'));
      }
    }
  };

  const ensureBaseSepolia = async () => {
    const BASE_SEPOLIA_CHAIN_ID = 84532;
    
    if (chainId !== BASE_SEPOLIA_CHAIN_ID) {
      await switchToBaseSepolia();
    }
  };

  const ensureBaseMainnet = async () => {
    const BASE_MAINNET_CHAIN_ID = 8453;
    
    if (chainId !== BASE_MAINNET_CHAIN_ID) {
      await switchToBaseMainnet();
    }
  };

  const switchWallet = async () => {
    try {
      const provider = await getEvmProvider();
      
      if (!provider) {
        if (isFarcaster()) {
          console.error('[RiddlePay] Farcaster wallet not available');
          return;
        }
        alert('Please install MetaMask or another Web3 wallet');
        return;
      }

      // Request account selection - this will show wallet's account picker
      const walletProvider = await getWalletProvider();
      if (walletProvider) {
        try {
          await walletProvider.request({
            method: 'wallet_requestPermissions',
            params: [{ eth_accounts: {} }],
          });
        } catch (permError: any) {
          // If permissions already granted, wallet_requestPermissions might not show picker
          if (permError.code !== 4001) {
            console.log('[RiddlePay] Permissions request:', permError);
          }
        }
      }

      // Request accounts - this will show account picker if multiple accounts exist
      await provider.send('eth_requestAccounts', []);
      const signer = await provider.getSigner();
      const newAddress = await signer.getAddress();
      
      setProvider(provider);
      setAddress(newAddress);

      // Get current chain ID
      const network = await provider.getNetwork();
      const providerChainId = Number(network.chainId);
      setChainId(providerChainId);
      
      console.log('[RiddlePay] Switched wallet to:', newAddress);
    } catch (error: any) {
      // User rejected the request or no accounts available
      if (error.code !== 4001) {
        console.error('[RiddlePay] Error switching wallet:', error);
        if (!isFarcaster()) {
          alert('Failed to switch wallet. Please try switching accounts directly.');
        }
      }
    }
  };

  const disconnect = () => {
    setAddress(null);
    setProvider(null);
    setChainId(null);
    // Mark as explicitly disconnected - this prevents auto-reconnection
    localStorage.setItem('wallet_disconnected', 'true');
  };

  return (
    <WalletContext.Provider
      value={{
        address,
        provider,
        connect,
        disconnect,
        switchWallet,
        isConnected: !!address,
        ensureBaseSepolia,
        ensureBaseMainnet,
        chainId,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet() {
  const context = useContext(WalletContext);
  if (context === undefined) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
}

// Type declaration for window.ethereum
declare global {
  interface Window {
    ethereum?: {
      request: (args: { method: string; params?: any[] }) => Promise<any>;
      on: (event: string, callback: (args: any) => void) => void;
      removeListener: (event: string, callback: (args: any) => void) => void;
      isMetaMask?: boolean;
    };
  }
}

