const { Resvg } = require('@resvg/resvg-js');
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const publicDir = path.join(__dirname, '../public');
const svgPath = path.join(publicDir, 'icon.svg');

// Read the SVG file
const svgContent = fs.readFileSync(svgPath, 'utf8');

// Function to create PNG from SVG using resvg
async function createPNGFromSVG(outputPath, width, height) {
  try {
    // Update SVG viewBox and dimensions
    const updatedSvg = svgContent
      .replace(/width="[^"]*"/, `width="${width}"`)
      .replace(/height="[^"]*"/, `height="${height}"`)
      .replace(/viewBox="[^"]*"/, `viewBox="0 0 ${width} ${height}"`);
    
    const resvg = new Resvg(updatedSvg, {
      fitTo: {
        mode: 'width',
        value: width,
      },
      background: 'rgba(0, 0, 0, 0)',
    });
    
    const pngData = resvg.render();
    const pngBuffer = pngData.asPng();
    
    // Resize if needed
    await sharp(pngBuffer)
      .resize(width, height, {
        fit: 'contain',
        background: { r: 0, g: 82, b: 255, alpha: 1 }
      })
      .png()
      .toFile(outputPath);
    
    console.log(`✅ Created: ${path.basename(outputPath)} (${width}x${height})`);
  } catch (error) {
    console.error(`❌ Error creating ${outputPath}:`, error.message);
    // Fallback: create a simple colored PNG
    await sharp({
      create: {
        width,
        height,
        channels: 4,
        background: { r: 0, g: 82, b: 255, alpha: 1 }
      }
    })
      .png()
      .toFile(outputPath);
    console.log(`✅ Created fallback: ${path.basename(outputPath)} (${width}x${height})`);
  }
}

// Function to create a hero/og image with text overlay
async function createHeroImage(outputPath, width, height) {
  try {
    const svgContent = `
      <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:#0052FF;stop-opacity:1" />
            <stop offset="100%" style="stop-color:#00C2FF;stop-opacity:1" />
          </linearGradient>
        </defs>
        <rect width="${width}" height="${height}" fill="url(#bg)"/>
        <g transform="translate(${width/2 - 200}, ${height/2 - 150})">
          <rect x="150" y="200" width="100" height="100" rx="20" fill="white" opacity="0.95"/>
          <rect x="130" y="180" width="140" height="30" rx="15" fill="white" opacity="0.95"/>
          <rect x="200" y="150" width="12" height="150" fill="white"/>
          <rect x="130" y="200" width="140" height="12" fill="white"/>
          <circle cx="206" cy="250" r="20" fill="white"/>
          <rect x="194" y="250" width="24" height="30" rx="12" fill="white"/>
        </g>
        <text x="${width/2}" y="${height/2 + 100}" font-family="Arial, sans-serif" font-size="60" font-weight="bold" fill="white" text-anchor="middle">RiddlePay</text>
        <text x="${width/2}" y="${height/2 + 150}" font-family="Arial, sans-serif" font-size="32" fill="white" text-anchor="middle" opacity="0.9">Unlock crypto gifts with riddles</text>
      </svg>
    `;
    
    const resvg = new Resvg(svgContent, {
      fitTo: {
        mode: 'width',
        value: width,
      },
      background: 'rgba(0, 82, 255, 1)',
    });
    
    const pngData = resvg.render();
    const pngBuffer = pngData.asPng();
    
    await sharp(pngBuffer)
      .resize(width, height)
      .png()
      .toFile(outputPath);
    
    console.log(`✅ Created: ${path.basename(outputPath)} (${width}x${height})`);
  } catch (error) {
    console.error(`❌ Error creating ${outputPath}:`, error.message);
    // Fallback: create a simple colored PNG
    await sharp({
      create: {
        width,
        height,
        channels: 4,
        background: { r: 0, g: 82, b: 255, alpha: 1 }
      }
    })
      .png()
      .toFile(outputPath);
    console.log(`✅ Created fallback: ${path.basename(outputPath)} (${width}x${height})`);
  }
}

// Function to create splash image (simpler version)
async function createSplashImage(outputPath, size) {
  await createPNGFromSVG(outputPath, size, size);
}

// Function to create screenshot placeholder
async function createScreenshot(outputPath, width, height, index) {
  try {
    const svgContent = `
      <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="bg${index}" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:#0052FF;stop-opacity:1" />
            <stop offset="100%" style="stop-color:#00C2FF;stop-opacity:1" />
          </linearGradient>
        </defs>
        <rect width="${width}" height="${height}" fill="url(#bg${index})"/>
        <g transform="translate(${width/2 - 150}, ${height/2 - 200})">
          <rect x="100" y="150" width="100" height="100" rx="20" fill="white" opacity="0.95"/>
          <rect x="80" y="130" width="140" height="30" rx="15" fill="white" opacity="0.95"/>
          <rect x="150" y="100" width="12" height="150" fill="white"/>
          <rect x="80" y="150" width="140" height="12" fill="white"/>
          <circle cx="156" cy="200" r="20" fill="white"/>
          <rect x="144" y="200" width="24" height="30" rx="12" fill="white"/>
        </g>
        <text x="${width/2}" y="${height/2 + 50}" font-family="Arial, sans-serif" font-size="80" font-weight="bold" fill="white" text-anchor="middle">RiddlePay</text>
        <text x="${width/2}" y="${height/2 + 120}" font-family="Arial, sans-serif" font-size="40" fill="white" text-anchor="middle" opacity="0.9">Screenshot ${index}</text>
      </svg>
    `;
    
    const resvg = new Resvg(svgContent, {
      fitTo: {
        mode: 'width',
        value: width,
      },
      background: 'rgba(0, 82, 255, 1)',
    });
    
    const pngData = resvg.render();
    const pngBuffer = pngData.asPng();
    
    await sharp(pngBuffer)
      .resize(width, height)
      .png()
      .toFile(outputPath);
    
    console.log(`✅ Created: ${path.basename(outputPath)} (${width}x${height})`);
  } catch (error) {
    console.error(`❌ Error creating ${outputPath}:`, error.message);
    // Fallback: create a simple colored PNG
    await sharp({
      create: {
        width,
        height,
        channels: 4,
        background: { r: 0, g: 82, b: 255, alpha: 1 }
      }
    })
      .png()
      .toFile(outputPath);
    console.log(`✅ Created fallback: ${path.basename(outputPath)} (${width}x${height})`);
  }
}

async function generateAllImages() {
  console.log('🎨 Generating all required PNG images for Farcaster manifest...\n');
  
  try {
    // 1. Icon (1024x1024) - from existing SVG
    await createPNGFromSVG(path.join(publicDir, 'icon.png'), 1024, 1024);
    
    // 2. Splash (200x200 recommended)
    await createSplashImage(path.join(publicDir, 'splash.png'), 200);
    
    // 3. Hero image (1200x630)
    await createHeroImage(path.join(publicDir, 'hero.png'), 1200, 630);
    
    // 4. OG Image (1200x630) - same as hero
    await createHeroImage(path.join(publicDir, 'og-image.png'), 1200, 630);
    
    // 5. Screenshots (portrait 1284x2778 recommended)
    await createScreenshot(path.join(publicDir, 'screenshot1.png'), 1284, 2778, 1);
    await createScreenshot(path.join(publicDir, 'screenshot2.png'), 1284, 2778, 2);
    await createScreenshot(path.join(publicDir, 'screenshot3.png'), 1284, 2778, 3);
    
    console.log('\n✨ All images generated successfully!');
    console.log('\n📁 Files created in public/ directory:');
    console.log('   - icon.png (1024x1024)');
    console.log('   - splash.png (200x200)');
    console.log('   - hero.png (1200x630)');
    console.log('   - og-image.png (1200x630)');
    console.log('   - screenshot1.png (1284x2778)');
    console.log('   - screenshot2.png (1284x2778)');
    console.log('   - screenshot3.png (1284x2778)');
    
  } catch (error) {
    console.error('❌ Error generating images:', error);
    process.exit(1);
  }
}

generateAllImages();

