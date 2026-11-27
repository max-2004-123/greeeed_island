import * as THREE from 'three';
import { ModelLibrary } from '../assets';

export interface BunzenBuildContext {
  models: ModelLibrary;
  createNeonSignMesh: (title: string, subtitle: string) => THREE.Mesh;
  addCircleCollider: (c: { x: number; z: number; r: number }) => void;
  addBoxCollider: (b: { minX: number; maxX: number; minZ: number; maxZ: number }) => void;
  addCameraOccluder?: (obj: THREE.Object3D) => void;
}

export const BUNZEN_CENTER = { x: 98, z: 136 } as const;
export const BUNZEN_ENTRANCE_X = 80;
export const BUNZEN_SPAWN = { x: 64, z: 136 } as const;

function createSunlitDirtTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#d4c398';
  ctx.fillRect(0, 0, 256, 256);

  let seed = 7717;
  const rand = () => {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  };

  for (let i = 0; i < 420; i++) {
    const x = rand() * 256;
    const y = rand() * 256;
    const r = 1.5 + rand() * 4.5;
    ctx.fillStyle = rand() > 0.5 ? 'rgba(182, 160, 114, 0.32)' : 'rgba(232, 219, 182, 0.34)';
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(6, 2);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function createVillagePlazaTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#cfc2a4';
  ctx.fillRect(0, 0, 256, 256);

  let seed = 4321;
  const rand = () => {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  };

  const step = 32;
  for (let y = 0; y < 256; y += step) {
    const off = ((y / step) % 2) * 16;
    for (let x = -16; x < 256; x += step) {
      const s = Math.floor((rand() - 0.5) * 20);
      ctx.fillStyle = `rgb(${214 + s},${201 + s},${172 + s})`;
      ctx.fillRect(x + off + 2, y + 2, step - 4, step - 4);
    }
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(5, 5);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function createBunzenPlaqueTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 192;
  const ctx = canvas.getContext('2d')!;

  // 暖米木紋底板
  ctx.fillStyle = '#efe0be';
  ctx.fillRect(0, 0, 512, 192);

  let seed = 3191;
  const rand = () => {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  };

  // 柔和水平木板紋理與拼縫
  for (let y = 38; y < 192; y += 38) {
    ctx.fillStyle = 'rgba(138, 102, 62, 0.24)';
    ctx.fillRect(0, y, 512, 2);
  }
  for (let i = 0; i < 110; i++) {
    ctx.fillStyle = rand() > 0.5 ? 'rgba(164, 126, 78, 0.16)' : 'rgba(255, 248, 232, 0.24)';
    ctx.fillRect(rand() * 440, rand() * 190, 36 + rand() * 96, 2);
  }

  // 溫潤深棕木框與內飾細線
  ctx.strokeStyle = '#6b4c32';
  ctx.lineWidth = 10;
  ctx.strokeRect(10, 10, 492, 172);
  ctx.strokeStyle = '#a0784e';
  ctx.lineWidth = 3;
  ctx.strokeRect(22, 22, 468, 148);

  // 四角森林小葉點綴
  ctx.fillStyle = '#5c7a44';
  for (const [lx, ly] of [
    [36, 36],
    [476, 36],
    [36, 156],
    [476, 156],
  ]) {
    ctx.beginPath();
    ctx.arc(lx, ly, 5.5, 0, Math.PI * 2);
    ctx.fill();
  }

  // 手繪歐洲村鎮深棕字體
  ctx.textAlign = 'center';
  ctx.fillStyle = 'rgba(255, 250, 236, 0.7)';
  ctx.font = 'bold 48px Georgia, serif';
  ctx.fillText('BUNZEN', 257, 87);
  ctx.fillStyle = '#3e2817';
  ctx.fillText('BUNZEN', 256, 85);

  ctx.strokeStyle = '#9a734a';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(116, 106);
  ctx.lineTo(396, 106);
  ctx.stroke();

  ctx.fillStyle = '#5a3a20';
  ctx.font = 'bold 28px sans-serif';
  ctx.fillText('布恩森鎮・除念之森', 256, 146);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/**
 * 布恩森鎮・除念之森（Bunzen）獨立場景模組
 * - 東南森林半島開闊地帶，中心 (98, 136)
 * - 傳送降落空地 (64, 136)：半徑 11m 柔和土草過渡圓盤，14m 內零石柱、零樹木、零岩石（360° 旋轉鏡頭零卡頓）
 * - 獨立雙白石柱鎮口（x = 80, z = 136 ± 4.8，柱間距 9.6m，頭頂開闊藍天，忠實還原原作陽光泥土大道）
 * - 村口北側路旁招牌 (77.5, 4.4, 128.5)、陽光泥土大道 (x = 64..112)、靜謐歐洲村莊廣場與外圍除念之森
 */
export function buildBunzenZone(ctx: BunzenBuildContext): THREE.Group {
  const bg = new THREE.Group();
  bg.name = 'zone_bunzen';

  const bx = BUNZEN_CENTER.x;   // 98
  const bz = BUNZEN_CENTER.z;   // 136
  const ex = BUNZEN_ENTRANCE_X; // 80
  const sx = BUNZEN_SPAWN.x;    // 64
  const sz = BUNZEN_SPAWN.z;    // 136

  // 1. 陽光入口開闊空地圓盤（(64, 0.03, 136), r = 11，周圍 14m 內絕不放任何障礙物）
  const clearingMat = new THREE.MeshStandardMaterial({ color: 0xbec089, roughness: 0.92 });
  const clearingDisk = new THREE.Mesh(new THREE.CylinderGeometry(11, 11.8, 0.06, 36), clearingMat);
  clearingDisk.position.set(sx, 0.03, sz);
  clearingDisk.receiveShadow = true;
  bg.add(clearingDisk);

  // 2. 陽光泥土主幹道（x = 64 到 x = 112，寬 6.4m 沿 z = 136，埋平貼地消除直角邊唇）
  const dirtRoadMat = new THREE.MeshStandardMaterial({
    map: createSunlitDirtTexture(),
    roughness: 0.9,
    polygonOffset: true,
    polygonOffsetFactor: -1,
    polygonOffsetUnits: -1,
  });
  const roadLen = 112 - 64; // 48m
  const mainRoad = new THREE.Mesh(new THREE.BoxGeometry(roadLen, 0.024, 6.4), dirtRoadMat);
  mainRoad.position.set((64 + 112) / 2, 0.012, bz);
  mainRoad.receiveShadow = true;
  bg.add(mainRoad);

  // 3. 靜謐歐洲村莊中心廣場（(98, 0.06, 136), r = 16）
  const plazaMat = new THREE.MeshStandardMaterial({
    map: createVillagePlazaTexture(),
    roughness: 0.86,
  });
  const plaza = new THREE.Mesh(new THREE.CylinderGeometry(16, 16.8, 0.12, 36), plazaMat);
  plaza.position.set(bx, 0.06, bz);
  plaza.receiveShadow = true;
  bg.add(plaza);

  // 4. 獨立雙白石柱鎮口（x = 80, z = 131.2 與 140.8，中間留出 9.6m 寬闊通途，不加橫樑保持開闊天空）
  const whiteStoneMat = new THREE.MeshStandardMaterial({ color: 0xf5f2ea, roughness: 0.62 });
  const stoneTrimMat = new THREE.MeshStandardMaterial({ color: 0xded8c8, roughness: 0.72 });

  for (const pz of [bz - 4.8, bz + 4.8]) {
    const pillarGroup = new THREE.Group();
    pillarGroup.position.set(ex, 0, pz);

    // 雙層階梯基座（高 0.80m）
    const baseLower = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.5, 2.0), stoneTrimMat);
    baseLower.position.y = 0.25;
    baseLower.castShadow = true;
    baseLower.receiveShadow = true;
    pillarGroup.add(baseLower);

    const baseUpper = new THREE.Mesh(new THREE.BoxGeometry(1.64, 0.3, 1.64), whiteStoneMat);
    baseUpper.position.y = 0.65;
    baseUpper.castShadow = true;
    baseUpper.receiveShadow = true;
    pillarGroup.add(baseUpper);

    // 白石柱身（高 3.90m，至 y = 4.70m）
    const shaft = new THREE.Mesh(new THREE.BoxGeometry(1.26, 3.9, 1.26), whiteStoneMat);
    shaft.position.y = 2.75;
    shaft.castShadow = true;
    shaft.receiveShadow = true;
    pillarGroup.add(shaft);

    // 柱身上下細飾石帶
    for (const bandY of [1.15, 4.35]) {
      const band = new THREE.Mesh(new THREE.BoxGeometry(1.36, 0.16, 1.36), stoneTrimMat);
      band.position.y = bandY;
      pillarGroup.add(band);
    }

    // 挑簷與斜角柱冠（總高度 5.40m）
    const cornice = new THREE.Mesh(new THREE.BoxGeometry(1.62, 0.28, 1.62), whiteStoneMat);
    cornice.position.y = 4.84;
    cornice.castShadow = true;
    pillarGroup.add(cornice);

    const capBlock = new THREE.Mesh(new THREE.BoxGeometry(1.36, 0.22, 1.36), stoneTrimMat);
    capBlock.position.y = 5.09;
    pillarGroup.add(capBlock);

    const capBevel = new THREE.Mesh(new THREE.ConeGeometry(0.92, 0.2, 4), whiteStoneMat);
    capBevel.rotation.y = Math.PI / 4;
    capBevel.position.y = 5.3;
    pillarGroup.add(capBevel);

    bg.add(pillarGroup);
    ctx.addCircleCollider({ x: ex, z: pz, r: 1.1 });
    ctx.addCameraOccluder?.(pillarGroup);
  }

  // 5. 村口北側路旁木石鎮牌（(77.5, 4.4, 128.5), rotY = -Math.PI / 2 + 0.25，距起點 15.44m，完全讓開柱間天空與車道）
  const signPos = { x: 77.5, z: 128.5 };
  const signGroup = new THREE.Group();
  signGroup.name = 'bunzen_village_sign';
  signGroup.position.set(signPos.x, 0, signPos.z);
  signGroup.rotation.y = -Math.PI / 2 + 0.25;

  const timberMat = new THREE.MeshStandardMaterial({ color: 0x6b4c32, roughness: 0.84 });
  for (const px of [-1.75, 1.75]) {
    const stoneFoot = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.55, 0.46), stoneTrimMat);
    stoneFoot.position.set(px, 0.275, 0);
    stoneFoot.receiveShadow = true;
    signGroup.add(stoneFoot);

    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.13, 4.7, 8), timberMat);
    post.position.set(px, 2.85, 0);
    post.castShadow = true;
    signGroup.add(post);
  }

  const signBeam = new THREE.Mesh(new THREE.BoxGeometry(4.3, 0.18, 0.34), timberMat);
  signBeam.position.set(0, 5.18, 0);
  signBeam.castShadow = true;
  signGroup.add(signBeam);

  const signLowerRail = new THREE.Mesh(new THREE.BoxGeometry(3.6, 0.14, 0.24), timberMat);
  signLowerRail.position.set(0, 3.62, 0);
  signLowerRail.castShadow = true;
  signGroup.add(signLowerRail);

  const plaqueTex = createBunzenPlaqueTexture();
  const plaqueFaceMat = new THREE.MeshStandardMaterial({ map: plaqueTex, roughness: 0.78 });
  const villageSign = new THREE.Mesh(new THREE.BoxGeometry(3.38, 1.28, 0.16), [
    timberMat,
    timberMat,
    timberMat,
    timberMat,
    plaqueFaceMat,
    plaqueFaceMat,
  ]);
  villageSign.position.set(0, 4.38, 0);
  villageSign.castShadow = true;
  villageSign.receiveShadow = true;
  signGroup.add(villageSign);

  bg.add(signGroup);
  ctx.addCircleCollider({ x: signPos.x, z: signPos.z, r: 1.2 });
  ctx.addCameraOccluder?.(signGroup);

  // 6. 暖黃歐式村莊民居、石井與木長椅
  const villageBuildings: Array<{
    file: string;
    x: number;
    y: number;
    z: number;
    h: number;
    rotY?: number;
    r: number;
  }> = [
    { file: 'House_4.glb', x: 94, y: 0.08, z: 123, h: 7.6, rotY: 0, r: 4.2 },
    { file: 'House_1.glb', x: 100, y: 0.08, z: 149, h: 7.5, rotY: Math.PI, r: 4.2 },
    { file: 'House_2.glb', x: 111, y: 0.08, z: 127, h: 7.8, rotY: -0.6, r: 4.2 },
    { file: 'Well.glb', x: 94, y: 0.08, z: 130.5, h: 3.3, r: 1.6 },
  ];

  for (const b of villageBuildings) {
    ctx.models.place(bg, b.file, {
      x: b.x,
      y: b.y,
      z: b.z,
      targetHeight: b.h,
      rotY: b.rotY,
    });
    ctx.addCircleCollider({ x: b.x, z: b.z, r: b.r });
  }

  ctx.models.place(bg, 'Bench_1.glb', {
    x: 90,
    y: 0.08,
    z: 141.5,
    targetHeight: 0.64,
    rotY: Math.PI,
  });
  ctx.addBoxCollider({ minX: 88.8, maxX: 91.2, minZ: 140.9, maxZ: 142.1 });

  // 7. 東側與外環南北緣除念之森 GLB 樹群（嚴格滿足 x >= 114 或 |z - 136| >= 18，且恆距 (64, 136) >= 18m）
  const perimeterTrees: ReadonlyArray<{
    file: 'Tree_1.glb' | 'Tree_2.glb' | 'BirchTree_1.glb';
    x: number;
    z: number;
    h: number;
    rotY: number;
  }> = [
    // 東緣背景密林 (x >= 114)
    { file: 'Tree_1.glb', x: 118, z: 136, h: 11.5, rotY: 0.4 },
    { file: 'BirchTree_1.glb', x: 117, z: 145, h: 10.5, rotY: 1.2 },
    { file: 'Tree_2.glb', x: 119, z: 127, h: 11.2, rotY: 2.1 },
    { file: 'Tree_1.glb', x: 115, z: 117, h: 10.8, rotY: 0.9 },
    { file: 'Tree_2.glb', x: 114, z: 155, h: 11.0, rotY: 2.6 },
    { file: 'Tree_2.glb', x: 124, z: 132, h: 12.2, rotY: 1.7 },
    { file: 'Tree_1.glb', x: 123, z: 142, h: 11.8, rotY: 0.2 },
    // 外環北緣 (z <= 118 -> |z - 136| >= 18，全數距 (64, 136) >= 22m)
    { file: 'Tree_1.glb', x: 66, z: 114, h: 10.2, rotY: 0.5 },
    { file: 'BirchTree_1.glb', x: 76, z: 116, h: 9.8, rotY: 1.8 },
    { file: 'Tree_1.glb', x: 86, z: 115, h: 11.2, rotY: 2.9 },
    { file: 'Tree_2.glb', x: 97, z: 114, h: 11.5, rotY: 0.7 },
    { file: 'BirchTree_1.glb', x: 107, z: 115, h: 10.4, rotY: 2.3 },
    // 外環南緣 (z >= 154 -> |z - 136| >= 18，全數距 (64, 136) >= 21m)
    { file: 'BirchTree_1.glb', x: 65, z: 157, h: 9.6, rotY: 1.1 },
    { file: 'Tree_2.glb', x: 74, z: 156, h: 10.5, rotY: 2.4 },
    { file: 'BirchTree_1.glb', x: 84, z: 155, h: 10.0, rotY: 0.3 },
    { file: 'Tree_1.glb', x: 93, z: 158, h: 11.4, rotY: 1.9 },
    { file: 'Tree_2.glb', x: 105, z: 158, h: 11.0, rotY: 2.8 },
  ];

  for (const t of perimeterTrees) {
    // 執行期安全守衛：確保絕不侵入起點空地半徑 18m 範圍
    if (Math.hypot(t.x - sx, t.z - sz) < 18) continue;
    ctx.models.place(bg, t.file, {
      x: t.x,
      y: 0,
      z: t.z,
      targetHeight: t.h,
      rotY: t.rotY,
    });
    ctx.addCircleCollider({ x: t.x, z: t.z, r: 0.85 });
  }

  // 8. 森林村莊外緣草叢與野花（InstancedMesh，避開起點空地 14.5m、泥土主路、廣場與雙石柱）
  const grassCount = 96;
  const flowerCount = 32;
  const grassInst = new THREE.InstancedMesh(
    new THREE.ConeGeometry(0.3, 0.78, 4),
    new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.88, flatShading: true }),
    grassCount
  );
  const flowerInst = new THREE.InstancedMesh(
    new THREE.DodecahedronGeometry(0.15, 0),
    new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.72 }),
    flowerCount
  );

  const isFoliageClear = (px: number, pz: number): boolean => {
    if (Math.hypot(px - sx, pz - sz) < 14.5) return false;
    if (px >= 62 && px <= 114 && Math.abs(pz - bz) < 4.4) return false;
    if (Math.hypot(px - bx, pz - bz) < 16.8) return false;
    if (Math.hypot(px - ex, pz - (bz - 4.8)) < 2.2) return false;
    if (Math.hypot(px - ex, pz - (bz + 4.8)) < 2.2) return false;
    if (Math.hypot(px - signPos.x, pz - signPos.z) < 2.6) return false;
    for (const b of villageBuildings) {
      if (Math.hypot(px - b.x, pz - b.z) < b.r + 1.5) return false;
    }
    return true;
  };

  let seed = 5503;
  const rand = () => {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  };
  const dummy = new THREE.Object3D();
  const tmpCol = new THREE.Color();

  let gi = 0;
  let gAttempts = 0;
  while (gi < grassCount && gAttempts < 1600) {
    gAttempts++;
    const gx = 74 + rand() * 52;  // [74, 126]
    const gz = 112 + rand() * 48; // [112, 160]
    if (!isFoliageClear(gx, gz)) continue;

    const sc = 0.65 + rand() * 0.68;
    dummy.position.set(gx, 0.32 * sc, gz);
    dummy.scale.set(sc, sc * (0.8 + rand() * 0.45), sc);
    dummy.rotation.set((rand() - 0.5) * 0.2, rand() * Math.PI * 2, (rand() - 0.5) * 0.2);
    dummy.updateMatrix();
    grassInst.setMatrixAt(gi, dummy.matrix);
    tmpCol.setHSL(0.28 + (rand() - 0.5) * 0.05, 0.48, 0.34 + rand() * 0.14);
    grassInst.setColorAt(gi, tmpCol);
    gi++;
  }
  grassInst.count = gi;
  grassInst.instanceMatrix.needsUpdate = true;
  if (grassInst.instanceColor) grassInst.instanceColor.needsUpdate = true;
  grassInst.computeBoundingSphere();

  const flowerCols = [0xffe57f, 0xffffff, 0xffc680, 0xfff3b0];
  let fi = 0;
  let fAttempts = 0;
  while (fi < flowerCount && fAttempts < 1000) {
    fAttempts++;
    const fx = 75 + rand() * 48;
    const fz = 114 + rand() * 44;
    if (!isFoliageClear(fx, fz)) continue;

    dummy.position.set(fx, 0.38, fz);
    dummy.scale.setScalar(0.8 + rand() * 0.45);
    dummy.rotation.set(0, rand() * 3, 0);
    dummy.updateMatrix();
    flowerInst.setMatrixAt(fi, dummy.matrix);
    tmpCol.setHex(flowerCols[fi % flowerCols.length]);
    flowerInst.setColorAt(fi, tmpCol);
    fi++;
  }
  flowerInst.count = fi;
  flowerInst.instanceMatrix.needsUpdate = true;
  if (flowerInst.instanceColor) flowerInst.instanceColor.needsUpdate = true;
  flowerInst.computeBoundingSphere();

  bg.add(grassInst, flowerInst);
  return bg;
}
