import * as THREE from 'three';

export interface RazorGymBuildContext {
  createNpcMesh: (clothColor: number, skinColor: number, hairColor: number) => THREE.Group;
  addAnimated: (fn: (t: number, dt: number) => void) => void;
  addCircleCollider: (c: { x: number; z: number; r: number }) => void;
  addBoxCollider: (b: { minX: number; maxX: number; minZ: number; maxZ: number }) => void;
  addCameraOccluder: (obj: THREE.Object3D) => void;
  addInteractable: (item: {
    id: string;
    label: string;
    position: THREE.Vector3;
    radius: number;
    kind: 'npc' | 'portal' | 'shop' | 'pickup' | 'sign' | 'interior_enter' | 'interior_exit';
    interiorId?: string;
  }) => void;
}

/**
 * 室內體育館拋光楓木地板紋理（還原原作壽富拉比磊札室內排球／躲避球場館的明亮木質運動地板）。
 */
function createGymHardwoodTexture(): THREE.CanvasTexture {
  const size = 512;
  const c = document.createElement('canvas');
  c.width = size;
  c.height = size;
  const ctx = c.getContext('2d')!;

  ctx.fillStyle = '#c89658';
  ctx.fillRect(0, 0, size, size);

  let seed = 2011;
  const rand = () => {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  };

  const stripH = 16;
  for (let y = 0; y < size; y += stripH) {
    let x = 0;
    while (x < size) {
      const segW = 64 + Math.floor(rand() * 96);
      const shade = Math.floor((rand() - 0.5) * 28);
      const R = Math.min(255, Math.max(0, 206 + shade));
      const G = Math.min(255, Math.max(0, 154 + Math.floor(shade * 0.8)));
      const B = Math.min(255, Math.max(0, 92 + Math.floor(shade * 0.6)));
      ctx.fillStyle = `rgb(${R},${G},${B})`;
      ctx.fillRect(x + 1, y + 1, segW - 2, stripH - 2);
      // 細緻木紋
      ctx.fillStyle = 'rgba(120, 74, 30, 0.12)';
      ctx.fillRect(x + 2, y + 5, segW - 4, 1.5);
      ctx.fillRect(x + 2, y + 11, segW - 4, 1.2);
      x += segW;
    }
  }

  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(6, 4);
  tex.anisotropy = 4;
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/**
 * 室內體育館雙色牆面貼圖（下段木質護牆板＋上段淺灰混凝土壁面）。
 */
function createGymWallTexture(): THREE.CanvasTexture {
  const c = document.createElement('canvas');
  c.width = 512;
  c.height = 512;
  const ctx = c.getContext('2d')!;

  // 上段淺灰米白水泥牆
  ctx.fillStyle = '#cfd4da';
  ctx.fillRect(0, 0, 512, 340);
  // 垂直結構柱陰影分隔
  for (let x = 0; x < 512; x += 128) {
    ctx.fillStyle = 'rgba(90, 98, 112, 0.18)';
    ctx.fillRect(x, 0, 14, 340);
  }
  // 藍色運動館飾帶
  ctx.fillStyle = '#294c7a';
  ctx.fillRect(0, 326, 512, 16);
  // 下段深暖木護牆板
  ctx.fillStyle = '#8b5e38';
  ctx.fillRect(0, 342, 512, 170);
  for (let x = 0; x < 512; x += 24) {
    ctx.fillStyle = 'rgba(54, 34, 18, 0.25)';
    ctx.fillRect(x, 342, 2, 170);
  }

  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.ClampToEdgeWrapping;
  tex.repeat.set(3, 1);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/**
 * 室內電子計分板貼圖（SOUFRABI INDOOR ARENA — RAZOR vs CHALLENGERS）。
 */
function createScoreboardTexture(): THREE.CanvasTexture {
  const c = document.createElement('canvas');
  c.width = 512;
  c.height = 192;
  const ctx = c.getContext('2d')!;

  ctx.fillStyle = '#151b26';
  ctx.fillRect(0, 0, 512, 192);
  ctx.strokeStyle = '#e5be58';
  ctx.lineWidth = 8;
  ctx.strokeRect(6, 6, 500, 180);

  ctx.textAlign = 'center';
  ctx.fillStyle = '#ffe58f';
  ctx.font = 'bold 26px Georgia, serif';
  ctx.fillText('SOUFRABI INDOOR ARENA', 256, 46);

  ctx.fillStyle = '#7ad4ff';
  ctx.font = 'bold 22px "Microsoft JhengHei", sans-serif';
  ctx.fillText('磊札海盜團 室內躲避球對決', 256, 84);

  // 左右比分電子燈號
  ctx.fillStyle = '#10151e';
  ctx.fillRect(46, 104, 164, 62);
  ctx.fillRect(302, 104, 164, 62);
  ctx.strokeStyle = '#38e4c5';
  ctx.lineWidth = 3;
  ctx.strokeRect(46, 104, 164, 62);
  ctx.strokeStyle = '#ff6b6b';
  ctx.strokeRect(302, 104, 164, 62);

  ctx.fillStyle = '#62f5dc';
  ctx.font = 'bold 16px "Microsoft JhengHei", sans-serif';
  ctx.fillText('挑戰者 CHALLENGERS', 128, 126);
  ctx.font = 'bold 28px Consolas, monospace';
  ctx.fillText('08', 128, 156);

  ctx.fillStyle = '#ff8a8a';
  ctx.font = 'bold 16px "Microsoft JhengHei", sans-serif';
  ctx.fillText('磊札 & 14人的惡魔', 384, 126);
  ctx.font = 'bold 28px Consolas, monospace';
  ctx.fillText('08', 384, 156);

  ctx.fillStyle = '#ffe58f';
  ctx.font = 'bold 24px Georgia, serif';
  ctx.fillText('VS', 256, 146);

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/**
 * 獨立室內空間：壽富拉比・磊札室內排球／躲避球館（42m × 28m × 15m）
 * - 100% 還原《獵人》貪婪之島篇室內體育館決戰名場面（非露天碼頭！）
 * - 拋光楓木地板＋標準室內躲避球／排球場白線＋挑高鋼架屋頂＋雙排場館投射燈
 * - 三階木造觀眾看台＋高腳裁判椅＋電子記分板＋No.002「一坪的海岸線」官方實卡大獎展櫃
 * - 磊札（1.34× 魁梧體格）＋ 4 名「14 人的惡魔」紫色念獸隊員 ＋ 中央雙環念氣躲避球
 * - 西側雙開木大門（按 E 返回壽富拉比海港）
 */
export function buildRazorGymInterior(ctx: RazorGymBuildContext): THREE.Group {
  const g = new THREE.Group();
  g.name = 'interior_razor_gym';

  const W = 42; // X: [-21, 21]
  const D = 28; // Z: [-14, 14]
  const H = 15; // 挑高 15m 體育館

  // 室內柔和補光＋場館投射主光
  const ceilingLight1 = new THREE.PointLight(0xfff4dc, 2.4, 48, 1.2);
  ceilingLight1.position.set(-8, 12.5, 0);
  g.add(ceilingLight1);

  const ceilingLight2 = new THREE.PointLight(0xfff4dc, 2.4, 48, 1.2);
  ceilingLight2.position.set(8, 12.5, 0);
  g.add(ceilingLight2);

  // 1. 拋光楓木體育館地板
  const floorMat = new THREE.MeshStandardMaterial({
    map: createGymHardwoodTexture(),
    roughness: 0.42,
    metalness: 0.04,
  });
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(W, D), floorMat);
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  g.add(floor);

  // 標準室內排球／躲避球場白線（22m × 12m 內場＋外場區）
  const lineMat = new THREE.MeshBasicMaterial({ color: 0xfbfbfb });
  const lines: Array<[number, number, number, number]> = [
    [0.18, 12.2, 0, 0],       // 中線
    [22.2, 0.18, 0, -6.0],    // 北邊線
    [22.2, 0.18, 0, 6.0],     // 南邊線
    [0.18, 12.2, -11.0, 0],   // 西底線
    [0.18, 12.2, 11.0, 0],    // 東底線
    [0.14, 12.2, -7.2, 0],    // 西側進攻／外場線
    [0.14, 12.2, 7.2, 0],     // 東側進攻／外場線
  ];
  for (const [lw, ld, lx, lz] of lines) {
    const ln = new THREE.Mesh(new THREE.PlaneGeometry(lw, ld), lineMat);
    ln.rotation.x = -Math.PI / 2;
    ln.position.set(lx, 0.015, lz);
    g.add(ln);
  }
  const centerCircle = new THREE.Mesh(new THREE.RingGeometry(1.72, 1.88, 36), lineMat);
  centerCircle.rotation.x = -Math.PI / 2;
  centerCircle.position.set(0, 0.016, 0);
  g.add(centerCircle);

  // 2. 四周高聳體育館牆面、挑高深藍鋼架屋頂與雙排高頂投射燈具
  const wallMat = new THREE.MeshStandardMaterial({
    map: createGymWallTexture(),
    roughness: 0.84,
  });
  const wallN = new THREE.Mesh(new THREE.PlaneGeometry(W, H), wallMat);
  wallN.position.set(0, H / 2, -D / 2);
  g.add(wallN);

  const wallS = new THREE.Mesh(new THREE.PlaneGeometry(W, H), wallMat);
  wallS.rotation.y = Math.PI;
  wallS.position.set(0, H / 2, D / 2);
  g.add(wallS);

  const wallE = new THREE.Mesh(new THREE.PlaneGeometry(D, H), wallMat);
  wallE.rotation.y = -Math.PI / 2;
  wallE.position.set(W / 2, H / 2, 0);
  g.add(wallE);

  const wallW = new THREE.Mesh(new THREE.PlaneGeometry(D, H), wallMat);
  wallW.rotation.y = Math.PI / 2;
  wallW.position.set(-W / 2, H / 2, 0);
  g.add(wallW);

  // 深藍工業鋼構天花板＋橫跨鋼樑＋高頂場館探照燈
  const ceiling = new THREE.Mesh(
    new THREE.PlaneGeometry(W, D),
    new THREE.MeshStandardMaterial({ color: 0x263142, roughness: 0.9 })
  );
  ceiling.rotation.x = Math.PI / 2;
  ceiling.position.y = H;
  g.add(ceiling);

  const steelMat = new THREE.MeshStandardMaterial({ color: 0x3b4658, roughness: 0.55, metalness: 0.45 });
  const lampGlowMat = new THREE.MeshBasicMaterial({ color: 0xfff8de });
  for (let bx = -15; bx <= 15; bx += 7.5) {
    const beam = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.65, D), steelMat);
    beam.position.set(bx, H - 0.5, 0);
    g.add(beam);

    for (const lz of [-6.5, 0, 6.5]) {
      const fixture = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.25, 0.9), steelMat);
      fixture.position.set(bx, H - 0.95, lz);
      g.add(fixture);

      const bulb = new THREE.Mesh(new THREE.PlaneGeometry(1.15, 0.68), lampGlowMat);
      bulb.rotation.x = Math.PI / 2;
      bulb.position.set(bx, H - 1.09, lz);
      g.add(bulb);
    }
  }

  // 3. 北牆電子記分板＋原作傳說大獎「No.002 一坪的海岸線」官方實卡展框＋四階木造看台
  const scoreBoard = new THREE.Mesh(
    new THREE.BoxGeometry(9.6, 3.6, 0.36),
    new THREE.MeshStandardMaterial({ map: createScoreboardTexture(), roughness: 0.45 })
  );
  scoreBoard.position.set(0, 9.6, -D / 2 + 0.25);
  g.add(scoreBoard);

  const goldMat = new THREE.MeshStandardMaterial({ color: 0xe6be54, metalness: 0.55, roughness: 0.34 });
  const prizeTex = new THREE.TextureLoader().load('./cards/2.webp');
  prizeTex.colorSpace = THREE.SRGBColorSpace;
  const prizeFrame = new THREE.Mesh(new THREE.BoxGeometry(2.5, 3.45, 0.2), goldMat);
  prizeFrame.position.set(7.4, 9.6, -D / 2 + 0.25);
  const prizeFace = new THREE.Mesh(
    new THREE.PlaneGeometry(2.26, 3.16),
    new THREE.MeshStandardMaterial({
      map: prizeTex,
      emissiveMap: prizeTex,
      emissive: new THREE.Color(0xffffff),
      emissiveIntensity: 0.16,
      roughness: 0.72,
    })
  );
  prizeFace.position.z = 0.11;
  prizeFrame.add(prizeFace);
  g.add(prizeFrame);

  // 北側四階木造觀眾看台（z ∈ [-13.6, -9.2]）
  const bleacherWood = new THREE.MeshStandardMaterial({ color: 0x7b5230, roughness: 0.85 });
  for (let row = 0; row < 4; row++) {
    const bench = new THREE.Mesh(new THREE.BoxGeometry(26, 0.58, 1.05), bleacherWood);
    bench.position.set(0, 0.3 + row * 0.58, -9.6 - row * 1.05);
    bench.castShadow = true;
    bench.receiveShadow = true;
    g.add(bench);
  }
  ctx.addBoxCollider({ minX: -13.2, maxX: 13.2, minZ: -13.8, maxZ: -9.0 });

  // 高腳裁判椅（球場南側中線旁）
  const refChair = new THREE.Group();
  refChair.position.set(0, 0, 8.8);
  for (const [lx, lz] of [
    [-0.4, -0.4],
    [0.4, -0.4],
    [-0.4, 0.4],
    [0.4, 0.4],
  ]) {
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.055, 2.2, 8), steelMat);
    leg.position.set(lx, 1.1, lz);
    refChair.add(leg);
  }
  const refSeat = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.14, 0.9), bleacherWood);
  refSeat.position.y = 2.22;
  refChair.add(refSeat);
  const refBack = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.85, 0.12), bleacherWood);
  refBack.position.set(0, 2.68, 0.4);
  refChair.add(refBack);
  g.add(refChair);
  ctx.addCircleCollider({ x: 0, z: 8.8, r: 0.85 });

  // 4. 場中央懸浮念能力躲避球＋雙層旋轉念氣能量環
  const ballGroup = new THREE.Group();
  ballGroup.position.set(0, 1.05, 0);
  const ball = new THREE.Mesh(
    new THREE.SphereGeometry(0.44, 18, 18),
    new THREE.MeshStandardMaterial({ color: 0xe02828, emissive: 0x991212, emissiveIntensity: 0.6, roughness: 0.32 })
  );
  ball.castShadow = true;
  ballGroup.add(ball);

  const nenRing1 = new THREE.Mesh(
    new THREE.TorusGeometry(0.75, 0.045, 8, 28),
    new THREE.MeshBasicMaterial({ color: 0xffc857, transparent: true, opacity: 0.8 })
  );
  const nenRing2 = new THREE.Mesh(
    new THREE.TorusGeometry(0.96, 0.035, 8, 28),
    new THREE.MeshBasicMaterial({ color: 0xc084fc, transparent: true, opacity: 0.65 })
  );
  nenRing2.rotation.x = Math.PI / 2;
  ballGroup.add(nenRing1, nenRing2);
  g.add(ballGroup);

  ctx.addAnimated((t) => {
    ballGroup.position.y = 1.05 + Math.sin(t * 3.1) * 0.15;
    ball.rotation.y = t * 1.8;
    nenRing1.rotation.x = t * 2.2;
    nenRing1.rotation.y = t * 1.4;
    nenRing2.rotation.y = -t * 1.9;
    nenRing2.rotation.z = t * 1.1;
  });

  // 5. 海港管理者「磊札（Razor）」與 4 名「14 人的惡魔」念獸隊員
  const razorNpc = ctx.createNpcMesh(0x232836, 0xe8b892, 0x1a1a1a);
  razorNpc.scale.setScalar(1.34);
  razorNpc.position.set(5.4, 0, 0);
  razorNpc.rotation.y = -Math.PI / 2;
  g.add(razorNpc);
  ctx.addCircleCollider({ x: 5.4, z: 0, r: 0.85 });
  ctx.addInteractable({
    id: 'npc_razor',
    label: '向海港管理者「磊札」挑戰一坪的海岸線（躲避球決戰）',
    position: new THREE.Vector3(5.4, 0, 0),
    radius: 4.4,
    kind: 'npc',
  });

  const devilAuraMat = new THREE.MeshBasicMaterial({
    color: 0xa855f7,
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 0.62,
  });
  const devilPositions: Array<[number, number, number]> = [
    [3.8, -3.2, -Math.PI / 2],
    [3.8, 3.2, -Math.PI / 2],
    [9.0, -3.8, -Math.PI / 2],
    [9.0, 3.8, -Math.PI / 2],
  ];
  for (const [dx, dz, ry] of devilPositions) {
    const devil = ctx.createNpcMesh(0x3a1c4a, 0xc7a3e6, 0x1a0b24);
    devil.position.set(dx, 0, dz);
    devil.rotation.y = ry;
    const aura = new THREE.Mesh(new THREE.RingGeometry(0.55, 0.74, 22), devilAuraMat);
    aura.rotation.x = -Math.PI / 2;
    aura.position.y = 0.04;
    devil.add(aura);
    g.add(devil);
    ctx.addCircleCollider({ x: dx, z: dz, r: 0.65 });
  }

  // 6. 西側出口雙開木門（按 E 返回壽富拉比海港）
  const exitDoorGroup = new THREE.Group();
  exitDoorGroup.position.set(-W / 2 + 0.18, 0, 0);
  const doorFrame = new THREE.Mesh(new THREE.BoxGeometry(0.4, 4.6, 4.6), goldMat);
  doorFrame.position.y = 2.3;
  exitDoorGroup.add(doorFrame);

  const doorWood = new THREE.Mesh(
    new THREE.BoxGeometry(0.46, 4.2, 4.0),
    new THREE.MeshStandardMaterial({ color: 0x4b2f1c, roughness: 0.82 })
  );
  doorWood.position.y = 2.1;
  exitDoorGroup.add(doorWood);

  const exitSignGlow = new THREE.Mesh(
    new THREE.BoxGeometry(0.2, 0.55, 1.9),
    new THREE.MeshBasicMaterial({ color: 0x38e4c5 })
  );
  exitSignGlow.position.set(0.18, 5.1, 0);
  exitDoorGroup.add(exitSignGlow);
  g.add(exitDoorGroup);
  ctx.addCameraOccluder(wallN);
  ctx.addCameraOccluder(wallS);
  ctx.addCameraOccluder(wallE);
  ctx.addCameraOccluder(wallW);

  ctx.addInteractable({
    id: 'exit_razor_gym',
    label: '推開體育館大門 → 返回壽富拉比海港',
    position: new THREE.Vector3(-W / 2 + 1.8, 0, 0),
    radius: 3.6,
    kind: 'interior_exit',
  });

  return g;
}
