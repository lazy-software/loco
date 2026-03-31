import * as THREE from 'three';
import { TrackManager } from './TrackManager.js';
import { Train } from './Train.js';
import { UI } from './ui.js';
import { AudioManager } from './AudioManager.js';
import { StationManager } from './StationManager.js';

// Setup basic scene
const canvas = document.querySelector('#game-canvas');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, logarithmicDepthBuffer: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

const scene = new THREE.Scene();
scene.background = new THREE.Color('#38bdf8'); // sky blue

// Camera
const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 1.0, 10000);

// Lights
const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
scene.add(ambientLight);

const dirLight = new THREE.DirectionalLight(0xffffff, 1.2);
dirLight.position.set(50, 100, 50);
dirLight.castShadow = true;
scene.add(dirLight);

// Ground
const groundGeo = new THREE.PlaneGeometry(20000, 20000);
const groundMat = new THREE.MeshStandardMaterial({ color: '#4ade80' }); // vibrant low-poly grass green
const ground = new THREE.Mesh(groundGeo, groundMat);
ground.rotation.x = -Math.PI / 2;
scene.add(ground);

// Track & Train
const trackManager = new TrackManager();
scene.add(trackManager.mesh);

// Stations
const stationManager = new StationManager(scene, trackManager);
stationManager.buildStations();

// Environment Clutter Removed

const train = new Train(trackManager);
scene.add(train.mesh);

const audioManager = new AudioManager(train);

// UI
const ui = new UI(train, audioManager);

// Resize handler
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// Animation loop
const clock = new THREE.Clock();

function animate() {
  requestAnimationFrame(animate);
  
  const delta = Math.min(clock.getDelta(), 0.1); // cap delta

  train.update(delta);
  audioManager.update();

  // Cinematic Camera System
  const cameraModes = [
    { offset: new THREE.Vector3( 60, 30, -80), look: new THREE.Vector3( 0,  5, -30) }, // 1. Wide Chase Left
    { offset: new THREE.Vector3(  6, 3.5,  2), look: new THREE.Vector3( 0,  2,  0) },  // 2. Ground Front Left (Looking at train side)
    { offset: new THREE.Vector3(  0, 1.5, 20), look: new THREE.Vector3( 0,  3,   0) }, // 3. Head-On Front
    { offset: new THREE.Vector3( -6, 3.5,  2), look: new THREE.Vector3( 0,  2,  0) },  // 4. Ground Front Right
    { offset: new THREE.Vector3(-60, 30, -80), look: new THREE.Vector3( 0,  5, -30) }  // 5. Wide Chase Right
  ];

  const mode = cameraModes[ui.cameraMode || 0];

  const offset = mode.offset.clone();
  offset.applyQuaternion(train.locomotive.quaternion);
  const desiredCameraPos = train.locomotive.position.clone().add(offset);
  camera.position.lerp(desiredCameraPos, 5 * delta);
  
  const lookOffset = mode.look.clone();
  lookOffset.applyQuaternion(train.locomotive.quaternion);
  const desiredLookTarget = train.locomotive.position.clone().add(lookOffset);
  
  // Cinematic slow panning for the focal point too!
  if (typeof window.currentLookTarget === 'undefined') {
     window.currentLookTarget = train.locomotive.position.clone();
  }
  window.currentLookTarget.lerp(desiredLookTarget, 8 * delta);
  camera.lookAt(window.currentLookTarget);

  renderer.render(scene, camera);
}

animate();
