# 🔧 Environment Variables Setup for Base Mainnet

## 📋 Required Environment Variables

### Root `.env` file (for contract deployment)

```bash
# Base Mainnet RPC (Alchemy recommended)
RPC_URL=https://base-mainnet.g.alchemy.com/v2/YOUR_ALCHEMY_API_KEY

# Your wallet private key (for deployment)
PRIVATE_KEY=your_private_key_here

# Basescan API key (for contract verification)
BASESCAN_API_KEY=your_basescan_api_key_here

# Optional: USDC Address (will use default if not set)
USDC_ADDRESS=0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913
```

### Frontend `.env.local` file (in `frontend/` directory)

```bash
# Contract Address (update after deployment)
NEXT_PUBLIC_CONTRACT_ADDRESS=0xYOUR_DEPLOYED_CONTRACT_ADDRESS

# Hybrid RPC Setup (Alchemy primary, Base public RPC fallback)
NEXT_PUBLIC_BASE_RPC_ALCHEMY=https://base-mainnet.g.alchemy.com/v2/YOUR_ALCHEMY_API_KEY
NEXT_PUBLIC_BASE_RPC_PUBLIC=https://mainnet.base.org

# Base Mainnet USDC Address
NEXT_PUBLIC_USDC_ADDRESS=0x833589fCD6E08f4c7C32D4f71b54bdA02913
```

## 🔄 Hybrid RPC Provider Setup

The app now uses a **Hybrid RPC Provider** with automatic fallback:

1. **Primary**: Alchemy RPC (fast, reliable, high rate limits)
2. **Fallback**: Base Public RPC (backup if Alchemy fails)

### How it works:
- Tries Alchemy RPC first
- If Alchemy fails (rate limit, downtime, etc.), automatically switches to Base Public RPC
- Users never see errors - seamless fallback!

### Benefits:
- ✅ **Reliability**: Always have a backup RPC
- ✅ **Performance**: Fast Alchemy RPC when available
- ✅ **Resilience**: App works even if one RPC provider fails
- ✅ **Rate Limit Protection**: Automatic throttling and caching

## 📝 Step-by-Step Setup

### 1. Get Alchemy API Key
1. Go to https://www.alchemy.com/
2. Create an account (free tier available)
3. Create a new app on Base Mainnet
4. Copy your API key

### 2. Get Basescan API Key (optional, for verification)
1. Go to https://basescan.org/
2. Create an account
3. Go to API-KEYs section
4. Create a new API key

### 3. Update Environment Variables

**Root `.env`:**
```bash
RPC_URL=https://base-mainnet.g.alchemy.com/v2/YOUR_ALCHEMY_KEY
PRIVATE_KEY=0x...
BASESCAN_API_KEY=your_key_here
```

**Frontend `.env.local`:**
```bash
NEXT_PUBLIC_CONTRACT_ADDRESS=0x...  # Update after deployment
NEXT_PUBLIC_BASE_RPC_ALCHEMY=https://base-mainnet.g.alchemy.com/v2/YOUR_ALCHEMY_KEY
NEXT_PUBLIC_BASE_RPC_PUBLIC=https://mainnet.base.org
NEXT_PUBLIC_USDC_ADDRESS=0x833589fCD6E08f4c7C32D4f71b54bdA02913
```

### 4. Deploy Contract
```bash
npx hardhat run scripts/deploy.js --network baseMainnet
```

### 5. Update Contract Address
After deployment, copy the contract address and update:
```bash
NEXT_PUBLIC_CONTRACT_ADDRESS=0xYOUR_DEPLOYED_ADDRESS
```

## 🚀 Vercel Deployment

When deploying to Vercel, add these environment variables in the Vercel dashboard:

1. Go to your project settings → Environment Variables
2. Add each variable:
   - `NEXT_PUBLIC_CONTRACT_ADDRESS`
   - `NEXT_PUBLIC_BASE_RPC_ALCHEMY`
   - `NEXT_PUBLIC_BASE_RPC_PUBLIC`
   - `NEXT_PUBLIC_USDC_ADDRESS`

## 🔍 Important Addresses

### Base Mainnet
- **USDC**: `0x833589fCD6E08f4c7C32D4f71b54bdA02913`
- **Chain ID**: `8453`
- **Block Explorer**: https://basescan.org
- **Public RPC**: `https://mainnet.base.org`

### Base Sepolia (Testnet)
- **USDC Mock**: `0x036CbD53842c5426634e7929541eC2318f3dCF7e`
- **Chain ID**: `84532`
- **Block Explorer**: https://sepolia.basescan.org
- **Public RPC**: `https://sepolia.base.org`

## ⚡ Rate Limit Protection

The app includes automatic protection against rate limiting:

1. **Throttling**: 200-300ms delays between requests
2. **Caching**: Frequently accessed data cached for 5 seconds
3. **Retry Logic**: Exponential backoff for failed requests
4. **Hybrid RPC**: Automatic fallback if primary RPC fails

## ✅ Verification Checklist

- [ ] Alchemy API key configured
- [ ] Contract deployed to Base Mainnet
- [ ] Contract address updated in `.env.local`
- [ ] USDC address set to mainnet address
- [ ] Hybrid RPC URLs configured
- [ ] Tested wallet connection
- [ ] Tested sending/claiming gifts
- [ ] Verified RPC fallback works (disconnect Alchemy temporarily)

## 🎯 Quick Reference

**Deploy:**
```bash
npx hardhat run scripts/deploy.js --network baseMainnet
```

**Verify:**
```bash
npx hardhat verify --network baseMainnet CONTRACT_ADDRESS USDC_ADDRESS
```

**Test RPC Fallback:**
1. Temporarily set wrong Alchemy URL
2. App should automatically use Base Public RPC
3. Check console logs for fallback messages

Good luck with your mainnet deployment! 🚀

