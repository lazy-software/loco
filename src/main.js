import * as THREE from 'three';
import { TrackManager } from './TrackManager.js';
import { Train } from './Train.js';
import { UI } from './ui.js';
import { EnvironmentManager } from './EnvironmentManager.js';
import { AudioManager } from './AudioManager.js';

// Setup basic scene
const canvas = document.querySelector('#game-canvas');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

const scene = new THREE.Scene();
scene.background = new THREE.Color('#38bdf8'); // sky blue
scene.fog = new THREE.FogExp2('#38bdf8', 0.006);

// Camera
const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 2000);

// Lights
const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
scene.add(ambientLight);

const dirLight = new THREE.DirectionalLight(0xffffff, 1.2);
dirLight.position.set(50, 100, 50);
dirLight.castShadow = true;
scene.add(dirLight);

// Ground
const groundGeo = new THREE.PlaneGeometry(2000, 2000);
const groundMat = new THREE.MeshStandardMaterial({ color: '#4ade80' }); // vibrant low-poly grass green
const ground = new THREE.Mesh(groundGeo, groundMat);
ground.rotation.x = -Math.PI / 2;
scene.add(ground);

// Track & Train
const trackManager = new TrackManager();
scene.add(trackManager.mesh);

// Environment Clutter
const envManager = new EnvironmentManager(scene, trackManager);
envManager.loadAndScatter();

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
  ui.update();
  audioManager.update();

  // Chase Camera Update
  // Use the Locomotive (the first car) as the camera target
  const offset = new THREE.Vector3(0, 15, -30);
  offset.applyQuaternion(train.locomotive.quaternion);
  const desiredCameraPos = train.locomotive.position.clone().add(offset);
  
  camera.position.lerp(desiredCameraPos, 5 * delta);
  
  const lookOffset = new THREE.Vector3(0, 5, 20);
  lookOffset.applyQuaternion(train.locomotive.quaternion);
  const lookTarget = train.locomotive.position.clone().add(lookOffset);
  
  camera.lookAt(lookTarget);

  renderer.render(scene, camera);
}

animate();
