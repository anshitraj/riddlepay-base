import { useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';
import { useWallet } from '@/contexts/WalletContext';
import { checkBatchSupport, sendBatchTransactions, getPaymasterAndData } from '@/utils/paymaster';
import { retryWithBackoff } from '@/utils/retry';
import { createHybridRpcProvider, throttle, getCached, setCached } from '@/utils/rpcProvider';

const CONTRACT_ABI = [
  "function createGift(address receiver, string memory riddle, string memory answer, string memory message, uint256 amount, bool isETH, uint256 unlockTime, uint256 expirationTime) external payable",
  "function createBulkGifts(address[] memory receivers, uint256[] memory amounts, bool isETH, string memory message, uint256 unlockTime, uint256 expirationTime) external payable",
  "function claimGift(uint256 giftId, string memory guess) external",
  "function refundGift(uint256 giftId) external",
  "function getGift(uint256 giftId) external view returns (tuple(address sender, address receiver, string riddle, bytes32 answerHash, string message, uint256 amount, address tokenAddress, uint256 createdAt, uint256 unlockTime, uint256 expirationTime, bool claimed))",
  "function getGiftCount() external view returns (uint256)",
  "function getGiftsForUser(address user) external view returns (uint256[])",
  "function isExpired(uint256 giftId) external view returns (bool)",
  "function getExpirationTime(uint256 giftId) external view returns (uint256)",
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
  expirationTime: string;
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
    unlockTime: number = 0, // Unix timestamp, 0 = immediately
    expirationTime: number = 0 // Unix timestamp, 0 = use default 7 days
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
      
      // Check if we can use batch transactions (EIP-5792)
      const canBatch = provider ? await checkBatchSupport(provider) : false;
      
      // For USDC, check and request approval first
      if (!isETH) {
        console.log('🔍 Checking USDC allowance for amount:', amount, 'USDC');
        const currentAllowance = await checkUSDCAllowance();
        console.log('🔍 Current allowance:', ethers.formatUnits(currentAllowance, 6), 'USDC');
        console.log('🔍 Required amount:', ethers.formatUnits(amountWei, 6), 'USDC');
        
        if (currentAllowance < amountWei) {
          console.log('⚠️ Insufficient allowance');
          
          // If batch is supported, combine approve + createGift
          if (canBatch && provider) {
            console.log('✅ Using batch transaction (approve + createGift)');
            
            const signer = await provider.getSigner();
            const usdcContract = new ethers.Contract(
              process.env.NEXT_PUBLIC_USDC_ADDRESS!,
              ['function approve(address spender, uint256 amount) external returns (bool)'],
              signer
            );
            
            const approvalAmount = amountWei * BigInt(10); // Approve 10x
            const maxUint256 = BigInt('0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff');
            const finalApprovalAmount = approvalAmount > maxUint256 / BigInt(2) ? maxUint256 : approvalAmount;
            
            // Prepare approve call
            const approveData = usdcContract.interface.encodeFunctionData('approve', [
              process.env.NEXT_PUBLIC_CONTRACT_ADDRESS,
              finalApprovalAmount,
            ]);
            
            // Prepare createGift call
            const createGiftData = contract.interface.encodeFunctionData('createGift', [
              receiver,
              riddle,
              answer,
              message || '',
              amountWei,
              isETH,
              unlockTime,
              expirationTime,
            ]);
            
            // Send batch transaction
            const txHash = await sendBatchTransactions(provider, [
              {
                to: process.env.NEXT_PUBLIC_USDC_ADDRESS!,
                data: approveData,
              },
              {
                to: process.env.NEXT_PUBLIC_CONTRACT_ADDRESS!,
                data: createGiftData,
              },
            ]);
            
            // Wait for confirmation
            const receipt = await provider.waitForTransaction(txHash);
            if (!receipt) {
              throw new Error('Transaction receipt not found');
            }
            return receipt.hash;
          } else {
            // Fallback to sequential transactions
            console.log('⚠️ Batch not supported, using sequential transactions');
            const approvalHash = await approveUSDC(amount);
            if (approvalHash) {
              console.log('✅ Approval transaction hash:', approvalHash);
              await new Promise(resolve => setTimeout(resolve, 1000));
            }
          }
        } else {
          console.log('✅ Sufficient USDC allowance');
        }
      }
      
      // If we already did batch, return early
      if (!isETH && canBatch && provider) {
        const currentAllowance = await checkUSDCAllowance();
        if (currentAllowance >= amountWei) {
          // Batch was already executed, return the hash from above
          // This shouldn't happen, but handle it gracefully
        }
      }
      
      // Retry with backoff for rate-limited requests
      const tx = await retryWithBackoff(async () => {
        // Get paymaster data for transaction sponsorship
        const paymasterData = provider ? await getPaymasterAndData({}) : {};
        
        const txOptions: any = {};
        if (isETH) {
          txOptions.value = amountWei;
        }
        
        // Add paymaster data if available (Base App handles this automatically)
        if (paymasterData.paymaster) {
          txOptions.paymaster = paymasterData.paymaster;
          txOptions.paymasterData = paymasterData.paymasterData;
        }
        
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
            expirationTime,
            txOptions
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
            unlockTime,
            expirationTime,
            txOptions
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
    unlockTime: number = 0,
    expirationTime: number = 0 // Unix timestamp, 0 = use default 7 days
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
            expirationTime,
            { value: totalAmount } // Transaction overrides for ETH
          );
        } else {
          // For USDC, no value needed
          return await contract.createBulkGifts(
            receivers,
            amountsWei,
            isETH,
            message || '',
            unlockTime,
            expirationTime
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
        expirationTime: gift.expirationTime?.toString() || '0',
        claimed: gift.claimed,
      };
    } catch (err: any) {
      console.error(`❌ Error fetching gift ${giftId}:`, err);
      throw new Error(err.message || 'Failed to fetch gift');
    }
  }, [contract, readContract]);

  const getGiftCount = useCallback(async (): Promise<number> => {
    // Use readContract first (available without wallet), fallback to contract (requires wallet)
    let contractToUse = readContract || contract;
    
    // If readContract is not ready, wait a bit (it initializes on mount)
    if (!contractToUse) {
      console.warn('⚠️ Contract not ready for getGiftCount, waiting for initialization...');
      // Wait up to 2 seconds for readContract to initialize
      for (let i = 0; i < 4; i++) {
        await new Promise(resolve => setTimeout(resolve, 500));
        contractToUse = readContract || contract;
        if (contractToUse) {
          console.log('✅ Contract ready after wait for getGiftCount');
          break;
        }
      }
    }
    
    if (!contractToUse) {
      console.error('❌ Contract not initialized for getGiftCount');
      return 0;
    }
    
    try {
      console.log('🔄 Fetching gift count...');
      // Wrap in retry logic to handle rate limiting
      const count = await retryWithBackoff(async () => {
        return await contractToUse.getGiftCount();
      });
      const countNumber = Number(count);
      console.log('✅ Gift count:', countNumber);
      return countNumber;
    } catch (err: any) {
      console.error('❌ Error getting gift count:', err);
      console.error('Error details:', {
        message: err.message,
        code: err.code,
        reason: err.reason,
        contractAddress: process.env.NEXT_PUBLIC_CONTRACT_ADDRESS
      });
      return 0;
    }
  }, [contract, readContract]);

  const getGiftsForUser = useCallback(async (userAddress: string): Promise<number[]> => {
    // Use readContract first (available without wallet), fallback to contract (requires wallet)
    let contractToUse = readContract || contract;
    
    // If readContract is not ready, wait a bit (it initializes on mount)
    if (!contractToUse) {
      console.warn('⚠️ Contract not ready for getGiftsForUser, waiting for initialization...');
      // Wait up to 2 seconds for readContract to initialize
      for (let i = 0; i < 4; i++) {
        await new Promise(resolve => setTimeout(resolve, 500));
        contractToUse = readContract || contract;
        if (contractToUse) {
          console.log('✅ Contract ready after wait for getGiftsForUser');
          break;
        }
      }
    }
    
    if (!contractToUse) {
      console.error('❌ Contract not initialized for getGiftsForUser');
      return [];
    }
    
    try {
      console.log('🔄 Fetching gifts for user:', userAddress);
      // Wrap in retry logic to handle rate limiting
      const giftIds = await retryWithBackoff(async () => {
        return await contractToUse.getGiftsForUser(userAddress);
      });
      const ids = giftIds.map((id: bigint) => Number(id));
      console.log('✅ Found gift IDs:', ids);
      return ids;
    } catch (err: any) {
      console.error('❌ Error getting gifts for user:', err);
      console.error('Error details:', {
        message: err.message,
        code: err.code,
        reason: err.reason,
        contractAddress: process.env.NEXT_PUBLIC_CONTRACT_ADDRESS
      });
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
      
      // Check cache first (leaderboard data changes infrequently)
      const cacheKey = 'leaderboard';
      const cached = getCached<{ topSenders: Array<{ address: string; count: number }>; topSolvers: Array<{ address: string; count: number }> }>(cacheKey);
      if (cached !== null) {
        console.log('✅ Using cached leaderboard data');
        return cached;
      }
      
      // Throttle to prevent rate limiting
      await throttle(300);
      
      // Get current block number to query from a reasonable range
      let fromBlock = 0;
      try {
        // Access provider correctly - contract.provider might be a BaseContractMethod, so we need to get the actual provider
        const provider = (contractToUse as any).provider as ethers.Provider;
        if (provider && typeof provider.getBlockNumber === 'function') {
          const currentBlock = await provider.getBlockNumber();
          // Query from last 50000 blocks (should cover all recent activity)
          fromBlock = Math.max(0, currentBlock - 50000);
          console.log(`📦 Querying events from block ${fromBlock} to latest (current: ${currentBlock})`);
        } else {
          console.warn('⚠️ Provider not available, querying from block 0');
          fromBlock = 0;
        }
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
          let sender: string | null = null;
          
          // Try different ways to access the sender
          if (event.args) {
            // ethers v5 format
            if (event.args.sender) {
              sender = event.args.sender;
            } else if (Array.isArray(event.args) && event.args.length > 1) {
              sender = event.args[1]; // sender is at index 1
            }
          } else if (Array.isArray(event)) {
            // Direct array format
            sender = event[1];
          } else if (event.sender) {
            // Named property
            sender = event.sender;
          }
          
          if (sender) {
            const senderLower = typeof sender === 'string' 
              ? sender.toLowerCase() 
              : String(sender).toLowerCase();
            senderCounts[senderLower] = (senderCounts[senderLower] || 0) + 1;
          } else {
            console.warn(`⚠️ Event ${index} missing sender. Event structure:`, JSON.stringify(event, null, 2));
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
          let receiver: string | null = null;
          
          // Try different ways to access the receiver
          if (event.args) {
            // ethers v5 format
            if (event.args.receiver) {
              receiver = event.args.receiver;
            } else if (Array.isArray(event.args) && event.args.length > 1) {
              receiver = event.args[1]; // receiver is at index 1
            }
          } else if (Array.isArray(event)) {
            // Direct array format
            receiver = event[1];
          } else if (event.receiver) {
            // Named property
            receiver = event.receiver;
          }
          
          if (receiver) {
            const receiverLower = typeof receiver === 'string' 
              ? receiver.toLowerCase() 
              : String(receiver).toLowerCase();
            solverCounts[receiverLower] = (solverCounts[receiverLower] || 0) + 1;
          } else {
            console.warn(`⚠️ Event ${index} missing receiver. Event structure:`, JSON.stringify(event, null, 2));
          }
        } catch (err) {
          console.warn(`⚠️ Error processing claimed event ${index}:`, err, event);
        }
      });

      console.log('📈 Sender counts:', senderCounts);
      console.log('📈 Solver counts:', solverCounts);
      console.log(`📊 Processed ${createdEvents.length} created events and ${claimedEvents.length} claimed events`);

      // If no events found or parsing failed, try fallback method using getGiftCount
      if ((createdEvents.length === 0 && claimedEvents.length === 0) || 
          (Object.keys(senderCounts).length === 0 && Object.keys(solverCounts).length === 0)) {
        console.log('⚠️ No events found or parsing failed, trying fallback method...');
        
        try {
          // Call contract directly for fallback
          const totalGifts = await retryWithBackoff(async () => {
            return await contractToUse.getGiftCount();
          });
          const totalGiftsNum = Number(totalGifts);
          console.log(`📦 Found ${totalGiftsNum} total gifts, fetching details...`);
          
          // Fetch all gifts and count manually
          const fallbackSenderCounts: Record<string, number> = {};
          const fallbackSolverCounts: Record<string, number> = {};
          
          // Limit to first 500 gifts to avoid timeout
          const maxGifts = Math.min(totalGiftsNum, 500);
          for (let i = 0; i < maxGifts; i++) {
            try {
              const gift = await retryWithBackoff(async () => {
                return await contractToUse.getGift(i);
              });
              
              const senderLower = gift.sender.toLowerCase();
              const receiverLower = gift.receiver.toLowerCase();
              
              // Count senders
              fallbackSenderCounts[senderLower] = (fallbackSenderCounts[senderLower] || 0) + 1;
              
              // Count solvers (only if claimed)
              if (gift.claimed) {
                fallbackSolverCounts[receiverLower] = (fallbackSolverCounts[receiverLower] || 0) + 1;
              }
            } catch (err) {
              // Gift might not exist, skip it
              continue;
            }
          }
          
          console.log('📈 Fallback sender counts:', fallbackSenderCounts);
          console.log('📈 Fallback solver counts:', fallbackSolverCounts);
          
          // Use fallback data if we got results
          if (Object.keys(fallbackSenderCounts).length > 0 || Object.keys(fallbackSolverCounts).length > 0) {
            const fallbackTopSenders = Object.entries(fallbackSenderCounts)
              .map(([address, count]) => ({ address, count: count as number }))
              .sort((a, b) => b.count - a.count)
              .slice(0, 10);
            
            const fallbackTopSolvers = Object.entries(fallbackSolverCounts)
              .map(([address, count]) => ({ address, count: count as number }))
              .sort((a, b) => b.count - a.count)
              .slice(0, 10);
            
            const result = { topSenders: fallbackTopSenders, topSolvers: fallbackTopSolvers };
            setCached(cacheKey, result);
            return result;
          }
        } catch (fallbackErr) {
          console.error('❌ Fallback method also failed:', fallbackErr);
        }
      }

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
          console.log('Sample created event:', JSON.stringify(createdEvents[0], null, 2));
          const firstEvent = createdEvents[0] as any;
          console.log('Created event args:', firstEvent.args);
          console.log('Created event keys:', Object.keys(firstEvent));
        }
        if (claimedEvents.length > 0) {
          console.log('Sample claimed event:', JSON.stringify(claimedEvents[0], null, 2));
          const firstClaimedEvent = claimedEvents[0] as any;
          console.log('Claimed event args:', firstClaimedEvent.args);
          console.log('Claimed event keys:', Object.keys(firstClaimedEvent));
        }
      }

      const result = { topSenders, topSolvers };
      // Cache the result (default TTL is 5 seconds)
      setCached(cacheKey, result);
      
      return result;
    } catch (err: any) {
      console.error('❌ Error fetching leaderboard:', err);
      console.error('Error details:', {
        message: err.message,
        code: err.code,
        reason: err.reason,
        contractAddress: process.env.NEXT_PUBLIC_CONTRACT_ADDRESS,
        stack: err.stack
      });
      
      // Try fallback method even on error
      try {
        console.log('🔄 Attempting fallback leaderboard method...');
        if (!contractToUse) {
          return { topSenders: [], topSolvers: [] };
        }
        
        const totalGifts = await retryWithBackoff(async () => {
          return await contractToUse.getGiftCount();
        });
        const totalGiftsNum = Number(totalGifts);
        
        const fallbackSenderCounts: Record<string, number> = {};
        const fallbackSolverCounts: Record<string, number> = {};
        
        const maxGifts = Math.min(totalGiftsNum, 500); // Limit to 500 for performance
        for (let i = 0; i < maxGifts; i++) {
          try {
            const gift = await retryWithBackoff(async () => {
              return await contractToUse.getGift(i);
            });
            
            const senderLower = gift.sender.toLowerCase();
            const receiverLower = gift.receiver.toLowerCase();
            
            fallbackSenderCounts[senderLower] = (fallbackSenderCounts[senderLower] || 0) + 1;
            
            if (gift.claimed) {
              fallbackSolverCounts[receiverLower] = (fallbackSolverCounts[receiverLower] || 0) + 1;
            }
          } catch {
            continue;
          }
        }
        
        const fallbackTopSenders = Object.entries(fallbackSenderCounts)
          .map(([address, count]) => ({ address, count: count as number }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 10);
        
        const fallbackTopSolvers = Object.entries(fallbackSolverCounts)
          .map(([address, count]) => ({ address, count: count as number }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 10);
        
        return { topSenders: fallbackTopSenders, topSolvers: fallbackTopSolvers };
      } catch (fallbackErr) {
        console.error('❌ Fallback method also failed:', fallbackErr);
        return { topSenders: [], topSolvers: [] };
      }
    }
  }, [contract, readContract]);

  const getTotalValueLocked = useCallback(async (): Promise<{ totalETH: string; totalUSDC: string }> => {
    // Use readContract first (available without wallet), fallback to contract (requires wallet)
    let contractToUse = readContract || contract;
    
    // If readContract is not ready, wait a bit (it initializes on mount)
    if (!contractToUse) {
      console.warn('⚠️ Contract not ready for getTotalValueLocked, waiting for initialization...');
      // Wait up to 2 seconds for readContract to initialize
      for (let i = 0; i < 4; i++) {
        await new Promise(resolve => setTimeout(resolve, 500));
        contractToUse = readContract || contract;
        if (contractToUse) {
          console.log('✅ Contract ready after wait for getTotalValueLocked');
          break;
        }
      }
    }
    
    if (!contractToUse) {
      console.error('❌ Contract not initialized for getTotalValueLocked');
      return { totalETH: '0', totalUSDC: '0' };
    }
    
    try {
      console.log('🔄 Fetching total value locked...');
      // Wrap in retry logic to handle rate limiting
      const result = await retryWithBackoff(async () => {
        return await contractToUse.getTotalValueLocked();
      });
      
      // Handle both tuple and array return formats
      let totalETH: bigint;
      let totalUSDC: bigint;
      
      if (Array.isArray(result)) {
        [totalETH, totalUSDC] = result;
      } else if (result && typeof result === 'object') {
        // Handle named tuple return
        totalETH = result.totalETH || result[0];
        totalUSDC = result.totalUSDC || result[1];
      } else {
        throw new Error('Unexpected return format from getTotalValueLocked');
      }
      
      const formattedETH = ethers.formatEther(totalETH);
      const formattedUSDC = ethers.formatUnits(totalUSDC, 6); // USDC has 6 decimals
      
      console.log('✅ Total value locked:', { 
        ETH: formattedETH, 
        USDC: formattedUSDC,
        rawETH: totalETH.toString(),
        rawUSDC: totalUSDC.toString()
      });
      
      return {
        totalETH: formattedETH,
        totalUSDC: formattedUSDC,
      };
    } catch (err: any) {
      console.error('❌ Error getting total value locked:', err);
      console.error('Error details:', {
        message: err.message,
        code: err.code,
        reason: err.reason,
        contractAddress: process.env.NEXT_PUBLIC_CONTRACT_ADDRESS
      });
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

