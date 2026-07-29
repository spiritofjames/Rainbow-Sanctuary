const fs = require("node:fs");
const path = require("node:path");
const sharp = require("sharp");

const scriptsDir = __dirname;
const siteDir = path.resolve(scriptsDir, "..");
const backgroundPath = path.join(siteDir, "assets/video/home-sanctuary-shore-v3-poster.jpg");
const logoPath = path.join(siteDir, "assets/brand/lotus-mark-header.png");
const outputDir = path.join(siteDir, "assets/social");
const outputPath = path.join(outputDir, "rainbow-sanctuary-home-og-v1.jpg");

const width = 1200;
const height = 630;

const overlay = Buffer.from(`
  <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="shade" x1="0" y1="0" x2="0.82" y2="1">
        <stop offset="0" stop-color="#031817" stop-opacity="0.54"/>
        <stop offset="0.48" stop-color="#071816" stop-opacity="0.24"/>
        <stop offset="1" stop-color="#120f0b" stop-opacity="0.76"/>
      </linearGradient>
      <linearGradient id="footer" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#071513" stop-opacity="0"/>
        <stop offset="1" stop-color="#07110f" stop-opacity="0.76"/>
      </linearGradient>
    </defs>
    <rect width="${width}" height="${height}" fill="url(#shade)"/>
    <rect y="300" width="${width}" height="330" fill="url(#footer)"/>
    <text x="188" y="100" fill="#fffaf1" font-family="Georgia, serif" font-size="39" font-weight="500">Rainbow Sanctuary</text>
    <text x="66" y="421" fill="#fffaf1" font-family="Georgia, serif" font-size="67" font-weight="400" letter-spacing="-2">Home is where your</text>
    <text x="66" y="493" fill="#fffaf1" font-family="Georgia, serif" font-size="67" font-weight="400" letter-spacing="-2">heart feels peace.</text>
    <line x1="66" y1="541" x2="184" y2="541" stroke="#f4c96e" stroke-width="3"/>
    <text x="211" y="548" fill="#f7efe2" font-family="Arial, sans-serif" font-size="17" font-weight="600" letter-spacing="5">HEALING · GROWTH · SERVICE</text>
  </svg>
`);

async function build() {
  fs.mkdirSync(outputDir, { recursive: true });

  const logo = await sharp(logoPath)
    .resize({ width: 112, height: 82, fit: "contain" })
    .png()
    .toBuffer();

  await sharp(backgroundPath)
    .resize(width, height, { fit: "cover", position: "centre" })
    .composite([
      { input: overlay, left: 0, top: 0 },
      { input: logo, left: 62, top: 35 }
    ])
    .jpeg({ quality: 88, chromaSubsampling: "4:4:4", progressive: true })
    .withMetadata({ density: 72 })
    .toFile(outputPath);

  const metadata = await sharp(outputPath).metadata();
  console.log(`Built ${path.relative(siteDir, outputPath)} (${metadata.width}x${metadata.height})`);
}

build().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
