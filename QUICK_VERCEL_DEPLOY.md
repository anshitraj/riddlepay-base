# ⚡ Quick Vercel Deployment Guide

## 🎯 Quick Steps

### Step 1: Update Frontend `.env.local`

Make sure `frontend/.env.local` has your deployed contract address:

```bash
NEXT_PUBLIC_CONTRACT_ADDRESS=0xYOUR_DEPLOYED_CONTRACT_ADDRESS
NEXT_PUBLIC_BASE_RPC_ALCHEMY=https://base-mainnet.g.alchemy.com/v2/UbUpyg_4rIeed4P-pOXyd
NEXT_PUBLIC_BASE_RPC_PUBLIC=https://mainnet.base.org
NEXT_PUBLIC_USDC_ADDRESS=0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913
```

### Step 2: Push to GitHub

```bash
cd gift-riddle-vault
git add .
git commit -m "Ready for Vercel deployment"
git push origin main
```

### Step 3: Deploy on Vercel

**Option A: Via Vercel Dashboard (Easiest)**

1. Go to https://vercel.com and sign in with GitHub
2. Click "Add New" → "Project"
3. Import your GitHub repository
4. **Important Settings**:
   - **Root Directory**: Click "Edit" → Set to `frontend`
   - **Framework Preset**: Next.js (auto-detected)
5. **Add Environment Variables**:
   - Click "Environment Variables"
   - Add these 4 variables:
     ```
     NEXT_PUBLIC_CONTRACT_ADDRESS = 0xYOUR_ADDRESS
     NEXT_PUBLIC_BASE_RPC_ALCHEMY = https://base-mainnet.g.alchemy.com/v2/YOUR_KEY
     NEXT_PUBLIC_BASE_RPC_PUBLIC = https://mainnet.base.org
     NEXT_PUBLIC_USDC_ADDRESS = 0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913
     ```
   - Make sure to select **Production**, **Preview**, and **Development**
6. Click "Deploy"
7. Wait ~2-3 minutes for build
8. Your app is live! 🎉

**Option B: Via Vercel CLI**

```bash
cd frontend
npm i -g vercel
vercel login
vercel
# Follow prompts, then:
vercel env add NEXT_PUBLIC_CONTRACT_ADDRESS
vercel env add NEXT_PUBLIC_BASE_RPC_ALCHEMY
vercel env add NEXT_PUBLIC_BASE_RPC_PUBLIC
vercel env add NEXT_PUBLIC_USDC_ADDRESS
vercel --prod
```

### Step 4: Update miniapp.json

After deployment, update `frontend/miniapp.json` with your Vercel URL:

```json
{
  "version": "1",
  "name": "RiddlePay",
  "iconUrl": "https://your-project.vercel.app/icon.png",
  "homeUrl": "https://your-project.vercel.app",
  "description": "RiddlePay - Unlock crypto gifts with riddles 🎁",
  "contractAddresses": ["0xYOUR_DEPLOYED_CONTRACT_ADDRESS"]
}
```

Then commit and push - Vercel will auto-redeploy.

## ✅ That's It!

Your app will be live at: `https://your-project.vercel.app`

Test it:
- Connect wallet
- Send a test gift
- Claim a gift
- Check dashboard

🎉 **Congratulations! Your app is live on Base Mainnet!**

