# 🚀 How to Run the Fully Functional App

## Prerequisites Checklist

- ✅ Node.js ≥ 18 installed
- ✅ MetaMask or Web3 wallet installed
- ✅ Base Sepolia testnet ETH (for gas fees)
- ✅ `.env` file created in root (for contract deployment)

## Step-by-Step Guide

### Step 1: Set Up Frontend Environment Variables

Create `frontend/.env.local` file:

```env
NEXT_PUBLIC_CONTRACT_ADDRESS=will_add_after_deployment
NEXT_PUBLIC_BASE_RPC=https://sepolia.base.org
NEXT_PUBLIC_USDC_ADDRESS=0x036CbD53842c5426634e7929541eC2318f3dCF7e
```

**Note:** We'll update `NEXT_PUBLIC_CONTRACT_ADDRESS` after deploying the contract.

### Step 2: Deploy the Smart Contract

```bash
# Make sure you're in the root directory
cd gift-riddle-vault

# Compile contracts first
npm run compile

# Deploy to Base Sepolia
npm run deploy:baseSepolia
```

**What happens:**
- The script will deploy your contract to Base Sepolia
- You'll see output like: `SecretGift deployed to: 0x...`
- **Copy that contract address!**

**After deployment, update `frontend/.env.local`:**
```env
NEXT_PUBLIC_CONTRACT_ADDRESS=0x_YOUR_DEPLOYED_CONTRACT_ADDRESS_HERE
NEXT_PUBLIC_BASE_RPC=https://sepolia.base.org
NEXT_PUBLIC_USDC_ADDRESS=0x036CbD53842c5426634e7929541eC2318f3dCF7e
```

### Step 3: Get Testnet Tokens (if needed)

**Get Base Sepolia ETH:**
- Visit: https://www.coinbase.com/developer-platform/products/faucet
- Or: https://faucet.quicknode.com/base/sepolia
- Enter your wallet address and claim

**Get Base Sepolia USDC (optional):**
- Visit: https://www.coinbase.com/developer-platform/products/faucet
- Select USDC token and claim

### Step 4: Run the Frontend

```bash
# Navigate to frontend directory
cd frontend

# Start the development server
npm run dev
```

**The app will be available at:** http://localhost:3000

### Step 5: Connect Your Wallet

1. **Open** http://localhost:3000 in your browser
2. **Click** "Connect Wallet" button
3. **Approve** the connection in MetaMask
4. **Important:** Make sure MetaMask is on **Base Sepolia** network
   - If not, add it:
     - Network Name: `Base Sepolia`
     - RPC URL: `https://sepolia.base.org`
     - Chain ID: `84532`
     - Currency Symbol: `ETH`
     - Block Explorer: `https://sepolia.basescan.org`

### Step 6: Test the App

#### Test 1: Send a Gift

1. Fill in the form:
   - **Receiver Address:** Another wallet address (or use a second wallet for testing)
   - **Riddle:** "What has keys but no locks?"
   - **Answer:** "piano" (hidden from receiver)
   - **Amount:** `0.001` (or any small amount)
   - **Token:** Choose ETH or USDC

2. Click **"Create Secret Gift 🎁"**
3. Approve the transaction in MetaMask
4. Wait for confirmation
5. You'll see a success message with a BaseScan link!

#### Test 2: View Your Gifts

1. Click **"View My Gifts"**
2. You'll see all gifts you've sent and received
3. Each gift shows:
   - Riddle question
   - Amount
   - Status (Pending/Claimed)
   - Date created

#### Test 3: Claim a Gift

1. In "My Gifts", find a gift sent **to your address**
2. Click **"Claim Gift"**
3. Enter your guess for the riddle
4. If correct, the gift transfers to your wallet! 🎉
5. You'll see confetti animation on success!

## Quick Command Reference

```bash
# Deploy contract
npm run deploy:baseSepolia

# Run frontend
cd frontend && npm run dev

# Compile contracts
npm run compile
```

## Troubleshooting

### "Contract not initialized" error
- ✅ Check `NEXT_PUBLIC_CONTRACT_ADDRESS` is set in `frontend/.env.local`
- ✅ Restart the dev server: Stop (Ctrl+C) and run `npm run dev` again

### "Failed to connect wallet"
- ✅ Make sure MetaMask is installed
- ✅ Check browser console for errors
- ✅ Refresh the page

### "Transaction failed"
- ✅ Ensure you're on Base Sepolia network (Chain ID: 84532)
- ✅ Check you have enough ETH for gas fees
- ✅ Verify receiver address is correct

### Contract deployment fails
- ✅ Check `.env` file has `PRIVATE_KEY` set
- ✅ Ensure wallet has Base Sepolia ETH
- ✅ Verify RPC URL is correct: `https://sepolia.base.org`

### Wrong network error
- ✅ Switch MetaMask to Base Sepolia
- ✅ Add network if not available (see Step 5)

## Full Workflow Example

```bash
# 1. Set up environment (one time)
# Create frontend/.env.local with contract address placeholder

# 2. Deploy contract
cd gift-riddle-vault
npm run compile
npm run deploy:baseSepolia

# 3. Update frontend/.env.local with deployed contract address

# 4. Run frontend
cd frontend
npm run dev

# 5. Open browser to http://localhost:3000
# 6. Connect wallet and test!
```

## What You Should See

✅ **Homepage:** Beautiful dark theme with "Send Secret Gift" form
✅ **My Gifts:** List of all your gifts with status indicators
✅ **Claim Page:** Interface to solve riddles and claim gifts
✅ **Confetti:** Celebration animation when gifts are claimed!

---

**You're all set!** 🎉 The app is fully functional and ready to use!

