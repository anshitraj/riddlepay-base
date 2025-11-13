# RiddlePay Logo Conversion

The logo SVG has been created at `riddlepay-logo.svg`. 

To convert it to PNG with transparent background:

1. **Online Tools (Recommended):**
   - Visit https://svgtopng.com
   - Upload `riddlepay-logo.svg`
   - Set size to 256x256 or 512x512
   - Enable transparent background
   - Download as `riddlepay-logo.png`
   - Place it in `frontend/public/` folder

2. **Alternative Tools:**
   - https://cloudconvert.com/svg-to-png
   - https://convertio.co/svg-png/
   - https://www.freeconvert.com/svg-to-png

3. **Using ImageMagick (if installed):**
   ```bash
   convert riddlepay-logo.svg -background none -resize 256x256 riddlepay-logo.png
   ```

The header component will automatically use the PNG if available, falling back to SVG if PNG is not found.

