import * as THREE from 'three';
import { TrackManager } from './TrackManager.js';
import { Train } from './Train.js';
import { UI } from './ui.js';

// Setup basic scene
const canvas = document.querySelector('#game-canvas');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

const scene = new THREE.Scene();
scene.background = new THREE.Color('#1e293b');
scene.fog = new THREE.FogExp2('#1e293b', 0.008);

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
const groundMat = new THREE.MeshStandardMaterial({ color: '#0f172a' });
const ground = new THREE.Mesh(groundGeo, groundMat);
ground.rotation.x = -Math.PI / 2;
scene.add(ground);

const gridHelper = new THREE.GridHelper(1000, 100, 0x334155, 0x334155);
scene.add(gridHelper);

// Track & Train
const trackManager = new TrackManager();
scene.add(trackManager.mesh);

const train = new Train(trackManager);
scene.add(train.mesh);

// UI
const ui = new UI(train);

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

  // Chase Camera Update
  // Position camera behind and above the train
  const offset = new THREE.Vector3(0, 15, -30); // behind the train
  offset.applyQuaternion(train.mesh.quaternion); // rotate relative to train heading
  const desiredCameraPos = train.mesh.position.clone().add(offset);
  
  // Smoothly move camera
  camera.position.lerp(desiredCameraPos, 5 * delta);
  
  // Look at a point slightly ahead of the train
  const lookOffset = new THREE.Vector3(0, 5, 20);
  lookOffset.applyQuaternion(train.mesh.quaternion);
  const lookTarget = train.mesh.position.clone().add(lookOffset);
  
  camera.lookAt(lookTarget);

  renderer.render(scene, camera);
}

animate();
