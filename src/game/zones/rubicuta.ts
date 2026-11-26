import * as THREE from 'three';
import { ModelLibrary } from '../assets';

export interface RubicutaBuildContext {
  models: ModelLibrary;
  addCircleCollider: (c: { x: number; z: number; r: number }) => void;
  addCameraOccluder?: (obj: THREE.Object3D) => void;
}

export const RUBICUTA_CENTER = { x: 4, z: 36 } as const;
export const RUBICUTA_SPAWN = { x: 4, z: 48 } as const;

/**
 * 決定性偽亂數產生器，確保程序化地磚、花叢與細節每次建置皆一致。
 */
function createSeededRandom(initialSeed: number): () => number {
  let seed = initialSeed;
  return () => {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  };
}

/**
 * 魯比克塔歐風暖色砂岩鵝卵石廣場紋理（CanvasTexture）。
 */
function createRubicutaCobbleTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  // 溫潤深灰褐石縫底色
  ctx.fillStyle = '#8b7f6e';
  ctx.fillRect(0, 0, 512, 512);

  const rand = createSeededRandom(4093);
  const rows = 16;
  const cols = 14;
  const rh = 512 / rows;
  const cw = 512 / cols;

  for (let r = 0; r < rows; r++) {
    const rowOff = (r % 2) * (cw * 0.5);
    for (let c = -1; c <= cols; c++) {
      const jitterX = (rand() - 0.5) * 2.4;
      const jitterY = (rand() - 0.5) * 1.8;
      const x = c * cw + rowOff + 2.5 + jitterX;
      const y = r * rh + 2.5 + jitterY;
      const w = cw - 5;
      const h = rh - 5;

      // 帶紅棕與暖砂岩色偏的歐式地磚
      const tone = Math.floor((rand() - 0.5) * 28);
      const warmTint = rand() > 0.72 ? 12 : 0;
      const R = Math.min(255, Math.max(0, 204 + tone + warmTint));
      const G = Math.min(255, Math.max(0, 189 + tone + Math.floor(warmTint * 0.4)));
      const B = Math.min(255, Math.max(0, 166 + tone - Math.floor(warmTint * 0.3)));

      ctx.fillStyle = `rgb(${R},${G},${B})`;
      ctx.beginPath();
      const rad = 5;
      ctx.moveTo(x + rad, y);
      ctx.lineTo(x + w - rad, y);
      ctx.quadraticCurveTo(x + w, y, x + w, y + rad);
      ctx.lineTo(x + w, y + h - rad);
      ctx.quadraticCurveTo(x + w, y + h, x + w - rad, y + h);
      ctx.lineTo(x + rad, y + h);
      ctx.quadraticCurveTo(x, y + h, x, y + h - rad);
      ctx.lineTo(x, y + rad);
      ctx.quadraticCurveTo(x, y, x + rad, y);
      ctx.closePath();
      ctx.fill();

      // 上緣細微高光，增強石塊立體感
      ctx.fillStyle = 'rgba(255, 248, 234, 0.22)';
      ctx.fillRect(x + 3, y + 2, w - 6, 3);
      ctx.fillStyle = 'rgba(72, 58, 44, 0.16)';
      ctx.fillRect(x + 3, y + h - 4, w - 6, 3);
    }
  }

  // 輕微風化砂塵與石面紋點
  for (let i = 0; i < 240; i++) {
    const px = rand() * 512;
    const py = rand() * 512;
    const pr = 1 + rand() * 2.5;
    ctx.fillStyle = rand() > 0.5 ? 'rgba(130, 112, 90, 0.14)' : 'rgba(244, 232, 208, 0.14)';
    ctx.beginPath();
    ctx.arc(px, py, pr, 0, Math.PI * 2);
    ctx.fill();
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(7, 7);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/**
 * 鄉村木石十字路口牌匾紋理（取代舊版霓虹看板）。
 */
function createRubicutaPlaqueTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 192;
  const ctx = canvas.getContext('2d')!;

  // 溫潤深橡木底板
  ctx.fillStyle = '#4e331f';
  ctx.fillRect(0, 0, 512, 192);

  // 水平木板接縫與木紋條
  const rand = createSeededRandom(8209);
  for (let y = 0; y < 192; y += 38) {
    ctx.fillStyle = 'rgba(32, 18, 9, 0.35)';
    ctx.fillRect(0, y, 512, 3);
  }
  for (let i = 0; i < 90; i++) {
    ctx.fillStyle = rand() > 0.5 ? 'rgba(112, 76, 44, 0.24)' : 'rgba(42, 25, 13, 0.22)';
    ctx.fillRect(rand() * 440, rand() * 190, 40 + rand() * 90, 2);
  }

  // 雕刻風暖金／陶紅內外邊框
  ctx.strokeStyle = '#c89b5a';
  ctx.lineWidth = 8;
  ctx.strokeRect(10, 10, 492, 172);
  ctx.strokeStyle = '#8a5032';
  ctx.lineWidth = 3;
  ctx.strokeRect(20, 20, 472, 152);

  // 四角鍛鐵鉚釘裝飾
  ctx.fillStyle = '#2d2825';
  for (const [rx, ry] of [
    [28, 28],
    [484, 28],
    [28, 164],
    [484, 164],
  ]) {
    ctx.beginPath();
    ctx.arc(rx, ry, 5.5, 0, Math.PI * 2);
    ctx.fill();
  }

  // 標題與副標
  ctx.textAlign = 'center';
  ctx.fillStyle = '#2a180c';
  ctx.font = 'bold 46px Georgia, serif';
  ctx.fillText('RUBICUTA', 258, 86);
  ctx.fillStyle = '#fff0cc';
  ctx.fillText('RUBICUTA', 256, 84);

  // 分隔線與菱形飾紋
  ctx.strokeStyle = '#d4a35d';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(96, 106);
  ctx.lineTo(416, 106);
  ctx.stroke();

  ctx.fillStyle = '#2a180c';
  ctx.font = 'bold 28px sans-serif';
  ctx.fillText('中央地峽・魯比克塔', 258, 148);
  ctx.fillStyle = '#f2d39c';
  ctx.fillText('中央地峽・魯比克塔', 256, 146);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/**
 * 鄉村路標指路木牌紋理。
 */
function createTrailBladeTexture(label: string): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 64;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#634329';
  ctx.fillRect(0, 0, 256, 64);
  ctx.strokeStyle = '#3b2515';
  ctx.lineWidth = 4;
  ctx.strokeRect(3, 3, 250, 58);

  ctx.textAlign = 'center';
  ctx.fillStyle = '#f9e9c4';
  ctx.font = 'bold 24px sans-serif';
  ctx.fillText(label, 128, 40);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/**
 * 魯比克塔（Rubicuta）獨立場景模組
 * - 中央偏南地峽十字路口（rx = 4, rz = 36），北臨中央屏障山脈門戶
 * - 半徑 17.5m 歐式鵝卵石廣場與暖砂岩路緣環，完整保留 x = 4 南北地峽大道與出生點 [4, 0, 48] 淨空
 * - 半木構紅棕瓦屋聚落、偏離中軸的村莊古井、手推車、木長椅、酒桶群、鍛鐵暖燈與砂岩石砌花圃
 * - 南側入口旁鄉村木石十字路口牌匾（RUBICUTA / 中央地峽・魯比克塔）
 */
export function buildRubicutaZone(ctx: RubicutaBuildContext): THREE.Group {
  const g = new THREE.Group();
  g.name = 'zone_rubicuta';

  const rx = RUBICUTA_CENTER.x; // 4
  const rz = RUBICUTA_CENTER.z; // 36

  // 共享材質
  const sandstoneCurbMat = new THREE.MeshStandardMaterial({ color: 0xd9c6a3, roughness: 0.78 });
  const sandstoneTrimMat = new THREE.MeshStandardMaterial({ color: 0xc2aa82, roughness: 0.82 });
  const wroughtIronMat = new THREE.MeshStandardMaterial({
    color: 0x4b5566,
    roughness: 0.48,
    metalness: 0.35,
  });
  const warmTimberMat = new THREE.MeshStandardMaterial({ color: 0x5d3d24, roughness: 0.86 });
  const terracottaRoofMat = new THREE.MeshStandardMaterial({ color: 0xa64b35, roughness: 0.76 });
  const soilMat = new THREE.MeshStandardMaterial({ color: 0x4b3828, roughness: 0.96 });

  // -------------------------------------------------------------------------
  // 1. 鵝卵石十字路口廣場（r = 17.5 at (4, 0.08, 36)）與暖砂岩路緣石環
  // -------------------------------------------------------------------------
  const cobbleTex = createRubicutaCobbleTexture();
  const plazaMat = new THREE.MeshStandardMaterial({
    map: cobbleTex,
    roughness: 0.85,
  });
  const plaza = new THREE.Mesh(new THREE.CylinderGeometry(17.5, 18.2, 0.16, 44), plazaMat);
  plaza.position.set(rx, 0.08, rz);
  plaza.receiveShadow = true;
  g.add(plaza);

  // 外圈低台階暖砂岩路緣基座
  const curbOuterBase = new THREE.Mesh(
    new THREE.CylinderGeometry(18.05, 18.55, 0.11, 48),
    sandstoneTrimMat
  );
  curbOuterBase.position.set(rx, 0.055, rz);
  curbOuterBase.receiveShadow = true;
  g.add(curbOuterBase);

  // 廣場頂面暖砂岩環形路緣石帶
  const curbTopRing = new THREE.Mesh(new THREE.RingGeometry(16.45, 17.55, 48), sandstoneCurbMat);
  curbTopRing.rotation.x = -Math.PI / 2;
  curbTopRing.position.set(rx, 0.164, rz);
  curbTopRing.receiveShadow = true;
  g.add(curbTopRing);

  // 圓潤砂岩邊石細環（高度極低，步行過渡順暢不卡腳）
  const curbRim = new THREE.Mesh(new THREE.TorusGeometry(17.52, 0.11, 8, 56), sandstoneCurbMat);
  curbRim.rotation.x = Math.PI / 2;
  curbRim.scale.set(1, 1, 0.45);
  curbRim.position.set(rx, 0.145, rz);
  curbRim.receiveShadow = true;
  g.add(curbRim);

  // 十字路口中央暖石鑲嵌指南圓環（強化地峽十字樞紐感）
  const innerMedallion = new THREE.Mesh(new THREE.RingGeometry(3.2, 3.65, 36), sandstoneCurbMat);
  innerMedallion.rotation.x = -Math.PI / 2;
  innerMedallion.position.set(rx, 0.165, rz);
  innerMedallion.receiveShadow = true;
  g.add(innerMedallion);

  // 廣場上方柔和暖色小鎮氛圍點光源
  const villageGlow = new THREE.PointLight(0xffd28e, 1.3, 30, 1.6);
  villageGlow.position.set(rx, 6.4, rz);
  g.add(villageGlow);

  // -------------------------------------------------------------------------
  // 2. 半木構歐風聚落建築、古井、手推車與生活道具（全數註冊相機遮蔽）
  //    保留 x = 4 南北地峽幹道與出生點 [4, 0, 48] / 礦石 [4, 46] 100% 淨空
  // -------------------------------------------------------------------------
  const placedBuildings: ReadonlyArray<{
    file: string;
    x: number;
    y: number;
    z: number;
    h: number;
    rotY?: number;
    r?: number;
  }> = [
    // 四座主屋環繞十字路口兩側
    { file: 'House_2.glb', x: rx - 10, y: 0.14, z: rz - 5, h: 7.8, rotY: Math.PI / 2, r: 4.2 },
    { file: 'House_3.glb', x: rx + 10, y: 0.14, z: rz - 5, h: 7.8, rotY: -Math.PI / 2, r: 4.2 },
    { file: 'House_1.glb', x: rx - 10, y: 0.14, z: rz + 7, h: 7.4, rotY: 1.0, r: 4.0 },
    { file: 'House_4.glb', x: rx + 11, y: 0.14, z: rz + 7, h: 7.4, rotY: -1.1, r: 4.0 },
    // 略偏離中央道路的村莊古井與商旅木車
    { file: 'Well.glb', x: rx - 3.8, y: 0.14, z: rz + 1.5, h: 3.4, rotY: 0.25, r: 1.6 },
    { file: 'Cart.glb', x: rx + 6.5, y: 0.14, z: rz + 1.5, h: 2.1, rotY: -0.7, r: 1.4 },
    // 歐風廣場木長椅
    { file: 'Bench_1.glb', x: rx - 6.8, y: 0.14, z: rz + 0.8, h: 0.64, rotY: Math.PI / 2, r: 0.9 },
    { file: 'Bench_1.glb', x: rx + 1.6, y: 0.14, z: rz - 11.4, h: 0.64, rotY: 0.08, r: 0.9 },
    // 屋側與貨車旁酒桶群（營造過境商隊驛站氛圍，略微拉開酒桶間距）
    { file: 'Barrel.glb', x: rx - 5.6, y: 0.14, z: rz - 6.6, h: 0.62, rotY: 0.3, r: 0.65 },
    { file: 'Barrel.glb', x: rx - 4.5, y: 0.14, z: rz - 7.7, h: 0.56, rotY: 1.4 },
    { file: 'Barrel.glb', x: rx + 8.4, y: 0.14, z: rz + 0.3, h: 0.6, rotY: 0.8, r: 0.65 },
    { file: 'Barrel.glb', x: rx + 9.4, y: 0.14, z: rz + 1.7, h: 0.56, rotY: 2.1 },
    { file: 'Barrel.glb', x: rx - 5.4, y: 0.14, z: rz + 9.8, h: 0.58, rotY: 0.5, r: 0.55 },
  ];

  for (const item of placedBuildings) {
    ctx.models.place(g, item.file, {
      x: item.x,
      y: item.y,
      z: item.z,
      targetHeight: item.h,
      rotY: item.rotY,
    });

    if (item.r !== undefined) {
      ctx.addCircleCollider({ x: item.x, z: item.z, r: item.r });
    }
  }

  // -------------------------------------------------------------------------
  // 3. 四盞村莊暖光鍛鐵路燈（InstancedMesh，避開所有道路與出生點）
  // -------------------------------------------------------------------------
  const lanternCoords: ReadonlyArray<readonly [number, number]> = [
    [rx - 5.6, rz - 9.4], // 西北路口
    [rx + 4.4, rz - 10.6], // 東北路口
    [rx - 4.6, rz + 10.8], // 西南入口側
    [rx + 4.8, rz + 11.4], // 東南入口側（遠離東側民宅階梯）
  ];
  const lanternCount = lanternCoords.length;

  const lanternBaseInst = new THREE.InstancedMesh(
    new THREE.CylinderGeometry(0.22, 0.3, 0.52, 8),
    sandstoneTrimMat,
    lanternCount
  );
  const lanternPostInst = new THREE.InstancedMesh(
    new THREE.CylinderGeometry(0.075, 0.11, 3.45, 8),
    wroughtIronMat,
    lanternCount
  );
  const lanternFrameInst = new THREE.InstancedMesh(
    new THREE.CylinderGeometry(0.28, 0.2, 0.12, 6),
    wroughtIronMat,
    lanternCount
  );
  const lanternGlassInst = new THREE.InstancedMesh(
    new THREE.CylinderGeometry(0.24, 0.19, 0.44, 6),
    new THREE.MeshStandardMaterial({
      color: 0xffdf96,
      emissive: 0xffb84d,
      emissiveIntensity: 1.25,
      roughness: 0.28,
    }),
    lanternCount
  );
  const lanternCapInst = new THREE.InstancedMesh(
    new THREE.ConeGeometry(0.35, 0.34, 6),
    wroughtIronMat,
    lanternCount
  );

  lanternBaseInst.castShadow = true;
  lanternBaseInst.receiveShadow = true;
  lanternPostInst.castShadow = true;
  lanternCapInst.castShadow = true;

  const dummy = new THREE.Object3D();
  for (let i = 0; i < lanternCount; i++) {
    const [lx, lz] = lanternCoords[i];
    dummy.scale.set(1, 1, 1);
    dummy.rotation.set(0, Math.PI / 6, 0);

    dummy.position.set(lx, 0.4, lz);
    dummy.updateMatrix();
    lanternBaseInst.setMatrixAt(i, dummy.matrix);

    dummy.position.set(lx, 2.35, lz);
    dummy.updateMatrix();
    lanternPostInst.setMatrixAt(i, dummy.matrix);

    dummy.position.set(lx, 4.05, lz);
    dummy.updateMatrix();
    lanternFrameInst.setMatrixAt(i, dummy.matrix);

    dummy.position.set(lx, 4.32, lz);
    dummy.updateMatrix();
    lanternGlassInst.setMatrixAt(i, dummy.matrix);

    dummy.position.set(lx, 4.7, lz);
    dummy.updateMatrix();
    lanternCapInst.setMatrixAt(i, dummy.matrix);

    ctx.addCircleCollider({ x: lx, z: lz, r: 0.42 });
  }

  for (const inst of [
    lanternBaseInst,
    lanternPostInst,
    lanternFrameInst,
    lanternGlassInst,
    lanternCapInst,
  ]) {
    inst.instanceMatrix.needsUpdate = true;
    inst.computeBoundingSphere();
  }
  g.add(lanternBaseInst, lanternPostInst, lanternFrameInst, lanternGlassInst, lanternCapInst);

  // -------------------------------------------------------------------------
  // 4. 四座砂岩石砌花圃（InstancedMesh 葉叢與歐風天竺葵／金盞花叢）
  // -------------------------------------------------------------------------
  const planterCoords: ReadonlyArray<readonly [number, number]> = [
    [rx - 12.6, rz + 1.2], // 西緣兩屋之間
    [rx + 13.0, rz + 1.2], // 東緣兩屋之間
    [rx - 6.8, rz + 13.2], // 西南廣場緣（避開出生點）
    [rx + 1.2, rz - 14.2], // 北緣門戶花圃（夾於兩北向道路間）
  ];
  const planterCount = planterCoords.length;

  const planterRimInst = new THREE.InstancedMesh(
    new THREE.CylinderGeometry(1.38, 1.48, 0.56, 8),
    sandstoneCurbMat,
    planterCount
  );
  const planterCapInst = new THREE.InstancedMesh(
    new THREE.TorusGeometry(1.34, 0.11, 6, 8),
    sandstoneTrimMat,
    planterCount
  );
  const planterSoilInst = new THREE.InstancedMesh(
    new THREE.CylinderGeometry(1.18, 1.18, 0.14, 8),
    soilMat,
    planterCount
  );
  planterRimInst.castShadow = true;
  planterRimInst.receiveShadow = true;
  planterSoilInst.receiveShadow = true;

  const leavesPerPlanter = 10;
  const flowersPerPlanter = 14;
  const leafInst = new THREE.InstancedMesh(
    new THREE.DodecahedronGeometry(0.28, 0),
    new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.85, flatShading: true }),
    planterCount * leavesPerPlanter
  );
  const flowerInst = new THREE.InstancedMesh(
    new THREE.DodecahedronGeometry(0.14, 0),
    new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.65 }),
    planterCount * flowersPerPlanter
  );
  leafInst.castShadow = true;

  const rand = createSeededRandom(6151);
  const tmpColor = new THREE.Color();
  const flowerPalette = [0xd94b43, 0xf2be54, 0xfff3d6, 0xe87a74, 0xf08c48];

  let leafIdx = 0;
  let flowerIdx = 0;

  for (let i = 0; i < planterCount; i++) {
    const [px, pz] = planterCoords[i];

    dummy.position.set(px, 0.42, pz);
    dummy.rotation.set(0, Math.PI / 8, 0);
    dummy.scale.set(1, 1, 1);
    dummy.updateMatrix();
    planterRimInst.setMatrixAt(i, dummy.matrix);

    dummy.position.set(px, 0.7, pz);
    dummy.rotation.set(Math.PI / 2, 0, Math.PI / 8);
    dummy.scale.set(1, 1, 0.72);
    dummy.updateMatrix();
    planterCapInst.setMatrixAt(i, dummy.matrix);

    dummy.position.set(px, 0.68, pz);
    dummy.rotation.set(0, Math.PI / 8, 0);
    dummy.scale.set(1, 1, 1);
    dummy.updateMatrix();
    planterSoilInst.setMatrixAt(i, dummy.matrix);

    for (let l = 0; l < leavesPerPlanter; l++) {
      const ang = (l / leavesPerPlanter) * Math.PI * 2 + rand() * 0.4;
      const dist = 0.25 + rand() * 0.68;
      const sc = 0.8 + rand() * 0.55;
      dummy.position.set(px + Math.cos(ang) * dist, 0.84 + rand() * 0.14, pz + Math.sin(ang) * dist);
      dummy.rotation.set(rand() * 0.6, rand() * Math.PI * 2, rand() * 0.6);
      dummy.scale.set(sc * 1.15, sc * 0.78, sc);
      dummy.updateMatrix();
      leafInst.setMatrixAt(leafIdx, dummy.matrix);
      tmpColor.setHSL(0.3 + (rand() - 0.5) * 0.05, 0.48, 0.28 + rand() * 0.12);
      leafInst.setColorAt(leafIdx, tmpColor);
      leafIdx++;
    }

    for (let f = 0; f < flowersPerPlanter; f++) {
      const ang = rand() * Math.PI * 2;
      const dist = 0.15 + Math.sqrt(rand()) * 0.84;
      const sc = 0.75 + rand() * 0.55;
      dummy.position.set(px + Math.cos(ang) * dist, 0.96 + rand() * 0.2, pz + Math.sin(ang) * dist);
      dummy.rotation.set(rand(), rand() * Math.PI * 2, rand());
      dummy.scale.setScalar(sc);
      dummy.updateMatrix();
      flowerInst.setMatrixAt(flowerIdx, dummy.matrix);
      tmpColor.setHex(flowerPalette[(i * 3 + f) % flowerPalette.length]);
      flowerInst.setColorAt(flowerIdx, tmpColor);
      flowerIdx++;
    }

    ctx.addCircleCollider({ x: px, z: pz, r: 1.48 });
  }

  for (const inst of [planterRimInst, planterCapInst, planterSoilInst, leafInst, flowerInst]) {
    inst.instanceMatrix.needsUpdate = true;
    if (inst.instanceColor) inst.instanceColor.needsUpdate = true;
    inst.computeBoundingSphere();
  }
  g.add(planterRimInst, planterCapInst, planterSoilInst, leafInst, flowerInst);

  // -------------------------------------------------------------------------
  // 5. 鄉村木石十字路口牌匾（RUBICUTA / 中央地峽・魯比克塔）
  //    位於南側入口右側 (rx + 6.8, 0, rz + 12.5)，r = 0.8，註冊相機遮蔽
  // -------------------------------------------------------------------------
  const signX = rx + 6.8; // 10.8
  const signZ = rz + 12.5; // 48.5

  const signpostGroup = new THREE.Group();
  signpostGroup.name = 'rubicuta_crossroads_signpost';
  signpostGroup.position.set(signX, 0, signZ);
  signpostGroup.rotation.y = -0.34; // 微朝向南側出生點與進鎮道路

  // 階梯式暖砂岩石砌基座
  const stonePedestalLow = new THREE.Mesh(new THREE.BoxGeometry(2.85, 0.42, 0.92), sandstoneTrimMat);
  stonePedestalLow.position.y = 0.21;
  stonePedestalLow.castShadow = true;
  stonePedestalLow.receiveShadow = true;
  signpostGroup.add(stonePedestalLow);

  const stonePedestalTop = new THREE.Mesh(new THREE.BoxGeometry(2.55, 0.26, 0.72), sandstoneCurbMat);
  stonePedestalTop.position.y = 0.55;
  stonePedestalTop.castShadow = true;
  stonePedestalTop.receiveShadow = true;
  signpostGroup.add(stonePedestalTop);

  // 雙實木立柱與鍛鐵箍帶
  for (const px of [-1.08, 1.08]) {
    const post = new THREE.Mesh(new THREE.BoxGeometry(0.18, 3.35, 0.18), warmTimberMat);
    post.position.set(px, 2.34, 0);
    post.castShadow = true;
    post.receiveShadow = true;
    signpostGroup.add(post);

    const ironBand = new THREE.Mesh(new THREE.BoxGeometry(0.21, 0.12, 0.21), wroughtIronMat);
    ironBand.position.set(px, 0.88, 0);
    signpostGroup.add(ironBand);

    // 頂端斜撐木
    const brace = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.58, 0.11), warmTimberMat);
    brace.position.set(px * 0.78, 3.68, 0);
    brace.rotation.z = px < 0 ? -Math.PI / 4 : Math.PI / 4;
    signpostGroup.add(brace);
  }

  // 上下橫樑
  const topBeam = new THREE.Mesh(new THREE.BoxGeometry(2.68, 0.16, 0.24), warmTimberMat);
  topBeam.position.set(0, 3.92, 0);
  topBeam.castShadow = true;
  signpostGroup.add(topBeam);

  const bottomRail = new THREE.Mesh(new THREE.BoxGeometry(2.34, 0.12, 0.18), warmTimberMat);
  bottomRail.position.set(0, 2.48, 0);
  signpostGroup.add(bottomRail);

  // 雙坡紅棕瓦迷你遮雨簷
  const eaveLength = 2.95;
  for (const side of [-1, 1]) {
    const slope = new THREE.Mesh(
      new THREE.BoxGeometry(eaveLength, 0.1, 0.68),
      terracottaRoofMat
    );
    slope.position.set(0, 4.2, side * 0.25);
    slope.rotation.x = side * 0.48;
    slope.castShadow = true;
    signpostGroup.add(slope);
  }
  const ridgeCap = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.075, eaveLength + 0.04, 8), warmTimberMat);
  ridgeCap.rotation.z = Math.PI / 2;
  ridgeCap.position.set(0, 4.38, 0);
  signpostGroup.add(ridgeCap);

  // 雙面可讀雕刻木質主牌匾
  const plaqueTex = createRubicutaPlaqueTexture();
  const plaqueFaceMat = new THREE.MeshStandardMaterial({ map: plaqueTex, roughness: 0.78 });
  const plaqueEdgeMat = warmTimberMat;
  const plaque = new THREE.Mesh(new THREE.BoxGeometry(2.14, 0.92, 0.12), [
    plaqueEdgeMat,
    plaqueEdgeMat,
    plaqueEdgeMat,
    plaqueEdgeMat,
    plaqueFaceMat,
    plaqueFaceMat,
  ]);
  plaque.position.set(0, 3.2, 0);
  plaque.castShadow = true;
  signpostGroup.add(plaque);

  // 附掛於右側木柱的小型十字路口木指路牌
  const northBladeTex = createTrailBladeTexture('↑ 荒地峽谷・瑪莎多拉');
  const northBladeMat = new THREE.MeshStandardMaterial({ map: northBladeTex, roughness: 0.84 });
  const northBlade = new THREE.Mesh(new THREE.BoxGeometry(1.18, 0.3, 0.06), [
    warmTimberMat,
    warmTimberMat,
    warmTimberMat,
    warmTimberMat,
    northBladeMat,
    northBladeMat,
  ]);
  northBlade.position.set(1.66, 2.08, 0);
  northBlade.castShadow = true;
  signpostGroup.add(northBlade);

  const eastBladeTex = createTrailBladeTexture('→ 壽富拉比海港');
  const eastBladeMat = new THREE.MeshStandardMaterial({ map: eastBladeTex, roughness: 0.84 });
  const eastBlade = new THREE.Mesh(new THREE.BoxGeometry(1.06, 0.28, 0.06), [
    warmTimberMat,
    warmTimberMat,
    warmTimberMat,
    warmTimberMat,
    eastBladeMat,
    eastBladeMat,
  ]);
  eastBlade.position.set(1.58, 1.66, 0.04);
  eastBlade.rotation.y = -0.18;
  eastBlade.castShadow = true;
  signpostGroup.add(eastBlade);

  g.add(signpostGroup);
  ctx.addCircleCollider({ x: signX, z: signZ, r: 0.8 });
  ctx.addCameraOccluder?.(signpostGroup);

  return g;
}
