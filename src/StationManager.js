import * as THREE from 'three';

export class StationManager {
  constructor(scene, trackManager) {
    this.scene = scene;
    this.trackManager = trackManager;
    
    this.stations = new THREE.Group();
    this.scene.add(this.stations);
  }

  buildStations() {
    // Spawn a station roughly every 0.08 normalized track length
    for (let t = 0.08; t <= 0.92; t += 0.06) {
      // Alternate sides left and right
      const side = Math.random() > 0.5 ? 1 : -1;
      this.createStation(t, side);
    }
  }

  createStation(t, sideMultiplier) {
    const pos = this.trackManager.getPointAt(t);
    const tangent = this.trackManager.getTangentAt(t).normalize();
    const up = new THREE.Vector3(0, 1, 0);
    
    const perp = new THREE.Vector3().crossVectors(tangent, up).normalize();
    
    const pushOut = perp.clone().multiplyScalar(sideMultiplier);

    const platformWidth = 5;
    const platformLength = 90;
    const offsetDistance = 1.2 + (platformWidth / 2);
    const rawCenter = pos.clone().add(pushOut.multiplyScalar(offsetDistance));
    
    const group = new THREE.Group();
    group.position.copy(rawCenter);
    group.lookAt(rawCenter.clone().add(tangent));

    // Base Slab
    const baseGeo = new THREE.BoxGeometry(platformWidth, 0.8, platformLength);
    const baseMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, roughness: 0.9 });
    const baseMesh = new THREE.Mesh(baseGeo, baseMat);
    baseMesh.position.y = 0.4; 
    baseMesh.castShadow = true;
    baseMesh.receiveShadow = true;
    group.add(baseMesh);

    // Yellow Safety Line
    const lineGeo = new THREE.BoxGeometry(0.3, 0.82, platformLength);
    const lineMat = new THREE.MeshStandardMaterial({ color: 0xfacc15, roughness: 0.9, metalness: 0.1 });
    const lineMesh = new THREE.Mesh(lineGeo, lineMat);
    lineMesh.position.y = 0.4;
    
    const trackLocalPos = group.worldToLocal(pos.clone());
    const lineX = trackLocalPos.x > 0 ? (platformWidth/2 - 0.4) : -(platformWidth/2 - 0.4);
    lineMesh.position.x = lineX;
    group.add(lineMesh);

    // Roof
    const roofGeo = new THREE.BoxGeometry(platformWidth - 1, 0.4, platformLength - 4);
    const roofMat = new THREE.MeshStandardMaterial({ color: 0x166534, roughness: 0.8 }); // Industrial Dark Green
    const roofMesh = new THREE.Mesh(roofGeo, roofMat);
    roofMesh.position.y = 3.8;
    roofMesh.castShadow = true;
    group.add(roofMesh);

    // Load-bearing Pillars (Square metal posts for LIRR)
    const pillarGeo = new THREE.BoxGeometry(0.3, 3.8, 0.3);
    const pillarMat = new THREE.MeshStandardMaterial({ color: 0x166534, roughness: 0.8, metalness: 0.3 }); // Matches roof
    
    // Spread pillars across the new 90m length
    for (let z = -40; z <= 40; z += 10) {
        const pillar = new THREE.Mesh(pillarGeo, pillarMat);
        pillar.position.set(0, 1.9, z);
        pillar.castShadow = true;
        group.add(pillar);
    }

    // Classic LIRR Blue Station Signs
    const signGeo = new THREE.BoxGeometry(0.05, 0.6, 2.5);
    const signMat = new THREE.MeshStandardMaterial({ color: 0x003399, roughness: 0.3 }); // LIRR Blue 
    
    // Spread signs evenly
    for (let z = -30; z <= 30; z += 30) {
        const sign = new THREE.Mesh(signGeo, signMat);
        // Hanging from the roof, centered on columns
        sign.position.set(0, 3.2, z);
        sign.castShadow = true;
        group.add(sign);
    }

    this.stations.add(group);
  }
}
