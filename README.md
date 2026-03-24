# Lazy Loco

*Note: This project is currently in early development.*

Lazy Loco is a lightweight, browser-based 3D Train Simulator built entirely with Vite, Three.js, and vanilla JavaScript. It is designed to be fully playable on mobile devices as a Progressive Web App (PWA) and features a "Stylized Toy Box" low-poly aesthetic.

## Features (Current)
- **Procedural Railways:** Dynamically generated track meshes that automatically form seamlessly continuous metal rails, wooden sleepers, and gravel ballast along massive mathematical spline curves.
- **Bogie Physics Engine:** The train calculates dual-pivot bogie alignments so wheel overhang and rotation behaves realistically strictly on the tracks, even on tight corners.
- **Multi-Car Simulation:** Supports sequential `.glb` car models physically trailing the leader along the invisible track spline with accurate distance-based follow tracking.
- **Procedural Sound Engine:** Utilizes the native browser Web Audio API to procedurally synthesize 8-bit electric engine hums and track clacks directly mapped to the train's velocity and odometer, requiring no `.mp3` downloads.
- **Environment Scatter:** Procedurally instanced forests leveraging the Kenney Nature pack to build high-performance dense low-poly environments without bogging down the GPU.
- **Progressive Web App:** Fully installable to iOS and Android home-screens via `vite-plugin-pwa` for native-like offline capability.

## Development setup
1. Install dependencies: `npm install`
2. Run local dev server: `npm run dev`
3. Build for production: `npm run build`

## Assets

Built utilizing the incredible public domain 3D models from [Kenney.nl](https://www.kenney.nl/).
