import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

export class Train {
  constructor(trackManager) {
    this.trackManager = trackManager;

    // Container for the whole train collection
    this.mesh = new THREE.Group();

    this.cars = [];
    const scale = 1.9;
    const carModels = [
      '/train-electric-bullet-a.glb',
      '/train-electric-bullet-b.glb',
      '/train-electric-bullet-c.glb'
    ];

    // Distance physically spacing the cars out (adjust if they clip into each other)
    // Reduced further to 4.5 to aggressively couple the Bullet Train models.
    const carSpacing = 5;

    const loader = new GLTFLoader();

    carModels.forEach((path, index) => {
      const carGroup = new THREE.Group();
      this.mesh.add(carGroup);

      loader.load(path, (gltf) => {
        const model = gltf.scene;
        model.traverse((child) => {
          if (child.isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;
          }
        });
        model.scale.set(scale, scale, scale);
        model.position.y = 0.2;
        model.rotation.y = 0;
        carGroup.add(model);
      });

      this.cars.push({
        group: carGroup,
        // The distance offset calculated into spline 't' parameter
        tOffset: (index * carSpacing) / this.trackManager.curve.getLength()
      });
    });

    // Physics state
    this.trackLength = this.trackManager.curve.getLength();
    this.t = 0; // position of the locomotive
    this.velocity = 0;
    this.odometer = 0;

    // Engine characteristics (Heavier mass to account for 3 cars now)
    this.mass = 150000; // 150 tons
    this.throttle = 0;
    this.maxTractiveEffort = 250000; // Halved top speed limit
    this.baseResistance = 10000;
    this.maxBrakeForce = 1200000; // Upgraded the brake pads!
  }

  // Helper for the Camera in main.js to lock onto the front car
  get locomotive() {
    return this.cars.length > 0 ? this.cars[0].group : this.mesh;
  }

  setThrottle(val) {
    // Value is -1.0 to 1.0 (Target Speed Selector)
    this.targetVelocity = Math.max(-1, Math.min(1, val)) * 120; // 120 m/s (~268 mph) limits
  }

  update(delta) {
    this.targetVelocity = this.targetVelocity || 0;
    const error = this.targetVelocity - this.velocity;
    
    let force = 0;
    
    if (error > 0.2) {
      // Need to move right/forward on number line
      if (this.velocity < 0) {
        // Moving backward, want to slow down or go forward -> Massive Brakes
        force = this.maxBrakeForce;
      } else {
        // Moving forward, want to go faster -> Tractive Effort
        force = this.maxTractiveEffort * Math.min(1.0, error / 10);
      }
    } else if (error < -0.2) {
      // Need to move left/backward on number line
      if (this.velocity > 0) {
        // Moving forward, want to slow down or reverse -> Massive Brakes
        force = -this.maxBrakeForce;
      } else {
        // Moving backward, want to go faster backward -> Tractive Effort in reverse
        force = -this.maxTractiveEffort * Math.min(1.0, Math.abs(error) / 10);
      }
    } else {
      // Reached target exactly
      this.velocity = this.targetVelocity;
      force = 0;
    }

    // Mechanical friction
    if (this.velocity > 0.1) force -= this.baseResistance;
    else if (this.velocity < -0.1) force += this.baseResistance;

    const acceleration = force / this.mass;
    this.velocity += acceleration * delta;

    // Snap coasting perfectly to 0
    if (this.targetVelocity === 0 && Math.abs(this.velocity) < 0.5) {
      this.velocity = 0;
    }

    // Track full life travel distance (independent of splines/loops) for accurate audio clacks
    this.odometer += Math.abs(this.velocity) * delta;

    const tDelta = (this.velocity * delta) / this.trackLength;
    this.t += tDelta;

    if (this.t > 1) this.t -= 1;
    if (this.t < 0) this.t += 1;

    // The dt for bogie math determining wheel overhang
    const dt = 2.8 / this.trackLength;

    // Update position universally for EVERY car in the train array
    this.cars.forEach((car) => {
      let carT = this.t - car.tOffset;

      while (carT > 1) carT -= 1;
      while (carT < 0) carT += 1;

      let frontT = carT + dt;
      let rearT = carT - dt;

      if (frontT > 1) frontT -= 1;
      if (rearT < 0) rearT += 1;

      const frontPos = this.trackManager.getPointAt(frontT);
      const rearPos = this.trackManager.getPointAt(rearT);

      const centerPos = new THREE.Vector3().addVectors(frontPos, rearPos).multiplyScalar(0.5);
      car.group.position.copy(centerPos);
      car.group.lookAt(frontPos);
    });
  }
}
