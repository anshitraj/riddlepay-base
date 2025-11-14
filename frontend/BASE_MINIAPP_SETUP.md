# Base Mini App Setup - Quick Reference

## ✅ Completed Setup

1. **Manifest File Created**: `/public/.well-known/farcaster.json`
2. **Next.js Config**: Headers configured for `.well-known` paths
3. **Vercel Config**: Headers configured for proper serving
4. **Logo Format**: Updated to use PNG instead of webp

## 📋 Next Steps

### 1. Create PNG Assets

You need to create these PNG files in the `public` folder:

- **icon.png** (1024×1024px) - App icon
- **splash.png** (200×200px recommended) - Loading screen
- **hero.png** (1200×630px) - Promotional image
- **og-image.png** (1200×630px) - Social sharing image
- **screenshot1.png, screenshot2.png, screenshot3.png** (1284×2778px) - App screenshots

**Quick Conversion:**
- Use `riddlepay-logo.svg` as source
- Convert using: https://svgtopng.com
- For icon: 1024×1024 with solid background (#000000 or #0052FF)
- For splash: 200×200 or 400×400

### 2. Verify Domain Ownership

1. **Deploy to Vercel** (if not already deployed)
   - The manifest will be available at: `https://riddlepay.tech/.well-known/farcaster.json`

2. **Go to Base Build Account Association Tool**
   - Navigate to Base Build dashboard
   - Find "Account Association" tool

3. **Verify Domain**
   - Enter: `riddlepay.tech`
   - Click "Submit"
   - Click "Verify"
   - Sign with your wallet

4. **Update Manifest**
   - Copy the generated `accountAssociation` fields:
     - `header`
     - `payload`
     - `signature`
   - Paste into `public/.well-known/farcaster.json`
   - Update `baseBuilder.ownerAddress` with your wallet address

5. **Redeploy**
   - Commit and push changes
   - Wait for Vercel deployment
   - Repost mini app in Base Build

## 📝 Manifest Fields Explained

### Required Fields (Already Set)
- ✅ `version`: "1"
- ✅ `name`: "RiddlePay" (max 32 chars)
- ✅ `homeUrl`: "https://riddlepay.tech"
- ✅ `iconUrl`: "https://riddlepay.tech/icon.png" (PNG 1024×1024)
- ✅ `splashImageUrl`: "https://riddlepay.tech/splash.png"
- ✅ `splashBackgroundColor`: "#000000"
- ✅ `primaryCategory`: "finance"
- ✅ `tags`: ["crypto", "gifts", "airdrops", "riddles", "base"]

### Optional Fields (Set)
- ✅ `subtitle`: "Unlock crypto gifts" (max 30 chars)
- ✅ `description`: Full description (max 170 chars)
- ✅ `tagline`: "Unlock crypto with riddles" (max 30 chars)
- ✅ `heroImageUrl`: Promotional image
- ✅ `screenshotUrls`: Up to 3 screenshots
- ✅ `ogTitle`, `ogDescription`, `ogImageUrl`: Social sharing
- ⚠️ `webhookUrl`: Empty (add if using notifications)

### Fields to Fill After Verification
- ⚠️ `accountAssociation.header`: From Base Build verification
- ⚠️ `accountAssociation.payload`: From Base Build verification
- ⚠️ `accountAssociation.signature`: From Base Build verification
- ⚠️ `baseBuilder.ownerAddress`: Your wallet address

## 🔍 Testing

After deployment, verify the manifest is accessible:
```bash
curl https://riddlepay.tech/.well-known/farcaster.json
```

Should return the JSON manifest with proper headers.

## 📚 Resources

- Base Build Documentation: https://docs.base.org
- Mini App Assets Generator: Use Base Build tools
- See `public/MANIFEST_SETUP.md` for detailed asset creation guide

## ⚠️ Important Notes

1. **All image URLs must be HTTPS** and publicly accessible
2. **PNG format required** for icon (1024×1024)
3. **After updating accountAssociation**, your mini app will appear in Base app discovery
4. **Set `"noindex": true`** during development to prevent search indexing
5. **Redeploy after any manifest changes** for them to take effect

