/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

async function renderSplash(width, scale) {
  const height = Math.floor(width * 0.35);
  // Create an SVG with embedded styles
  const svg = `
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@800&amp;display=swap');
          text {
            font-family: 'Plus Jakarta Sans', system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            font-weight: 800;
            font-size: ${Math.floor(width * 0.32)}px;
            fill: #E85D2A;
            letter-spacing: -2px;
          }
        </style>
      </defs>
      <text x="50%" y="54%" dominant-baseline="middle" text-anchor="middle">Savrd</text>
    </svg>
  `;

  const outPath = path.join(__dirname, '..', `splash@${scale}x.png`);
  
  await sharp(Buffer.from(svg))
    .png()
    .toFile(outPath);
    
  console.log(`Generated splash@${scale}x.png`);
}

async function main() {
  await renderSplash(200, 1);
  await renderSplash(400, 2);
  await renderSplash(600, 3);
  console.log('Done SVG generation!');
}

main().catch(console.error);
