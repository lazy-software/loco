import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      manifest: {
        name: 'Train Simulator PWA',
        short_name: 'TrainSim',
        description: 'A code-driven WebGL Train Simulator',
        theme_color: '#000000',
        background_color: '#0f172a',
        display: 'standalone',
      }
    })
  ]
});
