import * as THREE from 'three';

export class Train {
  constructor(trackManager) {
    this.trackManager = trackManager;

    // Container for the whole train collection
    this.mesh = new THREE.Group();

    this.cars = [];
    const numCars = 6;
    const carSpacing = 12.5;

    for (let i = 0; i < numCars; i++) {
      const isFrontCab = i === 0;
      const isRearCab = i === numCars - 1;
      
      const carMeshGroup = this.createLIRRM9(isFrontCab || isRearCab);
      
      if (isRearCab) {
        carMeshGroup.rotation.y = Math.PI;
      }
      
      const containerGroup = new THREE.Group();
      containerGroup.add(carMeshGroup);
      
      this.mesh.add(containerGroup);

      this.cars.push({
        group: containerGroup,
        tOffset: (i * carSpacing) / this.trackManager.curve.getLength()
      });
    }

    // Physics state
    this.trackLength = this.trackManager.curve.getLength();
    this.t = 0; // position of the locomotive
    this.velocity = 0;
    this.odometer = 0;

    // Engine characteristics (Heavier mass to account for 6 cars now)
    this.mass = 300000; // 300 tons
    this.throttle = 0;
    this.maxTractiveEffort = 250000; // Halved top speed limit
    this.baseResistance = 10000;
    this.maxBrakeForce = 1200000; // Upgraded the brake pads!
  }

  createLIRRM9(isCab) {
    const carGroup = new THREE.Group();
    
    // Core body
    const bodyGeometry = new THREE.BoxGeometry(2.0, 2.8, 12.0);
    const bodyMaterial = new THREE.MeshStandardMaterial({
      color: 0xcccccc,
      metalness: 0.6,
      roughness: 0.4
    });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.position.y = 1.8;
    carGroup.add(body);

    // Roof AC unit
    const acGeometry = new THREE.BoxGeometry(1.4, 0.4, 8.0);
    const acMaterial = new THREE.MeshStandardMaterial({ color: 0x888888 });
    const ac = new THREE.Mesh(acGeometry, acMaterial);
    ac.position.set(0, 3.4, 0);
    carGroup.add(ac);

    // Yellow/Blue Stripes
    const stripeGeometry = new THREE.BoxGeometry(2.02, 0.3, 12.02); 
    const stripeMaterial = new THREE.MeshStandardMaterial({ color: 0xffcc00 }); // Yellow
    const stripe = new THREE.Mesh(stripeGeometry, stripeMaterial);
    stripe.position.y = 1.2;
    carGroup.add(stripe);

    const blueStripeGeometry = new THREE.BoxGeometry(2.02, 0.2, 12.02);
    const blueStripeMaterial = new THREE.MeshStandardMaterial({ color: 0x003399 }); // Blue
    const blueStripe = new THREE.Mesh(blueStripeGeometry, blueStripeMaterial);
    blueStripe.position.y = 0.9;
    carGroup.add(blueStripe);

    // Windows
    const windowGeometry = new THREE.BoxGeometry(2.04, 0.8, 10.0);
    const windowMaterial = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.1, metalness: 0.9 });
    const windows = new THREE.Mesh(windowGeometry, windowMaterial);
    windows.position.y = 2.0;
    carGroup.add(windows);

    if (isCab) {
      // Cab front face (Yellow warning face)
      const cabFaceGeo = new THREE.BoxGeometry(2.01, 2.81, 0.1);
      const cabFaceMat = new THREE.MeshStandardMaterial({ color: 0xffcc00 });
      const cabFace = new THREE.Mesh(cabFaceGeo, cabFaceMat);
      cabFace.position.set(0, 1.8, 6.0);
      carGroup.add(cabFace);

      // Cab window (dark windshield)
      const windShieldGeo = new THREE.BoxGeometry(1.8, 1.0, 0.2);
      const windShieldMat = new THREE.MeshStandardMaterial({ color: 0x111111 });
      const windShield = new THREE.Mesh(windShieldGeo, windShieldMat);
      windShield.position.set(0, 2.2, 6.0);
      carGroup.add(windShield);

      // Headlights
      const lightGeo = new THREE.BoxGeometry(0.4, 0.2, 0.3);
      const lightMat = new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xffffff, emissiveIntensity: 2.0 });
      
      const light1 = new THREE.Mesh(lightGeo, lightMat);
      light1.position.set(-0.7, 1.4, 6.0);
      carGroup.add(light1);

      const light2 = new THREE.Mesh(lightGeo, lightMat);
      light2.position.set(0.7, 1.4, 6.0);
      carGroup.add(light2);

    }

    // Wheels/Bogies
    const bogieGeo = new THREE.BoxGeometry(1.6, 0.8, 2.0);
    const bogieMat = new THREE.MeshStandardMaterial({ color: 0x222222 });
    
    const bogieFront = new THREE.Mesh(bogieGeo, bogieMat);
    bogieFront.position.set(0, 0.4, 4.0);
    carGroup.add(bogieFront);

    const bogieRear = new THREE.Mesh(bogieGeo, bogieMat);
    bogieRear.position.set(0, 0.4, -4.0);
    carGroup.add(bogieRear);

    carGroup.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });

    return carGroup;
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

    // The dt for bogie math determining wheel overhang (half distance between bogies)
    const dt = 4.0 / this.trackLength;

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
