# 🚀 Vercel Deployment Guide for RiddlePay

## 📋 Pre-Deployment Checklist

### 1. Update Frontend Environment Variables

Update `frontend/.env.local` with your deployed contract address:

```bash
# Base Mainnet Contract Address (from deployment)
NEXT_PUBLIC_CONTRACT_ADDRESS=0xYOUR_DEPLOYED_CONTRACT_ADDRESS

# Hybrid RPC Setup
NEXT_PUBLIC_BASE_RPC_ALCHEMY=https://base-mainnet.g.alchemy.com/v2/YOUR_ALCHEMY_API_KEY
NEXT_PUBLIC_BASE_RPC_PUBLIC=https://mainnet.base.org

# Base Mainnet USDC Address
NEXT_PUBLIC_USDC_ADDRESS=0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913
```

### 2. Update miniapp.json

Update `frontend/miniapp.json` with your Vercel URL (after deployment):

```json
{
  "version": "1",
  "name": "RiddlePay",
  "iconUrl": "https://your-app.vercel.app/icon.png",
  "homeUrl": "https://your-app.vercel.app",
  "description": "RiddlePay - Unlock crypto gifts with riddles 🎁",
  "contractAddresses": []
}
```

## 🚀 Deployment Steps

### Option 1: Deploy via Vercel CLI (Recommended)

1. **Install Vercel CLI** (if not already installed):
   ```bash
   npm i -g vercel
   ```

2. **Login to Vercel**:
   ```bash
   vercel login
   ```

3. **Navigate to frontend directory**:
   ```bash
   cd frontend
   ```

4. **Deploy to Vercel**:
   ```bash
   vercel
   ```
   
   Follow the prompts:
   - Set up and deploy? **Yes**
   - Which scope? **Your account**
   - Link to existing project? **No** (first time) or **Yes** (if updating)
   - Project name? **riddlepay** (or your preferred name)
   - Directory? **./** (current directory)
   - Override settings? **No**

5. **Add Environment Variables**:
   After first deployment, add environment variables:
   ```bash
   vercel env add NEXT_PUBLIC_CONTRACT_ADDRESS
   vercel env add NEXT_PUBLIC_BASE_RPC_ALCHEMY
   vercel env add NEXT_PUBLIC_BASE_RPC_PUBLIC
   vercel env add NEXT_PUBLIC_USDC_ADDRESS
   ```
   
   Or add them via Vercel Dashboard (see Option 2)

6. **Deploy to Production**:
   ```bash
   vercel --prod
   ```

### Option 2: Deploy via Vercel Dashboard (Easier)

1. **Push code to GitHub**:
   ```bash
   git add .
   git commit -m "Ready for mainnet deployment"
   git push origin main
   ```

2. **Go to Vercel Dashboard**:
   - Visit https://vercel.com
   - Sign in with GitHub

3. **Import Project**:
   - Click "Add New" → "Project"
   - Import your GitHub repository
   - Select the repository

4. **Configure Project**:
   - **Framework Preset**: Next.js (auto-detected)
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build` (auto-detected)
   - **Output Directory**: `.next` (auto-detected)
   - **Install Command**: `npm install` (auto-detected)

5. **Add Environment Variables**:
   Click "Environment Variables" and add:
   
   | Name | Value |
   |------|-------|
   | `NEXT_PUBLIC_CONTRACT_ADDRESS` | `0xYOUR_DEPLOYED_CONTRACT_ADDRESS` |
   | `NEXT_PUBLIC_BASE_RPC_ALCHEMY` | `https://base-mainnet.g.alchemy.com/v2/YOUR_KEY` |
   | `NEXT_PUBLIC_BASE_RPC_PUBLIC` | `https://mainnet.base.org` |
   | `NEXT_PUBLIC_USDC_ADDRESS` | `0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913` |
   
   **Important**: Make sure to add these for **Production**, **Preview**, and **Development** environments.

6. **Deploy**:
   - Click "Deploy"
   - Wait for build to complete (~2-3 minutes)
   - Your app will be live at `https://your-project.vercel.app`

## 🔧 Post-Deployment Steps

### 1. Update miniapp.json

After deployment, update `frontend/miniapp.json`:

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

Then commit and push:
```bash
git add frontend/miniapp.json
git commit -m "Update miniapp.json with production URL"
git push
```

Vercel will automatically redeploy.

### 2. Test Your Deployment

1. **Visit your Vercel URL**: `https://your-project.vercel.app`
2. **Connect Wallet**: Make sure it connects to Base Mainnet
3. **Test Features**:
   - [ ] Send a small ETH gift
   - [ ] Send a small USDC gift
   - [ ] Claim a gift
   - [ ] Check dashboard
   - [ ] Check leaderboard
   - [ ] Test theme toggle

### 3. Custom Domain (Optional)

1. Go to Vercel Dashboard → Your Project → Settings → Domains
2. Add your custom domain
3. Follow DNS configuration instructions

## 📝 Environment Variables Reference

Make sure these are set in Vercel:

```bash
NEXT_PUBLIC_CONTRACT_ADDRESS=0x...
NEXT_PUBLIC_BASE_RPC_ALCHEMY=https://base-mainnet.g.alchemy.com/v2/YOUR_KEY
NEXT_PUBLIC_BASE_RPC_PUBLIC=https://mainnet.base.org
NEXT_PUBLIC_USDC_ADDRESS=0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913
```

## 🐛 Troubleshooting

### Build Fails
- Check that all environment variables are set
- Verify `package.json` has all dependencies
- Check build logs in Vercel dashboard

### App Shows "Contract not initialized"
- Verify `NEXT_PUBLIC_CONTRACT_ADDRESS` is correct
- Check RPC URLs are correct
- Make sure environment variables are set for Production environment

### RPC Rate Limiting
- The hybrid RPC provider should handle this automatically
- Check Alchemy API key is valid
- Verify public RPC fallback is working

## ✅ Deployment Checklist

- [ ] Contract deployed to Base Mainnet
- [ ] Contract address copied
- [ ] Frontend `.env.local` updated
- [ ] Code pushed to GitHub
- [ ] Vercel project created
- [ ] Environment variables added in Vercel
- [ ] Deployment successful
- [ ] App tested on production URL
- [ ] `miniapp.json` updated with production URL
- [ ] All features tested

## 🎉 You're Live!

Once deployed, your app will be accessible at:
- **Vercel URL**: `https://your-project.vercel.app`
- **Custom Domain**: `https://yourdomain.com` (if configured)

Share your app and start sending crypto gifts! 🎁

