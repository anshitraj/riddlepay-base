# 🚀 Quick Start Guide - Run the Full App

Follow these steps to get your Base Secret Gifting app fully functional!

## Step 1: Set Up Environment Variables

### Root `.env` file (for contract deployment)

Create a `.env` file in the root directory (`gift-riddle-vault/.env`):

```env
PRIVATE_KEY=your_wallet_private_key_without_0x_prefix
RPC_URL=https://sepolia.base.org
BASESCAN_API_KEY=your_basescan_api_key_optional
USDC_ADDRESS=0x036CbD53842c5426634e7929541eC2318f3dCF7e
```

**Important:**
- Get your private key from MetaMask: Settings → Security & Privacy → Show Private Key
- Remove the `0x` prefix if present
- Make sure your wallet has Base Sepolia ETH for gas fees

### Frontend `.env.local` file

Create `frontend/.env.local`:

```env
NEXT_PUBLIC_CONTRACT_ADDRESS=will_add_after_deployment
NEXT_PUBLIC_BASE_RPC=https://sepolia.base.org
NEXT_PUBLIC_USDC_ADDRESS=0x036CbD53842c5426634e7929541eC2318f3dCF7e
```

**Note:** We'll update `NEXT_PUBLIC_CONTRACT_ADDRESS` after deploying the contract.

## Step 2: Get Testnet Tokens

You'll need Base Sepolia testnet tokens:

1. **Get Base Sepolia ETH** (for gas):
   - Visit: https://www.coinbase.com/developer-platform/products/faucet
   - Or: https://faucet.quicknode.com/base/sepolia
   - Enter your wallet address and claim testnet ETH

2. **Get Base Sepolia USDC** (optional, for testing USDC gifts):
   - Visit: https://www.coinbase.com/developer-platform/products/faucet
   - Select USDC token
   - Claim testnet USDC

## Step 3: Deploy the Smart Contract

```bash
# Make sure you're in the root directory
cd gift-riddle-vault

# Compile the contracts
npm run compile

# Deploy to Base Sepolia
npm run deploy:baseSepolia
```

**After deployment, you'll see output like:**
```
SecretGift deployed to: 0x1234567890abcdef1234567890abcdef12345678
Network: baseSepolia
USDC Address: 0x036CbD53842c5426634e7929541eC2318f3dCF7e

Add this to your .env.local:
NEXT_PUBLIC_CONTRACT_ADDRESS=0x1234567890abcdef1234567890abcdef12345678
```

**Copy the contract address and update `frontend/.env.local`:**

```env
NEXT_PUBLIC_CONTRACT_ADDRESS=0x1234567890abcdef1234567890abcdef12345678
NEXT_PUBLIC_BASE_RPC=https://sepolia.base.org
NEXT_PUBLIC_USDC_ADDRESS=0x036CbD53842c5426634e7929541eC2318f3dCF7e
```

## Step 4: Run the Frontend

```bash
# Navigate to frontend directory
cd frontend

# Start the development server
npm run dev
```

The app will start at: **http://localhost:3000**

## Step 5: Test the App

### 5.1 Connect Your Wallet

1. Open http://localhost:3000 in your browser
2. Click **"Connect Wallet"** button
3. Approve the connection in MetaMask
4. **Important:** Make sure MetaMask is connected to **Base Sepolia** network
   - If not, add the network:
     - Network Name: Base Sepolia
     - RPC URL: https://sepolia.base.org
     - Chain ID: 84532
     - Currency Symbol: ETH
     - Block Explorer: https://sepolia.basescan.org

### 5.2 Send a Test Gift

1. Fill in the form:
   - **Receiver Address:** Another wallet address (or your second wallet for testing)
   - **Riddle:** "What has keys but no locks?"
   - **Answer:** "piano" (this is hidden from receiver)
   - **Amount:** 0.001 (or any small amount)
   - **Token:** ETH or USDC

2. Click **"Create Secret Gift 🎁"**

3. Approve the transaction in MetaMask

4. Wait for confirmation (check BaseScan link)

### 5.3 Claim a Gift

1. Click **"View My Gifts"**

2. Find a gift sent to your address

3. Click **"Claim Gift"**

4. Enter your guess for the riddle

5. If correct, the gift will be transferred to your wallet! 🎉

## Troubleshooting

### Contract deployment fails

**Error: "insufficient funds"**
- Make sure your wallet has Base Sepolia ETH
- Get more from faucets listed in Step 2

**Error: "nonce too high"**
- Reset your MetaMask account nonce
- Or wait a few minutes and try again

**Error: "execution reverted"**
- Check USDC_ADDRESS is correct
- Verify you have enough USDC if testing USDC gifts

### Frontend issues

**"Contract not initialized"**
- Check `NEXT_PUBLIC_CONTRACT_ADDRESS` is set in `frontend/.env.local`
- Restart the dev server after changing `.env.local`

**"Failed to connect wallet"**
- Make sure MetaMask is installed
- Check browser console for errors
- Try refreshing the page

**"Transaction failed"**
- Ensure you're on Base Sepolia network
- Check you have enough ETH for gas
- Verify receiver address is correct

### Network issues

**Wrong network error:**
- Switch MetaMask to Base Sepolia
- Network details:
  - Chain ID: 84532
  - RPC: https://sepolia.base.org

## What's Next?

✅ **You're all set!** The app is fully functional.

**Optional enhancements:**
- Deploy to Vercel for production
- Update `.well-known/miniapp.json` with your contract address
- Add your app icon
- Share with friends!

## Quick Commands Reference

```bash
# Deploy contract
npm run deploy:baseSepolia

# Run frontend
cd frontend && npm run dev

# Compile contracts
npm run compile

# Run tests
npm test
```

---

**Need help?** Check the full README.md for more details!

