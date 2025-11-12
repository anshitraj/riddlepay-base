import { useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';
import { useWallet } from '@/contexts/WalletContext';
import { retryWithBackoff } from '@/utils/retry';
import { createHybridRpcProvider, throttle, getCached, setCached } from '@/utils/rpcProvider';

const CONTRACT_ABI = [
  "function createGift(address receiver, string memory riddle, string memory answer, string memory message, uint256 amount, bool isETH, uint256 unlockTime) external payable",
  "function createBulkGifts(address[] memory receivers, uint256[] memory amounts, bool isETH, string memory message, uint256 unlockTime) external payable",
  "function claimGift(uint256 giftId, string memory guess) external",
  "function refundGift(uint256 giftId) external",
  "function getGift(uint256 giftId) external view returns (tuple(address sender, address receiver, string riddle, bytes32 answerHash, string message, uint256 amount, address tokenAddress, uint256 createdAt, uint256 unlockTime, bool claimed))",
  "function getGiftCount() external view returns (uint256)",
  "function getGiftsForUser(address user) external view returns (uint256[])",
  "function isExpired(uint256 giftId) external view returns (bool)",
  "function getTotalValueLocked() external view returns (uint256 totalETH, uint256 totalUSDC)",
  "event GiftCreated(uint256 indexed giftId, address indexed sender, address indexed receiver, string riddle, uint256 amount, address tokenAddress, uint256 unlockTime)",
  "event GiftClaimed(uint256 indexed giftId, address indexed receiver, uint256 amount)",
  "event GiftRefunded(uint256 indexed giftId, address indexed sender, uint256 amount)"
];

export interface Gift {
  sender: string;
  receiver: string;
  riddle: string;
  answerHash: string;
  message: string;
  amount: string;
  tokenAddress: string;
  createdAt: string;
  unlockTime: string;
  claimed: boolean;
}

export function useContract() {
  const { address, provider } = useWallet();
  const [approving, setApproving] = useState(false);
  const [contract, setContract] = useState<ethers.Contract | null>(null);
  const [readContract, setReadContract] = useState<ethers.Contract | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize read-only contract immediately (doesn't depend on provider)
  // Uses hybrid RPC provider (Alchemy primary, Base public RPC fallback)
  useEffect(() => {
    const contractAddress = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS;
    if (!contractAddress) {
      console.error('❌ Contract address not set in NEXT_PUBLIC_CONTRACT_ADDRESS');
      return;
    }
    console.log('✅ Contract address loaded:', contractAddress);

    // Create hybrid RPC provider (Alchemy primary, Base public RPC fallback)
    const rpcProvider = createHybridRpcProvider();
    
    if (rpcProvider) {
      try {
        const readOnlyContract = new ethers.Contract(
          contractAddress,
          CONTRACT_ABI,
          rpcProvider
        );
        console.log('✅ Read-only contract initialized with hybrid RPC provider');
        setReadContract(readOnlyContract);
        
        // Test the contract is working by getting the current block
        rpcProvider.getBlockNumber().then(blockNum => {
          console.log(`✅ RPC connection working, current block: ${blockNum}`);
        }).catch(err => {
          console.error('❌ RPC connection test failed:', err);
        });
      } catch (err) {
        console.error('❌ Error setting up read-only contract:', err);
      }
    } else {
      console.warn('⚠️ No RPC provider available, read-only contract unavailable');
    }
  }, []); // Empty dependency array - initialize once on mount

  // Set up write contract when provider is available
  useEffect(() => {
    const contractAddress = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS;
    if (!contractAddress || !provider) {
      return;
    }

    const setupContract = async () => {
      try {
        const signer = await provider.getSigner();
        const contractInstance = new ethers.Contract(
          contractAddress,
          CONTRACT_ABI,
          signer
        );
        console.log('✅ Write contract initialized');
        setContract(contractInstance);
      } catch (err) {
        console.error('❌ Error setting up write contract:', err);
      }
    };
    setupContract();
  }, [provider]);

  const approveUSDC = useCallback(async (amount: string) => {
    if (!provider || !process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || !process.env.NEXT_PUBLIC_USDC_ADDRESS) {
      throw new Error('Provider or addresses not initialized');
    }

    setApproving(true);
    try {
      const signer = await provider.getSigner();
      const usdcContract = new ethers.Contract(
        process.env.NEXT_PUBLIC_USDC_ADDRESS,
        [
          'function approve(address spender, uint256 amount) external returns (bool)',
          'function allowance(address owner, address spender) external view returns (uint256)'
        ],
        signer
      );

      const amountWei = ethers.parseUnits(amount, 6); // USDC has 6 decimals
      
      // Check current allowance first
      const userAddress = await signer.getAddress();
      const currentAllowance = await usdcContract.allowance(userAddress, process.env.NEXT_PUBLIC_CONTRACT_ADDRESS);
      
      console.log('🔍 Current USDC allowance:', ethers.formatUnits(currentAllowance, 6), 'USDC');
      console.log('🔍 Required amount:', amount, 'USDC');
      
      // Only approve if current allowance is insufficient
      if (currentAllowance < amountWei) {
        // Approve a larger amount (10x the required amount) to avoid multiple approvals
        // Or approve max if the amount is very small
        const approvalAmount = amountWei * BigInt(10); // Approve 10x to avoid frequent approvals
        const maxUint256 = BigInt('0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff');
        const finalApprovalAmount = approvalAmount > maxUint256 / BigInt(2) ? maxUint256 : approvalAmount;
        
        console.log('✅ Requesting USDC approval for:', ethers.formatUnits(finalApprovalAmount, 6), 'USDC');
        
        // Retry with backoff for rate-limited requests
        const tx = await retryWithBackoff(async () => {
          return await usdcContract.approve(process.env.NEXT_PUBLIC_CONTRACT_ADDRESS, finalApprovalAmount);
        });
        
        console.log('⏳ Waiting for approval transaction confirmation...');
        const receipt = await tx.wait();
        console.log('✅ USDC approval confirmed in block:', receipt.blockNumber);
        
        // Verify the approval went through
        const newAllowance = await usdcContract.allowance(userAddress, process.env.NEXT_PUBLIC_CONTRACT_ADDRESS);
        console.log('✅ New USDC allowance:', ethers.formatUnits(newAllowance, 6), 'USDC');
        
        if (newAllowance < amountWei) {
          throw new Error('Approval transaction confirmed but allowance is still insufficient');
        }
        
        return tx.hash;
      } else {
        console.log('✅ Sufficient USDC allowance already exists');
        return null; // No approval needed
      }
    } catch (err: any) {
      console.error('❌ USDC approval error:', err);
      const errorMsg = err.reason || err.message || 'Approval failed';
      throw new Error(`USDC approval failed: ${errorMsg}`);
    } finally {
      setApproving(false);
    }
  }, [provider]);

  const checkUSDCAllowance = useCallback(async (): Promise<bigint> => {
    if (!provider || !address || !process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || !process.env.NEXT_PUBLIC_USDC_ADDRESS) {
      return BigInt(0);
    }

    try {
      const usdcContract = new ethers.Contract(
        process.env.NEXT_PUBLIC_USDC_ADDRESS,
        ['function allowance(address owner, address spender) external view returns (uint256)'],
        provider
      );

      const allowance = await usdcContract.allowance(address, process.env.NEXT_PUBLIC_CONTRACT_ADDRESS);
      return allowance;
    } catch (err) {
      return BigInt(0);
    }
  }, [provider, address]);

  const createGift = useCallback(async (
    receiver: string,
    riddle: string,
    answer: string,
    message: string,
    amount: string,
    isETH: boolean,
    unlockTime: number = 0 // Unix timestamp, 0 = immediately
  ) => {
    // If riddle is empty, answer should also be empty (direct gift)
    if (!riddle.trim() && answer.trim()) {
      throw new Error('Answer not needed for direct gifts (no riddle)');
    }
    if (!contract) throw new Error('Contract not initialized');
    
    setLoading(true);
    setError(null);
    
    try {
      const amountWei = isETH 
        ? ethers.parseEther(amount)
        : ethers.parseUnits(amount, 6); // USDC has 6 decimals
      
      // For USDC, check and request approval first
      if (!isETH) {
        console.log('🔍 Checking USDC allowance for amount:', amount, 'USDC');
        const currentAllowance = await checkUSDCAllowance();
        console.log('🔍 Current allowance:', ethers.formatUnits(currentAllowance, 6), 'USDC');
        console.log('🔍 Required amount:', ethers.formatUnits(amountWei, 6), 'USDC');
        
        if (currentAllowance < amountWei) {
          console.log('⚠️ Insufficient allowance, requesting approval...');
          // Request approval - this will show a MetaMask popup and wait for confirmation
          const approvalHash = await approveUSDC(amount);
          if (approvalHash) {
            console.log('✅ Approval transaction hash:', approvalHash);
            // Wait a bit more to ensure the approval is fully processed
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
        } else {
          console.log('✅ Sufficient USDC allowance');
        }
      }
      
      // Retry with backoff for rate-limited requests
      const tx = await retryWithBackoff(async () => {
        if (isETH) {
          // For ETH, pass value in transaction overrides
          return await contract.createGift(
            receiver,
            riddle,
            answer,
            message || '', // Default to empty string if no message
            amountWei,
            isETH,
            unlockTime,
            { value: amountWei } // Transaction overrides for ETH
          );
        } else {
          // For USDC, no value needed
          return await contract.createGift(
            receiver,
            riddle,
            answer,
            message || '', // Default to empty string if no message
            amountWei,
            isETH,
            unlockTime
          );
        }
      });
      
      await tx.wait();
      return tx.hash;
    } catch (err: any) {
      console.error('❌ createGift error:', err);
      console.error('Error details:', {
        reason: err.reason,
        message: err.message,
        code: err.code,
        data: err.data,
        contractAddress: process.env.NEXT_PUBLIC_CONTRACT_ADDRESS
      });
      
      let errorMsg = err.reason || err.message || 'Transaction failed';
      
      // Better error messages for common issues
      if (err.message?.includes('require(false)') || err.message?.includes('execution reverted')) {
        errorMsg = `Contract call failed: ${err.reason || err.message}. Contract: ${process.env.NEXT_PUBLIC_CONTRACT_ADDRESS}`;
      } else if (err.message?.includes('Rate limit') || err.message?.includes('rate limited') || err.code === -32603) {
        errorMsg = 'Rate limit exceeded. The retry logic will handle this automatically. Please wait...';
      } else if (err.message?.includes('Internal JSON-RPC error')) {
        errorMsg = 'RPC error. Please check your network connection and try again.';
      } else if (err.code === 'UNPREDICTABLE_GAS_LIMIT') {
        errorMsg = `Transaction would fail: ${err.reason || err.message}. Please check all fields are valid.`;
      } else if (err.code === 'CALL_EXCEPTION' || err.code === -32000) {
        errorMsg = `Contract call exception: ${err.reason || err.message}. Make sure the contract is deployed at ${process.env.NEXT_PUBLIC_CONTRACT_ADDRESS}`;
      }
      
      setError(errorMsg);
      throw new Error(errorMsg);
    } finally {
      setLoading(false);
    }
  }, [contract, approveUSDC, checkUSDCAllowance]);

  const createBulkGifts = useCallback(async (
    receivers: string[],
    amounts: string[],
    isETH: boolean,
    message: string,
    unlockTime: number = 0
  ) => {
    if (!contract) throw new Error('Contract not initialized');
    
    setLoading(true);
    setError(null);
    
    try {
      const amountsWei = amounts.map(amount => 
        isETH 
          ? ethers.parseEther(amount)
          : ethers.parseUnits(amount, 6) // USDC has 6 decimals
      );
      
      const totalAmount = amountsWei.reduce((sum, amt) => sum + amt, BigInt(0));
      
      // For USDC, check and request approval first
      if (!isETH) {
        const currentAllowance = await checkUSDCAllowance();
        if (currentAllowance < totalAmount) {
          // Calculate total amount as string for approval
          const totalAmountStr = amounts.reduce((sum, amt) => sum + parseFloat(amt), 0).toString();
          await approveUSDC(totalAmountStr);
        }
      }
      
      const tx = await retryWithBackoff(async () => {
        if (isETH) {
          // For ETH, pass value in transaction overrides
          return await contract.createBulkGifts(
            receivers,
            amountsWei,
            isETH,
            message || '',
            unlockTime,
            { value: totalAmount } // Transaction overrides for ETH
          );
        } else {
          // For USDC, no value needed
          return await contract.createBulkGifts(
            receivers,
            amountsWei,
            isETH,
            message || '',
            unlockTime
          );
        }
      });
      
      await tx.wait();
      return tx.hash;
    } catch (err: any) {
      let errorMsg = err.reason || err.message || 'Transaction failed';
      setError(errorMsg);
      throw new Error(errorMsg);
    } finally {
      setLoading(false);
    }
  }, [contract, approveUSDC, checkUSDCAllowance]);

  const claimGift = useCallback(async (giftId: number, guess: string = '') => {
    if (!contract) throw new Error('Contract not initialized');
    
    setLoading(true);
    setError(null);
    
    try {
      // Retry with backoff for rate-limited requests
      const tx = await retryWithBackoff(async () => {
        return await contract.claimGift(giftId, guess);
      });
      
      await tx.wait();
      return tx.hash;
    } catch (err: any) {
      const errorMsg = err.reason || err.message || 'Transaction failed';
      setError(errorMsg);
      throw new Error(errorMsg);
    } finally {
      setLoading(false);
    }
  }, [contract]);

  const refundGift = useCallback(async (giftId: number) => {
    if (!contract) throw new Error('Contract not initialized');
    
    setLoading(true);
    setError(null);
    
    try {
      const tx = await contract.refundGift(giftId);
      await tx.wait();
      return tx.hash;
    } catch (err: any) {
      const errorMsg = err.reason || err.message || 'Transaction failed';
      setError(errorMsg);
      throw new Error(errorMsg);
    } finally {
      setLoading(false);
    }
  }, [contract]);

  const getGift = useCallback(async (giftId: number): Promise<Gift> => {
    // Use readContract first (available without wallet), fallback to contract (requires wallet)
    let contractToUse = readContract || contract;
    
    // If readContract is not ready, wait a bit (it initializes on mount)
    if (!contractToUse) {
      console.warn('⚠️ Contract not ready, waiting for initialization...');
      // Wait up to 2 seconds for readContract to initialize
      for (let i = 0; i < 4; i++) {
        await new Promise(resolve => setTimeout(resolve, 500));
        contractToUse = readContract || contract;
        if (contractToUse) {
          console.log('✅ Contract ready after wait');
          break;
        }
      }
    }
    
    if (!contractToUse) {
      const contractAddress = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS;
      const rpcUrl = process.env.NEXT_PUBLIC_BASE_RPC;
      console.error('❌ Contract not initialized after retries', {
        contractAddress,
        hasRpc: !!rpcUrl,
        hasReadContract: !!readContract,
        hasContract: !!contract,
        readContractType: readContract ? typeof readContract : 'null'
      });
      throw new Error('Contract not initialized. Please refresh the page or check your network connection.');
    }
    
    try {
      console.log(`🔄 Fetching gift ${giftId}...`);
      const gift = await retryWithBackoff(async () => {
        const result = await contractToUse.getGift(giftId);
        console.log(`✅ Gift ${giftId} fetched:`, {
          sender: result.sender,
          receiver: result.receiver,
          claimed: result.claimed,
          amount: result.amount.toString()
        });
        return result;
      });
      
      return {
        sender: gift.sender,
        receiver: gift.receiver,
        riddle: gift.riddle,
        answerHash: gift.answerHash,
        message: gift.message || '',
        amount: gift.amount.toString(),
        tokenAddress: gift.tokenAddress,
        createdAt: gift.createdAt.toString(),
        unlockTime: gift.unlockTime?.toString() || '0',
        claimed: gift.claimed,
      };
    } catch (err: any) {
      console.error(`❌ Error fetching gift ${giftId}:`, err);
      throw new Error(err.message || 'Failed to fetch gift');
    }
  }, [contract, readContract]);

  const getGiftCount = useCallback(async (): Promise<number> => {
    const contractToUse = readContract || contract;
    if (!contractToUse) return 0;
    
    try {
      // Wrap in retry logic to handle rate limiting
      const count = await retryWithBackoff(async () => {
        return await contractToUse.getGiftCount();
      });
      return Number(count);
    } catch (err) {
      console.warn('Error getting gift count:', err);
      return 0;
    }
  }, [contract, readContract]);

  const getGiftsForUser = useCallback(async (userAddress: string): Promise<number[]> => {
    const contractToUse = readContract || contract;
    if (!contractToUse) return [];
    
    try {
      // Wrap in retry logic to handle rate limiting
      const giftIds = await retryWithBackoff(async () => {
        return await contractToUse.getGiftsForUser(userAddress);
      });
      return giftIds.map((id: bigint) => Number(id));
    } catch (err) {
      console.warn('Error getting gifts for user:', err);
      return [];
    }
  }, [contract, readContract]);

  const isExpired = useCallback(async (giftId: number): Promise<boolean> => {
    const contractToUse = readContract || contract;
    if (!contractToUse) return false;
    
    try {
      // Wrap in retry logic to handle rate limiting
      return await retryWithBackoff(async () => {
        return await contractToUse.isExpired(giftId);
      });
    } catch (err) {
      console.warn('Error checking expiry:', err);
      return false; // Default to not expired if we can't check
    }
  }, [contract, readContract]);

  const getLeaderboard = useCallback(async (): Promise<{
    topSenders: Array<{ address: string; count: number }>;
    topSolvers: Array<{ address: string; count: number }>;
  }> => {
    // Wait for readContract to initialize
    let contractToUse = readContract || contract;
    
    if (!contractToUse) {
      console.warn('⚠️ Contract not initialized, waiting...');
      // Wait up to 2 seconds for readContract to initialize
      for (let i = 0; i < 4; i++) {
        await new Promise(resolve => setTimeout(resolve, 500));
        contractToUse = readContract || contract;
        if (contractToUse) break;
      }
    }
    
    if (!contractToUse) {
      console.error('❌ Contract not initialized for leaderboard');
      return { topSenders: [], topSolvers: [] };
    }

    try {
      console.log('📊 Fetching leaderboard data from contract:', contractToUse.target);
      
      // Get current block number to query from a reasonable range
      let fromBlock = 0;
      try {
        const currentBlock = await contractToUse.provider.getBlockNumber();
        // Query from last 50000 blocks (should cover all recent activity)
        fromBlock = Math.max(0, currentBlock - 50000);
        console.log(`📦 Querying events from block ${fromBlock} to latest (current: ${currentBlock})`);
      } catch (err) {
        console.warn('⚠️ Could not get block number, querying from block 0');
        fromBlock = 0;
      }
      
      // Throttle between event queries
      await throttle(200);
      
      // Get all GiftCreated events
      const createdFilter = contractToUse.filters.GiftCreated();
      const createdEvents = await retryWithBackoff(async () => {
        try {
          const events = await contractToUse.queryFilter(createdFilter, fromBlock);
          console.log(`✅ Found ${events.length} GiftCreated events`);
          return events;
        } catch (err: any) {
          console.warn('⚠️ Querying with block range failed, trying without range:', err.message);
          // Fallback: query without block range (defaults to latest blocks)
          const events = await contractToUse.queryFilter(createdFilter);
          console.log(`✅ Found ${events.length} GiftCreated events (default range)`);
          return events;
        }
      });

      // Throttle between event queries
      await throttle(200);

      // Get all GiftClaimed events
      const claimedFilter = contractToUse.filters.GiftClaimed();
      const claimedEvents = await retryWithBackoff(async () => {
        try {
          const events = await contractToUse.queryFilter(claimedFilter, fromBlock);
          console.log(`✅ Found ${events.length} GiftClaimed events`);
          return events;
        } catch (err: any) {
          console.warn('⚠️ Querying with block range failed, trying without range:', err.message);
          // Fallback: query without block range
          const events = await contractToUse.queryFilter(claimedFilter);
          console.log(`✅ Found ${events.length} GiftClaimed events (default range)`);
          return events;
        }
      });

      // Count gifts sent per address
      const senderCounts: Record<string, number> = {};
      createdEvents.forEach((event: any, index: number) => {
        try {
          // Handle both ethers v5 and v6 event formats
          const args = event.args || event;
          if (args) {
            // Try named property first (ethers v5), then array index (ethers v6)
            const sender = args.sender || (Array.isArray(args) ? args[1] : null);
            if (sender) {
              const senderLower = typeof sender === 'string' 
                ? sender.toLowerCase() 
                : String(sender).toLowerCase();
              senderCounts[senderLower] = (senderCounts[senderLower] || 0) + 1;
            } else {
              console.warn(`⚠️ Event ${index} missing sender. Args:`, args);
            }
          } else {
            console.warn(`⚠️ Event ${index} missing args:`, event);
          }
        } catch (err) {
          console.warn(`⚠️ Error processing created event ${index}:`, err, event);
        }
      });

      // Count gifts claimed per address
      const solverCounts: Record<string, number> = {};
      claimedEvents.forEach((event: any, index: number) => {
        try {
          // Handle both ethers v5 and v6 event formats
          const args = event.args || event;
          if (args) {
            // Try named property first (ethers v5), then array index (ethers v6)
            const receiver = args.receiver || (Array.isArray(args) ? args[1] : null);
            if (receiver) {
              const receiverLower = typeof receiver === 'string' 
                ? receiver.toLowerCase() 
                : String(receiver).toLowerCase();
              solverCounts[receiverLower] = (solverCounts[receiverLower] || 0) + 1;
            } else {
              console.warn(`⚠️ Event ${index} missing receiver. Args:`, args);
            }
          } else {
            console.warn(`⚠️ Event ${index} missing args:`, event);
          }
        } catch (err) {
          console.warn(`⚠️ Error processing claimed event ${index}:`, err, event);
        }
      });

      console.log('📈 Sender counts:', senderCounts);
      console.log('📈 Solver counts:', solverCounts);
      console.log(`📊 Processed ${createdEvents.length} created events and ${claimedEvents.length} claimed events`);

      // Convert to arrays and sort
      const topSenders = Object.entries(senderCounts)
        .map(([address, count]) => ({ address, count: count as number }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10); // Top 10

      const topSolvers = Object.entries(solverCounts)
        .map(([address, count]) => ({ address, count: count as number }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10); // Top 10

      console.log('🏆 Top senders:', topSenders);
      console.log('🏆 Top solvers:', topSolvers);
      
      if (topSenders.length === 0 && topSolvers.length === 0 && (createdEvents.length > 0 || claimedEvents.length > 0)) {
        console.warn('⚠️ Events found but no addresses counted. Checking event structure...');
        if (createdEvents.length > 0) {
          console.log('Sample created event:', createdEvents[0]);
        }
        if (claimedEvents.length > 0) {
          console.log('Sample claimed event:', claimedEvents[0]);
        }
      }

      const result = { topSenders, topSolvers };
      // Cache the result for 5 seconds
      setCached(cacheKey, result);
      
      return result;
    } catch (err: any) {
      console.error('❌ Error fetching leaderboard:', err);
      console.error('Error details:', {
        message: err.message,
        code: err.code,
        reason: err.reason,
        contractAddress: process.env.NEXT_PUBLIC_CONTRACT_ADDRESS
      });
      return { topSenders: [], topSolvers: [] };
    }
  }, [contract, readContract]);

  const getTotalValueLocked = useCallback(async (): Promise<{ totalETH: string; totalUSDC: string }> => {
    const contractToUse = readContract || contract;
    if (!contractToUse) {
      return { totalETH: '0', totalUSDC: '0' };
    }
    
    try {
      // Wrap in retry logic to handle rate limiting
      const [totalETH, totalUSDC] = await retryWithBackoff(async () => {
        return await contractToUse.getTotalValueLocked();
      });
      return {
        totalETH: ethers.formatEther(totalETH),
        totalUSDC: ethers.formatUnits(totalUSDC, 6), // USDC has 6 decimals
      };
    } catch (err) {
      console.warn('Error getting total value locked:', err);
      return { totalETH: '0', totalUSDC: '0' };
    }
  }, [contract, readContract]);

  return {
    contract,
    loading: loading || approving,
    error,
    createGift,
    createBulkGifts,
    claimGift,
    refundGift,
    getGift,
    getGiftCount,
    getGiftsForUser,
    isExpired,
    approveUSDC,
    checkUSDCAllowance,
    approving,
    getLeaderboard,
    getTotalValueLocked,
  };
}

