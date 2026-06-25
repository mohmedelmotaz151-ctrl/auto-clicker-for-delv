import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import fs from 'fs';
import {defineConfig} from 'vite';

function copyPwaAssetsPlugin() {
  return {
    name: 'copy-pwa-assets-plugin',
    buildStart() {
      try {
        const publicDir = path.resolve(__dirname, 'public');
        if (!fs.existsSync(publicDir)) {
          fs.mkdirSync(publicDir, { recursive: true });
        }
        
        const sourceIcon = path.resolve(__dirname, 'src/assets/images/app_icon_1782389979945.jpg');
        if (fs.existsSync(sourceIcon)) {
          fs.copyFileSync(sourceIcon, path.join(publicDir, 'icon-512.jpg'));
          fs.copyFileSync(sourceIcon, path.join(publicDir, 'icon-192.jpg'));
          console.log('Successfully copied generated app icon to /public for PWA!');
        } else {
          console.warn('Source app icon not found at: ', sourceIcon);
        }
      } catch (err) {
        console.error('Failed to copy PWA assets:', err);
      }
    }
  };
}

export default defineConfig(() => {
  return {
    plugins: [
      react(), 
      tailwindcss(),
      copyPwaAssetsPlugin()
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
