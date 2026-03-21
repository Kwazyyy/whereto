/* eslint-disable @typescript-eslint/no-require-imports */
const sharp = require('sharp');
const path = require('path');

const input = process.argv[2];
if (!input) {
  console.error('Usage: node scripts/resize-icon.js <path-to-icon.png>');
  process.exit(1);
}

const outputDir = path.join(__dirname, '..', 'public');

const sizes = [
  { size: 1024, name: 'icon-1024.png' },
  { size: 512, name: 'icon-512.png' },
  { size: 192, name: 'icon-192.png' },
  { size: 180, name: 'apple-touch-icon.png' },
  { size: 60, name: 'icon-60.png' },
  { size: 32, name: 'favicon-32.png' },
  { size: 16, name: 'favicon-16.png' },
];

async function resize() {
  for (const { size, name } of sizes) {
    await sharp(input)
      .resize(size, size, { fit: 'cover' })
      .png()
      .toFile(path.join(outputDir, name));
    console.log(`Created ${name} (${size}x${size})`);
  }
  console.log('All icons generated!');
}

resize().catch(console.error);
