import fs from 'node:fs';
import path from 'node:path';
import { PNG } from 'pngjs';

const targetDirs = [
  'ios/App/App/Assets.xcassets',
  'ios/App/App/Assets.xcassets/AppIcon.appiconset',
  'ios/App/App/public',
  'public'
];

// Dark background color matching app: #060914
const bgR = 6;
const bgG = 9;
const bgB = 20;

let processedCount = 0;

function processDirectory(dirPath) {
  if (!fs.existsSync(dirPath)) return;
  const entries = fs.readdirSync(dirPath, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);
    if (entry.isDirectory()) {
      processDirectory(fullPath);
    } else if (entry.isFile() && entry.name.toLowerCase().endsWith('.png') && (entry.name.toLowerCase().includes('icon') || entry.name.toLowerCase().includes('appicon'))) {
      stripAlpha(fullPath);
    }
  }
}

function stripAlpha(filePath) {
  try {
    const data = fs.readFileSync(filePath);
    // Check byte 25 for PNG color type
    if (data.length > 26 && data.subarray(0, 8).toString('hex') === '89504e470d0a1a0a') {
      const currentColorType = data[25];
      // Color type 2 is RGB without alpha
      if (currentColorType === 2) {
        console.log(`[Icon-Alpha-Stripper] Already RGB (Color Type 2): ${filePath}`);
        return;
      }
    }

    const png = PNG.sync.read(data);
    const rgbPng = new PNG({
      width: png.width,
      height: png.height,
      colorType: 2,
      inputColorType: 2,
      inputHasAlpha: false
    });

    for (let y = 0; y < png.height; y++) {
      for (let x = 0; x < png.width; x++) {
        const idx = (png.width * y + x) << 2;
        const a = (png.data[idx + 3] ?? 255) / 255;
        const r = Math.round(png.data[idx] * a + bgR * (1 - a));
        const g = Math.round(png.data[idx + 1] * a + bgG * (1 - a));
        const b = Math.round(png.data[idx + 2] * a + bgB * (1 - a));

        rgbPng.data[idx] = r;
        rgbPng.data[idx + 1] = g;
        rgbPng.data[idx + 2] = b;
        rgbPng.data[idx + 3] = 255;
      }
    }

    const outBuf = PNG.sync.write(rgbPng, { colorType: 2, inputHasAlpha: false });
    fs.writeFileSync(filePath, outBuf);
    processedCount++;
    console.log(`[Icon-Alpha-Stripper] Successfully converted to RGB (Color Type 2, no alpha): ${filePath}`);
  } catch (err) {
    console.warn(`[Icon-Alpha-Stripper] Warning processing ${filePath}:`, err.message);
  }
}

console.log('=== Stripping Alpha Channel from App Store Icons ===');
for (const dir of targetDirs) {
  processDirectory(dir);
}
console.log(`=== Completed: ${processedCount} icon(s) converted to true RGB without alpha ===`);
