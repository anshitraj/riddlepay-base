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

  useEffect(() => {
    // Only check for existing connection if we don't have a stored disconnect state
    // This ensures users must explicitly reconnect after disconnecting
    if (typeof window !== 'undefined' && window.ethereum) {
      // Check localStorage for explicit disconnect state
      const wasDisconnected = localStorage.getItem('wallet_disconnected') === 'true';
      
      if (!wasDisconnected) {
        window.ethereum.request({ method: 'eth_accounts' }).then((accounts: string[]) => {
          if (accounts.length > 0) {
            const provider = new ethers.BrowserProvider(window.ethereum);
            setProvider(provider);
            setAddress(accounts[0]);
            
            // Get current chain ID - ensure it's properly parsed
            window.ethereum.request({ method: 'eth_chainId' }).then((id: string) => {
              const parsedChainId = typeof id === 'string' ? parseInt(id, 16) : Number(id);
              console.log('Initial chainId from eth_chainId:', id, 'parsed:', parsedChainId);
              setChainId(parsedChainId);
            }).catch(err => {
              console.error('Error getting chainId:', err);
              // Fallback: get from provider
              provider.getNetwork().then(network => {
                console.log('ChainId from provider:', Number(network.chainId));
                setChainId(Number(network.chainId));
              });
            });
          }
        });
      }
      
      // Listen for chain changes
      window.ethereum.on('chainChanged', (chainId: string) => {
        const parsedChainId = typeof chainId === 'string' ? parseInt(chainId, 16) : Number(chainId);
        console.log('Chain changed to:', parsedChainId);
        setChainId(parsedChainId);
        window.location.reload();
      });
    }
  }, []);

  const switchToBaseMainnet = async () => {
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
      await window.ethereum!.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: BASE_MAINNET_CHAIN_ID }],
      });
    } catch (switchError: any) {
      // This error code indicates that the chain has not been added to MetaMask
      if (switchError.code === 4902) {
        try {
          // Add Base Mainnet network
          await window.ethereum!.request({
            method: 'wallet_addEthereumChain',
            params: [BASE_MAINNET_NETWORK],
          });
        } catch (addError) {
          console.error('Error adding Base Mainnet network:', addError);
          throw new Error('Failed to add Base Mainnet network. Please add it manually in MetaMask.');
        }
      } else {
        console.error('Error switching to Base Mainnet:', switchError);
        throw new Error('Failed to switch to Base Mainnet network.');
      }
    }
  };

  const switchToBaseSepolia = async () => {
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
      await window.ethereum!.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: BASE_SEPOLIA_CHAIN_ID }],
      });
    } catch (switchError: any) {
      // This error code indicates that the chain has not been added to MetaMask
      if (switchError.code === 4902) {
        try {
          // Add Base Sepolia network
          await window.ethereum!.request({
            method: 'wallet_addEthereumChain',
            params: [BASE_SEPOLIA_NETWORK],
          });
        } catch (addError) {
          console.error('Error adding Base Sepolia network:', addError);
          throw new Error('Failed to add Base Sepolia network. Please add it manually in MetaMask.');
        }
      } else {
        console.error('Error switching to Base Sepolia:', switchError);
        throw new Error('Failed to switch to Base Sepolia network.');
      }
    }
  };

  const connect = async () => {
    if (typeof window === 'undefined' || !window.ethereum) {
      alert('Please install MetaMask or another Web3 wallet');
      return;
    }

    try {
      // Clear disconnect state to allow reconnection
      localStorage.removeItem('wallet_disconnected');
      
      // First, switch to Base Sepolia network
      await switchToBaseSepolia();
      
      // Wait a moment for network switch to complete
      await new Promise(resolve => setTimeout(resolve, 500));

      // Always request accounts explicitly - this ensures MetaMask popup opens
      // Using eth_requestAccounts instead of eth_accounts ensures user approval
      const provider = new ethers.BrowserProvider(window.ethereum);
      await provider.send('eth_requestAccounts', []);
      const signer = await provider.getSigner();
      const address = await signer.getAddress();
      
      setProvider(provider);
      setAddress(address);

      // Listen for account changes
      window.ethereum.on('accountsChanged', (accounts: string[]) => {
        if (accounts.length > 0) {
          setAddress(accounts[0]);
        } else {
          disconnect();
        }
      });

      // Get current chain ID - check both methods to ensure accuracy
      const network = await provider.getNetwork();
      const networkChainId = Number(network.chainId);
      
      // Also check via eth_chainId for verification
      const ethChainId = await window.ethereum.request({ method: 'eth_chainId' });
      const parsedEthChainId = typeof ethChainId === 'string' ? parseInt(ethChainId, 16) : Number(ethChainId);
      
      console.log('Connected - chainId from network:', networkChainId, 'from eth_chainId:', parsedEthChainId);
      
      // Use the chainId from eth_chainId as it's more reliable
      setChainId(parsedEthChainId);

      // Listen for chain changes
      window.ethereum.on('chainChanged', (chainId: string) => {
        setChainId(parseInt(chainId, 16));
        window.location.reload();
      });
    } catch (error: any) {
      console.error('Error connecting wallet:', error);
      // If user rejects, set disconnect state
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
    if (typeof window === 'undefined' || !window.ethereum) {
      alert('Please install MetaMask or another Web3 wallet');
      return;
    }

    try {
      // Request account selection - this will show MetaMask's account picker
      // First try wallet_requestPermissions which shows account selection UI
      try {
        await window.ethereum.request({
          method: 'wallet_requestPermissions',
          params: [{ eth_accounts: {} }],
        });
      } catch (permError: any) {
        // If permissions already granted, wallet_requestPermissions might not show picker
        // Fall through to eth_requestAccounts
        if (permError.code !== 4001) {
          console.log('Permissions request:', permError);
        }
      }

      // Request accounts - this will show account picker if multiple accounts exist
      const provider = new ethers.BrowserProvider(window.ethereum);
      const accounts = await provider.send('eth_requestAccounts', []);
      
      if (accounts && accounts.length > 0) {
        const signer = await provider.getSigner();
        const newAddress = await signer.getAddress();
        
        setProvider(provider);
        setAddress(newAddress);

        // Get current chain ID
        const network = await provider.getNetwork();
        setChainId(Number(network.chainId));
      }
    } catch (error: any) {
      // User rejected the request or no accounts available
      if (error.code !== 4001) {
        console.error('Error switching wallet:', error);
        alert('Failed to switch wallet. Please try switching accounts in MetaMask directly.');
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

