import sharp from "sharp";

const size = 180;
const logoWidth = 150;
const logoLeft = Math.round((size - logoWidth) / 2);
const logoTop = 57;

const logo = await sharp("public/brand/cma-monogram-transparent.png")
  .resize({ width: logoWidth, fit: "inside" })
  .png()
  .toBuffer();

const icon = sharp({
  create: {
    width: size,
    height: size,
    channels: 4,
    background: "#F4F7FA",
  },
}).composite([
  { input: logo, left: logoLeft, top: logoTop },
]);

const output = await icon.png({ compressionLevel: 9 }).toBuffer();

await Promise.all([
  sharp(output).toFile("public/brand/cma-app-icon-apple-v2-180.png"),
  sharp(output).toFile("app/apple-icon.png"),
]);
