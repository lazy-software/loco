import * as THREE from 'three';

export class TrackManager {
  constructor() {
    this.mesh = new THREE.Group();
    
    // Define some points for a simple track loop
    this.points = [
      new THREE.Vector3(0, 0, 10),
      new THREE.Vector3(20, 0, 20),
      new THREE.Vector3(40, 0, 0),
      new THREE.Vector3(20, 0, -20),
      new THREE.Vector3(0, 0, -10),
      new THREE.Vector3(-20, 0, -20),
      new THREE.Vector3(-40, 0, 0),
      new THREE.Vector3(-20, 0, 20)
    ];

    // Create a smooth 3D spline curve from the points
    this.curve = new THREE.CatmullRomCurve3(this.points, true, 'catmullrom', 0.5);
    
    // Visualize the track
    this.createTrackMesh();
  }

  createTrackMesh() {
    // Render a simple tube representing the track centerline
    const geometry = new THREE.TubeGeometry(this.curve, 200, 0.2, 8, true);
    const material = new THREE.MeshStandardMaterial({ 
      color: 0x94a3b8, // silver/slate
      roughness: 0.4,
      metalness: 0.8
    });
    const tubeMesh = new THREE.Mesh(geometry, material);
    tubeMesh.position.y = 0.2; // slightly above ground
    
    this.mesh.add(tubeMesh);
  }

  // Helper method to get a point at normalized value t (0.0 to 1.0)
  getPointAt(t) {
    return this.curve.getPointAt(t);
  }

  getTangentAt(t) {
    return this.curve.getTangentAt(t);
  }
}
