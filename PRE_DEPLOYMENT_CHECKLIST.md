# ✅ Pre-Deployment Checklist for Base Mainnet

## 🚨 IMPORTANT: Mainnet Uses REAL MONEY!

Before deploying to Base Mainnet, make sure you understand:
- ⚠️ **Real ETH/USDC** will be used (not testnet tokens)
- ⚠️ **Real transaction fees** will be charged
- ⚠️ **No way to undo** transactions once deployed
- ⚠️ **Test thoroughly** on Base Sepolia first!

## ✅ Pre-Deployment Checklist

### 1. Environment Variables
- [ ] Fixed USDC address: `0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913` (not the shortened one)
- [ ] Alchemy API key configured in `.env`
- [ ] Private key configured in `.env` (wallet has ETH for gas)
- [ ] Basescan API key configured (for verification)

### 2. Wallet Preparation
- [ ] Wallet has **Base Mainnet ETH** for gas fees (~0.001-0.01 ETH recommended)
- [ ] Private key matches the wallet with ETH
- [ ] Tested wallet connection on Base Mainnet

### 3. Contract Testing (Base Sepolia)
- [ ] Contract deployed and tested on Base Sepolia
- [ ] All functions work: createGift, claimGift, refundGift
- [ ] Tested with both ETH and USDC
- [ ] Tested direct gifts (no riddle)
- [ ] Tested time-locked gifts
- [ ] Tested bulk gifts
- [ ] No errors or issues found

### 4. Code Review
- [ ] Contract code reviewed and audited
- [ ] No hardcoded testnet addresses
- [ ] All security checks passed
- [ ] Frontend ready for mainnet

### 5. Frontend Environment
- [ ] Frontend `.env.local` ready (will update after deployment)
- [ ] Hybrid RPC URLs configured
- [ ] Ready to update contract address after deployment

## 🚀 Deployment Steps

### Step 1: Verify Your `.env` File
```bash
# Check your .env file has:
RPC_URL=https://base-mainnet.g.alchemy.com/v2/YOUR_KEY
PRIVATE_KEY=0x...
BASESCAN_API_KEY=your_key
USDC_ADDRESS=0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913
```

### Step 2: Compile Contract
```bash
cd gift-riddle-vault
npx hardhat compile
```

### Step 3: Deploy to Base Mainnet
```bash
npx hardhat run scripts/deploy.js --network baseMainnet
```

### Step 4: Save Contract Address
Copy the deployed contract address from the output.

### Step 5: Verify Contract (Optional but Recommended)
```bash
npx hardhat verify --network baseMainnet CONTRACT_ADDRESS 0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913
```

### Step 6: Update Frontend `.env.local`
```bash
NEXT_PUBLIC_CONTRACT_ADDRESS=0xYOUR_DEPLOYED_ADDRESS
NEXT_PUBLIC_BASE_RPC_ALCHEMY=https://base-mainnet.g.alchemy.com/v2/YOUR_KEY
NEXT_PUBLIC_BASE_RPC_PUBLIC=https://mainnet.base.org
NEXT_PUBLIC_USDC_ADDRESS=0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913
```

### Step 7: Test on Mainnet
- [ ] Connect wallet to Base Mainnet
- [ ] Test sending a small ETH gift
- [ ] Test sending a small USDC gift
- [ ] Test claiming a gift
- [ ] Verify dashboard shows correct data
- [ ] Check leaderboard works

## 💰 Estimated Costs

- **Contract Deployment**: ~0.001-0.005 ETH (~$2-10)
- **First Transaction**: ~0.0001-0.001 ETH (~$0.20-2)
- **Total**: ~$2-12 depending on gas prices

## ⚠️ Common Mistakes to Avoid

1. ❌ Wrong USDC address (use the full address!)
2. ❌ Insufficient ETH for gas
3. ❌ Wrong network (make sure it says "baseMainnet")
4. ❌ Forgetting to update frontend `.env.local`
5. ❌ Not verifying contract on Basescan

## 🎯 Ready to Deploy?

If you've checked all items above, you're ready! Run:

```bash
npx hardhat run scripts/deploy.js --network baseMainnet
```

Good luck! 🚀

