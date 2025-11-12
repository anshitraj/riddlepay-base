# Quick Setup Guide

## Prerequisites

- Node.js ≥ 18
- Git
- A Base Sepolia wallet with testnet ETH/USDC

## Step 1: Install Dependencies

```bash
# Install Hardhat dependencies
npm install

# Install frontend dependencies
cd frontend
npm install
cd ..
```

## Step 2: Configure Environment Variables

### Root `.env` file:
```env
PRIVATE_KEY=your_wallet_private_key_here
RPC_URL=https://sepolia.base.org
BASESCAN_API_KEY=your_basescan_api_key_optional
USDC_ADDRESS=0x036CbD53842c5426634e7929541eC2318f3dCF7e
```

### Frontend `.env.local` file:
```env
NEXT_PUBLIC_CONTRACT_ADDRESS=deployed_contract_address_here
NEXT_PUBLIC_BASE_RPC=https://sepolia.base.org
NEXT_PUBLIC_USDC_ADDRESS=0x036CbD53842c5426634e7929541eC2318f3dCF7e
```

## Step 3: Deploy Smart Contract

```bash
# Compile contracts
npm run compile

# Deploy to Base Sepolia
npm run deploy:baseSepolia
```

**Important:** Copy the deployed contract address and add it to `frontend/.env.local`

## Step 4: Run Frontend

```bash
cd frontend
npm run dev
```

Open `http://localhost:3000` in your browser.

## Step 5: Test the App

1. Connect your wallet using the "Connect Wallet" button
2. Send a test gift:
   - Enter a receiver address
   - Write a riddle
   - Enter the answer
   - Choose amount and token
   - Submit!

3. View your gifts:
   - Click "View My Gifts"
   - See all sent/received gifts
   - Claim gifts sent to you

## Troubleshooting

**PowerShell execution policy error (Windows):**
If you see `npm : File C:\Program Files\nodejs\npm.ps1 cannot be loaded because running scripts is disabled`:

**Option 1: Change execution policy (Recommended)**
```powershell
# Run PowerShell as Administrator, then:
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

**Option 2: Use Command Prompt instead**
- Open Command Prompt (cmd.exe) instead of PowerShell
- Navigate to project: `cd E:\base\gift-riddle-vault`
- Run: `npm install`

**Option 3: Bypass for single command**
```powershell
powershell -ExecutionPolicy Bypass -Command "npm install"
```

**Contract deployment fails:**
- Ensure wallet has enough ETH for gas
- Verify RPC URL is correct
- Check private key format

**Frontend can't connect:**
- Verify `NEXT_PUBLIC_CONTRACT_ADDRESS` is set
- Ensure you're on Base Sepolia network
- Check browser console for errors

**Wallet connection not working:**
- Ensure MetaMask or another Web3 wallet is installed
- Make sure your wallet is connected to Base Sepolia network
- Check browser console for errors
- Verify `window.ethereum` is available in browser console

## Next Steps

- Deploy frontend to Vercel
- Update `.well-known/miniapp.json` with your contract address
- Add your app icon
- Share with friends!

