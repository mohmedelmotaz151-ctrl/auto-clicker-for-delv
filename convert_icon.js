import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { Jimp } from 'jimp';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function convertIcon() {
  try {
    const imagesDir = path.resolve(__dirname, 'src/assets/images');
    const publicDir = path.resolve(__dirname, 'public');
    
    if (!fs.existsSync(publicDir)) {
      fs.mkdirSync(publicDir, { recursive: true });
    }

    // Find the latest generated JPG app_icon
    const files = fs.readdirSync(imagesDir);
    const jpgIconFile = files.find(f => f.startsWith('app_icon_') && f.endsWith('.jpg'));
    
    if (!jpgIconFile) {
      console.error('No app_icon JPG file found in src/assets/images');
      process.exit(1);
    }
    
    const sourcePath = path.join(imagesDir, jpgIconFile);
    console.log(`Found source app icon at: ${sourcePath}`);
    
    console.log('Loading image via Jimp...');
    const image = await Jimp.read(sourcePath);
    
    // Resize and save as PNG 192x192
    console.log('Resizing to 192x192...');
    const image192 = image.clone().resize({ w: 192, h: 192 });
    const dest192 = path.join(publicDir, 'icon-192.png');
    await image192.write(dest192);
    console.log(`Saved 192x192 PNG to: ${dest192}`);
    
    // Resize and save as PNG 512x512
    console.log('Resizing to 512x512...');
    const image512 = image.clone().resize({ w: 512, h: 512 });
    const dest512 = path.join(publicDir, 'icon-512.png');
    await image512.write(dest512);
    console.log(`Saved 512x512 PNG to: ${dest512}`);

    // Also write JPG copies just in case
    await image192.clone().write(path.join(publicDir, 'icon-192.jpg'));
    await image512.clone().write(path.join(publicDir, 'icon-512.jpg'));
    console.log('Saved legacy JPG copies in public folder.');

    console.log('Icon conversion completed successfully!');
  } catch (error) {
    console.error('Error converting icon:', error);
    process.exit(1);
  }
}

convertIcon();
