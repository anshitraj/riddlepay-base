'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { ethers } from 'ethers';

interface WalletContextType {
  address: string | null;
  provider: ethers.BrowserProvider | null;
  connect: () => Promise<void>;
  connectFarcaster: () => Promise<void>;
  connectBase: () => Promise<void>;
  connectBrowser: () => Promise<void>;
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
  const [walletType, setWalletType] = useState<'farcaster' | 'base' | 'browser' | null>(null);

  // Helper to check if running in Base Mini App
  const isBaseMiniApp = (): boolean => {
    try {
      if (typeof window === 'undefined') return false;
      const anyWindow = window as any;
      return (
        !!(anyWindow.coinbaseWalletSDK) ||
        navigator.userAgent?.includes('BaseApp') ||
        window.location?.href?.includes('base.org') ||
        window.location?.href?.includes('base.build')
      );
    } catch (error) {
      console.error('[RiddlePay] Error checking Base Mini App:', error);
      return false;
    }
  };

  // Helper to check if running in Farcaster Mini App
  const isFarcasterMiniApp = async (): Promise<boolean> => {
    try {
      if (typeof window === 'undefined') return false;
      
      // Try to detect via SDK first (most reliable)
      try {
        const { sdk } = await import('@farcaster/miniapp-sdk');
        const ethProvider = await sdk.wallet.getEthereumProvider();
        if (ethProvider) return true;
      } catch (err) {
        // SDK not available, continue with URL detection
      }
      
      // Fallback: Check URLs
      return (
        window.location?.href?.includes('farcaster.xyz') || 
        window.location?.href?.includes('warpcast.com') ||
        !!(window as any).farcaster ||
        !!(window as any).parent?.farcaster
      );
    } catch (error) {
      console.error('[RiddlePay] Error checking Farcaster Mini App:', error);
      return false;
    }
  };

  // Helper to check if running in any Mini App (Base App or Farcaster)
  const isMiniApp = async (): Promise<boolean> => {
    return isBaseMiniApp() || await isFarcasterMiniApp();
  };

  // Helper to check if running in Farcaster (for UI decisions)
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
      console.error('[RiddlePay] Error checking Farcaster environment:', error);
      return false;
    }
  };

  // Helper to get Ethereum provider based on stored wallet type or auto-detect
  const getEvmProvider = async (): Promise<ethers.BrowserProvider | null> => {
    try {
      if (typeof window === 'undefined') return null;

      // If we have a stored wallet type, use that specific provider
      const storedWalletType = walletType || localStorage.getItem('wallet_type') as 'farcaster' | 'base' | 'browser' | null;
      
      if (storedWalletType === 'farcaster') {
        try {
          const { sdk } = await import('@farcaster/miniapp-sdk');
          const ethProvider = await sdk.wallet.getEthereumProvider();
          if (ethProvider) {
            console.log('[RiddlePay] Using stored Farcaster wallet provider');
            return new ethers.BrowserProvider(ethProvider as any);
          }
        } catch (err) {
          console.warn('[RiddlePay] Stored Farcaster wallet not available, falling back');
        }
      }
      
      if (storedWalletType === 'base' || storedWalletType === 'browser') {
        const anyWindow = window as any;
        if (anyWindow.ethereum) {
          console.log(`[RiddlePay] Using stored ${storedWalletType} wallet provider`);
          return new ethers.BrowserProvider(anyWindow.ethereum as any);
        }
      }

      // Auto-detect if no stored type (for initial connection)
      // 1️⃣ Try Farcaster Mini App wallet first
      try {
        const { sdk } = await import('@farcaster/miniapp-sdk');
        const ethProvider = await sdk.wallet.getEthereumProvider();
        
        if (ethProvider) {
          console.log('[RiddlePay] Auto-detected Farcaster Mini App wallet provider');
          return new ethers.BrowserProvider(ethProvider as any);
        }
      } catch (err) {
        // Not Farcaster, continue
      }

      // 2️⃣ Try Base Mini App provider (uses window.ethereum from Coinbase Wallet SDK)
      if (isBaseMiniApp()) {
        const anyWindow = window as any;
        if (anyWindow.ethereum) {
          console.log('[RiddlePay] Auto-detected Base Mini App wallet provider');
          return new ethers.BrowserProvider(anyWindow.ethereum as any);
        }
      }

      // 3️⃣ Fall back to normal browser wallet (MetaMask, Coinbase, etc.)
      const anyWindow = window as any;
      if (anyWindow.ethereum) {
        console.log('[RiddlePay] Auto-detected browser wallet provider');
        return new ethers.BrowserProvider(anyWindow.ethereum as any);
      }

      // 4️⃣ No wallet anywhere
      console.warn('[RiddlePay] No Ethereum wallet available');
      return null;
    } catch (error) {
      console.error('[RiddlePay] Error getting wallet provider:', error);
      return null;
    }
  };

  // Helper to get raw wallet provider (for direct requests) - respects stored wallet type
  const getWalletProvider = async () => {
    try {
      if (typeof window === 'undefined') return null;

      // If we have a stored wallet type, use that specific provider
      const storedWalletType = walletType || localStorage.getItem('wallet_type') as 'farcaster' | 'base' | 'browser' | null;
      
      if (storedWalletType === 'farcaster') {
        try {
          const { sdk } = await import('@farcaster/miniapp-sdk');
          const ethProvider = await sdk.wallet.getEthereumProvider();
          if (ethProvider) {
            console.log('[RiddlePay] Using stored Farcaster wallet provider (raw)');
            return ethProvider;
          }
        } catch (err) {
          console.warn('[RiddlePay] Stored Farcaster wallet not available, falling back');
        }
      }
      
      if (storedWalletType === 'base' || storedWalletType === 'browser') {
        const anyWindow = window as any;
        if (anyWindow.ethereum) {
          console.log(`[RiddlePay] Using stored ${storedWalletType} wallet provider (raw)`);
          return anyWindow.ethereum;
        }
      }

      // Auto-detect if no stored type (for initial connection)
      // 1️⃣ Try Farcaster Mini App wallet first
      try {
        const { sdk } = await import('@farcaster/miniapp-sdk');
        const ethProvider = await sdk.wallet.getEthereumProvider();
        
        if (ethProvider) {
          console.log('[RiddlePay] Auto-detected Farcaster Mini App wallet provider (raw)');
          return ethProvider;
        }
      } catch (err) {
        // Not Farcaster, continue
      }

      // 2️⃣ Try Base Mini App or browser wallet
      const anyWindow = window as any;
      if (anyWindow.ethereum) {
        console.log('[RiddlePay] Auto-detected window.ethereum provider (raw)');
        return anyWindow.ethereum;
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
        const inMiniApp = await isMiniApp();
        
        // In Mini App (Base App/Farcaster), always try to auto-connect
        // In normal browser, only auto-connect if not explicitly disconnected
        if (wasDisconnected && !inMiniApp) return;

        // Check for existing accounts with error handling
        let accounts: string[] = [];
        try {
          accounts = await provider.send('eth_accounts', []) as string[];
        } catch (error: any) {
          console.warn('[RiddlePay] Error checking existing accounts:', error);
          // If there's an error, don't auto-connect
          return;
        }
        
        if (accounts && accounts.length > 0) {
          setProvider(provider);
          setAddress(accounts[0]);
          
          // Get current chain ID
          const network = await provider.getNetwork();
          const networkChainId = Number(network.chainId);
          setChainId(networkChainId);
          
          // Restore wallet type from localStorage if available
          const storedWalletType = localStorage.getItem('wallet_type') as 'farcaster' | 'base' | 'browser' | null;
          if (storedWalletType) {
            setWalletType(storedWalletType);
          } else {
            // Auto-detect wallet type
            if (await isFarcasterMiniApp()) {
              setWalletType('farcaster');
              localStorage.setItem('wallet_type', 'farcaster');
            } else if (isBaseMiniApp()) {
              setWalletType('base');
              localStorage.setItem('wallet_type', 'base');
            } else {
              setWalletType('browser');
              localStorage.setItem('wallet_type', 'browser');
            }
          }
          
          console.log('[RiddlePay] Auto-connected wallet:', accounts[0], 'Chain:', networkChainId, 'Type:', storedWalletType || 'auto-detected');
          
          // Setup listeners only once
          const walletProvider = await getWalletProvider();
          if (walletProvider && typeof walletProvider.on === 'function') {
            // Remove any existing listeners first to prevent duplicates
            if (typeof walletProvider.removeAllListeners === 'function') {
              walletProvider.removeAllListeners('accountsChanged');
              walletProvider.removeAllListeners('chainChanged');
            }
            
            walletProvider.on('accountsChanged', (accounts: string[]) => {
              if (accounts.length > 0) {
                setAddress(accounts[0]);
              } else {
                disconnect();
              }
            });

            walletProvider.on('chainChanged', async (chainId: string) => {
              const parsedChainId = typeof chainId === 'string' ? parseInt(chainId, 16) : Number(chainId);
              console.log('[RiddlePay] Chain changed to:', parsedChainId);
              setChainId(parsedChainId);
              try {
                const newProvider = new ethers.BrowserProvider(walletProvider as any);
                setProvider(newProvider);
              } catch (error) {
                console.error('[RiddlePay] Error updating provider after chain change:', error);
              }
            });
          }
        }
      } catch (error) {
        console.error('[RiddlePay] Error initializing wallet:', error);
      }
    };

    initWallet();
    
    // Cleanup function to remove listeners on unmount
    return () => {
      // Cleanup is handled by removeAllListeners in setupWalletConnection
    };
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

  // Helper to setup wallet listeners and handle connection
  const setupWalletConnection = async (provider: ethers.BrowserProvider, walletProvider: any) => {
    try {
      // Check if we're explicitly disconnected before attempting connection
      const wasDisconnected = localStorage.getItem('wallet_disconnected') === 'true';
      if (wasDisconnected) {
        console.log('[RiddlePay] Skipping connection - wallet was explicitly disconnected');
        return;
      }

      // Request accounts explicitly with error handling
      let accounts: string[] = [];
      try {
        accounts = await provider.send('eth_requestAccounts', []) as string[];
      } catch (error: any) {
        // Handle user rejection or connection errors
        if (error.code === 4001) {
          console.log('[RiddlePay] User rejected connection request');
          localStorage.setItem('wallet_disconnected', 'true');
          throw new Error('Connection rejected by user');
        }
        // Handle other errors
        console.error('[RiddlePay] Error requesting accounts:', error);
        throw new Error(`Failed to connect: ${error.message || 'Unknown error'}`);
      }

      if (!accounts || accounts.length === 0) {
        throw new Error('No accounts available');
      }

      const signer = await provider.getSigner();
      const address = await signer.getAddress();
      
      setProvider(provider);
      setAddress(address);

      // Get current chain ID
      const network = await provider.getNetwork();
      const networkChainId = Number(network.chainId);
      setChainId(networkChainId);
      
      console.log('[RiddlePay] Connected wallet:', address, 'Chain:', networkChainId);

      // Listen for account changes - remove existing listeners first to prevent duplicates
      if (walletProvider && typeof walletProvider.on === 'function') {
        // Remove any existing listeners to prevent multiple registrations
        if (typeof walletProvider.removeAllListeners === 'function') {
          walletProvider.removeAllListeners('accountsChanged');
          walletProvider.removeAllListeners('chainChanged');
        }
        
        walletProvider.on('accountsChanged', (accounts: string[]) => {
          if (accounts.length > 0) {
            setAddress(accounts[0]);
          } else {
            disconnect();
          }
        });

        // Listen for chain changes - update state without reloading
        walletProvider.on('chainChanged', async (chainId: string) => {
          const parsedChainId = typeof chainId === 'string' ? parseInt(chainId, 16) : Number(chainId);
          console.log('[RiddlePay] Chain changed to:', parsedChainId);
          setChainId(parsedChainId);
          // Update provider to reflect new chain
          try {
            const newProvider = new ethers.BrowserProvider(walletProvider as any);
            setProvider(newProvider);
          } catch (error) {
            console.error('[RiddlePay] Error updating provider after chain change:', error);
          }
        });
      }
    } catch (error: any) {
      console.error('[RiddlePay] Error in setupWalletConnection:', error);
      // Clean up on error
      setProvider(null);
      setAddress(null);
      setChainId(null);
      throw error;
    }
  };

  // Connect to Farcaster Mini App
  const connectFarcaster = async () => {
    try {
      localStorage.removeItem('wallet_disconnected');
      
      // First check if we're actually in Farcaster app
      const inFarcaster = await isFarcasterMiniApp();
      if (!inFarcaster) {
        // User is in browser, show friendly message
        alert('You are on browser. Please connect with Base or open this app in Farcaster to use Farcaster login.');
        return;
      }
      
      try {
        const { sdk } = await import('@farcaster/miniapp-sdk');
        const ethProvider = await sdk.wallet.getEthereumProvider();
        
        if (!ethProvider) {
          console.warn('[RiddlePay] Farcaster wallet not available');
          alert('Farcaster wallet not available. Please open this app in Farcaster.');
          return;
        }

        const provider = new ethers.BrowserProvider(ethProvider as any);
        setWalletType('farcaster');
        localStorage.setItem('wallet_type', 'farcaster');
        await setupWalletConnection(provider, ethProvider);
      } catch (sdkError: any) {
        // If SDK import fails or provider not available
        console.warn('[RiddlePay] Farcaster SDK not available:', sdkError);
        alert('You are on browser. Please connect with Base or open this app in Farcaster to use Farcaster login.');
        return;
      }
    } catch (error: any) {
      console.error('[RiddlePay] Error connecting to Farcaster:', error);
      // Show user-friendly message instead of technical error
      alert('You are on browser. Please connect with Base or open this app in Farcaster to use Farcaster login.');
    }
  };

  // Connect to Base Mini App
  const connectBase = async () => {
    try {
      localStorage.removeItem('wallet_disconnected');
      
      const anyWindow = window as any;
      if (!anyWindow.ethereum) {
        // Only show alert if explicitly trying to connect to Base
        // Don't show if this is called from auto-connect or fallback
        console.warn('[RiddlePay] Base wallet not available');
        return;
      }

      const provider = new ethers.BrowserProvider(anyWindow.ethereum as any);
      setWalletType('base');
      localStorage.setItem('wallet_type', 'base');
      
      // Check if we're on Base network, if not, switch
      const network = await provider.getNetwork();
      const networkChainId = Number(network.chainId);
      
      if (networkChainId !== 8453) {
        await switchToBaseMainnet();
        // Wait a moment for network switch, then reconnect
        await new Promise(resolve => setTimeout(resolve, 500));
        const updatedProvider = new ethers.BrowserProvider(anyWindow.ethereum as any);
        const updatedNetwork = await updatedProvider.getNetwork();
        const updatedChainId = Number(updatedNetwork.chainId);
        setChainId(updatedChainId);
        await setupWalletConnection(updatedProvider, anyWindow.ethereum);
        return;
      }

      await setupWalletConnection(provider, anyWindow.ethereum);
    } catch (error: any) {
      console.error('[RiddlePay] Error connecting to Base:', error);
      // Don't show alert, just log the error
      // User can try again if needed
    }
  };

  // Connect to browser wallet (MetaMask, Coinbase, etc.)
  const connectBrowser = async () => {
    try {
      localStorage.removeItem('wallet_disconnected');
      
      const anyWindow = window as any;
      if (!anyWindow.ethereum) {
        alert('Please install MetaMask or another Web3 wallet');
        return;
      }

      const provider = new ethers.BrowserProvider(anyWindow.ethereum as any);
      setWalletType('browser');
      localStorage.setItem('wallet_type', 'browser');
      
      // Ensure we're on Base Mainnet
      const network = await provider.getNetwork();
      const networkChainId = Number(network.chainId);
      
      if (networkChainId !== 8453) {
        await switchToBaseMainnet();
        // Wait a moment for network switch, then reconnect
        await new Promise(resolve => setTimeout(resolve, 500));
        const updatedProvider = new ethers.BrowserProvider(anyWindow.ethereum as any);
        const updatedNetwork = await updatedProvider.getNetwork();
        const updatedChainId = Number(updatedNetwork.chainId);
        setChainId(updatedChainId);
        await setupWalletConnection(updatedProvider, anyWindow.ethereum);
        return;
      }

      await setupWalletConnection(provider, anyWindow.ethereum);
    } catch (error: any) {
      console.error('[RiddlePay] Error connecting browser wallet:', error);
      if (error.code === 4001) {
        localStorage.setItem('wallet_disconnected', 'true');
      }
      alert('Failed to connect wallet: ' + (error.message || 'Unknown error'));
    }
  };

  // Auto-connect (tries all methods in priority order)
  const connect = async () => {
    try {
      localStorage.removeItem('wallet_disconnected');
      
      // Get the appropriate provider (Farcaster SDK or window.ethereum)
      const provider = await getEvmProvider();
      
      if (!provider) {
        alert('Please install MetaMask or another Web3 wallet');
        return;
      }

      // Request accounts explicitly with error handling
      let accounts: string[] = [];
      try {
        accounts = await provider.send('eth_requestAccounts', []) as string[];
      } catch (error: any) {
        if (error.code === 4001) {
          console.log('[RiddlePay] User rejected connection request');
          localStorage.setItem('wallet_disconnected', 'true');
          throw new Error('Connection rejected by user');
        }
        console.error('[RiddlePay] Error requesting accounts:', error);
        throw new Error(`Failed to connect: ${error.message || 'Unknown error'}`);
      }

      if (!accounts || accounts.length === 0) {
        throw new Error('No accounts available');
      }

      const signer = await provider.getSigner();
      const address = await signer.getAddress();
      
      setProvider(provider);
      setAddress(address);

      // Get current chain ID and ensure we're on Base
      const network = await provider.getNetwork();
      const networkChainId = Number(network.chainId);
      setChainId(networkChainId);
      
      console.log('[RiddlePay] Connected wallet:', address, 'Chain:', networkChainId);

      // In normal browser (not Mini App), ensure we're on Base Mainnet
      const inMiniApp = await isMiniApp();
      if (!inMiniApp && networkChainId !== 8453) {
        await switchToBaseMainnet();
        // Wait a moment for network switch, then update state
        await new Promise(resolve => setTimeout(resolve, 500));
        const updatedNetwork = await provider.getNetwork();
        const updatedChainId = Number(updatedNetwork.chainId);
        setChainId(updatedChainId);
        // Re-setup listeners with updated provider
        const walletProvider = await getWalletProvider();
        if (walletProvider && typeof walletProvider.on === 'function') {
          walletProvider.on('accountsChanged', (accounts: string[]) => {
            if (accounts.length > 0) {
              setAddress(accounts[0]);
            } else {
              disconnect();
            }
          });
          walletProvider.on('chainChanged', async (chainId: string) => {
            const parsedChainId = typeof chainId === 'string' ? parseInt(chainId, 16) : Number(chainId);
            console.log('[RiddlePay] Chain changed to:', parsedChainId);
            setChainId(parsedChainId);
            try {
              const newProvider = new ethers.BrowserProvider(walletProvider as any);
              setProvider(newProvider);
            } catch (error) {
              console.error('[RiddlePay] Error updating provider after chain change:', error);
            }
          });
        }
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
      if (error.code === 4001) {
        localStorage.setItem('wallet_disconnected', 'true');
      }
      alert('Failed to connect wallet: ' + (error.message || 'Unknown error'));
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
      let accounts: string[] = [];
      try {
        accounts = await provider.send('eth_requestAccounts', []) as string[];
      } catch (error: any) {
        if (error.code === 4001) {
          console.log('[RiddlePay] User rejected account switch request');
          return;
        }
        console.error('[RiddlePay] Error requesting accounts for switch:', error);
        throw new Error(`Failed to switch accounts: ${error.message || 'Unknown error'}`);
      }

      if (!accounts || accounts.length === 0) {
        throw new Error('No accounts available');
      }

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

  const disconnect = async () => {
    // Clean up listeners before disconnecting
    try {
      const walletProvider = await getWalletProvider();
      if (walletProvider && typeof walletProvider.removeAllListeners === 'function') {
        walletProvider.removeAllListeners('accountsChanged');
        walletProvider.removeAllListeners('chainChanged');
        console.log('[RiddlePay] Removed wallet listeners on disconnect');
      }
    } catch (error) {
      console.warn('[RiddlePay] Error removing listeners on disconnect:', error);
    }

    // Clear state
    setAddress(null);
    setProvider(null);
    setChainId(null);
    setWalletType(null);
    
    // Mark as explicitly disconnected - this prevents auto-reconnection
    localStorage.setItem('wallet_disconnected', 'true');
    localStorage.removeItem('wallet_type');
    
    console.log('[RiddlePay] Wallet disconnected');
  };

  return (
    <WalletContext.Provider
      value={{
        address,
        provider,
        connect,
        connectFarcaster,
        connectBase,
        connectBrowser,
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

