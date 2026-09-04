import sharp from "sharp";

await sharp("src/assets/logo.png").resize({ width: 512, height: 512, fit: "contain", background: { r: 11, g: 11, b: 11, alpha: 1 } }).png().toFile("public/logo.png");
await sharp("src/assets/logo.png").resize({ width: 180, height: 180, fit: "contain", background: { r: 11, g: 11, b: 11, alpha: 1 } }).png().toFile("public/apple-touch-icon.png");
console.log("public/logo.png y public/apple-touch-icon.png generados");
