import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  base: '/', // Custom domain: https://loco.lazy.software
  plugins: [
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      manifest: {
        name: 'Lazy Loco',
        short_name: 'LazyLoco',
        description: 'A code-driven WebGL Train Simulator PWA',
        theme_color: '#38bdf8',
        background_color: '#4ade80',
        display: 'standalone',
      }
    })
  ]
});
