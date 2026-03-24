import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

export class EnvironmentManager {
  constructor(scene, trackManager) {
    this.scene = scene;
    this.trackManager = trackManager;
    this.modelsToLoad = [
      { path: '/tree_default.glb', count: 120, scale: [1.5, 3] },
      { path: '/tree_pineDefaultA.glb', count: 150, scale: [1.5, 3.5] },
      { path: '/tree_detailed.glb', count: 80, scale: [1.5, 3] },
      { path: '/plant_bush.glb', count: 200, scale: [0.8, 1.5] },
      { path: '/rock_largeA.glb', count: 60, scale: [1, 2.5] }
    ];
  }

  loadAndScatter() {
    const loader = new GLTFLoader();
    this.modelsToLoad.forEach(info => {
      loader.load(info.path, (gltf) => {
        let template = null;
        gltf.scene.traverse((c) => {
          if (c.isMesh && !template) template = c;
        });
        if (template) {
          this.scatterInstancedMesh(template.geometry, template.material, info.count, info.scale);
        }
      });
    });
  }

  scatterInstancedMesh(geometry, material, count, scaleRange) {
    const instancedMesh = new THREE.InstancedMesh(geometry, material, count);
    instancedMesh.castShadow = true;
    instancedMesh.receiveShadow = true;

    const dummy = new THREE.Object3D();
    let placed = 0;
    while (placed < count) {
      const x = (Math.random() - 0.5) * 400;
      const z = (Math.random() - 0.5) * 400;
      const testPoint = new THREE.Vector3(x, 0, z);
      
      let tooClose = false;
      for(let t = 0; t <= 1; t += 0.04) {
        const trackPos = this.trackManager.getPointAt(t);
        if (trackPos.distanceTo(testPoint) < 8) {
           tooClose = true;
           break;
        }
      }
      if (tooClose) continue;

      dummy.position.set(x, 0, z);
      dummy.rotation.y = Math.random() * Math.PI * 2;
      const scale = scaleRange[0] + Math.random() * (scaleRange[1] - scaleRange[0]);
      dummy.scale.set(scale, scale, scale);
      dummy.updateMatrix();
      instancedMesh.setMatrixAt(placed, dummy.matrix);
      placed++;
    }
    this.scene.add(instancedMesh);
  }
}
