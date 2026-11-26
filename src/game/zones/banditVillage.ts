import * as THREE from 'three';
import { ModelLibrary } from '../assets';

export interface BanditVillageBuildContext {
  models: ModelLibrary;
  createNpcMesh: (clothColor: number, skinColor: number, hairColor: number) => THREE.Group;
  addAnimated: (fn: (t: number, dt: number) => void) => void;
  addCircleCollider: (c: { x: number; z: number; r: number }) => void;
  addCameraOccluder?: (obj: THREE.Object3D) => void;
  addInteractable: (item: {
    id: string;
    label: string;
    position: THREE.Vector3;
    radius: number;
    kind: 'npc' | 'portal' | 'shop' | 'pickup' | 'sign';
  }) => void;
}

export const BANDIT_VILLAGE_CENTER = { x: -74, z: -124 } as const;
export const BANDIT_VILLAGE_SPAWN = { x: -74, z: -108 } as const;

function createSeededRandom(initialSeed: number): () => number {
  let seed = initialSeed;
  return () => {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  };
}

/**
 * 西北密林空地苔土與松針地面紋理（CanvasTexture）。
 */
function createForestFloorTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  // 濕潤深森林腐殖土底色
  ctx.fillStyle = '#4e4736';
  ctx.fillRect(0, 0, 512, 512);

  const rand = createSeededRandom(9137);

  // 苔蘚綠與泥土斑塊
  for (let i = 0; i < 180; i++) {
    const x = rand() * 512;
    const y = rand() * 512;
    const r = 10 + rand() * 28;
    const pick = rand();
    if (pick < 0.42) {
      ctx.fillStyle = 'rgba(63, 86, 48, 0.28)'; // 陰涼森林青苔
    } else if (pick < 0.76) {
      ctx.fillStyle = 'rgba(98, 79, 55, 0.30)'; // 踩實山村泥土
    } else {
      ctx.fillStyle = 'rgba(54, 43, 32, 0.32)'; // 深濕土壤
    }
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }

  // 散落枯葉與針葉細痕
  for (let i = 0; i < 420; i++) {
    const x = rand() * 512;
    const y = rand() * 512;
    const len = 3 + rand() * 7;
    const ang = rand() * Math.PI * 2;
    ctx.strokeStyle = rand() > 0.5 ? 'rgba(138, 108, 68, 0.28)' : 'rgba(72, 92, 54, 0.26)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + Math.cos(ang) * len, y + Math.sin(ang) * len);
    ctx.stroke();
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(5, 5);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/**
 * 深色原木山林小屋牆板紋理。
 */
function createDarkTimberWallTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#6e503a';
  ctx.fillRect(0, 0, 256, 256);

  const rand = createSeededRandom(2719);
  const plankCount = 10;
  const ph = 256 / plankCount;

  for (let i = 0; i < plankCount; i++) {
    const shade = Math.floor((rand() - 0.5) * 20);
    ctx.fillStyle = `rgb(${110 + shade},${80 + Math.floor(shade * 0.8)},${58 + Math.floor(shade * 0.6)})`;
    ctx.fillRect(0, i * ph + 2, 256, ph - 3);

    // 木板暗縫
    ctx.fillStyle = '#4e3726';
    ctx.fillRect(0, i * ph, 256, 2.5);

    // 橫向木紋絲
    for (let s = 0; s < 5; s++) {
      ctx.fillStyle = rand() > 0.5 ? 'rgba(78, 55, 38, 0.26)' : 'rgba(156, 120, 86, 0.22)';
      ctx.fillRect(rand() * 190, i * ph + 4 + rand() * (ph - 7), 45 + rand() * 80, 1.5);
    }
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(2, 1.5);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/**
 * 帶苔痕的深色木瓦陡斜屋頂紋理。
 */
function createShingleRoofTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#544337';
  ctx.fillRect(0, 0, 256, 256);

  const rand = createSeededRandom(5107);
  const rows = 12;
  const cols = 10;
  const rh = 256 / rows;
  const cw = 256 / cols;

  for (let r = 0; r < rows; r++) {
    const off = (r % 2) * (cw * 0.5);
    for (let c = -1; c <= cols; c++) {
      const shade = Math.floor((rand() - 0.5) * 18);
      const mossy = rand() > 0.8;
      const R = mossy ? 82 + shade : 92 + shade;
      const G = mossy ? 96 + shade : 74 + shade;
      const B = mossy ? 70 + shade : 62 + shade;
      ctx.fillStyle = `rgb(${R},${G},${B})`;
      ctx.fillRect(c * cw + off + 1.5, r * rh + 1.5, cw - 3, rh - 2.5);
    }
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(3, 3);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/**
 * 舊化原木山賊之村村口牌匾紋理（BANDIT VILLAGE / 山賊之村）。
 */
function createBanditPlaqueTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 176;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#362417';
  ctx.fillRect(0, 0, 512, 176);

  const rand = createSeededRandom(6311);
  for (let y = 0; y < 176; y += 35) {
    ctx.fillStyle = 'rgba(20, 12, 7, 0.42)';
    ctx.fillRect(0, y, 512, 3);
  }
  for (let i = 0; i < 85; i++) {
    ctx.fillStyle = rand() > 0.5 ? 'rgba(92, 64, 40, 0.24)' : 'rgba(26, 17, 10, 0.25)';
    ctx.fillRect(rand() * 440, rand() * 172, 35 + rand() * 85, 2);
  }

  // 邊角微苔與舊化木框
  ctx.fillStyle = 'rgba(66, 94, 52, 0.26)';
  ctx.beginPath();
  ctx.arc(24, 154, 24, 0, Math.PI * 2);
  ctx.arc(488, 24, 20, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = '#8b6844';
  ctx.lineWidth = 8;
  ctx.strokeRect(8, 8, 496, 160);
  ctx.strokeStyle = '#24170e';
  ctx.lineWidth = 3;
  ctx.strokeRect(18, 18, 476, 140);

  ctx.textAlign = 'center';
  ctx.fillStyle = '#1d120a';
  ctx.font = 'bold 42px Georgia, serif';
  ctx.fillText('BANDIT VILLAGE', 258, 78);
  ctx.fillStyle = '#f2d9a6';
  ctx.fillText('BANDIT VILLAGE', 256, 76);

  ctx.fillStyle = '#1d120a';
  ctx.font = 'bold 34px sans-serif';
  ctx.fillText('山賊之村', 258, 134);
  ctx.fillStyle = '#d9ae6c';
  ctx.fillText('山賊之村', 256, 132);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/**
 * 建造傳統暗原木山村小屋（陡斜木瓦雙坡屋頂、石砌煙囪、微暖昏暗木窗與門廊）。
 */
function buildMountainTimberHut(
  mats: {
    wallMat: THREE.MeshStandardMaterial;
    roofMat: THREE.MeshStandardMaterial;
    beamMat: THREE.MeshStandardMaterial;
    stoneMat: THREE.MeshStandardMaterial;
    windowGlowMat: THREE.MeshStandardMaterial;
    doorMat: THREE.MeshStandardMaterial;
  },
  chimneySide: -1 | 1
): { group: THREE.Group; smokePuffs: THREE.Mesh[] } {
  const hut = new THREE.Group();

  const w = 4.6;
  const h = 3.05;
  const d = 4.1;
  const foundationH = 0.52;

  // 1. 粗石基座
  const foundation = new THREE.Mesh(
    new THREE.BoxGeometry(w + 0.34, foundationH, d + 0.34),
    mats.stoneMat
  );
  foundation.position.y = foundationH / 2;
  foundation.castShadow = true;
  foundation.receiveShadow = true;
  hut.add(foundation);

  // 2. 深木板主牆體
  const walls = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mats.wallMat);
  walls.position.y = foundationH + h / 2;
  walls.castShadow = true;
  walls.receiveShadow = true;
  hut.add(walls);

  // 四角粗原木立柱與上下圈樑
  for (const sx of [-w / 2, w / 2]) {
    for (const sz of [-d / 2, d / 2]) {
      const post = new THREE.Mesh(new THREE.BoxGeometry(0.24, h + 0.12, 0.24), mats.beamMat);
      post.position.set(sx, foundationH + h / 2, sz);
      post.castShadow = true;
      hut.add(post);
    }
  }
  const eaveBand = new THREE.Mesh(new THREE.BoxGeometry(w + 0.26, 0.18, d + 0.26), mats.beamMat);
  eaveBand.position.y = foundationH + h;
  hut.add(eaveBand);

  // 3. 山牆三角形牆面（前後兩側）
  const gableH = 2.35;
  const gableShape = new THREE.Shape();
  gableShape.moveTo(-w / 2, 0);
  gableShape.lineTo(w / 2, 0);
  gableShape.lineTo(0, gableH);
  gableShape.closePath();

  const gableGeo = new THREE.ExtrudeGeometry(gableShape, {
    depth: d,
    bevelEnabled: false,
  });
  gableGeo.translate(0, 0, -d / 2);
  const gableMesh = new THREE.Mesh(gableGeo, mats.wallMat);
  gableMesh.position.y = foundationH + h;
  gableMesh.castShadow = true;
  gableMesh.receiveShadow = true;
  hut.add(gableMesh);

  // 4. 陡斜木瓦雙坡屋頂（含深出簷與脊樑）
  const roofAngle = Math.atan2(gableH, w / 2); // ~45.6° 經典山林防雪陡坡
  const slopeHalfSpan = Math.hypot(w / 2, gableH) + 0.65;
  const roofDepth = d + 1.05;

  for (const side of [-1, 1]) {
    const slope = new THREE.Mesh(
      new THREE.BoxGeometry(slopeHalfSpan, 0.18, roofDepth),
      mats.roofMat
    );
    const midX = side * ((w / 4) + 0.18);
    const midY = foundationH + h + gableH * 0.5 - 0.08;
    slope.position.set(midX, midY, 0);
    slope.rotation.z = -side * roofAngle;
    slope.castShadow = true;
    slope.receiveShadow = true;
    hut.add(slope);
  }

  const ridgeBeam = new THREE.Mesh(
    new THREE.CylinderGeometry(0.14, 0.14, roofDepth + 0.25, 8),
    mats.beamMat
  );
  ridgeBeam.rotation.x = Math.PI / 2;
  ridgeBeam.position.set(0, foundationH + h + gableH + 0.08, 0);
  ridgeBeam.castShadow = true;
  hut.add(ridgeBeam);

  // 5. 前側木門與簡易雨遮門廊
  const doorFrame = new THREE.Mesh(new THREE.BoxGeometry(1.18, 2.02, 0.14), mats.beamMat);
  doorFrame.position.set(0, foundationH + 1.0, d / 2 + 0.04);
  hut.add(doorFrame);

  const doorLeaf = new THREE.Mesh(new THREE.BoxGeometry(0.96, 1.88, 0.08), mats.doorMat);
  doorLeaf.position.set(0, foundationH + 0.96, d / 2 + 0.08);
  hut.add(doorLeaf);

  const porchStep = new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.28, 0.78), mats.stoneMat);
  porchStep.position.set(0, 0.14, d / 2 + 0.45);
  porchStep.receiveShadow = true;
  hut.add(porchStep);

  const porchAwning = new THREE.Mesh(new THREE.BoxGeometry(1.88, 0.1, 0.88), mats.roofMat);
  porchAwning.position.set(0, foundationH + 2.25, d / 2 + 0.42);
  porchAwning.rotation.x = 0.28;
  porchAwning.castShadow = true;
  hut.add(porchAwning);

  for (const px of [-0.74, 0.74]) {
    const porchPost = new THREE.Mesh(new THREE.CylinderGeometry(0.065, 0.075, 2.15, 6), mats.beamMat);
    porchPost.position.set(px, 1.32, d / 2 + 0.72);
    porchPost.castShadow = true;
    hut.add(porchPost);
  }

  // 6. 暖黃昏暗窗戶（正面兩側 + 左右側牆各一扇，含木窗格）
  const addWindow = (wx: number, wy: number, wz: number, rotY: number) => {
    const winGroup = new THREE.Group();
    winGroup.position.set(wx, wy, wz);
    winGroup.rotation.y = rotY;

    const frame = new THREE.Mesh(new THREE.BoxGeometry(0.96, 0.92, 0.12), mats.beamMat);
    winGroup.add(frame);

    const glass = new THREE.Mesh(new THREE.PlaneGeometry(0.76, 0.72), mats.windowGlowMat);
    glass.position.z = 0.065;
    winGroup.add(glass);

    // 十字木窗櫺
    const barV = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.76, 0.05), mats.beamMat);
    barV.position.z = 0.07;
    winGroup.add(barV);

    const barH = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.07, 0.05), mats.beamMat);
    barH.position.z = 0.07;
    winGroup.add(barH);

    // 窗台木板
    const sill = new THREE.Mesh(new THREE.BoxGeometry(1.08, 0.09, 0.2), mats.beamMat);
    sill.position.set(0, -0.48, 0.05);
    winGroup.add(sill);

    hut.add(winGroup);
  };

  addWindow(-1.42, foundationH + 1.56, d / 2 + 0.03, 0);
  addWindow(1.42, foundationH + 1.56, d / 2 + 0.03, 0);
  addWindow(w / 2 + 0.03, foundationH + 1.6, 0.25, Math.PI / 2);
  addWindow(-w / 2 - 0.03, foundationH + 1.6, -0.25, -Math.PI / 2);

  // 閣樓小方窗（山牆高處微光）
  const atticGlow = new THREE.Mesh(new THREE.BoxGeometry(0.56, 0.56, 0.12), mats.beamMat);
  atticGlow.position.set(0, foundationH + h + 0.85, d / 2 + 0.03);
  hut.add(atticGlow);
  const atticPane = new THREE.Mesh(new THREE.PlaneGeometry(0.4, 0.4), mats.windowGlowMat);
  atticPane.position.set(0, foundationH + h + 0.85, d / 2 + 0.095);
  hut.add(atticPane);

  // 7. 粗石壁爐煙囪與輕微嫋嫋炊煙
  const chimX = chimneySide * (w / 2 + 0.18);
  const chimZ = -0.75;
  const chimneyBase = new THREE.Mesh(new THREE.BoxGeometry(0.92, 3.2, 0.96), mats.stoneMat);
  chimneyBase.position.set(chimX, 1.6, chimZ);
  chimneyBase.castShadow = true;
  hut.add(chimneyBase);

  const chimneyFlue = new THREE.Mesh(new THREE.BoxGeometry(0.68, 3.3, 0.72), mats.stoneMat);
  chimneyFlue.position.set(chimX - chimneySide * 0.08, 4.75, chimZ);
  chimneyFlue.castShadow = true;
  hut.add(chimneyFlue);

  const chimneyCap = new THREE.Mesh(new THREE.BoxGeometry(0.84, 0.18, 0.88), mats.stoneMat);
  chimneyCap.position.set(chimX - chimneySide * 0.08, 6.45, chimZ);
  hut.add(chimneyCap);

  const smokeMat = new THREE.MeshBasicMaterial({
    color: 0xcbd5dc,
    transparent: true,
    opacity: 0.24,
    depthWrite: false,
  });
  const smokePuffs: THREE.Mesh[] = [];
  for (let i = 0; i < 3; i++) {
    const puff = new THREE.Mesh(new THREE.DodecahedronGeometry(0.28 + i * 0.06, 0), smokeMat);
    puff.position.set(chimX - chimneySide * 0.08, 6.7 + i * 0.65, chimZ);
    hut.add(puff);
    smokePuffs.push(puff);
  }

  return { group: hut, smokePuffs };
}

/**
 * 山賊之村（Bandit Village）獨立場景模組
 * - 西北半島密林深處（vx = -62, vz = -106），2011 動畫「假扮山賊的病患村民／奇運亞歷山大石」事件地
 * - 苔土松針林間空地（r = 17），完整保留出生點 [-62, 0, -90] 與奇運亞歷山大石拾取點 (-58, -98) 淨空
 * - 原木柵欄村口大門（7.6m 寬敞開口、舊化木質「BANDIT VILLAGE / 山賊之村」牌匾與吊掛鐵燈）
 * - 2 棟 House_3.glb 木造山屋 + 2 棟程序化深木陡頂石煙囪小屋（昏暖窗光與炊煙）
 * - 村中央石圈營火、鐵三腳架與熬煮藥湯黑鑄鐵大鍋、閃爍暖橘火光、劈柴堆、木桶與苔岩
 * - 山賊之村村民 NPC（id: 'npc_bandit_chief'）
 */
export function buildBanditVillageZone(ctx: BanditVillageBuildContext): THREE.Group {
  const vg = new THREE.Group();
  vg.name = 'zone_bandit_village';

  const vx = BANDIT_VILLAGE_CENTER.x; // -62
  const vz = BANDIT_VILLAGE_CENTER.z; // -106
  const sx = BANDIT_VILLAGE_SPAWN.x;  // -62
  const sz = BANDIT_VILLAGE_SPAWN.z;  // -90

  // 共享材質
  const logDarkMat = new THREE.MeshStandardMaterial({ color: 0x5e422c, roughness: 0.92 });
  const logBarkMat = new THREE.MeshStandardMaterial({ color: 0x6b4c34, roughness: 0.94 });
  const ropeMat = new THREE.MeshStandardMaterial({ color: 0x9e8256, roughness: 0.9 });
  const ironMat = new THREE.MeshStandardMaterial({
    color: 0x4b5362,
    roughness: 0.5,
    metalness: 0.35,
  });
  const mossyStoneMat = new THREE.MeshStandardMaterial({
    color: 0x626b5c,
    roughness: 0.92,
    flatShading: true,
  });
  const hutWallMat = new THREE.MeshStandardMaterial({
    map: createDarkTimberWallTexture(),
    roughness: 0.9,
  });
  const hutRoofMat = new THREE.MeshStandardMaterial({
    map: createShingleRoofTexture(),
    roughness: 0.88,
  });
  const hutDoorMat = new THREE.MeshStandardMaterial({ color: 0x5c3e28, roughness: 0.88 });
  const hutWindowGlowMat = new THREE.MeshStandardMaterial({
    color: 0xffba63,
    emissive: 0xd9751c,
    emissiveIntensity: 0.72,
    roughness: 0.4,
  });

  // -------------------------------------------------------------------------
  // 1. 密林苔土空地（r = 17 at (-62, 0.05, -106)），出生點 [-62, 0, -90] 保持完全淨空
  // -------------------------------------------------------------------------
  const floorMat = new THREE.MeshStandardMaterial({
    map: createForestFloorTexture(),
    roughness: 0.95,
  });
  const clearingFloor = new THREE.Mesh(new THREE.CylinderGeometry(17, 17.8, 0.1, 40), floorMat);
  clearingFloor.position.set(vx, 0.05, vz);
  clearingFloor.receiveShadow = true;
  vg.add(clearingFloor);

  // 連接出生點 (-62, -90) 穿過柵欄門進入村內的平整林間泥土小徑
  const entryPathMat = new THREE.MeshStandardMaterial({ color: 0x685640, roughness: 0.95 });
  const entryPath = new THREE.Mesh(new THREE.BoxGeometry(4.4, 0.05, 9.5), entryPathMat);
  entryPath.position.set(vx, 0.025, vz + 12.5);
  entryPath.receiveShadow = true;
  vg.add(entryPath);

  // -------------------------------------------------------------------------
  // 2. 原木柵欄村口大門（(vx, 0, vz + 11) = (-62, 0, -95)，寬 7.6m 淨空入口）
  // -------------------------------------------------------------------------
  const gateZ = vz + 11; // -95
  const gateGroup = new THREE.Group();
  gateGroup.name = 'bandit_village_palisade_gate';
  gateGroup.position.set(vx, 0, gateZ);

  const postOffsetX = 4.25; // 主柱半徑 ~0.45 -> 柱間淨寬 7.6m
  const lanternGlowMat = new THREE.MeshStandardMaterial({
    color: 0xffca72,
    emissive: 0xe68422,
    emissiveIntensity: 1.15,
    roughness: 0.32,
  });

  for (const side of [-1, 1]) {
    const px = side * postOffsetX;

    // 主門粗原木立柱與圓錐尖頂
    const mainPost = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.48, 6.0, 10), logBarkMat);
    mainPost.position.set(px, 3.0, 0);
    mainPost.castShadow = true;
    mainPost.receiveShadow = true;
    gateGroup.add(mainPost);

    const postTip = new THREE.Mesh(new THREE.ConeGeometry(0.38, 0.58, 10), logDarkMat);
    postTip.position.set(px, 6.29, 0);
    postTip.castShadow = true;
    gateGroup.add(postTip);

    // 麻繩綁紮環
    for (const ry of [1.5, 5.15]) {
      const lash = new THREE.Mesh(new THREE.TorusGeometry(0.43, 0.06, 6, 12), ropeMat);
      lash.rotation.x = Math.PI / 2;
      lash.position.set(px, ry, 0);
      gateGroup.add(lash);
    }

    // 門框角撐斜木
    const brace = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.15, 1.55, 8), logDarkMat);
    brace.position.set(px - side * 0.58, 4.78, 0);
    brace.rotation.z = side * 0.72;
    brace.castShadow = true;
    gateGroup.add(brace);

    // 兩側漸降式原木柵欄翼牆（每側 3 根削尖木樁 + 上下橫綁木）
    const wingStakes: ReadonlyArray<readonly [number, number]> = [
      [5.1, 3.8],
      [5.85, 3.25],
      [6.6, 2.7],
    ];
    for (const [ox, sh] of wingStakes) {
      const stake = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.3, sh, 8), logBarkMat);
      stake.position.set(side * ox, sh / 2, -0.15);
      stake.castShadow = true;
      stake.receiveShadow = true;
      gateGroup.add(stake);

      const tip = new THREE.Mesh(new THREE.ConeGeometry(0.24, 0.45, 8), logDarkMat);
      tip.position.set(side * ox, sh + 0.22, -0.15);
      gateGroup.add(tip);
    }

    for (const railY of [1.15, 2.25]) {
      const rail = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.12, 2.65, 7), logDarkMat);
      rail.rotation.z = Math.PI / 2;
      rail.position.set(side * 5.6, railY, 0.08);
      rail.castShadow = true;
      gateGroup.add(rail);
    }

    // 門楣內側吊掛暖橘小鐵燈
    const chain = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.7, 6), ironMat);
    chain.position.set(side * 3.15, 4.95, 0);
    gateGroup.add(chain);

    const lampBody = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.14, 0.36, 6), lanternGlowMat);
    lampBody.position.set(side * 3.15, 4.46, 0);
    gateGroup.add(lampBody);

    const lampHood = new THREE.Mesh(new THREE.ConeGeometry(0.26, 0.22, 6), ironMat);
    lampHood.position.set(side * 3.15, 4.72, 0);
    gateGroup.add(lampHood);

    // 主柱與柵欄翼牆碰撞體
    ctx.addCircleCollider({ x: vx + px, z: gateZ, r: 0.8 });
    ctx.addCircleCollider({ x: vx + side * 5.9, z: gateZ, r: 0.75 });
  }

  // 門頂粗原木橫樑
  const crossBeam = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.34, 10.6, 10), logDarkMat);
  crossBeam.rotation.z = Math.PI / 2;
  crossBeam.position.set(0, 5.45, 0);
  crossBeam.castShadow = true;
  gateGroup.add(crossBeam);

  // 舊化木質村口牌匾（BANDIT VILLAGE / 山賊之村）
  const plaqueTex = createBanditPlaqueTexture();
  const plaqueFaceMat = new THREE.MeshStandardMaterial({ map: plaqueTex, roughness: 0.84 });
  const plaqueMesh = new THREE.Mesh(new THREE.BoxGeometry(4.6, 1.56, 0.22), [
    logBarkMat,
    logBarkMat,
    logBarkMat,
    logBarkMat,
    plaqueFaceMat,
    plaqueFaceMat,
  ]);
  plaqueMesh.position.set(0, 6.22, 0.06);
  plaqueMesh.castShadow = true;
  gateGroup.add(plaqueMesh);

  vg.add(gateGroup);
  ctx.addCameraOccluder?.(gateGroup);

  // -------------------------------------------------------------------------
  // 3. 傳統密林木屋群（2 棟 House_3.glb + 2 棟程序化深木陡頂石煙囪小屋）
  // -------------------------------------------------------------------------
  const glbCabins: ReadonlyArray<{
    file: string;
    x: number;
    y: number;
    z: number;
    h: number;
    rotY: number;
    r: number;
  }> = [
    { file: 'House_3.glb', x: vx - 8.5, y: 0.06, z: vz - 5, h: 7.0, rotY: 0.55, r: 4.0 },
    { file: 'House_3.glb', x: vx + 8.5, y: 0.06, z: vz - 4, h: 7.0, rotY: -0.65, r: 4.0 },
  ];

  for (const cabin of glbCabins) {
    ctx.models.place(vg, cabin.file, {
      x: cabin.x,
      y: cabin.y,
      z: cabin.z,
      targetHeight: cabin.h,
      rotY: cabin.rotY,
    });
    ctx.addCircleCollider({ x: cabin.x, z: cabin.z, r: cabin.r });
  }

  const hutMats = {
    wallMat: hutWallMat,
    roofMat: hutRoofMat,
    beamMat: logBarkMat,
    stoneMat: mossyStoneMat,
    windowGlowMat: hutWindowGlowMat,
    doorMat: hutDoorMat,
  };

  const swHutBuilt = buildMountainTimberHut(hutMats, -1);
  swHutBuilt.group.name = 'bandit_hut_sw';
  swHutBuilt.group.position.set(vx - 9, 0.06, vz + 5.5);
  swHutBuilt.group.rotation.y = Math.PI / 2 - 0.42; // 朝向中央營火
  vg.add(swHutBuilt.group);
  ctx.addCircleCollider({ x: vx - 9, z: vz + 5.5, r: 3.6 });
  ctx.addCameraOccluder?.(swHutBuilt.group);

  const seHutBuilt = buildMountainTimberHut(hutMats, 1);
  seHutBuilt.group.name = 'bandit_hut_se';
  seHutBuilt.group.position.set(vx + 9.5, 0.06, vz + 5.5);
  seHutBuilt.group.rotation.y = -Math.PI / 2 + 0.42; // 朝向中央營火
  vg.add(seHutBuilt.group);
  ctx.addCircleCollider({ x: vx + 9.5, z: vz + 5.5, r: 3.6 });
  ctx.addCameraOccluder?.(seHutBuilt.group);

  const allSmokePuffs = [...swHutBuilt.smokePuffs, ...seHutBuilt.smokePuffs];

  // -------------------------------------------------------------------------
  // 4. 村中央山賊營火、石圈、鐵三腳架與沸騰黑大鍋（(vx, 0.06, vz)）
  // -------------------------------------------------------------------------
  const campGroup = new THREE.Group();
  campGroup.name = 'bandit_central_campfire';
  campGroup.position.set(vx, 0.06, vz);

  // 焦土灰燼床
  const ashBed = new THREE.Mesh(
    new THREE.CylinderGeometry(1.12, 1.24, 0.09, 18),
    new THREE.MeshStandardMaterial({ color: 0x221d1a, roughness: 0.98 })
  );
  ashBed.position.y = 0.045;
  ashBed.receiveShadow = true;
  campGroup.add(ashBed);

  // 12 顆環狀營火圍石（InstancedMesh）
  const ringStoneCount = 12;
  const ringStoneInst = new THREE.InstancedMesh(
    new THREE.DodecahedronGeometry(0.28, 0),
    mossyStoneMat,
    ringStoneCount
  );
  ringStoneInst.castShadow = true;
  ringStoneInst.receiveShadow = true;

  const dummy = new THREE.Object3D();
  const stoneRand = createSeededRandom(3041);
  for (let i = 0; i < ringStoneCount; i++) {
    const ang = (i / ringStoneCount) * Math.PI * 2;
    const rad = 1.22 + (stoneRand() - 0.5) * 0.1;
    dummy.position.set(Math.cos(ang) * rad, 0.18, Math.sin(ang) * rad);
    dummy.rotation.set(stoneRand(), ang, stoneRand());
    dummy.scale.set(1.15 + stoneRand() * 0.3, 0.72 + stoneRand() * 0.25, 0.95 + stoneRand() * 0.25);
    dummy.updateMatrix();
    ringStoneInst.setMatrixAt(i, dummy.matrix);
  }
  ringStoneInst.instanceMatrix.needsUpdate = true;
  ringStoneInst.computeBoundingSphere();
  campGroup.add(ringStoneInst);

  // 交叉燃燒木柴與紅熱餘燼
  const charredWoodMat = new THREE.MeshStandardMaterial({
    color: 0x2c1b12,
    emissive: 0x5c1a05,
    emissiveIntensity: 0.35,
    roughness: 0.94,
  });
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2 + 0.2;
    const log = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.1, 1.32, 7), charredWoodMat);
    log.position.set(Math.cos(a) * 0.26, 0.2, Math.sin(a) * 0.26);
    log.rotation.set(0.32, a, Math.PI / 2 - 0.24);
    campGroup.add(log);
  }

  const emberCore = new THREE.Mesh(
    new THREE.DodecahedronGeometry(0.45, 0),
    new THREE.MeshBasicMaterial({ color: 0xff5a1f })
  );
  emberCore.scale.set(1.3, 0.42, 1.3);
  emberCore.position.y = 0.18;
  campGroup.add(emberCore);

  // 多層跳動橘金火焰（外焰、中焰、核心金白焰）
  const flameOuter = new THREE.Mesh(
    new THREE.ConeGeometry(0.48, 1.12, 7),
    new THREE.MeshBasicMaterial({ color: 0xff5e1a, transparent: true, opacity: 0.78 })
  );
  flameOuter.position.y = 0.66;
  campGroup.add(flameOuter);

  const flameMid = new THREE.Mesh(
    new THREE.ConeGeometry(0.34, 0.9, 6),
    new THREE.MeshBasicMaterial({ color: 0xffa326, transparent: true, opacity: 0.88 })
  );
  flameMid.position.y = 0.62;
  campGroup.add(flameMid);

  const flameInner = new THREE.Mesh(
    new THREE.ConeGeometry(0.19, 0.62, 6),
    new THREE.MeshBasicMaterial({ color: 0xfff099 })
  );
  flameInner.position.y = 0.52;
  campGroup.add(flameInner);

  // 鍛鐵三腳架與吊掛黑鑄鐵大鍋
  const tripodApexY = 2.45;
  const tripodFootR = 1.38;
  const upAxis = new THREE.Vector3(0, 1, 0);
  const legDir = new THREE.Vector3();
  for (let i = 0; i < 3; i++) {
    const ang = (i / 3) * Math.PI * 2 + 0.4;
    const fx = Math.cos(ang) * tripodFootR;
    const fz = Math.sin(ang) * tripodFootR;
    const legLen = Math.hypot(tripodFootR, tripodApexY);
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.055, legLen, 7), ironMat);
    leg.position.set(fx * 0.5, tripodApexY * 0.5, fz * 0.5);
    legDir.set(-fx, tripodApexY, -fz).normalize();
    leg.quaternion.setFromUnitVectors(upAxis, legDir);
    leg.castShadow = true;
    campGroup.add(leg);
  }

  const apexCollar = new THREE.Mesh(new THREE.TorusGeometry(0.14, 0.045, 6, 12), ironMat);
  apexCollar.rotation.x = Math.PI / 2;
  apexCollar.position.y = tripodApexY - 0.06;
  campGroup.add(apexCollar);

  const hookChain = new THREE.Mesh(new THREE.CylinderGeometry(0.032, 0.032, 1.08, 6), ironMat);
  hookChain.position.y = 1.9;
  campGroup.add(hookChain);

  const cauldronGroup = new THREE.Group();
  cauldronGroup.position.y = 1.18;

  const cauldronBody = new THREE.Mesh(
    new THREE.SphereGeometry(0.56, 16, 12, 0, Math.PI * 2, Math.PI * 0.24, Math.PI * 0.76),
    ironMat
  );
  cauldronBody.castShadow = true;
  cauldronGroup.add(cauldronBody);

  const cauldronRim = new THREE.Mesh(new THREE.TorusGeometry(0.42, 0.055, 8, 18), ironMat);
  cauldronRim.rotation.x = Math.PI / 2;
  cauldronRim.position.y = 0.4;
  cauldronGroup.add(cauldronRim);

  const bailHandle = new THREE.Mesh(
    new THREE.TorusGeometry(0.46, 0.03, 6, 14, Math.PI),
    ironMat
  );
  bailHandle.position.y = 0.36;
  cauldronGroup.add(bailHandle);

  // 鍋中熬煮的溫熱草藥湯面（呼應病患村民劇情）
  const stewSurface = new THREE.Mesh(
    new THREE.CircleGeometry(0.39, 14),
    new THREE.MeshStandardMaterial({
      color: 0x7c9c4a,
      emissive: 0x2d4018,
      emissiveIntensity: 0.45,
      roughness: 0.3,
    })
  );
  stewSurface.rotation.x = -Math.PI / 2;
  stewSurface.position.y = 0.38;
  cauldronGroup.add(stewSurface);

  // 大鍋升起的水蒸氣泡
  const steamMat = new THREE.MeshBasicMaterial({
    color: 0xe6efe8,
    transparent: true,
    opacity: 0.3,
    depthWrite: false,
  });
  const steamWisps: THREE.Mesh[] = [];
  for (let i = 0; i < 4; i++) {
    const wisp = new THREE.Mesh(new THREE.DodecahedronGeometry(0.14 + i * 0.02, 0), steamMat);
    wisp.position.set((i - 1.5) * 0.1, 0.55 + i * 0.28, (i % 2 === 0 ? 1 : -1) * 0.08);
    cauldronGroup.add(wisp);
    steamWisps.push(wisp);
  }

  campGroup.add(cauldronGroup);

  // 飛升火星粒子
  const sparkMat = new THREE.MeshBasicMaterial({ color: 0xffc966 });
  const sparks: Array<{ mesh: THREE.Mesh; phase: number; radius: number; speed: number }> = [];
  for (let i = 0; i < 7; i++) {
    const sp = new THREE.Mesh(new THREE.OctahedronGeometry(0.05, 0), sparkMat);
    campGroup.add(sp);
    sparks.push({
      mesh: sp,
      phase: (i / 7) * Math.PI * 2,
      radius: 0.18 + (i % 3) * 0.16,
      speed: 0.75 + (i % 4) * 0.18,
    });
  }

  // 營火閃爍暖橘點光源
  const fireLight = new THREE.PointLight(0xff842b, 2.5, 25, 1.45);
  fireLight.position.set(0, 1.7, 0);
  campGroup.add(fireLight);

  vg.add(campGroup);
  ctx.addCircleCollider({ x: vx, z: vz, r: 1.7 });

  // 營火、大鍋蒸氣、窗光與煙囪炊煙即時動畫
  ctx.addAnimated((t) => {
    const f1 = Math.sin(t * 11.2) * 0.12 + Math.cos(t * 17.5) * 0.08;
    const f2 = Math.cos(t * 13.7) * 0.1 + Math.sin(t * 7.4) * 0.06;

    flameOuter.scale.set(1 + f1 * 0.55, 1 + f1 * 1.15, 1 - f2 * 0.45);
    flameOuter.rotation.y = t * 1.6;
    flameMid.scale.set(1 - f2 * 0.45, 1 + f2 * 1.25, 1 + f1 * 0.45);
    flameMid.rotation.y = -t * 2.2;
    flameInner.scale.set(1 + f1 * 0.3, 1 + (f1 - f2) * 0.8, 1 + f2 * 0.3);

    fireLight.intensity = 2.4 + Math.sin(t * 10.5) * 0.38 + Math.cos(t * 16.3) * 0.18;
    fireLight.position.x = Math.sin(t * 8.1) * 0.06;
    fireLight.position.z = Math.cos(t * 7.3) * 0.06;

    // 沸騰鍋面輕微起伏與大鍋微晃
    stewSurface.position.y = 0.375 + Math.sin(t * 5.2) * 0.012;
    cauldronGroup.rotation.z = Math.sin(t * 1.35) * 0.025;

    for (let i = 0; i < steamWisps.length; i++) {
      const wisp = steamWisps[i];
      const cycle = (t * 0.52 + i * 0.25) % 1;
      wisp.position.y = 0.5 + cycle * 1.25;
      wisp.position.x = Math.sin(t * 2.2 + i * 1.7) * (0.08 + cycle * 0.18);
      wisp.position.z = Math.cos(t * 1.8 + i * 1.4) * (0.08 + cycle * 0.16);
      const sc = 0.65 + cycle * 1.15;
      wisp.scale.setScalar(sc);
    }

    for (const sp of sparks) {
      const cycle = (t * sp.speed + sp.phase) % 1;
      const ang = t * 1.8 + sp.phase;
      sp.mesh.position.set(
        Math.cos(ang) * sp.radius * (0.6 + cycle),
        0.55 + cycle * 2.35,
        Math.sin(ang) * sp.radius * (0.6 + cycle)
      );
      sp.mesh.scale.setScalar(Math.max(0.05, 1 - cycle));
    }

    // 屋窗微弱壁爐光脈動
    hutWindowGlowMat.emissiveIntensity = 0.68 + Math.sin(t * 3.1) * 0.08;

    // 雙小屋石煙囪嫋嫋炊煙
    for (let i = 0; i < allSmokePuffs.length; i++) {
      const puff = allSmokePuffs[i];
      const cycle = (t * 0.28 + (i % 3) * 0.333 + (i >= 3 ? 0.16 : 0)) % 1;
      puff.position.y = 6.65 + cycle * 2.6;
      puff.scale.setScalar(0.65 + cycle * 1.35);
    }
  });

  // -------------------------------------------------------------------------
  // 5. 營火周邊劈柴堆、原木長凳、Barrel.glb 與苔蘚林間巨岩（InstancedMesh）
  // -------------------------------------------------------------------------
  // 堆疊木柴垛（位於營火東北側 (vx + 3.2, 0.06, vz - 2.6)）
  const firewoodGroup = new THREE.Group();
  firewoodGroup.position.set(vx + 3.2, 0.06, vz - 2.6);
  firewoodGroup.rotation.y = -0.45;

  const logLen = 1.45;
  const firewoodRows: ReadonlyArray<readonly [number, number]> = [
    [4, 0.12],
    [3, 0.32],
    [2, 0.52],
  ];
  for (const [count, ly] of firewoodRows) {
    for (let i = 0; i < count; i++) {
      const lx = (i - (count - 1) / 2) * 0.24;
      const piece = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.115, logLen, 7), logDarkMat);
      piece.rotation.x = Math.PI / 2;
      piece.position.set(lx, ly, 0);
      piece.castShadow = true;
      piece.receiveShadow = true;
      firewoodGroup.add(piece);
    }
  }
  // 旁側劈柴樹樁
  const chopStump = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.38, 0.62, 10), logBarkMat);
  chopStump.position.set(0.92, 0.31, 0.35);
  chopStump.castShadow = true;
  chopStump.receiveShadow = true;
  firewoodGroup.add(chopStump);
  vg.add(firewoodGroup);
  ctx.addCircleCollider({ x: vx + 3.2, z: vz - 2.6, r: 1.15 });

  // 營火旁兩張粗原木坐凳（完全讓開 NPC 位置與入口動線）
  const benchSpecs: ReadonlyArray<{ x: number; z: number; rotY: number }> = [
    { x: vx + 3.4, z: vz + 1.1, rotY: -1.25 },
    { x: vx - 0.6, z: vz - 3.6, rotY: 0.18 },
  ];
  for (const bs of benchSpecs) {
    const bench = new THREE.Group();
    bench.position.set(bs.x, 0.06, bs.z);
    bench.rotation.y = bs.rotY;

    const seatLog = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.26, 2.25, 9), logDarkMat);
    seatLog.rotation.z = Math.PI / 2;
    seatLog.position.y = 0.44;
    seatLog.castShadow = true;
    seatLog.receiveShadow = true;
    bench.add(seatLog);

    for (const lx of [-0.78, 0.78]) {
      const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.16, 0.42, 7), logBarkMat);
      leg.position.set(lx, 0.21, 0);
      bench.add(leg);
    }
    vg.add(bench);
    ctx.addCircleCollider({ x: bs.x, z: bs.z, r: 0.95 });
  }

  // Barrel.glb 雜物桶群（避開奇運亞歷山大石 (-58, -98) 與出生點 (-62, -90)，barrels[0] 與 House_3.glb 留足淨空）
  const barrels: ReadonlyArray<{ x: number; z: number; h: number; rotY: number; r?: number }> = [
    { x: vx - 3.4, z: vz - 5.0, h: 0.62, rotY: 0.4, r: 0.6 },
    { x: vx - 3.6, z: vz - 6.0, h: 0.56, rotY: 1.8 },
    { x: vx + 4.9, z: vz + 3.0, h: 0.6, rotY: 0.9, r: 0.6 },
    { x: vx + 5.7, z: vz + 2.4, h: 0.56, rotY: 2.3 },
    { x: vx - 5.6, z: vz + 8.1, h: 0.58, rotY: 1.2, r: 0.55 },
  ];
  for (const b of barrels) {
    ctx.models.place(vg, 'Barrel.glb', {
      x: b.x,
      y: 0.06,
      z: b.z,
      targetHeight: b.h,
      rotY: b.rotY,
    });
    if (b.r !== undefined) {
      ctx.addCircleCollider({ x: b.x, z: b.z, r: b.r });
    }
  }

  // 外緣苔蘚巨岩與密林蕨叢（InstancedMesh，避開入口、出生點、拾取點與所有木屋）
  const boulderMax = 18;
  const boulderInst = new THREE.InstancedMesh(
    new THREE.DodecahedronGeometry(1, 0),
    new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.94, flatShading: true }),
    boulderMax
  );
  boulderInst.castShadow = true;
  boulderInst.receiveShadow = true;

  const fernMax = 48;
  const fernInst = new THREE.InstancedMesh(
    new THREE.ConeGeometry(0.42, 0.9, 5),
    new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.9, flatShading: true }),
    fernMax
  );

  const pickupX = vx + 4;
  const pickupZ = vz + 8;
  const npcX = vx - 3.2; // -65.2
  const npcZ = vz + 2.5; // -103.5

  const isPropSpotClear = (px: number, pz: number, margin: number): boolean => {
    // 保留出生點 (-62, -90) 與南門通行走廊淨空
    if (Math.hypot(px - sx, pz - sz) < 6.5 + margin) return false;
    if (Math.abs(px - vx) < 5.2 + margin && pz > vz + 5.5 && pz < vz + 18) return false;
    // 保留奇運亞歷山大石拾取點 (-58, -98) 淨空
    if (Math.hypot(px - pickupX, pz - pickupZ) < 2.8 + margin) return false;
    // 保留營火核心區與 NPC 淨空
    if (Math.hypot(px - vx, pz - vz) < 8.8) return false;
    if (Math.hypot(px - npcX, pz - npcZ) < 3.2 + margin) return false;
    // 避開四棟木屋
    if (Math.hypot(px - (vx - 8.5), pz - (vz - 5)) < 4.8 + margin) return false;
    if (Math.hypot(px - (vx + 8.5), pz - (vz - 4)) < 4.8 + margin) return false;
    if (Math.hypot(px - (vx - 9), pz - (vz + 5.5)) < 4.4 + margin) return false;
    if (Math.hypot(px - (vx + 9.5), pz - (vz + 5.5)) < 4.4 + margin) return false;
    // 避開柵欄門翼柱
    if (Math.hypot(px - (vx - 5.2), pz - gateZ) < 2.6 + margin) return false;
    if (Math.hypot(px - (vx + 5.2), pz - gateZ) < 2.6 + margin) return false;
    return true;
  };

  const rand = createSeededRandom(4423);
  const tmpCol = new THREE.Color();

  let bPlaced = 0;
  let bAttempts = 0;
  while (bPlaced < boulderMax && bAttempts < 600) {
    bAttempts++;
    const ang = rand() * Math.PI * 2;
    const dist = 11.2 + rand() * 5.6;
    const bx = vx + Math.cos(ang) * dist;
    const bz = vz + Math.sin(ang) * dist;
    if (!isPropSpotClear(bx, bz, 1.0)) continue;

    const sc = 0.65 + rand() * 0.85;
    dummy.position.set(bx, sc * 0.36, bz);
    dummy.rotation.set(rand() * 0.8, rand() * Math.PI * 2, rand() * 0.8);
    dummy.scale.set(sc * 1.25, sc * 0.72, sc * 1.05);
    dummy.updateMatrix();
    boulderInst.setMatrixAt(bPlaced, dummy.matrix);

    // 帶青苔灰綠調的森林巨石
    tmpCol.setHSL(0.28 + (rand() - 0.5) * 0.06, 0.14 + rand() * 0.1, 0.33 + rand() * 0.1);
    boulderInst.setColorAt(bPlaced, tmpCol);
    if (sc > 1.05) {
      ctx.addCircleCollider({ x: bx, z: bz, r: sc * 0.95 });
    }
    bPlaced++;
  }
  boulderInst.count = bPlaced;
  boulderInst.instanceMatrix.needsUpdate = true;
  if (boulderInst.instanceColor) boulderInst.instanceColor.needsUpdate = true;
  boulderInst.computeBoundingSphere();

  let fPlaced = 0;
  let fAttempts = 0;
  while (fPlaced < fernMax && fAttempts < 1000) {
    fAttempts++;
    const ang = rand() * Math.PI * 2;
    const dist = 10.0 + rand() * 7.2;
    const fx = vx + Math.cos(ang) * dist;
    const fz = vz + Math.sin(ang) * dist;
    if (!isPropSpotClear(fx, fz, 0.3)) continue;

    const sc = 0.65 + rand() * 0.75;
    dummy.position.set(fx, 0.38 * sc, fz);
    dummy.rotation.set((rand() - 0.5) * 0.25, rand() * Math.PI * 2, (rand() - 0.5) * 0.25);
    dummy.scale.set(sc * 1.15, sc * 0.85, sc * 1.15);
    dummy.updateMatrix();
    fernInst.setMatrixAt(fPlaced, dummy.matrix);

    tmpCol.setHSL(0.34 + (rand() - 0.5) * 0.05, 0.42, 0.2 + rand() * 0.1);
    fernInst.setColorAt(fPlaced, tmpCol);
    fPlaced++;
  }
  fernInst.count = fPlaced;
  fernInst.instanceMatrix.needsUpdate = true;
  if (fernInst.instanceColor) fernInst.instanceColor.needsUpdate = true;
  fernInst.computeBoundingSphere();

  vg.add(boulderInst, fernInst);

  // -------------------------------------------------------------------------
  // 6. 山賊之村村民 NPC（奇運亞歷山大石線索）
  // -------------------------------------------------------------------------
  const banditChiefNpc = ctx.createNpcMesh(0x525e42, 0xf2d5b8, 0x26211d);
  banditChiefNpc.position.set(npcX, 0.06, npcZ);
  banditChiefNpc.rotation.y = 0.55;
  vg.add(banditChiefNpc);

  ctx.addInteractable({
    id: 'npc_bandit_chief',
    label: '與山賊之村村民對話（奇運亞歷山大石線索）',
    position: new THREE.Vector3(npcX, 0, npcZ),
    radius: 3.8,
    kind: 'npc',
  });

  return vg;
}
