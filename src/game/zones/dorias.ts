import * as THREE from 'three';
import { ModelLibrary } from '../assets';

export interface DoriasBuildContext {
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

export const DORIAS_CENTER = { x: -52, z: -26 } as const;

function createSandstonePlazaTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#b48d57';
  ctx.fillRect(0, 0, 512, 512);

  let seed = 7717;
  const rand = () => {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  };

  const rows = 12;
  const cols = 12;
  const rh = 512 / rows;
  const cw = 512 / cols;

  for (let r = 0; r < rows; r++) {
    const off = (r % 2) * (cw * 0.5);
    for (let c = -1; c <= cols; c++) {
      const shade = Math.floor((rand() - 0.5) * 24);
      const R = Math.min(255, Math.max(0, 224 + shade));
      const G = Math.min(255, Math.max(0, 190 + Math.floor(shade * 0.85)));
      const B = Math.min(255, Math.max(0, 134 + Math.floor(shade * 0.65)));
      ctx.fillStyle = `rgb(${R},${G},${B})`;
      ctx.fillRect(c * cw + off + 2, r * rh + 2, cw - 4, rh - 4);
    }
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(7, 7);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function createSandstoneBrickTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#a88149';
  ctx.fillRect(0, 0, 512, 512);

  let seed = 4219;
  const rand = () => {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  };

  const rows = 16;
  const cols = 8;
  const rh = 512 / rows;
  const cw = 512 / cols;

  for (let r = 0; r < rows; r++) {
    const off = (r % 2) * (cw * 0.5);
    for (let c = -1; c <= cols; c++) {
      const shade = Math.floor((rand() - 0.5) * 22);
      const R = Math.min(255, Math.max(0, 232 + shade));
      const G = Math.min(255, Math.max(0, 194 + Math.floor(shade * 0.85)));
      const B = Math.min(255, Math.max(0, 118 + Math.floor(shade * 0.65)));
      ctx.fillStyle = `rgb(${R},${G},${B})`;
      ctx.fillRect(c * cw + off + 2, r * rh + 2, cw - 4, rh - 4);
    }
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(2.5, 3);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function createRoyalBlueSpireTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#184487';
  ctx.fillRect(0, 0, 256, 256);

  const rows = 10;
  const cols = 8;
  const rh = 256 / rows;
  const cw = 256 / cols;

  for (let r = 0; r < rows; r++) {
    const off = (r % 2) * (cw * 0.5);
    for (let c = -1; c <= cols; c++) {
      ctx.fillStyle = (r + c) % 2 === 0 ? '#215db0' : '#296cc7';
      ctx.beginPath();
      ctx.arc(c * cw + off + cw * 0.5, r * rh + rh * 0.65, cw * 0.48, 0, Math.PI);
      ctx.fill();
    }
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(4, 3);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function createDoriasMarqueeSign(): THREE.Group {
  const signGroup = new THREE.Group();

  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 160;
  const ctx = canvas.getContext('2d')!;

  const grad = ctx.createLinearGradient(0, 0, 0, 160);
  grad.addColorStop(0, '#0f1e42');
  grad.addColorStop(0.5, '#193266');
  grad.addColorStop(1, '#0d1936');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 512, 160);

  ctx.strokeStyle = '#f2c85b';
  ctx.lineWidth = 10;
  ctx.strokeRect(8, 8, 496, 144);

  ctx.strokeStyle = '#ffebb0';
  ctx.lineWidth = 2.5;
  ctx.strokeRect(20, 20, 472, 120);

  // Corner diamond casino ornaments
  ctx.fillStyle = '#f2c85b';
  for (const [cx, cy] of [
    [34, 34],
    [478, 34],
    [34, 126],
    [478, 126],
  ]) {
    ctx.beginPath();
    ctx.moveTo(cx, cy - 8);
    ctx.lineTo(cx + 8, cy);
    ctx.lineTo(cx, cy + 8);
    ctx.lineTo(cx - 8, cy);
    ctx.closePath();
    ctx.fill();
  }

  ctx.textAlign = 'center';
  ctx.shadowColor = '#f5c242';
  ctx.shadowBlur = 12;
  ctx.fillStyle = '#ffe58f';
  ctx.font = 'bold 40px sans-serif';
  ctx.fillText('DORIAS CASINO', 256, 74);

  ctx.shadowBlur = 6;
  ctx.fillStyle = '#fff3cf';
  ctx.font = 'bold 26px sans-serif';
  ctx.fillText('賭博都市・多里亞斯', 256, 120);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;

  const goldFrameMat = new THREE.MeshStandardMaterial({
    color: 0xe8bd4c,
    metalness: 0.62,
    roughness: 0.28,
  });

  const backing = new THREE.Mesh(new THREE.BoxGeometry(6.4, 2.05, 0.26), goldFrameMat);
  signGroup.add(backing);

  const faceMat = new THREE.MeshStandardMaterial({
    map: tex,
    emissive: 0x2b2008,
    emissiveIntensity: 0.35,
    roughness: 0.38,
  });
  const frontFace = new THREE.Mesh(new THREE.PlaneGeometry(6.15, 1.88), faceMat);
  frontFace.position.z = 0.14;
  signGroup.add(frontFace);

  const backFace = new THREE.Mesh(new THREE.PlaneGeometry(6.15, 1.88), faceMat);
  backFace.position.z = -0.14;
  backFace.rotation.y = Math.PI;
  signGroup.add(backFace);

  // Decorative top gilded crest
  const crest = new THREE.Mesh(new THREE.OctahedronGeometry(0.32, 0), goldFrameMat);
  crest.scale.set(1.3, 0.85, 0.5);
  crest.position.set(0, 1.28, 0);
  signGroup.add(crest);

  return signGroup;
}

function createArchedWindow(
  frameMat: THREE.Material,
  glassMat: THREE.Material,
  sillMat: THREE.Material,
  width = 1.05,
  height = 2.05
): THREE.Group {
  const wg = new THREE.Group();

  const frame = new THREE.Mesh(new THREE.BoxGeometry(width + 0.28, height + 0.22, 0.26), frameMat);
  wg.add(frame);

  const archRim = new THREE.Mesh(
    new THREE.TorusGeometry((width + 0.2) * 0.5, 0.12, 8, 16, Math.PI),
    sillMat
  );
  archRim.position.set(0, height * 0.5, 0.08);
  wg.add(archRim);

  const paneRect = new THREE.Mesh(new THREE.PlaneGeometry(width, height), glassMat);
  paneRect.position.z = 0.14;
  wg.add(paneRect);

  const paneArch = new THREE.Mesh(
    new THREE.CircleGeometry(width * 0.5, 16, 0, Math.PI),
    glassMat
  );
  paneArch.position.set(0, height * 0.5, 0.14);
  wg.add(paneArch);

  const sill = new THREE.Mesh(new THREE.BoxGeometry(width + 0.44, 0.18, 0.42), sillMat);
  sill.position.set(0, -height * 0.5 - 0.12, 0.08);
  wg.add(sill);

  return wg;
}

function createStylizedPalmTree(
  height: number,
  leanAngle: number,
  leanStrength: number,
  materials: {
    planterMat: THREE.Material;
    soilMat: THREE.Material;
    trunkLightMat: THREE.Material;
    trunkDarkMat: THREE.Material;
    frondMat: THREE.Material;
    frondTipMat: THREE.Material;
    coconutMat: THREE.Material;
  }
): { root: THREE.Group; crown: THREE.Group } {
  const root = new THREE.Group();

  // Sandstone planter curb & soil
  const planter = new THREE.Mesh(new THREE.CylinderGeometry(1.12, 1.24, 0.42, 14), materials.planterMat);
  planter.position.y = 0.21;
  planter.receiveShadow = true;
  planter.castShadow = true;
  root.add(planter);

  const soil = new THREE.Mesh(new THREE.CylinderGeometry(0.95, 0.95, 0.44, 12), materials.soilMat);
  soil.position.y = 0.22;
  root.add(soil);

  // Curved segmented brown trunk (7 tapered bark segments stepping along a graceful arc)
  const segments = 7;
  const segH = height / segments;
  const dirX = Math.cos(leanAngle);
  const dirZ = Math.sin(leanAngle);

  let curX = 0;
  let curY = 0.35;
  let curZ = 0;

  for (let i = 0; i < segments; i++) {
    const t0 = i / segments;
    const t1 = (i + 1) / segments;
    const curve0 = t0 * t0 * leanStrength;
    const curve1 = t1 * t1 * leanStrength;
    const nextX = dirX * curve1;
    const nextY = 0.35 + t1 * height;
    const nextZ = dirZ * curve1;

    const midX = (curX + nextX) * 0.5;
    const midY = (curY + nextY) * 0.5;
    const midZ = (curZ + nextZ) * 0.5;

    const rBot = 0.44 - t0 * 0.2;
    const rTop = 0.4 - t1 * 0.19;
    const segLen = Math.hypot(nextX - curX, nextY - curY, nextZ - curZ) + 0.12;

    const seg = new THREE.Mesh(
      new THREE.CylinderGeometry(rTop, rBot, segLen, 9),
      i % 2 === 0 ? materials.trunkLightMat : materials.trunkDarkMat
    );
    seg.position.set(midX, midY, midZ);
    const tilt = Math.atan2(curve1 - curve0, segH);
    seg.rotation.y = -leanAngle;
    seg.rotation.z = -tilt;
    seg.castShadow = true;
    seg.receiveShadow = true;
    root.add(seg);

    curX = nextX;
    curY = nextY;
    curZ = nextZ;
  }

  // Crown group (for gentle breeze sway)
  const crown = new THREE.Group();
  crown.position.set(curX, curY, curZ);

  // 3 small glossy coconuts tucked under the fronds
  for (let c = 0; c < 3; c++) {
    const ca = (c / 3) * Math.PI * 2 + 0.4;
    const nut = new THREE.Mesh(new THREE.SphereGeometry(0.24, 10, 8), materials.coconutMat);
    nut.scale.set(0.95, 1.15, 0.95);
    nut.position.set(Math.cos(ca) * 0.34, -0.22, Math.sin(ca) * 0.34);
    nut.castShadow = true;
    crown.add(nut);
  }

  // 7 arching palm fronds fanning outward (3 articulated tapered leaf segments per frond)
  const frondCount = 7;
  const baseLeafGeo = new THREE.BoxGeometry(0.74, 0.08, 1.45);
  const midLeafGeo = new THREE.BoxGeometry(0.92, 0.07, 1.6);
  const tipLeafGeo = new THREE.ConeGeometry(0.46, 1.45, 4);

  for (let f = 0; f < frondCount; f++) {
    const fa = (f / frondCount) * Math.PI * 2 + (f % 2) * 0.14;
    const frondPivot = new THREE.Group();
    frondPivot.rotation.y = fa;

    // Slight alternating upper/lower frond pitch for lush layered silhouette
    const lift = f % 2 === 0 ? 0.34 : 0.14;

    const seg1 = new THREE.Mesh(baseLeafGeo, materials.frondMat);
    seg1.position.set(0, 0.24 + lift * 0.4, 0.72);
    seg1.rotation.x = -0.32 - lift * 0.45;
    seg1.castShadow = true;
    frondPivot.add(seg1);

    const seg2 = new THREE.Mesh(midLeafGeo, materials.frondMat);
    seg2.position.set(0, 0.4 + lift * 0.75, 2.02);
    seg2.rotation.x = 0.16 - lift * 0.25;
    seg2.castShadow = true;
    frondPivot.add(seg2);

    const seg3 = new THREE.Mesh(tipLeafGeo, materials.frondTipMat);
    seg3.scale.set(1.0, 1.0, 0.22);
    seg3.position.set(0, -0.05 + lift * 0.55, 3.22);
    seg3.rotation.x = Math.PI * 0.5 + 0.62;
    seg3.castShadow = true;
    frondPivot.add(seg3);

    crown.add(frondPivot);
  }

  root.add(crown);
  return { root, crown };
}

/**
 * 賭博都市・多里亞斯（Gambling City of Dorias）獨立場景模組
 * - 暖金砂岩圓形廣場（r = 21）＋鑲金輪盤環飾＋暖金點光源
 * - 宏偉金沙色藍頂賭場城堡（東向大理石階梯與紅金迎賓地毯、拱廊門廊、5 座多層圓塔與皇家藍尖頂、旋轉二十面風險金骰）
 * - 6 株多層彎幹展開式熱帶棕櫚樹（附椰子叢，完全避開 spawnPos [-38, -26] 與風險骰子拾取點 [-46, -22]）
 * - 4 盞金色賭城路燈（InstancedMesh）＋賭場之王 NPC
 */
export function buildDoriasZone(ctx: DoriasBuildContext): THREE.Group {
  const dg = new THREE.Group();
  dg.name = 'zone_dorias';

  const dx = DORIAS_CENTER.x; // -52
  const dz = DORIAS_CENTER.z; // -26

  const plazaTex = createSandstonePlazaTexture();
  const brickTex = createSandstoneBrickTexture();
  const blueSpireTex = createRoyalBlueSpireTexture();

  const sandstoneWallMat = new THREE.MeshStandardMaterial({ map: brickTex, roughness: 0.62 });
  const sandstoneTrimMat = new THREE.MeshStandardMaterial({ color: 0xf4e3bd, roughness: 0.52 });
  const marbleMat = new THREE.MeshStandardMaterial({ color: 0xf8f3e8, roughness: 0.42 });
  const blueSpireMat = new THREE.MeshStandardMaterial({ map: blueSpireTex, color: 0xffffff, roughness: 0.38 });
  const royalBlueSolidMat = new THREE.MeshStandardMaterial({ color: 0x215db0, roughness: 0.42 });
  const goldMat = new THREE.MeshStandardMaterial({
    color: 0xf2c85b,
    metalness: 0.62,
    roughness: 0.26,
  });
  const crimsonMat = new THREE.MeshStandardMaterial({ color: 0xa62639, roughness: 0.72 });
  const darkNavyMat = new THREE.MeshStandardMaterial({ color: 0x2c4b82, roughness: 0.55 });
  const bronzeRecessMat = new THREE.MeshStandardMaterial({ color: 0x664d30, roughness: 0.75 });
  const warmWinGlassMat = new THREE.MeshBasicMaterial({ color: 0xffe494 });

  // =========================================================================
  // 1. 暖金砂岩圓形廣場（r = 21）＋鑲金輪盤環飾＋暖金點光源
  // =========================================================================
  const plaza = new THREE.Mesh(
    new THREE.CylinderGeometry(20.6, 21.4, 0.2, 48),
    new THREE.MeshStandardMaterial({ map: plazaTex, roughness: 0.78 })
  );
  plaza.position.set(dx, 0.1, dz);
  plaza.receiveShadow = true;
  dg.add(plaza);

  // 鑲金雙環邊框
  for (const [rIn, rOut, col] of [
    [19.5, 20.3, 0xf2c85b],
    [16.2, 16.65, 0xe8bd4c],
    [8.2, 8.55, 0xf2c85b],
  ] as const) {
    const ring = new THREE.Mesh(
      new THREE.RingGeometry(rIn, rOut, 56),
      new THREE.MeshStandardMaterial({
        color: col,
        metalness: 0.48,
        roughness: 0.36,
        side: THREE.DoubleSide,
      })
    );
    ring.rotation.x = -Math.PI / 2;
    ring.position.set(dx, 0.208, dz);
    ring.receiveShadow = true;
    dg.add(ring);
  }

  // 24 格紅藍交替輪盤鑲嵌環（InstancedMesh）
  const rouletteCount = 24;
  const rouletteSegGeo = new THREE.BoxGeometry(2.05, 0.03, 1.35);
  const rouletteInst = new THREE.InstancedMesh(
    rouletteSegGeo,
    new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.52 }),
    rouletteCount
  );
  const dummy = new THREE.Object3D();
  const tmpCol = new THREE.Color();
  for (let i = 0; i < rouletteCount; i++) {
    const a = (i / rouletteCount) * Math.PI * 2;
    const rad = 18.0;
    dummy.position.set(dx + Math.cos(a) * rad, 0.205, dz + Math.sin(a) * rad);
    dummy.rotation.set(0, -a + Math.PI / 2, 0);
    dummy.scale.set(1, 1, 1);
    dummy.updateMatrix();
    rouletteInst.setMatrixAt(i, dummy.matrix);
    tmpCol.setHex(i % 2 === 0 ? 0xa62639 : 0x1b3668);
    rouletteInst.setColorAt(i, tmpCol);
  }
  rouletteInst.instanceMatrix.needsUpdate = true;
  if (rouletteInst.instanceColor) rouletteInst.instanceColor.needsUpdate = true;
  rouletteInst.computeBoundingSphere();
  rouletteInst.receiveShadow = true;
  dg.add(rouletteInst);

  // 暖金陽光氛圍點光源
  const plazaWarmLight = new THREE.PointLight(0xffcb72, 2.2, 50, 1.35);
  plazaWarmLight.position.set(dx + 2, 11.0, dz);
  dg.add(plazaWarmLight);

  // =========================================================================
  // 2. 宏偉金沙色賭場城堡（Grand Golden Casino Castle at (dx - 7, 0.2, dz)）
  // =========================================================================
  const castleGroup = new THREE.Group();
  castleGroup.name = 'dorias_casino_castle';
  castleGroup.position.set(dx - 7, 0.2, dz);

  // 石砌高基座
  const castlePlinth = new THREE.Mesh(new THREE.BoxGeometry(12.2, 0.72, 11.2), sandstoneTrimMat);
  castlePlinth.position.y = 0.36;
  castlePlinth.receiveShadow = true;
  castlePlinth.castShadow = true;
  castleGroup.add(castlePlinth);

  // 主堡兩層砂岩堡體
  const mainKeep = new THREE.Mesh(new THREE.BoxGeometry(10.6, 8.6, 9.4), sandstoneWallMat);
  mainKeep.position.y = 5.0;
  mainKeep.castShadow = true;
  mainKeep.receiveShadow = true;
  castleGroup.add(mainKeep);

  const upperKeep = new THREE.Mesh(new THREE.BoxGeometry(7.6, 3.2, 6.8), sandstoneWallMat);
  upperKeep.position.y = 10.9;
  upperKeep.castShadow = true;
  upperKeep.receiveShadow = true;
  castleGroup.add(upperKeep);

  // 金色水平腰線與屋頂石線腳
  const lowerBelt = new THREE.Mesh(new THREE.BoxGeometry(11.0, 0.34, 9.8), goldMat);
  lowerBelt.position.y = 5.2;
  castleGroup.add(lowerBelt);

  const roofCornice = new THREE.Mesh(new THREE.BoxGeometry(11.1, 0.42, 9.9), sandstoneTrimMat);
  roofCornice.position.y = 9.3;
  castleGroup.add(roofCornice);

  const upperCornice = new THREE.Mesh(new THREE.BoxGeometry(8.1, 0.36, 7.3), goldMat);
  upperCornice.position.y = 12.55;
  castleGroup.add(upperCornice);

  // 城堡屋頂城垛（Battlements — InstancedMesh）
  const merlonPositions: Array<[number, number, number]> = [];
  for (const mx of [-4.2, -2.1, 0, 2.1, 4.2]) {
    merlonPositions.push([mx, 9.82, -4.65], [mx, 9.82, 4.65]);
  }
  for (const mz of [-2.4, 0, 2.4]) {
    merlonPositions.push([-5.25, 9.82, mz], [5.25, 9.82, mz]);
  }
  for (const mx of [-2.8, 0, 2.8]) {
    merlonPositions.push([mx, 13.0, -3.35], [mx, 13.0, 3.35]);
  }
  for (const mz of [-1.4, 1.4]) {
    merlonPositions.push([-3.75, 13.0, mz], [3.75, 13.0, mz]);
  }
  const merlonInst = new THREE.InstancedMesh(
    new THREE.BoxGeometry(0.86, 0.72, 0.62),
    sandstoneTrimMat,
    merlonPositions.length
  );
  for (let i = 0; i < merlonPositions.length; i++) {
    const [mx, my, mz] = merlonPositions[i];
    dummy.position.set(mx, my, mz);
    dummy.rotation.set(0, 0, 0);
    dummy.scale.set(1, 1, 1);
    dummy.updateMatrix();
    merlonInst.setMatrixAt(i, dummy.matrix);
  }
  merlonInst.instanceMatrix.needsUpdate = true;
  merlonInst.computeBoundingSphere();
  merlonInst.castShadow = true;
  castleGroup.add(merlonInst);

  // 東向大理石迎賓階梯＋紅金地毯（朝向 +X spawnPos: [-38, 0, -26]）
  for (let s = 0; s < 4; s++) {
    const stepW = 1.05;
    const stepH = 0.18 * (4 - s);
    const step = new THREE.Mesh(new THREE.BoxGeometry(stepW, stepH, 6.4 + s * 0.45), marbleMat);
    step.position.set(6.0 + s * 0.72, stepH * 0.5, 0);
    step.receiveShadow = true;
    castleGroup.add(step);

    const carpetStep = new THREE.Mesh(new THREE.BoxGeometry(stepW + 0.04, 0.04, 2.9), crimsonMat);
    carpetStep.position.set(6.0 + s * 0.72, stepH + 0.02, 0);
    castleGroup.add(carpetStep);
  }

  // 紅金迎賓長地毯延伸至廣場
  const carpetRunner = new THREE.Mesh(new THREE.BoxGeometry(4.2, 0.04, 2.9), crimsonMat);
  carpetRunner.position.set(10.1, 0.02, 0);
  carpetRunner.receiveShadow = true;
  castleGroup.add(carpetRunner);
  for (const gz of [-1.48, 1.48]) {
    const carpetGoldBorder = new THREE.Mesh(new THREE.BoxGeometry(4.25, 0.045, 0.14), goldMat);
    carpetGoldBorder.position.set(10.1, 0.024, gz);
    castleGroup.add(carpetGoldBorder);
  }

  // 東向拱廊入口（Arched Entrance Colonnade）＋二樓陽台欄杆（Balcony Balustrades）
  const porticoDeck = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.34, 6.8), sandstoneTrimMat);
  porticoDeck.position.set(6.2, 4.95, 0);
  porticoDeck.castShadow = true;
  castleGroup.add(porticoDeck);

  // 4 根東向拱廊柱＋3 道半圓金砂岩拱券
  const colZ = [-3.0, -1.0, 1.0, 3.0];
  for (const cz of colZ) {
    const colBase = new THREE.Mesh(new THREE.BoxGeometry(0.68, 0.48, 0.68), marbleMat);
    colBase.position.set(6.95, 0.96, cz);
    castleGroup.add(colBase);

    const colShaft = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.28, 3.55, 12), sandstoneTrimMat);
    colShaft.position.set(6.95, 2.95, cz);
    colShaft.castShadow = true;
    castleGroup.add(colShaft);

    const colCap = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.26, 0.62), goldMat);
    colCap.position.set(6.95, 4.78, cz);
    castleGroup.add(colCap);
  }

  for (const az of [-2.0, 0, 2.0]) {
    const arch = new THREE.Mesh(new THREE.TorusGeometry(0.96, 0.16, 8, 18, Math.PI), sandstoneTrimMat);
    arch.rotation.y = Math.PI / 2;
    arch.position.set(6.95, 3.9, az);
    castleGroup.add(arch);
  }

  // 東向拱形發光賭場大門
  const grandDoor = createArchedWindow(bronzeRecessMat, warmWinGlassMat, goldMat, 2.35, 3.1);
  grandDoor.position.set(5.32, 2.3, 0);
  grandDoor.rotation.y = Math.PI / 2;
  castleGroup.add(grandDoor);

  // 二樓陽台石柱欄杆（InstancedMesh）
  const balusterOffsets: Array<[number, number]> = [];
  for (let i = 0; i < 9; i++) {
    balusterOffsets.push([7.15, -3.1 + i * 0.775]);
  }
  for (const side of [-1, 1]) {
    balusterOffsets.push([6.25, side * 3.1], [5.6, side * 3.1]);
  }
  const balusterInst = new THREE.InstancedMesh(
    new THREE.CylinderGeometry(0.08, 0.11, 0.92, 8),
    marbleMat,
    balusterOffsets.length
  );
  for (let i = 0; i < balusterOffsets.length; i++) {
    const [bx, bz] = balusterOffsets[i];
    dummy.position.set(bx, 5.58, bz);
    dummy.rotation.set(0, 0, 0);
    dummy.scale.set(1, 1, 1);
    dummy.updateMatrix();
    balusterInst.setMatrixAt(i, dummy.matrix);
  }
  balusterInst.instanceMatrix.needsUpdate = true;
  balusterInst.computeBoundingSphere();
  castleGroup.add(balusterInst);

  const frontRail = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.16, 6.7), sandstoneTrimMat);
  frontRail.position.set(7.15, 6.08, 0);
  castleGroup.add(frontRail);
  for (const side of [-1, 1]) {
    const sideRail = new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.16, 0.24), sandstoneTrimMat);
    sideRail.position.set(6.25, 6.08, side * 3.15);
    castleGroup.add(sideRail);
  }

  // 凹入式暖金發光拱窗（東、南、北、西立面）
  for (const wz of [-2.4, 2.4]) {
    const eastUpperWin = createArchedWindow(bronzeRecessMat, warmWinGlassMat, goldMat, 1.0, 1.9);
    eastUpperWin.position.set(5.34, 6.95, wz);
    eastUpperWin.rotation.y = Math.PI / 2;
    castleGroup.add(eastUpperWin);

    const westWin = createArchedWindow(bronzeRecessMat, warmWinGlassMat, goldMat, 1.0, 1.9);
    westWin.position.set(-5.34, 6.7, wz);
    westWin.rotation.y = -Math.PI / 2;
    castleGroup.add(westWin);
  }
  for (const wx of [-2.1, 0, 2.1]) {
    const northWin = createArchedWindow(bronzeRecessMat, warmWinGlassMat, goldMat, 0.95, 1.85);
    northWin.position.set(wx, 6.75, -4.74);
    northWin.rotation.y = Math.PI;
    castleGroup.add(northWin);

    const southWin = createArchedWindow(bronzeRecessMat, warmWinGlassMat, goldMat, 0.95, 1.85);
    southWin.position.set(wx, 6.75, 4.74);
    castleGroup.add(southWin);
  }
  // 上層主殿東面中央大拱窗
  const clerestoryWin = createArchedWindow(bronzeRecessMat, warmWinGlassMat, goldMat, 1.25, 1.7);
  clerestoryWin.position.set(3.84, 10.9, 0);
  clerestoryWin.rotation.y = Math.PI / 2;
  castleGroup.add(clerestoryWin);

  // 華麗金框深藍賭城招牌（DORIAS CASINO / 賭博都市・多里亞斯）立於東向拱廊正上方
  const marquee = createDoriasMarqueeSign();
  marquee.position.set(6.85, 7.65, 0);
  marquee.rotation.y = Math.PI / 2;
  castleGroup.add(marquee);

  // 招牌金色支撐柱
  for (const sz of [-2.2, 2.2]) {
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.13, 1.65, 8), goldMat);
    post.position.set(6.85, 6.0, sz);
    castleGroup.add(post);
  }

  // 5 座多層圓柱砂岩塔樓（1 座中央高塔 h = 16.5 + 4 座角塔 h = 11.6..13.0，配挑出簷口、金腰線、皇家藍尖頂 0x215db0 與金色塔尖）
  const towerSpecs: Array<{
    ox: number;
    oz: number;
    h: number;
    rTop: number;
    rBot: number;
    spireH: number;
    isCentral?: boolean;
  }> = [
    { ox: 0, oz: 0, h: 16.5, rTop: 2.15, rBot: 2.55, spireH: 6.8, isCentral: true },
    { ox: -5.1, oz: -4.6, h: 13.0, rTop: 1.55, rBot: 1.85, spireH: 5.4 },
    { ox: -5.1, oz: 4.6, h: 13.0, rTop: 1.55, rBot: 1.85, spireH: 5.4 },
    { ox: 4.9, oz: -4.6, h: 11.6, rTop: 1.48, rBot: 1.76, spireH: 5.0 },
    { ox: 4.9, oz: 4.6, h: 11.6, rTop: 1.48, rBot: 1.76, spireH: 5.0 },
  ];

  const corbelTransforms: Array<{ x: number; y: number; z: number; rotY: number }> = [];

  for (const ts of towerSpecs) {
    // 塔基石座
    const tBase = new THREE.Mesh(
      new THREE.CylinderGeometry(ts.rBot + 0.18, ts.rBot + 0.34, 1.1, 18),
      sandstoneTrimMat
    );
    tBase.position.set(ts.ox, 0.55, ts.oz);
    tBase.receiveShadow = true;
    castleGroup.add(tBase);

    // 主塔身
    const lowerH = ts.h * 0.78;
    const tShaft = new THREE.Mesh(
      new THREE.CylinderGeometry(ts.rTop, ts.rBot, lowerH, 20),
      sandstoneWallMat
    );
    tShaft.position.set(ts.ox, lowerH * 0.5 + 0.4, ts.oz);
    tShaft.castShadow = true;
    tShaft.receiveShadow = true;
    castleGroup.add(tShaft);

    // 上層外擴觀景塔段（Multi-tiered crown）
    const upperTierH = ts.h * 0.22;
    const upperTierY = lowerH + 0.4 + upperTierH * 0.5;
    const upperTier = new THREE.Mesh(
      new THREE.CylinderGeometry(ts.rTop + 0.28, ts.rTop + 0.14, upperTierH, 20),
      sandstoneWallMat
    );
    upperTier.position.set(ts.ox, upperTierY, ts.oz);
    upperTier.castShadow = true;
    castleGroup.add(upperTier);

    // 雙道金色環帶腰線
    for (const frac of [0.46, 0.78]) {
      const rBelt = THREE.MathUtils.lerp(ts.rBot, ts.rTop, frac) + 0.08;
      const belt = new THREE.Mesh(new THREE.TorusGeometry(rBelt, 0.14, 8, 24), goldMat);
      belt.rotation.x = Math.PI / 2;
      belt.position.set(ts.ox, ts.h * frac + 0.4, ts.oz);
      castleGroup.add(belt);
    }

    // 挑出簷口石環（Corbelled eaves）
    const eaveY = ts.h + 0.42;
    const eaveRing = new THREE.Mesh(
      new THREE.CylinderGeometry(ts.rTop + 0.56, ts.rTop + 0.22, 0.55, 20),
      sandstoneTrimMat
    );
    eaveRing.position.set(ts.ox, eaveY, ts.oz);
    eaveRing.castShadow = true;
    castleGroup.add(eaveRing);

    const corbelCount = ts.isCentral ? 12 : 8;
    for (let c = 0; c < corbelCount; c++) {
      const ca = (c / corbelCount) * Math.PI * 2;
      corbelTransforms.push({
        x: ts.ox + Math.sin(ca) * (ts.rTop + 0.28),
        y: eaveY - 0.36,
        z: ts.oz + Math.cos(ca) * (ts.rTop + 0.28),
        rotY: ca,
      });
    }

    // 塔頂細長發光狹窗（四向）
    for (let w = 0; w < 4; w++) {
      const wa = (w / 4) * Math.PI * 2;
      const winR = ts.rTop + 0.24;
      const lWin = new THREE.Mesh(new THREE.BoxGeometry(0.42, 1.35, 0.14), warmWinGlassMat);
      lWin.position.set(ts.ox + Math.sin(wa) * winR, upperTierY, ts.oz + Math.cos(wa) * winR);
      lWin.rotation.y = wa;
      castleGroup.add(lWin);
    }

    // 高聳皇家藍圓錐尖頂（0x215db0）
    const spireBaseY = eaveY + 0.25;
    const spire = new THREE.Mesh(
      new THREE.ConeGeometry(ts.rTop + 0.72, ts.spireH, 22),
      ts.isCentral ? blueSpireMat : royalBlueSolidMat
    );
    spire.position.set(ts.ox, spireBaseY + ts.spireH * 0.5, ts.oz);
    spire.castShadow = true;
    castleGroup.add(spire);

    // 尖頂下緣金色飾環
    const spireRim = new THREE.Mesh(new THREE.TorusGeometry(ts.rTop + 0.66, 0.1, 8, 24), goldMat);
    spireRim.rotation.x = Math.PI / 2;
    spireRim.position.set(ts.ox, spireBaseY + 0.08, ts.oz);
    castleGroup.add(spireRim);

    // 閃耀金色塔尖（Finial）
    const spireTopY = spireBaseY + ts.spireH;
    const finialBase = new THREE.Mesh(new THREE.SphereGeometry(0.28, 12, 10), goldMat);
    finialBase.position.set(ts.ox, spireTopY + 0.1, ts.oz);
    castleGroup.add(finialBase);

    const finialRod = new THREE.Mesh(
      new THREE.CylinderGeometry(0.05, 0.1, ts.isCentral ? 2.2 : 1.7, 8),
      goldMat
    );
    finialRod.position.set(ts.ox, spireTopY + (ts.isCentral ? 1.1 : 0.85), ts.oz);
    castleGroup.add(finialRod);
  }

  // 所有塔樓簷口托架批次 InstancedMesh
  const corbelInst = new THREE.InstancedMesh(
    new THREE.BoxGeometry(0.28, 0.55, 0.44),
    sandstoneTrimMat,
    corbelTransforms.length
  );
  for (let i = 0; i < corbelTransforms.length; i++) {
    const ct = corbelTransforms[i];
    dummy.position.set(ct.x, ct.y, ct.z);
    dummy.rotation.set(0, ct.rotY, 0);
    dummy.scale.set(1, 1, 1);
    dummy.updateMatrix();
    corbelInst.setMatrixAt(i, dummy.matrix);
  }
  corbelInst.instanceMatrix.needsUpdate = true;
  corbelInst.computeBoundingSphere();
  castleGroup.add(corbelInst);

  // =========================================================================
  // 3. 中央塔頂懸浮旋轉「二十面黃金風險骰子」（IcosahedronGeometry）
  // =========================================================================
  const dicePivot = new THREE.Group();
  dicePivot.position.set(0, 26.8, 0);

  const riskyDiceMat = new THREE.MeshStandardMaterial({
    color: 0xffd75e,
    emissive: 0xd4951a,
    emissiveIntensity: 0.48,
    metalness: 0.78,
    roughness: 0.18,
    flatShading: true,
  });
  const riskyDice = new THREE.Mesh(new THREE.IcosahedronGeometry(1.48, 0), riskyDiceMat);
  riskyDice.castShadow = true;
  dicePivot.add(riskyDice);

  const diceWire = new THREE.Mesh(
    new THREE.IcosahedronGeometry(1.52, 0),
    new THREE.MeshBasicMaterial({ color: 0xfff3b8, wireframe: true, transparent: true, opacity: 0.55 })
  );
  dicePivot.add(diceWire);

  const diceHalo = new THREE.Mesh(
    new THREE.TorusGeometry(2.25, 0.08, 10, 32),
    new THREE.MeshBasicMaterial({ color: 0xffe58f, transparent: true, opacity: 0.75 })
  );
  diceHalo.rotation.x = Math.PI / 2;
  dicePivot.add(diceHalo);

  castleGroup.add(dicePivot);

  dg.add(castleGroup);
  ctx.addCircleCollider({ x: dx - 7, z: dz, r: 7.2 });
  ctx.addCameraOccluder?.(castleGroup);

  // =========================================================================
  // 4. 6 株多層彎幹展開式熱帶棕櫚樹（嚴格避開東側 spawnPos [-38, -26] 與拾取點 [-46, -22]）
  // =========================================================================
  const palmMaterials = {
    planterMat: sandstoneTrimMat,
    soilMat: new THREE.MeshStandardMaterial({ color: 0x5c422c, roughness: 0.94 }),
    trunkLightMat: new THREE.MeshStandardMaterial({ color: 0x8d633d, roughness: 0.88 }),
    trunkDarkMat: new THREE.MeshStandardMaterial({ color: 0x704c2c, roughness: 0.9 }),
    frondMat: new THREE.MeshStandardMaterial({ color: 0x3a9147, roughness: 0.72 }),
    frondTipMat: new THREE.MeshStandardMaterial({ color: 0x50ad57, roughness: 0.7 }),
    coconutMat: new THREE.MeshStandardMaterial({ color: 0x4d3019, roughness: 0.62 }),
  };

  const palmSpecs: Array<{ x: number; z: number; h: number; leanAng: number; lean: number }> = [
    { x: dx + 9.2, z: dz - 14.8, h: 7.6, leanAng: 0.75, lean: 1.05 },
    { x: dx - 3.2, z: dz - 17.4, h: 8.3, leanAng: 1.75, lean: 1.15 },
    { x: dx - 16.4, z: dz - 11.2, h: 8.8, leanAng: 2.55, lean: 1.2 },
    { x: dx - 16.4, z: dz + 11.4, h: 8.6, leanAng: -2.45, lean: 1.15 },
    { x: dx - 2.2, z: dz + 17.2, h: 7.9, leanAng: -1.65, lean: 1.05 },
    { x: dx + 11.4, z: dz + 13.0, h: 7.4, leanAng: -0.65, lean: 1.0 },
  ];

  const palmCrowns: Array<{ crown: THREE.Group; phase: number }> = [];
  for (let i = 0; i < palmSpecs.length; i++) {
    const p = palmSpecs[i];
    const { root: palmRoot, crown } = createStylizedPalmTree(p.h, p.leanAng, p.lean, palmMaterials);
    palmRoot.position.set(p.x, 0.2, p.z);
    dg.add(palmRoot);
    palmCrowns.push({ crown, phase: i * 1.15 });
    ctx.addCircleCollider({ x: p.x, z: p.z, r: 0.95 });
  }

  // 動畫：風險金骰旋轉懸浮＋棕櫚樹冠微風搖曳
  ctx.addAnimated((t) => {
    dicePivot.position.y = 26.8 + Math.sin(t * 2.1) * 0.42;
    riskyDice.rotation.y = t * 0.95;
    riskyDice.rotation.x = Math.sin(t * 0.7) * 0.38;
    diceWire.rotation.copy(riskyDice.rotation);
    diceHalo.rotation.z = t * 0.65;

    for (const pc of palmCrowns) {
      pc.crown.rotation.z = Math.sin(t * 1.4 + pc.phase) * 0.045;
      pc.crown.rotation.x = Math.cos(t * 1.1 + pc.phase) * 0.032;
    }
  });

  // =========================================================================
  // 5. 4 盞金色賭城路燈（InstancedMesh）＋廣場休憩長椅
  // =========================================================================
  const lampCoords: ReadonlyArray<readonly [number, number]> = [
    [dx + 10.6, dz - 6.2],
    [dx + 10.6, dz + 6.2],
    [dx + 2.4, dz - 10.6],
    [dx + 2.4, dz + 10.6],
  ];

  const lampBaseInst = new THREE.InstancedMesh(
    new THREE.CylinderGeometry(0.32, 0.44, 0.52, 10),
    sandstoneTrimMat,
    lampCoords.length
  );
  const lampPostInst = new THREE.InstancedMesh(
    new THREE.CylinderGeometry(0.1, 0.16, 3.7, 10),
    goldMat,
    lampCoords.length
  );
  const lampCapInst = new THREE.InstancedMesh(
    new THREE.ConeGeometry(0.46, 0.42, 8),
    darkNavyMat,
    lampCoords.length
  );
  const lampGlobeInst = new THREE.InstancedMesh(
    new THREE.SphereGeometry(0.34, 12, 10),
    new THREE.MeshBasicMaterial({ color: 0xffeba8 }),
    lampCoords.length
  );
  lampPostInst.castShadow = true;

  for (let i = 0; i < lampCoords.length; i++) {
    const [lx, lz] = lampCoords[i];
    dummy.rotation.set(0, 0, 0);
    dummy.scale.set(1, 1, 1);

    dummy.position.set(lx, 0.46, lz);
    dummy.updateMatrix();
    lampBaseInst.setMatrixAt(i, dummy.matrix);

    dummy.position.set(lx, 2.45, lz);
    dummy.updateMatrix();
    lampPostInst.setMatrixAt(i, dummy.matrix);

    dummy.position.set(lx, 4.42, lz);
    dummy.updateMatrix();
    lampGlobeInst.setMatrixAt(i, dummy.matrix);

    dummy.position.set(lx, 4.86, lz);
    dummy.updateMatrix();
    lampCapInst.setMatrixAt(i, dummy.matrix);

    ctx.addCircleCollider({ x: lx, z: lz, r: 0.38 });
  }
  for (const inst of [lampBaseInst, lampPostInst, lampGlobeInst, lampCapInst]) {
    inst.instanceMatrix.needsUpdate = true;
    inst.computeBoundingSphere();
  }
  dg.add(lampBaseInst, lampPostInst, lampGlobeInst, lampCapInst);

  // 廣場邊緣長椅（使用本地 CC0 GLB）
  ctx.models.place(dg, 'Bench_1.glb', { x: dx + 3.2, y: 0.2, z: dz - 14.0, targetHeight: 0.64, rotY: 0 });
  ctx.models.place(dg, 'Bench_1.glb', { x: dx + 3.2, y: 0.2, z: dz + 14.0, targetHeight: 0.64, rotY: Math.PI });

  // =========================================================================
  // 6. 賭場之王 NPC（保留原 ID 與互動座標 (dx + 4.5, 0.2, dz)）
  // =========================================================================
  const dealerNpc = ctx.createNpcMesh(0xc98a22, 0xffe0bd, 0x1a1a1a);
  dealerNpc.position.set(dx + 4.5, 0.2, dz);
  dealerNpc.rotation.y = Math.PI / 2;
  dg.add(dealerNpc);

  ctx.addInteractable({
    id: 'npc_dorias_dealer',
    label: '向「賭場之王」挑戰賭博都市卡片',
    position: new THREE.Vector3(dx + 4.5, 0.2, dz),
    radius: 3.8,
    kind: 'npc',
  });

  return dg;
}
