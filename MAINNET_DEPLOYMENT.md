# 🚀 RiddlePay - Mainnet Deployment Guide

## ✅ Security Audit Complete

All critical security issues have been fixed and the contract is ready for Base Mainnet deployment.

## 🔒 Security Fixes Applied

1. **Hash Collision Protection** ✅
   - Added salted hash: `keccak256(abi.encodePacked(answer, giftId, sender, receiver))`
   - Prevents hash collision attacks

2. **Gas Griefing Protection** ✅
   - Added maximum string lengths:
     - Riddle: 500 characters
     - Answer: 200 characters
     - Message: 1000 characters

3. **Input Validation** ✅
   - Frontend validates Ethereum addresses
   - String length checks
   - Amount validation

4. **Base Mainnet Support** ✅
   - Network configuration added
   - Wallet switching support
   - USDC address configured

## 📋 Pre-Deployment Checklist

### 1. Environment Setup
```bash
# Create .env file in root directory
PRIVATE_KEY=your_deployer_private_key
RPC_URL=https://mainnet.base.org  # Or use Alchemy/Infura
USDC_ADDRESS=0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913
BASESCAN_API_KEY=your_basescan_api_key
```

### 2. Verify USDC Address
- Base Mainnet USDC: `0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913`
- Verify on BaseScan: https://basescan.org/address/0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913

### 3. Test on Sepolia First (Recommended)
```bash
# Deploy to Base Sepolia first
npx hardhat run scripts/deploy.js --network baseSepolia

# Test all functions:
# - Create gift
# - Claim gift
# - Refund expired gift
# - View gifts
```

## 🚀 Deployment Steps

### Step 1: Compile Contract
```bash
cd gift-riddle-vault
npx hardhat compile
```

### Step 2: Deploy to Base Mainnet
```bash
npx hardhat run scripts/deploy.js --network baseMainnet
```

**Expected Output:**
```
Deploying SecretGift contract...
Network: baseMainnet
USDC Address: 0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913
SecretGift deployed to: 0x...
Waiting for block confirmations...
Contract verified!
```

### Step 3: Verify Contract on BaseScan
```bash
npx hardhat verify --network baseMainnet <CONTRACT_ADDRESS> 0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913
```

### Step 4: Update Frontend Environment

Create/update `frontend/.env.local`:
```env
NEXT_PUBLIC_CONTRACT_ADDRESS=<your_deployed_contract_address>
NEXT_PUBLIC_BASE_RPC=https://mainnet.base.org
# Or use Alchemy/Infura for better reliability:
# NEXT_PUBLIC_BASE_RPC=https://base-mainnet.g.alchemy.com/v2/YOUR_API_KEY
NEXT_PUBLIC_USDC_ADDRESS=0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913
```

### Step 5: Build and Deploy Frontend
```bash
cd frontend
npm run build
# Deploy to Vercel or your hosting provider
```

## 🔍 Post-Deployment Verification

1. **Contract Functions:**
   - [ ] Create a test gift (small amount)
   - [ ] Claim the gift with correct answer
   - [ ] Verify gift appears in "My Gifts"
   - [ ] Test refund after expiry (wait 7 days or modify EXPIRY_DAYS for testing)

2. **Frontend:**
   - [ ] Wallet connects to Base Mainnet
   - [ ] Network switching works
   - [ ] Gift creation works
   - [ ] Gift claiming works
   - [ ] Leaderboard loads

3. **Security:**
   - [ ] Only receiver can claim
   - [ ] Only sender can refund expired gifts
   - [ ] String length limits enforced
   - [ ] Address validation works

## ⚠️ Important Notes

1. **RPC Provider:** Use Alchemy or Infura for production (not public RPC)
   - Public RPC has rate limits
   - Update `NEXT_PUBLIC_BASE_RPC` in frontend

2. **Gas Costs:** Monitor gas costs for:
   - Creating gifts (especially with long strings)
   - Claiming gifts
   - Refunding gifts

3. **USDC Approval:** Users need to approve USDC spending before creating USDC gifts
   - Frontend handles this automatically
   - First USDC gift requires 2 transactions (approve + create)

4. **Contract Immutability:** Contract cannot be upgraded after deployment
   - All security fixes are final
   - Test thoroughly on Sepolia first

## 📊 Contract Addresses

### Base Mainnet
- **Contract:** `<DEPLOYED_ADDRESS>` (update after deployment)
- **USDC:** `0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913`

### Base Sepolia (Testnet)
- **Contract:** `<SEPOLIA_ADDRESS>` (if deployed)
- **USDC:** `0x036CbD53842c5426634e7929541eC2318f3dCF7e`

## 🆘 Troubleshooting

### Deployment Fails
- Check RPC URL is correct
- Verify private key has ETH for gas
- Ensure USDC address is correct

### Contract Verification Fails
- Wait a few minutes after deployment
- Check constructor arguments match
- Verify compiler version matches

### Frontend Issues
- Clear browser cache
- Check environment variables
- Verify contract address is correct
- Check RPC provider is not rate-limited

## 📝 Next Steps After Deployment

1. **Monitor Contract:**
   - Set up BaseScan alerts
   - Monitor for unusual activity
   - Track gas costs

2. **User Onboarding:**
   - Create tutorial/guide
   - Add FAQ section
   - Provide example riddles

3. **Marketing:**
   - Share on social media
   - Submit to Base ecosystem
   - Create demo video

---

**Status:** ✅ Ready for Mainnet Deployment

**Last Updated:** $(date)

