# 🚀 Base Mainnet Deployment Guide

## 📋 Pre-Deployment Checklist

### 1. Environment Variables Update

Update your `.env` file in the root directory:

```bash
# Base Mainnet Configuration
RPC_URL=https://base-mainnet.g.alchemy.com/v2/YOUR_ALCHEMY_API_KEY
PRIVATE_KEY=your_private_key_here
BASESCAN_API_KEY=your_basescan_api_key_here

# Optional: USDC Address (will use default if not set)
USDC_ADDRESS=0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913
```

Update your `frontend/.env.local` file:

```bash
# Base Mainnet Contract Address (update after deployment)
NEXT_PUBLIC_CONTRACT_ADDRESS=0xYOUR_DEPLOYED_CONTRACT_ADDRESS

# Hybrid RPC Setup (Alchemy primary, Base public RPC fallback)
NEXT_PUBLIC_BASE_RPC_ALCHEMY=https://base-mainnet.g.alchemy.com/v2/YOUR_ALCHEMY_API_KEY
NEXT_PUBLIC_BASE_RPC_PUBLIC=https://mainnet.base.org

# Base Mainnet USDC Address
NEXT_PUBLIC_USDC_ADDRESS=0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913
```

### 2. Contract Deployment Steps

1. **Compile the contract:**
   ```bash
   cd gift-riddle-vault
   npx hardhat compile
   ```

2. **Deploy to Base Mainnet:**
   ```bash
   npx hardhat run scripts/deploy.js --network baseMainnet
   ```

3. **Copy the deployed contract address** from the output

4. **Update `frontend/.env.local`:**
   - Set `NEXT_PUBLIC_CONTRACT_ADDRESS` to your deployed contract address

5. **Verify the contract on Basescan:**
   ```bash
   npx hardhat verify --network baseMainnet CONTRACT_ADDRESS 0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913
   ```

### 3. Frontend Deployment

1. **Build the frontend:**
   ```bash
   cd frontend
   npm run build
   ```

2. **Deploy to Vercel:**
   - Push code to GitHub
   - Connect repository to Vercel
   - Add environment variables in Vercel dashboard:
     - `NEXT_PUBLIC_CONTRACT_ADDRESS`
     - `NEXT_PUBLIC_BASE_RPC_ALCHEMY`
     - `NEXT_PUBLIC_BASE_RPC_PUBLIC`
     - `NEXT_PUBLIC_USDC_ADDRESS`
   - Deploy

3. **Update `miniapp.json`:**
   - Update `homeUrl` and `iconUrl` with your Vercel deployment URL

### 4. Network Configuration

The app now uses a **Hybrid RPC Provider**:
- **Primary**: Alchemy RPC (fast, reliable)
- **Fallback**: Base Public RPC (backup if Alchemy fails)

This ensures users can always interact with the contract even if one RPC provider fails.

### 5. Important Addresses

**Base Mainnet:**
- USDC: `0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913`
- Chain ID: `8453`
- Block Explorer: https://basescan.org

**Base Sepolia (Testnet):**
- USDC Mock: `0x036CbD53842c5426634e7929541eC2318f3dCF7e`
- Chain ID: `84532`
- Block Explorer: https://sepolia.basescan.org

### 6. Testing Checklist

After deployment, test:
- [ ] Wallet connection on Base Mainnet
- [ ] Sending ETH gift
- [ ] Sending USDC gift
- [ ] Claiming gift
- [ ] Refunding expired gift
- [ ] Dashboard stats
- [ ] Leaderboard
- [ ] RPC fallback (disconnect Alchemy temporarily to test)

### 7. Security Reminders

- ✅ Never commit `.env` files to Git
- ✅ Use environment variables in Vercel dashboard
- ✅ Keep private keys secure
- ✅ Verify contract on Basescan
- ✅ Test thoroughly before announcing

### 8. Post-Deployment

- [ ] Update documentation with mainnet contract address
- [ ] Test all features on mainnet
- [ ] Monitor for errors in console
- [ ] Check Basescan for contract interactions
- [ ] Share your deployed app! 🎉

## 🎯 Quick Reference

**Deploy Contract:**
```bash
npx hardhat run scripts/deploy.js --network baseMainnet
```

**Verify Contract:**
```bash
npx hardhat verify --network baseMainnet CONTRACT_ADDRESS USDC_ADDRESS
```

**Update Frontend Env:**
```bash
NEXT_PUBLIC_CONTRACT_ADDRESS=0x...
NEXT_PUBLIC_BASE_RPC_ALCHEMY=https://base-mainnet.g.alchemy.com/v2/YOUR_KEY
NEXT_PUBLIC_BASE_RPC_PUBLIC=https://mainnet.base.org
NEXT_PUBLIC_USDC_ADDRESS=0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913
```

Good luck with your mainnet deployment! 🚀

