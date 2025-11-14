# Base Mini App Manifest Setup Guide

## Required PNG Assets

You need to create the following PNG images and place them in the `public` folder:

### 1. Icon (icon.png)
- **Size**: 1024×1024px
- **Format**: PNG
- **Background**: Solid color (transparent discouraged)
- **URL**: `https://riddlepay.tech/icon.png`
- **Usage**: App icon displayed in Base app

### 2. Splash Screen (splash.png)
- **Size**: Recommended 200×200px (can be larger)
- **Format**: PNG
- **Background**: Will use `splashBackgroundColor` (#000000)
- **URL**: `https://riddlepay.tech/splash.png`
- **Usage**: Loading screen image

### 3. Hero Image (hero.png)
- **Size**: 1200×630px (1.91:1 aspect ratio)
- **Format**: PNG or JPG
- **URL**: `https://riddlepay.tech/hero.png`
- **Usage**: Large promotional image on app page

### 4. Screenshots (screenshot1.png, screenshot2.png, screenshot3.png)
- **Size**: Portrait 1284×2778px (recommended)
- **Format**: PNG or JPG
- **Max**: 3 screenshots
- **URLs**: 
  - `https://riddlepay.tech/screenshot1.png`
  - `https://riddlepay.tech/screenshot2.png`
  - `https://riddlepay.tech/screenshot3.png`
- **Usage**: Visual previews of the app

### 5. Open Graph Image (og-image.png)
- **Size**: 1200×630px (1.91:1 aspect ratio)
- **Format**: PNG or JPG
- **URL**: `https://riddlepay.tech/og-image.png`
- **Usage**: Image shown when sharing on social platforms

## Converting SVG to PNG

You can use the existing `riddlepay-logo.svg` to generate these assets:

### Online Tools:
1. **SVG to PNG Converters:**
   - https://svgtopng.com
   - https://cloudconvert.com/svg-to-png
   - https://convertio.co/svg-png/

2. **For Icon (1024×1024):**
   - Upload `riddlepay-logo.svg`
   - Set size to 1024×1024
   - Use solid background color (e.g., #000000 or #0052FF)
   - Save as `icon.png`

3. **For Splash (200×200 or larger):**
   - Upload `riddlepay-logo.svg`
   - Set size to 200×200 or 400×400
   - Transparent or solid background
   - Save as `splash.png`

### Using ImageMagick (Command Line):
```bash
# Icon (1024×1024)
convert riddlepay-logo.svg -background "#000000" -resize 1024x1024 icon.png

# Splash (400×400)
convert riddlepay-logo.svg -background none -resize 400x400 splash.png
```

## Base Build Account Association

After creating the manifest file:

1. **Deploy your app** so the manifest is accessible at:
   `https://riddlepay.tech/.well-known/farcaster.json`

2. **Navigate to Base Build Account Association tool:**
   - Go to Base Build dashboard
   - Find the Account Association tool

3. **Verify your domain:**
   - Paste `riddlepay.tech` in the App URL field
   - Click "Submit"
   - Click "Verify"
   - Sign the manifest with your wallet

4. **Update the manifest:**
   - Copy the generated `accountAssociation` fields (header, payload, signature)
   - Paste them into `public/.well-known/farcaster.json`
   - Update `baseBuilder.ownerAddress` with your wallet address

5. **Redeploy:**
   - Commit and push the updated manifest
   - Wait for Vercel deployment
   - Repost your mini app in Base Build

## Notes

- The manifest file is already configured in `next.config.js` and `vercel.json` to be served correctly
- All image URLs must be HTTPS and accessible
- After updating `accountAssociation`, your mini app will appear in Base app discovery
- Set `"noindex": true` during development to prevent search indexing

