# RPC Provider Setup Guide

## Rate Limiting Issue

The public Base Sepolia RPC endpoint (`https://sepolia.base.org`) has rate limits that can cause "Request is being rate limited" errors.

## Solution: Use a Better RPC Provider

### Option 1: Alchemy (Recommended - Free)

1. **Sign up for Alchemy:**
   - Visit: https://www.alchemy.com/
   - Create a free account

2. **Create a Base Sepolia App:**
   - Go to Dashboard → Create App
   - Network: Base Sepolia
   - Copy your API key

3. **Update `.env.local`:**
   ```env
   NEXT_PUBLIC_BASE_RPC=https://base-sepolia.g.alchemy.com/v2/YOUR_API_KEY
   ```

### Option 2: QuickNode (Free Tier Available)

1. **Sign up for QuickNode:**
   - Visit: https://www.quicknode.com/
   - Create a free account

2. **Create Base Sepolia Endpoint:**
   - Select Base Sepolia network
   - Copy your HTTP endpoint URL

3. **Update `.env.local`:**
   ```env
   NEXT_PUBLIC_BASE_RPC=YOUR_QUICKNODE_ENDPOINT_URL
   ```

### Option 3: Infura (Free Tier Available)

1. **Sign up for Infura:**
   - Visit: https://www.infura.io/
   - Create a free account

2. **Create Base Sepolia Project:**
   - Create new project
   - Select Base Sepolia network
   - Copy your endpoint URL

3. **Update `.env.local`:**
   ```env
   NEXT_PUBLIC_BASE_RPC=https://base-sepolia.infura.io/v3/YOUR_PROJECT_ID
   ```

## Current Setup

The app now includes:
- ✅ **Automatic retry logic** with exponential backoff (1s, 2s, 4s delays)
- ✅ **Rate limit detection** - automatically retries when rate limited
- ✅ **Better error handling** - clearer error messages

## Quick Fix

If you're getting rate limited:

1. **Wait 30-60 seconds** and try again (retry logic will handle it automatically)
2. **Or set up a better RPC provider** using one of the options above

## Environment Variables

Update `frontend/.env.local`:

```env
# Use a better RPC provider to avoid rate limits
NEXT_PUBLIC_BASE_RPC=https://base-sepolia.g.alchemy.com/v2/YOUR_API_KEY
# OR
# NEXT_PUBLIC_BASE_RPC=https://base-sepolia.infura.io/v3/YOUR_PROJECT_ID
# OR
# NEXT_PUBLIC_BASE_RPC=YOUR_QUICKNODE_ENDPOINT_URL

NEXT_PUBLIC_CONTRACT_ADDRESS=your_deployed_contract_address
NEXT_PUBLIC_USDC_ADDRESS=0x036CbD53842c5426634e7929541eC2318f3dCF7e
```

After updating, **restart your dev server** (`npm run dev`).

