# RiddlePay 🎁

**RiddlePay** - An on-chain social app that lets users send secret crypto gifts to their friends, unlocked by riddles. Built on Base Network.

## 🎯 Features

- **Secret Gifts**: Send USDC or ETH gifts locked by riddles
- **Riddle-Based Unlocking**: Receivers must guess the correct answer to claim
- **Auto-Refund**: Unclaimed gifts automatically refund after 7 days
- **Base Mini-App**: Wallet connection using ethers.js (compatible with MetaMask and Base wallets)
- **Beautiful UI**: Dark theme with Base blue accents

## 📁 Project Structure

```
gift-riddle-vault/
├── contracts/
│   └── SecretGift.sol          # Main smart contract
├── scripts/
│   └── deploy.js               # Deployment script
├── hardhat.config.js           # Hardhat configuration
├── frontend/
│   ├── pages/
│   │   ├── index.tsx          # Send gifts page
│   │   ├── my-gifts.tsx       # View all gifts
│   │   └── claim.tsx          # Claim gift page
│   ├── components/
│   │   ├── SendGiftForm.tsx   # Gift creation form
│   │   ├── ClaimGift.tsx      # Gift claiming component
│   │   └── GiftCard.tsx       # Gift display card
│   ├── hooks/
│   │   └── useContract.ts     # Contract interaction hooks
│   └── styles/
│       └── globals.css        # Global styles
└── README.md
```

## 🚀 Getting Started

### Prerequisites

- Node.js ≥ 18
- Git
- A funded Base Sepolia wallet (get testnet ETH/USDC from faucets)

### Installation

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd gift-riddle-vault
   ```

2. **Install Hardhat dependencies**
   ```bash
   npm install
   ```

3. **Install frontend dependencies**
   ```bash
   cd frontend
   npm install
   cd ..
   ```

4. **Set up environment variables**

   Create a `.env` file in the root directory:
   ```env
   PRIVATE_KEY=your_wallet_private_key
   RPC_URL=https://sepolia.base.org
   BASESCAN_API_KEY=your_basescan_api_key_optional
   USDC_ADDRESS=0x036CbD53842c5426634e7929541eC2318f3dCF7e
   ```

   Create a `frontend/.env.local` file:
   ```env
   NEXT_PUBLIC_CONTRACT_ADDRESS=deployed_contract_address
   NEXT_PUBLIC_BASE_RPC=https://sepolia.base.org
   NEXT_PUBLIC_USDC_ADDRESS=0x036CbD53842c5426634e7929541eC2318f3dCF7e
   ```

## 🔧 Smart Contract Deployment

1. **Compile the contract**
   ```bash
   npm run compile
   ```

2. **Deploy to Base Sepolia**
   ```bash
   npm run deploy:baseSepolia
   ```

3. **Copy the deployed contract address** and add it to `frontend/.env.local`:
   ```env
   NEXT_PUBLIC_CONTRACT_ADDRESS=0x...
   ```

## 💻 Frontend Development

1. **Start the development server**
   ```bash
   cd frontend
   npm run dev
   ```

2. **Open your browser**
   Navigate to `http://localhost:3000`

3. **Connect your wallet** using Base MiniKit

## 📱 Base Mini-App Configuration

After deploying your frontend to Vercel, create a `.well-known/miniapp.json` file:

```json
{
  "version": "1",
  "name": "Base Secret Gifting",
  "iconUrl": "https://yourapp.vercel.app/icon.png",
  "homeUrl": "https://yourapp.vercel.app",
  "description": "Send secret crypto gifts unlocked by riddles 🎁",
  "contractAddresses": ["<your_contract_address>"]
}
```

## 🎮 Usage

### Sending a Gift

1. Connect your wallet
2. Enter the receiver's wallet address
3. Write a riddle question
4. Enter the answer (hidden from receiver)
5. Choose amount and token (ETH or USDC)
6. Submit the transaction

### Claiming a Gift

1. Navigate to "My Gifts"
2. Find a gift sent to you
3. Read the riddle
4. Enter your guess
5. If correct, the gift is transferred to your wallet!

### Refunding Expired Gifts

If a gift remains unclaimed for 7 days, the sender can call `refundGift()` to get their funds back.

## 🧪 Testing

Run Hardhat tests:
```bash
npm test
```

## 📝 Smart Contract Functions

- `createGift()` - Create a new secret gift
- `claimGift()` - Claim a gift with the correct answer
- `refundGift()` - Refund an expired gift
- `getGift()` - Get gift details
- `getGiftsForUser()` - Get all gifts for a user
- `isExpired()` - Check if a gift has expired

## 🔐 Security

- Answers are hashed using `keccak256` before storage
- Reentrancy protection using OpenZeppelin's `ReentrancyGuard`
- Safe token transfers using OpenZeppelin's `SafeERC20`
- Only the receiver can claim gifts
- Only the sender can refund expired gifts

## 🚢 Deployment

### Smart Contract

Deploy to Base Sepolia:
```bash
npm run deploy:baseSepolia
```

### Frontend

#### Deploy to Vercel via GitHub Actions

1. **Set up GitHub Secrets** (in your GitHub repository settings):
   - Go to Settings → Secrets and variables → Actions
   - Add the following secrets:
     - `VERCEL_TOKEN`: Get from [Vercel Account Settings → Tokens](https://vercel.com/account/tokens)
     - `VERCEL_ORG_ID`: Get from your Vercel project settings (Settings → General)
     - `VERCEL_PROJECT_ID`: Get from your Vercel project settings (Settings → General)
   
   **Note**: If your Vercel project is already linked to this GitHub repository, you may only need `VERCEL_TOKEN`.

2. **Push to GitHub**:
   ```bash
   git add .
   git commit -m "Setup GitHub Actions deployment"
   git push origin main
   ```

3. **Automatic Deployment**:
   - The workflow will automatically deploy on pushes to `main` or `master` branch
   - Pull requests will trigger a preview deployment

#### Manual Deploy to Vercel

Alternatively, you can deploy manually:
1. Push your code to GitHub
2. Import the project in Vercel
3. Set environment variables
4. Deploy!

## 📄 License

MIT

## 🙏 Acknowledgments

- Built for Base Network
- Uses Base MiniKit for wallet integration
- OpenZeppelin contracts for security

## 🐛 Troubleshooting

**Contract deployment fails:**
- Ensure your wallet has enough ETH for gas
- Check your RPC URL is correct
- Verify your private key is correct

**Frontend can't connect to contract:**
- Verify `NEXT_PUBLIC_CONTRACT_ADDRESS` is set correctly
- Ensure you're on Base Sepolia network
- Check browser console for errors

**Gift claiming fails:**
- Verify you're the receiver
- Check the answer is correct (case-sensitive)
- Ensure the gift hasn't expired

## 🎉 Next Steps

- Add more token support
- Implement Secret Santa mode
- Add timed unlock feature
- Create NFT/POAP rewards
- Build social sharing features
- Add leaderboard

---

Made with ❤️ for Base Network
