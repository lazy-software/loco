import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

export class Train {
  constructor(trackManager) {
    this.trackManager = trackManager;
    this.mesh = new THREE.Group();

    const loader = new GLTFLoader();
    loader.load('/train-electric-subway-a.glb', (gltf) => {
      const model = gltf.scene;
      
      model.traverse((child) => {
        if (child.isMesh) {
          child.castShadow = true;
          child.receiveShadow = true;
        }
      });
      
      // Scale and lift slightly onto the rails
      model.scale.set(1.9, 1.9, 1.9);
      model.position.y = 0.2; 
      
      // Remove the previous 90-degree twist; Kenney's subway car aligns cleanly to 0 or 180 degrees.
      // If it's driving backwards, we would just change this to Math.PI
      model.rotation.y = 0;

      this.mesh.add(model);
    });

    // Physics state
    this.t = 0; // position along the curve (0 to 1)
    this.velocity = 0; // units per second
    this.mass = 50000; // 50 tons
    this.throttle = 0; // -1 (full brake/reverse) to 1 (full throttle)
    
    // Engine characteristics
    this.maxTractiveEffort = 300000; // Newtons
    this.baseResistance = 5000; // Friction
    this.maxBrakeForce = 500000;

    // Track length (approximate)
    this.trackLength = this.trackManager.curve.getLength();
  }

  setThrottle(val) {
    this.throttle = Math.max(-1, Math.min(1, val));
  }

  update(delta) {
    // Calculate simple 1D physics
    let force = 0;

    if (this.throttle > 0) {
      force = this.throttle * this.maxTractiveEffort;
    } else if (this.throttle < 0) {
      // Dynamic braking
      force = this.throttle * this.maxBrakeForce; 
      // If moving very slowly and braking, stop completely
      if (Math.abs(this.velocity) < 0.1) {
        this.velocity = 0;
        force = 0;
      }
    }

    // Apply basic rolling resistance (always opposes velocity)
    if (this.velocity > 0) {
      force -= this.baseResistance;
      if (this.throttle === 0 && force < 0 && this.velocity < 0.5) {
         this.velocity = 0;
         force = 0;
      }
    } else if (this.velocity < 0) {
      force += this.baseResistance;
      if (this.throttle === 0 && force > 0 && this.velocity > -0.5) {
         this.velocity = 0;
         force = 0;
      }
    }

    // F = ma -> a = F/m
    const acceleration = force / this.mass;
    this.velocity += acceleration * delta;

    // Convert velocity (units/sec) to t change (t/sec)
    const tDelta = (this.velocity * delta) / this.trackLength;
    this.t += tDelta;

    // Loop around the track
    if (this.t > 1) this.t -= 1;
    if (this.t < 0) this.t += 1;
    // Bogie Math: Calculate front and rear wheel positions to accurately model curve overhang
    // If the back wheels fall to the inside of the curve, it means this 'dt' value is too large 
    // (the math chord is cutting too deep into the corner). We decreased it to 2.8.
    // Feel free to tweak 2.8 until it permanently pins the wheels exactly over the rails!
    const dt = 2.8 / this.trackLength; 
    let frontT = this.t + dt;
    let rearT = this.t - dt;

    if (frontT > 1) frontT -= 1;
    if (rearT < 0) rearT += 1;

    const frontPos = this.trackManager.getPointAt(frontT);
    const rearPos = this.trackManager.getPointAt(rearT);

    // The physical center of the train car is on the chord between the bogies
    const centerPos = new THREE.Vector3().addVectors(frontPos, rearPos).multiplyScalar(0.5);
    this.mesh.position.copy(centerPos);

    // Look directly from rear bogie to front bogie
    this.mesh.lookAt(frontPos);
  }
}
