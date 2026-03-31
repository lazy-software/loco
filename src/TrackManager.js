import * as THREE from 'three';

export class TrackManager {
  constructor() {
    this.mesh = new THREE.Group();
    
    const points = [
      new THREE.Vector3(0, 0, -5000),
      new THREE.Vector3(0, 0, -3000),
      new THREE.Vector3(150, 0, -1000), // Minor bend
      new THREE.Vector3(150, 0, 1000),
      new THREE.Vector3(0, 0, 3000),    // Bend back
      new THREE.Vector3(0, 0, 5000)
    ];

    this.curve = new THREE.CatmullRomCurve3(points, false); // Open curve
    
    // Visualize the track
    this.createTrackMesh();
  }

  createTrackMesh() {
    const gauge = 0.75; // Narrowed rails slightly to perfectly hug the wheels of the subway model
    
    // Custom curve class to generate parallel rails without the Three.js Extrude rotation bug
    class OffsetCurve extends THREE.Curve {
      constructor(baseCurve, offsetScalar) {
        super();
        this.baseCurve = baseCurve;
        this.offsetScalar = offsetScalar;
      }
      getPoint(t, optionalTarget = new THREE.Vector3()) {
        const point = this.baseCurve.getPoint(t);
        const tangent = this.baseCurve.getTangent(t).normalize();
        const up = new THREE.Vector3(0, 1, 0);
        // Getting the normal pointing 'right' from the track
        const normal = new THREE.Vector3().crossVectors(tangent, up).normalize();
        return optionalTarget.copy(point).add(normal.multiplyScalar(this.offsetScalar));
      }
    }

    const leftCurve = new OffsetCurve(this.curve, -gauge);
    const rightCurve = new OffsetCurve(this.curve, gauge);

    const railMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, roughness: 0.3, metalness: 0.9 });
    
    const segments = 1500; // Longer track needs more segments to prevent chunky rendering
    
    // Left Rail
    const leftGeo = new THREE.TubeGeometry(leftCurve, segments, 0.1, 8, false);
    const leftMesh = new THREE.Mesh(leftGeo, railMat);
    leftMesh.position.y = 0.2;
    this.mesh.add(leftMesh);

    // Right Rail
    const rightGeo = new THREE.TubeGeometry(rightCurve, segments, 0.1, 8, false);
    const rightMesh = new THREE.Mesh(rightGeo, railMat);
    rightMesh.position.y = 0.2;
    this.mesh.add(rightMesh);

    // Sleepers (Ties)
    const tieGeo = new THREE.BoxGeometry(gauge * 2 + 0.6, 0.2, 0.4);
    const tieMat = new THREE.MeshStandardMaterial({ color: 0x5c4033, roughness: 0.9, metalness: 0.1 });
    
    const trackLength = this.curve.getLength();
    const tieCount = Math.floor(trackLength / 1.0);
    const instancedTies = new THREE.InstancedMesh(tieGeo, tieMat, tieCount);
    
    const dummy = new THREE.Object3D();
    for (let i = 0; i < tieCount; i++) {
      const t = (i * 1.0) / trackLength;
      const pos = this.curve.getPointAt(t);
      const tangent = this.curve.getTangentAt(t).normalize();
      
      dummy.position.copy(pos);
      dummy.position.y = 0.05; // sit beautifully under the rails
      dummy.lookAt(pos.clone().add(tangent));
      
      dummy.updateMatrix();
      instancedTies.setMatrixAt(i, dummy.matrix);
    }
    this.mesh.add(instancedTies);

    // 3. Ballast Base
    const ballastGeo = new THREE.TubeGeometry(this.curve, segments, 1.8, 12, false);
    const ballastMat = new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 1.0, metalness: 0.0 });
    const ballastMesh = new THREE.Mesh(ballastGeo, ballastMat);
    ballastMesh.scale.y = 0.05; 
    ballastMesh.position.y = 0.02; // Lift slightly to prevent ground z-fighting
    this.mesh.add(ballastMesh);
  }

  // Helper method to get a point at normalized value t (0.0 to 1.0)
  getPointAt(t) {
    return this.curve.getPointAt(t);
  }

  getTangentAt(t) {
    return this.curve.getTangentAt(t);
  }
}
