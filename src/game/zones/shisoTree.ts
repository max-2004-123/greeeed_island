import * as THREE from 'three';

export interface ShisoTreeBuildContext {
  addAnimated: (fn: (t: number, dt: number) => void) => void;
  addCircleCollider: (c: { x: number; z: number; r: number }) => void;
  addCameraOccluder?: (obj: THREE.Object3D) => void;
  getLocalGroundY?: (localX: number, localZ: number) => number;
  addInteractable: (item: {
    id: string;
    label: string;
    position: THREE.Vector3;
    radius: number;
    kind: 'npc' | 'portal' | 'shop' | 'pickup' | 'sign';
  }) => void;
}

export const SHISO_TREE_CENTER = { x: 6, z: 196 } as const;
export const SHISO_TREE_SPAWN = { x: 6, z: 174 } as const;

/** 從起始陣盤一路蜿蜒向北通往安多奇拔城門的草原主道中軸折線 */
const MEADOW_PATH_POINTS: ReadonlyArray<readonly [number, number]> = [
  [6, 174],
  [-1, 148],
  [8, 125],
  [23, 106],
  [26, 92],
];

function distToSegment2D(
  px: number,
  pz: number,
  ax: number,
  az: number,
  bx: number,
  bz: number
): number {
  const vx = bx - ax;
  const vz = bz - az;
  const lenSq = vx * vx + vz * vz;
  if (lenSq < 1e-6) return Math.hypot(px - ax, pz - az);
  const t = Math.max(0, Math.min(1, ((px - ax) * vx + (pz - az) * vz) / lenSq));
  return Math.hypot(px - (ax + vx * t), pz - (az + vz * t));
}

function distToMeadowPath(px: number, pz: number): number {
  let minD = Infinity;
  for (let i = 0; i < MEADOW_PATH_POINTS.length - 1; i++) {
    const [ax, az] = MEADOW_PATH_POINTS[i];
    const [bx, bz] = MEADOW_PATH_POINTS[i + 1];
    const d = distToSegment2D(px, pz, ax, az, bx, bz);
    if (d < minD) minD = d;
  }
  return minD;
}

function createPurpleBrickTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#473661'; // 磚縫暗紫灰
  ctx.fillRect(0, 0, 512, 512);

  const rows = 16;
  const cols = 8;
  const rh = 512 / rows;
  const cw = 512 / cols;

  let seed = 42;
  const rand = () => {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  };

  for (let r = 0; r < rows; r++) {
    const offset = (r % 2) * (cw * 0.5);
    for (let c = -1; c <= cols; c++) {
      const shade = Math.floor((rand() - 0.5) * 26);
      const R = Math.min(255, Math.max(0, 108 + shade));
      const G = Math.min(255, Math.max(0, 84 + Math.floor(shade * 0.8)));
      const B = Math.min(255, Math.max(0, 144 + shade));
      ctx.fillStyle = `rgb(${R},${G},${B})`;
      ctx.fillRect(c * cw + offset + 2, r * rh + 2, cw - 4, rh - 4);
    }
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(3, 4);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function createPurpleTileRoofTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#382552';
  ctx.fillRect(0, 0, 256, 256);

  const rows = 10;
  const cols = 8;
  const rh = 256 / rows;
  const cw = 256 / cols;
  for (let r = 0; r < rows; r++) {
    const off = (r % 2) * (cw * 0.5);
    for (let c = -1; c <= cols; c++) {
      ctx.fillStyle = (r + c) % 2 === 0 ? '#4d366e' : '#432e61';
      ctx.beginPath();
      ctx.arc(c * cw + off + cw / 2, r * rh + rh * 0.65, cw * 0.48, 0, Math.PI);
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

function createSteleTabletTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 384;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#8b9099';
  ctx.fillRect(0, 0, 256, 384);
  ctx.strokeStyle = '#e8c468';
  ctx.lineWidth = 8;
  ctx.strokeRect(12, 12, 232, 360);
  ctx.strokeStyle = '#4f5560';
  ctx.lineWidth = 3;
  ctx.strokeRect(24, 24, 208, 336);

  ctx.textAlign = 'center';
  ctx.fillStyle = '#f8e6a8';
  ctx.font = 'bold 28px sans-serif';
  ctx.fillText('SHISO TREE', 128, 76);

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 24px sans-serif';
  ctx.fillText('貪婪之島起點', 128, 124);

  ctx.fillStyle = '#dfe5ee';
  ctx.font = 'bold 20px sans-serif';
  ctx.fillText('↑ 安多奇拔', 128, 194);
  ctx.fillText('→ 布恩森之森', 128, 240);
  ctx.fillText('✦ 全島導覽碑', 128, 306);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function createWoodSignBoardTexture(text: string, subText: string): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 320;
  canvas.height = 96;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#6f4e32';
  ctx.fillRect(0, 0, 320, 96);
  ctx.strokeStyle = '#472f1c';
  ctx.lineWidth = 6;
  ctx.strokeRect(4, 4, 312, 88);

  ctx.textAlign = 'center';
  ctx.fillStyle = '#fff5d9';
  ctx.font = 'bold 30px sans-serif';
  ctx.fillText(text, 160, 48);

  ctx.fillStyle = '#e5cf9c';
  ctx.font = 'bold 18px sans-serif';
  ctx.fillText(subText, 160, 78);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export function buildShisoTreeZone(ctx: ShisoTreeBuildContext): THREE.Group {
  const root = new THREE.Group();
  root.name = 'zone_shiso_tree';

  const tx = SHISO_TREE_CENTER.x; // 6
  const tz = SHISO_TREE_CENTER.z; // 196
  const sx = SHISO_TREE_SPAWN.x;  // 6
  const sz = SHISO_TREE_SPAWN.z;  // 174

  const towerGroup = new THREE.Group();
  towerGroup.name = 'shiso_tree_tower';
  towerGroup.position.set(tx, 0, tz);

  const brickTex = createPurpleBrickTexture();
  const roofTex = createPurpleTileRoofTexture();

  const purpleBrickMat = new THREE.MeshStandardMaterial({ map: brickTex, roughness: 0.78 });
  const roofMat = new THREE.MeshStandardMaterial({ map: roofTex, roughness: 0.64 });
  const darkTrimMat = new THREE.MeshStandardMaterial({ color: 0x3f2d59, roughness: 0.7 });
  const stoneTrimMat = new THREE.MeshStandardMaterial({ color: 0xc9c2d4, roughness: 0.76 });
  const goldMat = new THREE.MeshStandardMaterial({ color: 0xf0c659, metalness: 0.6, roughness: 0.28 });

  // 1. 雙層圓形石基與塔門迎賓石階（北緣位於 z = 196 - 7.2 = 188.8，離起點陣盤 14.8m，零鏡頭遮擋）
  const plinthOuter = new THREE.Mesh(new THREE.CylinderGeometry(6.5, 7.2, 0.75, 28), stoneTrimMat);
  plinthOuter.position.y = 0.375;
  plinthOuter.receiveShadow = true;
  towerGroup.add(plinthOuter);

  const plinthInner = new THREE.Mesh(new THREE.CylinderGeometry(5.5, 5.9, 0.65, 28), darkTrimMat);
  plinthInner.position.y = 1.05;
  plinthInner.receiveShadow = true;
  towerGroup.add(plinthInner);

  // 2. 孤立紫色石磚圓柱主塔（高寬比 ~3.2:1）
  const tower = new THREE.Mesh(new THREE.CylinderGeometry(4.15, 4.75, 23.2, 28), purpleBrickMat);
  tower.position.y = 12.9;
  tower.castShadow = true;
  tower.receiveShadow = true;
  towerGroup.add(tower);

  // 水平石環裝飾線
  for (const ry of [7.0, 15.0, 23.6]) {
    const band = new THREE.Mesh(new THREE.TorusGeometry(4.42, 0.2, 8, 32), darkTrimMat);
    band.rotation.x = Math.PI / 2;
    band.position.y = ry;
    towerGroup.add(band);
  }

  // 挑出石簷（Corbelled Cornice）與 12 塊簷口托架（InstancedMesh）
  const cornice = new THREE.Mesh(new THREE.CylinderGeometry(5.05, 4.25, 1.15, 28), stoneTrimMat);
  cornice.position.y = 24.4;
  cornice.castShadow = true;
  towerGroup.add(cornice);

  const corbelGeo = new THREE.BoxGeometry(0.42, 0.9, 0.75);
  const corbels = new THREE.InstancedMesh(corbelGeo, darkTrimMat, 12);
  const dummy = new THREE.Object3D();
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2;
    dummy.position.set(Math.sin(a) * 4.45, 23.6, Math.cos(a) * 4.45);
    dummy.rotation.set(0, a, 0);
    dummy.scale.set(1, 1, 1);
    dummy.updateMatrix();
    corbels.setMatrixAt(i, dummy.matrix);
  }
  corbels.instanceMatrix.needsUpdate = true;
  corbels.computeBoundingSphere();
  towerGroup.add(corbels);

  // 深凹尖拱窗洞（四面：深色凹框＋暖黃玻璃＋石窗台）
  const recessMat = new THREE.MeshStandardMaterial({ color: 0x261b38, roughness: 0.85 });
  const glassMat = new THREE.MeshBasicMaterial({ color: 0xfff0b8 });
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * Math.PI * 2;
    const winGroup = new THREE.Group();
    winGroup.position.set(Math.sin(a) * 4.28, 18.8, Math.cos(a) * 4.28);
    winGroup.rotation.y = a;

    const frame = new THREE.Mesh(new THREE.BoxGeometry(1.25, 2.75, 0.34), recessMat);
    winGroup.add(frame);
    const pane = new THREE.Mesh(new THREE.BoxGeometry(0.84, 2.25, 0.16), glassMat);
    pane.position.z = 0.12;
    winGroup.add(pane);
    const sill = new THREE.Mesh(new THREE.BoxGeometry(1.45, 0.22, 0.52), stoneTrimMat);
    sill.position.y = -1.42;
    winGroup.add(sill);
    towerGroup.add(winGroup);
  }

  // 深紫鱗片瓦圓錐尖頂屋頂＋金色尖針風標
  const coneRoof = new THREE.Mesh(new THREE.ConeGeometry(5.85, 9.8, 28), roofMat);
  coneRoof.position.y = 29.8;
  coneRoof.castShadow = true;
  towerGroup.add(coneRoof);

  const finial = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.14, 3.6, 8), goldMat);
  finial.position.y = 36.2;
  towerGroup.add(finial);
  const finialOrb = new THREE.Mesh(new THREE.SphereGeometry(0.32, 12, 10), goldMat);
  finialOrb.position.y = 35.2;
  towerGroup.add(finialOrb);

  // 塔底拱券大門＋石階＋銅門環（朝向正北開闊草原與安多奇拔）
  const doorArch = new THREE.Mesh(new THREE.TorusGeometry(1.58, 0.3, 10, 22, Math.PI), stoneTrimMat);
  doorArch.position.set(0, 1.35, -4.75);
  towerGroup.add(doorArch);
  const door = new THREE.Mesh(
    new THREE.BoxGeometry(2.5, 3.6, 0.5),
    new THREE.MeshStandardMaterial({ color: 0x3d281b, roughness: 0.85 })
  );
  door.position.set(0, 2.9, -4.62);
  towerGroup.add(door);
  for (const dx of [-0.55, 0.55]) {
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.16, 0.035, 6, 12), goldMat);
    ring.position.set(dx, 2.6, -4.9);
    towerGroup.add(ring);
  }
  const doorStep = new THREE.Mesh(new THREE.BoxGeometry(3.8, 0.5, 1.5), stoneTrimMat);
  doorStep.position.set(0, 0.25, -5.6);
  towerGroup.add(doorStep);

  root.add(towerGroup);
  ctx.addCircleCollider({ x: tx, z: tz, r: 6.7 });
  ctx.addCameraOccluder?.(towerGroup);

  // 3. 塔前同心圓刻紋「起點陣盤」（Spawn Pad，位於 (6, 0.08, 174)）
  const padBase = new THREE.Mesh(
    new THREE.CylinderGeometry(5.6, 6.1, 0.16, 32),
    new THREE.MeshStandardMaterial({ color: 0xc9c2b2, roughness: 0.82 })
  );
  padBase.position.set(sx, 0.08, sz);
  padBase.receiveShadow = true;
  root.add(padBase);

  const padRing = new THREE.Mesh(
    new THREE.RingGeometry(4.4, 4.75, 36),
    new THREE.MeshBasicMaterial({ color: 0xf0c659, side: THREE.DoubleSide })
  );
  padRing.rotation.x = -Math.PI / 2;
  padRing.position.set(sx, 0.18, sz);
  root.add(padRing);

  const padInnerRing = new THREE.Mesh(
    new THREE.RingGeometry(2.25, 2.42, 36),
    new THREE.MeshBasicMaterial({ color: 0xe6d6a8, side: THREE.DoubleSide })
  );
  padInnerRing.rotation.x = -Math.PI / 2;
  padInnerRing.position.set(sx, 0.175, sz);
  root.add(padInnerRing);

  // 4. 退至路旁東側的雕花導覽石碑（(15.5, 0, 168)，完全避開起點中軸視線）
  const guideMat = new THREE.MeshStandardMaterial({ color: 0xa6acb5, roughness: 0.78 });
  const stelePos = { x: 15.5, z: 168 };
  const steleGroup = new THREE.Group();
  steleGroup.name = 'shiso_tree_welcome_stele';
  steleGroup.position.set(stelePos.x, 0, stelePos.z);
  steleGroup.rotation.y = -0.38;

  const steleBase = new THREE.Mesh(new THREE.BoxGeometry(2.1, 0.6, 1.2), stoneTrimMat);
  steleBase.position.y = 0.3;
  steleBase.receiveShadow = true;
  steleGroup.add(steleBase);

  const steleBody = new THREE.Mesh(new THREE.BoxGeometry(1.55, 3.0, 0.62), guideMat);
  steleBody.position.y = 2.05;
  steleBody.castShadow = true;
  steleBody.receiveShadow = true;
  steleGroup.add(steleBody);

  const steleFaceMat = new THREE.MeshStandardMaterial({
    map: createSteleTabletTexture(),
    roughness: 0.62,
  });
  const stelePlaque = new THREE.Mesh(new THREE.BoxGeometry(1.32, 2.32, 0.66), steleFaceMat);
  stelePlaque.position.y = 2.05;
  steleGroup.add(stelePlaque);

  const steleCrest = new THREE.Mesh(new THREE.OctahedronGeometry(0.42), goldMat);
  steleCrest.position.y = 3.95;
  steleGroup.add(steleCrest);

  ctx.addAnimated((t) => {
    steleCrest.rotation.y = t * 1.4;
  });

  root.add(steleGroup);
  ctx.addCircleCollider({ x: stelePos.x, z: stelePos.z, r: 1.2 });
  ctx.addCameraOccluder?.(steleGroup);
  ctx.addInteractable({
    id: 'sign_welcome',
    label: '閱讀「Shiso Tree 起始石碑與全島指南」',
    position: new THREE.Vector3(stelePos.x, 0, stelePos.z),
    radius: 3.6,
    kind: 'sign',
  });

  // 5. 沿彎曲草原主道兩側設置低矮石木里程樁（高度 1.30m <= 1.5m，距道路中軸 >= 4.5m，避開 (6,174)~(6,188)）
  const bollardSpecs: Array<{ seg: number; t: number; side: -1 | 1; offset: number }> = [
    { seg: 0, t: 0.44, side: -1, offset: 5.2 },
    { seg: 0, t: 0.44, side: 1, offset: 5.2 },
    { seg: 0, t: 0.84, side: -1, offset: 5.3 },
    { seg: 0, t: 0.84, side: 1, offset: 5.3 },
    { seg: 1, t: 0.36, side: -1, offset: 5.3 },
    { seg: 1, t: 0.72, side: -1, offset: 5.3 },
    { seg: 1, t: 0.72, side: 1, offset: 5.3 },
    { seg: 2, t: 0.35, side: -1, offset: 5.3 },
    { seg: 2, t: 0.35, side: 1, offset: 5.3 },
    { seg: 2, t: 0.78, side: -1, offset: 5.3 },
    { seg: 2, t: 0.78, side: 1, offset: 5.3 },
    { seg: 3, t: 0.42, side: -1, offset: 5.3 },
    { seg: 3, t: 0.42, side: 1, offset: 5.3 },
  ];

  const forkPos = { x: 6.5, z: 142 };
  const bollardCoords: Array<{ x: number; z: number; yaw: number }> = [];
  for (const spec of bollardSpecs) {
    const [ax, az] = MEADOW_PATH_POINTS[spec.seg];
    const [bx, bz] = MEADOW_PATH_POINTS[spec.seg + 1];
    const vx = bx - ax;
    const vz = bz - az;
    const len = Math.hypot(vx, vz);
    const txDir = vx / len;
    const tzDir = vz / len;
    // 法向量：side = +1 往路徑右側（東側），side = -1 往左側（西側）
    const nx = -tzDir * spec.side;
    const nz = txDir * spec.side;
    const px = ax + vx * spec.t + nx * spec.offset;
    const pz = az + vz * spec.t + nz * spec.offset;

    // 雙重幾何守衛：確保離道路 >= 4.5m、不在起點到塔門之間、不撞石碑與岔路牌
    if (distToMeadowPath(px, pz) < 4.5) continue;
    if (pz >= 170 && pz <= 190) continue;
    if (Math.hypot(px - stelePos.x, pz - stelePos.z) < 3.0) continue;
    if (Math.hypot(px - forkPos.x, pz - forkPos.z) < 3.0) continue;
    bollardCoords.push({ x: px, z: pz, yaw: Math.atan2(vx, vz) });
  }

  const woodPostMat = new THREE.MeshStandardMaterial({ color: 0x7a5738, roughness: 0.86 });
  const bollardStoneMat = new THREE.MeshStandardMaterial({ color: 0xb9b4a8, roughness: 0.82 });

  const bollardBaseInst = new THREE.InstancedMesh(
    new THREE.CylinderGeometry(0.32, 0.38, 0.32, 8),
    bollardStoneMat,
    bollardCoords.length
  );
  const bollardShaftInst = new THREE.InstancedMesh(
    new THREE.CylinderGeometry(0.18, 0.22, 0.82, 8),
    woodPostMat,
    bollardCoords.length
  );
  const bollardCapInst = new THREE.InstancedMesh(
    new THREE.SphereGeometry(0.16, 8, 6),
    goldMat,
    bollardCoords.length
  );
  bollardBaseInst.receiveShadow = true;
  bollardShaftInst.castShadow = true;

  for (let i = 0; i < bollardCoords.length; i++) {
    const b = bollardCoords[i];
    const by = ctx.getLocalGroundY ? ctx.getLocalGroundY(b.x, b.z) : 0;
    dummy.scale.set(1, 1, 1);
    dummy.rotation.set(0, b.yaw, 0);

    dummy.position.set(b.x, by + 0.16, b.z);
    dummy.updateMatrix();
    bollardBaseInst.setMatrixAt(i, dummy.matrix);

    dummy.position.set(b.x, by + 0.73, b.z);
    dummy.updateMatrix();
    bollardShaftInst.setMatrixAt(i, dummy.matrix);

    // 總高度：1.14 + 0.16 = 1.30m (<= 1.5m)
    dummy.position.set(b.x, by + 1.18, b.z);
    dummy.updateMatrix();
    bollardCapInst.setMatrixAt(i, dummy.matrix);
  }
  for (const inst of [bollardBaseInst, bollardShaftInst, bollardCapInst]) {
    inst.instanceMatrix.needsUpdate = true;
    inst.computeBoundingSphere();
  }
  root.add(bollardBaseInst, bollardShaftInst, bollardCapInst);

  // 6. 岔路木製指示路牌（(6.5, 142)：向北指「安多奇拔」、向東指「布恩森林道」，自動貼合 V2 起伏地形）
  const forkY = ctx.getLocalGroundY ? ctx.getLocalGroundY(forkPos.x, forkPos.z) - 0.06 : 0;
  const forkGroup = new THREE.Group();
  forkGroup.name = 'shiso_fork_signpost';
  forkGroup.position.set(forkPos.x, forkY, forkPos.z);

  const forkCollar = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.34, 0.34, 8), bollardStoneMat);
  forkCollar.position.y = 0.17;
  forkCollar.receiveShadow = true;
  forkGroup.add(forkCollar);

  const forkPost = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.13, 2.55, 8), woodPostMat);
  forkPost.position.y = 1.38;
  forkPost.castShadow = true;
  forkGroup.add(forkPost);

  const forkCap = new THREE.Mesh(new THREE.ConeGeometry(0.18, 0.24, 6), goldMat);
  forkCap.position.y = 2.74;
  forkGroup.add(forkCap);

  // 北向指示牌（指向安多奇拔）
  const northSignGroup = new THREE.Group();
  northSignGroup.position.set(0, 2.25, 0);
  northSignGroup.rotation.y = Math.PI / 2 - 0.18;
  const northBoardMat = new THREE.MeshStandardMaterial({
    map: createWoodSignBoardTexture('↑ 安多奇拔', 'Antokiba'),
    roughness: 0.76,
  });
  const northBoard = new THREE.Mesh(new THREE.BoxGeometry(1.55, 0.44, 0.1), northBoardMat);
  northBoard.position.x = 0.52;
  northBoard.castShadow = true;
  northSignGroup.add(northBoard);
  const northTip = new THREE.Mesh(new THREE.ConeGeometry(0.26, 0.32, 4), woodPostMat);
  northTip.rotation.z = -Math.PI / 2;
  northTip.position.x = 1.44;
  northSignGroup.add(northTip);
  forkGroup.add(northSignGroup);

  // 東向指示牌（指向布恩森林道）
  const eastSignGroup = new THREE.Group();
  eastSignGroup.position.set(0, 1.68, 0);
  eastSignGroup.rotation.y = 0.08;
  const eastBoardMat = new THREE.MeshStandardMaterial({
    map: createWoodSignBoardTexture('布恩森林道 →', 'Bunzen Forest'),
    roughness: 0.76,
  });
  const eastBoard = new THREE.Mesh(new THREE.BoxGeometry(1.65, 0.44, 0.1), eastBoardMat);
  eastBoard.position.x = 0.56;
  eastBoard.castShadow = true;
  eastSignGroup.add(eastBoard);
  const eastTip = new THREE.Mesh(new THREE.ConeGeometry(0.26, 0.32, 4), woodPostMat);
  eastTip.rotation.z = -Math.PI / 2;
  eastTip.position.x = 1.54;
  eastSignGroup.add(eastTip);
  forkGroup.add(eastSignGroup);

  root.add(forkGroup);
  ctx.addCircleCollider({ x: forkPos.x, z: forkPos.z, r: 0.45 });

  // 草原草叢與野花已統一升級為 world.ts 全島 GPU 迎風搖曳手繪交叉草葉與五瓣野花群
  void distToMeadowPath;
  return root;
}
