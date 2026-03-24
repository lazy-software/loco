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
    this.throttle = Math.max(-1, Math.min(1, val));
  }

  update(delta) {
    let force = 0;

    // Determine if the engine is powering or braking natively based on momentum direction
    if (this.velocity > 0.5 && this.throttle < 0) {
      force = this.throttle * this.maxBrakeForce; // Reverse throttle while moving forward = Brakes
    } else if (this.velocity < -0.5 && this.throttle > 0) {
      force = this.throttle * this.maxBrakeForce; // Forward throttle while reversing = Brakes
    } else {
      force = this.throttle * this.maxTractiveEffort; // Normal power application
    }

    // Base mechanical resistance (friction)
    if (this.velocity > 0) {
      force -= this.baseResistance;
      // Snap to stop if coasting at very low speeds
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
    } else {
      // Prevent creeping from a dead stop if throttle is extremely low
      if (Math.abs(force) < this.baseResistance) force = 0;
    }

    const acceleration = force / this.mass;
    this.velocity += acceleration * delta;

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
