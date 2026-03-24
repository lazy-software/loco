import * as THREE from 'three';

export class StationManager {
  constructor(scene, trackManager) {
    this.scene = scene;
    this.trackManager = trackManager;
    
    this.stations = new THREE.Group();
    this.scene.add(this.stations);
  }

  buildStations() {
    let rightT = -1;
    let leftT = -1;

    for (let t = 0; t <= 1.0; t += 0.005) {
      const pt = this.trackManager.getPointAt(t);
      if (Math.abs(pt.z) < 2) {
        if (pt.x > 0 && rightT === -1) rightT = t;
        if (pt.x < 0 && leftT === -1) leftT = t;
      }
    }

    if (rightT !== -1) this.createStation(rightT);
    if (leftT !== -1) this.createStation(leftT);
  }

  createStation(t) {
    const pos = this.trackManager.getPointAt(t);
    const tangent = this.trackManager.getTangentAt(t).normalize();
    const up = new THREE.Vector3(0, 1, 0);
    
    const perp = new THREE.Vector3().crossVectors(tangent, up).normalize();
    
    const centerDirection = pos.clone().normalize();
    let pushOut = perp.clone();
    if (pushOut.dot(centerDirection) < 0) {
        pushOut.negate();
    }

    const platformWidth = 5;
    const platformLength = 50;
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
    const roofMat = new THREE.MeshStandardMaterial({ color: '#f43f5e', roughness: 0.5 }); // Stylized Crimson
    const roofMesh = new THREE.Mesh(roofGeo, roofMat);
    roofMesh.position.y = 3.8;
    roofMesh.castShadow = true;
    group.add(roofMesh);

    // Load-bearing Pillars
    const pillarGeo = new THREE.CylinderGeometry(0.2, 0.2, 3.8, 8);
    const pillarMat = new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.8 });
    
    for (let z = -20; z <= 20; z += 10) {
        const pillar = new THREE.Mesh(pillarGeo, pillarMat);
        pillar.position.set(0, 1.9, z);
        pillar.castShadow = true;
        group.add(pillar);
    }

    this.stations.add(group);
  }
}
