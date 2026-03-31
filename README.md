# Lazy Loco Simulator

*Note: This project is currently in early development.*

Lazy Loco is a lightweight, browser-based 3D Train Simulator built entirely with Vite, Three.js, and vanilla JavaScript. It is designed to be fully playable on mobile devices as a Progressive Web App (PWA) and features a stunning, 100% procedural graphical aesthetic.

## Features (Current)
- **100% Procedural Geometry:** No external `.glb` models, heavy textures, or `.mp3` files are downloaded. The entire LIRR M9 Train consist, sliding doors, the 10-kilometer rail track, and the environment are generated purely with Three.js rendering math on the fly.
- **Functional Multi-Car Simulation:** Supports sequential 6-car trains trailing precisely along the mathematical spline curve. Features mechanical sliding pocket doors that correctly mirror internal hollow-void geometry for visual realism.
- **Dynamic Synthesized Audio:** Utilizes the native browser Web Audio API to procedurally synthesize 8-bit electric engine hums, sliding door "Ding-Dong" chimes, and track clacks perfectly mapped to the train's physical velocity and odometer.
- **Text-to-Speech Conductor:** Hooks into the HTML5 `SpeechSynthesis` Web API to dynamically evaluate your geospatial position against the 3D platform bounds and naturally announce the current station, next stop, and terminating line in a realistic human voice.
- **Procedural LIRR Stations:** Generates immersive commuter rail stations using off-screen 2D Canvas contexts to dynamically write authentic Long Island Railroad names (Jamaica, Ronkonkoma, Montauk, etc.) in perfectly crisp typography, mapped seamlessly onto 3D steel signposts.
- **Progressive Web App:** Fully installable to iOS and Android home screens with natively defined PWA `manifest.json` configurations, SVG app icons, and glassmorphic dynamic UI.

## Development setup
1. Install dependencies: `npm install`
2. Run local dev server: `npm run dev`
3. Build for production: `npm run build`
