import fs from 'fs';
import path from 'path';
import { Resvg } from '@resvg/resvg-js';

const svgPath = path.resolve('public/icon.svg');
const svg = fs.readFileSync(svgPath, 'utf8');

const targets = [
  { name: 'apple-touch-icon.png', size: 180 },
  { name: 'apple-touch-icon-precomposed.png', size: 180 },
  { name: 'pwa-192x192.png', size: 192 },
  { name: 'pwa-512x512.png', size: 512 },
  { name: 'pwa-maskable-512x512.png', size: 512 },
  { name: 'favicon-32x32.png', size: 32 },
  { name: 'favicon-16x16.png', size: 16 }
];

for (const target of targets) {
  const resvg = new Resvg(svg, {
    fitTo: {
      mode: 'width',
      value: target.size
    }
  });
  const pngData = resvg.render();
  const pngBuffer = pngData.asPng();
  const outPath = path.resolve('public', target.name);
  fs.writeFileSync(outPath, pngBuffer);
  console.log(`Generated ${target.name} (${target.size}x${target.size}) - ${pngBuffer.length} bytes`);
}

// Generate iOS App Icon 1024x1024 (True 24-bit RGB, no alpha channel) if ios xcassets exists
const iosIconDir = path.resolve('ios/App/App/Assets.xcassets/AppIcon.appiconset');
if (fs.existsSync(iosIconDir)) {
  const zlib = await import('zlib');
  const { PNG } = await import('pngjs');

  const iosSvg = svg.replace(
    '<rect width="512" height="512" rx="118" fill="url(#bgGrad)" />',
    '<rect width="512" height="512" fill="#0b1736" /><rect width="512" height="512" rx="118" fill="url(#bgGrad)" />'
  );

  const resvg1024 = new Resvg(iosSvg, { fitTo: { mode: 'width', value: 1024 } });
  const rendered = resvg1024.render().asPng();
  const parsed = PNG.sync.read(rendered);

  const width = 1024;
  const height = 1024;
  const rawRgb = Buffer.alloc(height * (1 + width * 3));

  for (let y = 0; y < height; y++) {
    const rowStart = y * (1 + width * 3);
    rawRgb[rowStart] = 0;
    for (let x = 0; x < width; x++) {
      const srcIdx = (y * width + x) * 4;
      const dstIdx = rowStart + 1 + x * 3;
      rawRgb[dstIdx]     = parsed.data[srcIdx];
      rawRgb[dstIdx + 1] = parsed.data[srcIdx + 1];
      rawRgb[dstIdx + 2] = parsed.data[srcIdx + 2];
    }
  }

  const compressed = zlib.deflateSync(rawRgb);
  const crcTable = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
    crcTable[n] = c >>> 0;
  }

  function makeChunk(type, data) {
    const len = Buffer.alloc(4);
    len.writeUInt32BE(data.length, 0);
    const typeBuf = Buffer.from(type, 'ascii');
    const typeAndData = Buffer.concat([typeBuf, data]);
    let crc = 0xFFFFFFFF;
    for (let i = 0; i < typeAndData.length; i++) {
      crc = (crc >>> 8) ^ crcTable[(crc ^ typeAndData[i]) & 0xFF];
    }
    crc = (crc ^ 0xFFFFFFFF) >>> 0;
    const crcBuf = Buffer.alloc(4);
    crcBuf.writeUInt32BE(crc, 0);
    return Buffer.concat([len, typeAndData, crcBuf]);
  }

  const sig = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData[8] = 8;
  ihdrData[9] = 2; // RGB Color Type 2
  ihdrData[10] = 0;
  ihdrData[11] = 0;
  ihdrData[12] = 0;

  const pngBuffer = Buffer.concat([
    sig,
    makeChunk('IHDR', ihdrData),
    makeChunk('IDAT', compressed),
    makeChunk('IEND', Buffer.alloc(0))
  ]);

  fs.writeFileSync(path.join(iosIconDir, 'AppIcon-512@2x.png'), pngBuffer);
  console.log(`Generated iOS AppIcon (1024x1024 True RGB, ColorType: 2) - ${pngBuffer.length} bytes`);
}

// Generate Android Launcher Icons if android exists
const androidResDir = path.resolve('android/app/src/main/res');
if (fs.existsSync(androidResDir)) {
  const androidSizes = [
    { dir: 'mipmap-mdpi', size: 48 },
    { dir: 'mipmap-hdpi', size: 72 },
    { dir: 'mipmap-xhdpi', size: 96 },
    { dir: 'mipmap-xxhdpi', size: 144 },
    { dir: 'mipmap-xxxhdpi', size: 192 }
  ];
  for (const item of androidSizes) {
    const targetFolder = path.join(androidResDir, item.dir);
    if (fs.existsSync(targetFolder)) {
      const r = new Resvg(svg, { fitTo: { mode: 'width', value: item.size } });
      const buf = r.render().asPng();
      fs.writeFileSync(path.join(targetFolder, 'ic_launcher.png'), buf);
      fs.writeFileSync(path.join(targetFolder, 'ic_launcher_round.png'), buf);
      fs.writeFileSync(path.join(targetFolder, 'ic_launcher_foreground.png'), buf);
      console.log(`Generated Android ${item.dir} (${item.size}x${item.size})`);
    }
  }
}

console.log('All icons generated successfully!');
