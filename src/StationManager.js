import * as THREE from 'three';

export class StationManager {
  constructor(scene, trackManager) {
    this.scene = scene;
    this.trackManager = trackManager;
    
    // Classic Commuter Branches
    this.lirrStations = [
      "PENN STATION", "WOODSIDE", "JAMAICA", "MINEOLA", 
      "HICKSVILLE", "FARMINGDALE", "WYANDANCH", "DEER PARK", 
      "BRENTWOOD", "CENTRAL ISLIP", "RONKONKOMA", "MEDFORD",
      "YAPHANK", "RIVERHEAD", "MATTITUCK", "MONTAUK"
    ];

    this.stations = new THREE.Group();
    this.scene.add(this.stations);
  }

  getNearestStationData(t) {
    let stationIndex = 0;
    for (let st = 0.08; st <= 0.92; st += 0.06) {
      if (Math.abs(t - st) < 0.005) {
        return {
          current: this.lirrStations[stationIndex % this.lirrStations.length],
          next: this.lirrStations[(stationIndex + 1) % this.lirrStations.length],
          end: "MONTAUK" // Terminating station for eastbound travel
        };
      }
      stationIndex++;
    }
    return null;
  }

  buildStations() {
    let stationIndex = 0;
    for (let t = 0.08; t <= 0.92; t += 0.06) {
      const side = Math.random() > 0.5 ? 1 : -1;
      const name = this.lirrStations[stationIndex % this.lirrStations.length];
      this.createStation(t, side, name);
      stationIndex++;
    }
  }

  createStation(t, sideMultiplier, stationName = "LIRR STATION") {
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

    // Rear Safety Fence
    const fenceHeight = 1.0;
    const fenceGeo = new THREE.BoxGeometry(0.1, fenceHeight, platformLength);
    const fenceMat = new THREE.MeshStandardMaterial({ color: 0x333333, roughness: 0.9, metalness: 0.4 });
    const fenceMesh = new THREE.Mesh(fenceGeo, fenceMat);
    fenceMesh.position.y = 0.8 + (fenceHeight / 2); // 0.8 is platform slab Y-top (0.4 y + 0.4 half-height)
    
    // Put fence on the far edge, opposite the yellow line
    const backEdgeX = trackLocalPos.x > 0 ? -(platformWidth/2 - 0.1) : (platformWidth/2 - 0.1);
    fenceMesh.position.x = backEdgeX;
    fenceMesh.castShadow = true;
    group.add(fenceMesh);

    // Procedural Canvas Generation for LIRR Signs
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');
    
    // Background Navy Blue
    ctx.fillStyle = '#003399';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Thin White Border
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 12;
    ctx.strokeRect(12, 12, canvas.width - 24, canvas.height - 24);
    
    // Crisp White Text
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 110px "Helvetica Neue", Helvetica, Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(stationName, canvas.width / 2, canvas.height / 2 + 10);
    
    const signTexture = new THREE.CanvasTexture(canvas);
    
    // Classic LIRR Blue Station Signs on independent posts
    const signGeo = new THREE.BoxGeometry(0.1, 0.8, 3.0);
    
    // Face 0: Right, 1: Left -> the wide parts of the box
    const edgeMat = new THREE.MeshStandardMaterial({ color: 0x003399, roughness: 0.3 }); // pure blue
    const faceMat = new THREE.MeshStandardMaterial({ 
        color: 0xffffff,
        map: signTexture, 
        roughness: 0.3 
    });
    const materials = [faceMat, faceMat, edgeMat, edgeMat, edgeMat, edgeMat];
    
    const postGeo = new THREE.BoxGeometry(0.15, 2.5, 0.15);
    const postMat = new THREE.MeshStandardMaterial({ color: 0x888888, metalness: 0.8 });

    // Spread 3 signs across the 90m length
    for (let z = -30; z <= 30; z += 30) {
        const signGroup = new THREE.Group();

        const post = new THREE.Mesh(postGeo, postMat);
        post.position.y = 0.8 + 1.25; // 0.8 platform + 1.25 half-height
        post.castShadow = true;

        const sign = new THREE.Mesh(signGeo, materials);
        sign.position.y = 0.8 + 2.1; // Mount it near the top of the post
        sign.castShadow = true;

        signGroup.add(post);
        signGroup.add(sign);
        
        signGroup.position.set(0, 0, z); // Center of the platform width
        group.add(signGroup);
    }

    this.stations.add(group);
  }
}
