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

// Generate iOS App Icon 1024x1024 if ios xcassets exists
const iosIconDir = path.resolve('ios/App/App/Assets.xcassets/AppIcon.appiconset');
if (fs.existsSync(iosIconDir)) {
  const resvg1024 = new Resvg(svg, {
    fitTo: { mode: 'width', value: 1024 }
  });
  const png1024 = resvg1024.render().asPng();
  fs.writeFileSync(path.join(iosIconDir, 'AppIcon-512@2x.png'), png1024);
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
