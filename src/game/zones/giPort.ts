import * as THREE from 'three';
import { ModelLibrary } from '../assets';

export interface GiPortBuildContext {
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

export const GI_PORT_CENTER = { x: -66, z: 54 } as const;

function createHarborQuayStoneTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#8b8378';
  ctx.fillRect(0, 0, 512, 512);

  let seed = 5501;
  const rand = () => {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  };

  const rows = 12;
  const cols = 10;
  const rh = 512 / rows;
  const cw = 512 / cols;

  for (let r = 0; r < rows; r++) {
    const off = (r % 2) * (cw * 0.5);
    for (let c = -1; c <= cols; c++) {
      const shade = Math.floor((rand() - 0.5) * 24);
      const R = Math.min(255, Math.max(0, 184 + shade));
      const G = Math.min(255, Math.max(0, 176 + shade));
      const B = Math.min(255, Math.max(0, 162 + shade));
      ctx.fillStyle = `rgb(${R},${G},${B})`;
      ctx.fillRect(c * cw + off + 2, r * rh + 2, cw - 4, rh - 4);
    }
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(5, 4);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function createIvoryMasonryTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#b4b0a4';
  ctx.fillRect(0, 0, 512, 512);

  let seed = 8087;
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
      const shade = Math.floor((rand() - 0.5) * 18);
      const R = Math.min(255, Math.max(0, 234 + shade));
      const G = Math.min(255, Math.max(0, 229 + shade));
      const B = Math.min(255, Math.max(0, 217 + shade));
      ctx.fillStyle = `rgb(${R},${G},${B})`;
      ctx.fillRect(c * cw + off + 2, r * rh + 2, cw - 4, rh - 4);
    }
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(3, 4);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function createBayWaterRippleTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#1b8ec4';
  ctx.fillRect(0, 0, 256, 256);

  // Subtle sunlit azure wave bands & caustics highlights
  for (let y = 0; y < 256; y += 16) {
    ctx.strokeStyle = y % 32 === 0 ? 'rgba(182, 240, 255, 0.34)' : 'rgba(120, 218, 248, 0.22)';
    ctx.lineWidth = y % 32 === 0 ? 3 : 2;
    ctx.beginPath();
    for (let x = 0; x <= 256; x += 16) {
      const waveY = y + Math.sin((x / 256) * Math.PI * 4 + y * 0.15) * 4;
      if (x === 0) ctx.moveTo(x, waveY);
      else ctx.lineTo(x, waveY);
    }
    ctx.stroke();
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(6, 6);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function createTealTileRoofTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#186e5e';
  ctx.fillRect(0, 0, 256, 256);

  const rows = 10;
  const cols = 8;
  const rh = 256 / rows;
  const cw = 256 / cols;

  for (let r = 0; r < rows; r++) {
    const off = (r % 2) * (cw * 0.5);
    for (let c = -1; c <= cols; c++) {
      ctx.fillStyle = (r + c) % 2 === 0 ? '#27b99b' : '#1f9c82';
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

function createNauticalPlaqueMesh(): THREE.Mesh {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 160;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#1d3247';
  ctx.fillRect(0, 0, 512, 160);

  // Subtle horizontal weathered timber planks
  ctx.fillStyle = '#243c54';
  for (let y = 18; y < 160; y += 28) {
    ctx.fillRect(0, y, 512, 4);
  }

  ctx.strokeStyle = '#c8a15a';
  ctx.lineWidth = 10;
  ctx.strokeRect(8, 8, 496, 144);

  ctx.strokeStyle = '#62d9c2';
  ctx.lineWidth = 3;
  ctx.strokeRect(18, 18, 476, 124);

  ctx.textAlign = 'center';
  ctx.fillStyle = '#f8efd6';
  ctx.font = 'bold 34px sans-serif';
  ctx.fillText('GREED ISLAND PORT', 256, 72);

  ctx.fillStyle = '#79f0da';
  ctx.font = 'bold 24px sans-serif';
  ctx.fillText('貪婪之島港・港長事務所', 256, 120);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return new THREE.Mesh(
    new THREE.BoxGeometry(4.5, 1.4, 0.18),
    new THREE.MeshStandardMaterial({ map: tex, roughness: 0.68 })
  );
}

function createMultipaneWindow(
  width: number,
  height: number,
  frameMat: THREE.Material,
  glassMat: THREE.Material
): THREE.Group {
  const wg = new THREE.Group();

  const frame = new THREE.Mesh(new THREE.BoxGeometry(width + 0.2, height + 0.2, 0.16), frameMat);
  wg.add(frame);

  const glass = new THREE.Mesh(new THREE.PlaneGeometry(width, height), glassMat);
  glass.position.z = 0.09;
  wg.add(glass);

  const vBar = new THREE.Mesh(new THREE.BoxGeometry(0.08, height, 0.12), frameMat);
  vBar.position.z = 0.07;
  wg.add(vBar);

  const hBar = new THREE.Mesh(new THREE.BoxGeometry(width, 0.08, 0.12), frameMat);
  hBar.position.z = 0.07;
  wg.add(hBar);

  const sill = new THREE.Mesh(new THREE.BoxGeometry(width + 0.34, 0.12, 0.28), frameMat);
  sill.position.set(0, -height * 0.5 - 0.1, 0.06);
  wg.add(sill);

  return wg;
}

/**
 * 貪婪之島港 & 艾蓮娜之塔（Greed Island Port & Elena's Exit Tower）獨立場景模組
 * - 海港石砌碼頭平台（(-66, 0.1, 54)）
 * - 港長白色山牆事務所（純正雙坡三角形山牆石板藍屋頂、側翼紅磚煙囪、木造前廊、發光多格窗、紅白救生圈、舊化航海木牌）
 * - 東北向伸入西側封閉海灣的石造防波堤碼頭（鐵繫船柱、港燈 InstancedMesh、Soufrabi_Dock.glb、堤端石燈塔信標、2 艘搖曳帆船 Sailboat.glb）
 * - 艾蓮娜之塔（Shiso Tree 姊妹塔：象牙白與青綠石磚圓塔 h = 16.5、3 道青綠腰環、挑出簷口托架、發光青色離境拱門）
 * - 港長 NPC（npc_harbormaster）與木桶、長椅道具，完全避開 spawnPos [-56, 0, 64]
 */
export function buildGiPortZone(ctx: GiPortBuildContext): THREE.Group {
  const pg = new THREE.Group();
  pg.name = 'zone_gi_port';

  const px = GI_PORT_CENTER.x; // -66
  const pz = GI_PORT_CENTER.z; // 54

  const quayStoneTex = createHarborQuayStoneTexture();
  const ivoryMasonryTex = createIvoryMasonryTexture();
  const tealTileTex = createTealTileRoofTexture();

  const quayMat = new THREE.MeshStandardMaterial({ map: quayStoneTex, roughness: 0.86 });
  const quayEdgeMat = new THREE.MeshStandardMaterial({ color: 0x9b9286, roughness: 0.84 });
  const whiteStuccoMat = new THREE.MeshStandardMaterial({ color: 0xf6f6f2, roughness: 0.68 });
  const slateRoofMat = new THREE.MeshStandardMaterial({ color: 0x355373, roughness: 0.54 });
  const trimWoodMat = new THREE.MeshStandardMaterial({ color: 0x6b4b30, roughness: 0.84 });
  const porchDeckMat = new THREE.MeshStandardMaterial({ color: 0x8f6b47, roughness: 0.86 });
  const brickMat = new THREE.MeshStandardMaterial({ color: 0xa65540, roughness: 0.88 });
  const darkIronMat = new THREE.MeshStandardMaterial({ color: 0x485466, metalness: 0.35, roughness: 0.4 });
  const windowGlowMat = new THREE.MeshBasicMaterial({ color: 0xffe8a3 });
  const lifeRedMat = new THREE.MeshStandardMaterial({ color: 0xd13232, roughness: 0.52 });
  const goldMat = new THREE.MeshStandardMaterial({ color: 0xf0c659, metalness: 0.58, roughness: 0.28 });

  // =========================================================================
  // 1. 海港石砌碼頭平台（(-66, 0.1, 54)）
  // =========================================================================
  const quayPlatform = new THREE.Mesh(new THREE.BoxGeometry(19.0, 0.22, 16.0), quayMat);
  quayPlatform.position.set(px, 0.1, pz);
  quayPlatform.receiveShadow = true;
  pg.add(quayPlatform);

  const quayCurb = new THREE.Mesh(new THREE.BoxGeometry(19.6, 0.16, 16.6), quayEdgeMat);
  quayCurb.position.set(px, 0.04, pz);
  quayCurb.receiveShadow = true;
  pg.add(quayCurb);

  // =========================================================================
  // 2. 港長白色山牆事務所（Harbormaster's White Gabled Office at (px, 0.15, pz)）
  // =========================================================================
  const officeGroup = new THREE.Group();
  officeGroup.name = 'gi_port_harbormaster_office';
  officeGroup.position.set(px, 0.15, pz);
  officeGroup.rotation.y = 0.52; // 朝向東南 arrival / 港長 NPC

  // 石砌基礎台座
  const officeBase = new THREE.Mesh(new THREE.BoxGeometry(7.6, 0.48, 5.8), quayEdgeMat);
  officeBase.position.y = 0.24;
  officeBase.receiveShadow = true;
  officeGroup.add(officeBase);

  // 純白灰泥外牆（寬 7.0 × 高 4.1 × 深 5.2）
  const officeBody = new THREE.Mesh(new THREE.BoxGeometry(7.0, 4.1, 5.2), whiteStuccoMat);
  officeBody.position.y = 2.52;
  officeBody.castShadow = true;
  officeBody.receiveShadow = true;
  officeGroup.add(officeBody);

  // 轉角淺灰石條飾柱
  const cornerMat = new THREE.MeshStandardMaterial({ color: 0xd6dce2, roughness: 0.72 });
  for (const sx of [-3.48, 3.48]) {
    for (const sz of [-2.58, 2.58]) {
      const pilaster = new THREE.Mesh(new THREE.BoxGeometry(0.32, 4.12, 0.32), cornerMat);
      pilaster.position.set(sx, 2.52, sz);
      officeGroup.add(pilaster);
    }
  }

  // 純正三角形山牆擠出（白牆山牆端面，絕非四角錐！）
  const gablePeakH = 2.55;
  const gableShape = new THREE.Shape();
  gableShape.moveTo(-3.5, 0);
  gableShape.lineTo(3.5, 0);
  gableShape.lineTo(0, gablePeakH);
  gableShape.closePath();

  const gableWallGeo = new THREE.ExtrudeGeometry(gableShape, {
    depth: 5.2,
    bevelEnabled: false,
  });
  gableWallGeo.translate(0, 0, -2.6);
  const gableWall = new THREE.Mesh(gableWallGeo, whiteStuccoMat);
  gableWall.position.y = 4.57;
  gableWall.castShadow = true;
  officeGroup.add(gableWall);

  // 雙坡石板藍屋頂（帶出簷與屋脊樑）
  const roofHalfSpan = 3.5;
  const roofSlopeAngle = Math.atan2(gablePeakH, roofHalfSpan); // ~36°
  const roofSlopeLen = Math.hypot(roofHalfSpan, gablePeakH) + 0.75;
  const roofDepth = 6.1;

  for (const side of [-1, 1]) {
    const slope = new THREE.Mesh(new THREE.BoxGeometry(roofSlopeLen, 0.24, roofDepth), slateRoofMat);
    const midX = side * (roofHalfSpan * 0.5 + 0.18);
    const midY = 4.57 + gablePeakH * 0.5 + 0.04;
    slope.position.set(midX, midY, 0);
    slope.rotation.z = -side * roofSlopeAngle;
    slope.castShadow = true;
    slope.receiveShadow = true;
    officeGroup.add(slope);
  }

  const ridgeBeam = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.3, roofDepth + 0.18), slateRoofMat);
  ridgeBeam.position.set(0, 4.57 + gablePeakH + 0.14, 0);
  officeGroup.add(ridgeBeam);

  // 山牆正面小圓形航海舷窗
  const gableRim = new THREE.Mesh(new THREE.TorusGeometry(0.48, 0.08, 8, 20), trimWoodMat);
  gableRim.position.set(0, 5.65, 2.64);
  officeGroup.add(gableRim);
  const gableGlass = new THREE.Mesh(new THREE.CircleGeometry(0.45, 18), windowGlowMat);
  gableGlass.position.set(0, 5.65, 2.63);
  officeGroup.add(gableGlass);

  // 側翼紅磚煙囪高塔（附石帽與煙道）
  const chimneyLower = new THREE.Mesh(new THREE.BoxGeometry(1.15, 5.2, 1.35), brickMat);
  chimneyLower.position.set(-3.75, 2.85, -0.6);
  chimneyLower.castShadow = true;
  officeGroup.add(chimneyLower);

  const chimneyUpper = new THREE.Mesh(new THREE.BoxGeometry(0.88, 3.2, 1.02), brickMat);
  chimneyUpper.position.set(-3.75, 6.8, -0.6);
  chimneyUpper.castShadow = true;
  officeGroup.add(chimneyUpper);

  const chimneyCap = new THREE.Mesh(new THREE.BoxGeometry(1.12, 0.24, 1.24), quayEdgeMat);
  chimneyCap.position.set(-3.75, 8.48, -0.6);
  officeGroup.add(chimneyCap);

  const chimneyPot = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.22, 0.45, 10), brickMat);
  chimneyPot.position.set(-3.75, 8.8, -0.6);
  officeGroup.add(chimneyPot);

  // 有頂木造前廊（Covered Timber Front Porch）
  const porchDeck = new THREE.Mesh(new THREE.BoxGeometry(6.2, 0.34, 2.15), porchDeckMat);
  porchDeck.position.set(0, 0.32, 3.65);
  porchDeck.receiveShadow = true;
  officeGroup.add(porchDeck);

  const porchStep = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.18, 0.68), porchDeckMat);
  porchStep.position.set(0, 0.09, 4.95);
  porchStep.receiveShadow = true;
  officeGroup.add(porchStep);

  for (const postX of [-2.85, -1.15, 1.15, 2.85]) {
    const post = new THREE.Mesh(new THREE.BoxGeometry(0.2, 2.85, 0.2), trimWoodMat);
    post.position.set(postX, 1.9, 4.55);
    post.castShadow = true;
    officeGroup.add(post);
  }
  // 兩側木欄杆
  for (const side of [-1, 1]) {
    const frontRail = new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.12, 0.14), trimWoodMat);
    frontRail.position.set(side * 2.0, 1.25, 4.55);
    officeGroup.add(frontRail);

    const sideRail = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.12, 1.95), trimWoodMat);
    sideRail.position.set(side * 2.85, 1.25, 3.6);
    officeGroup.add(sideRail);
  }

  const porchRoof = new THREE.Mesh(new THREE.BoxGeometry(6.6, 0.2, 2.55), slateRoofMat);
  porchRoof.position.set(0, 3.55, 3.72);
  porchRoof.rotation.x = 0.2;
  porchRoof.castShadow = true;
  officeGroup.add(porchRoof);

  // 事務所木門＋發光門楣窗
  const frontDoor = new THREE.Mesh(new THREE.BoxGeometry(1.35, 2.4, 0.16), trimWoodMat);
  frontDoor.position.set(0, 1.72, 2.62);
  officeGroup.add(frontDoor);

  const doorKnob = new THREE.Mesh(new THREE.SphereGeometry(0.07, 8, 8), goldMat);
  doorKnob.position.set(0.45, 1.68, 2.74);
  officeGroup.add(doorKnob);

  // 多格發光窗戶（正面、右側、背面）
  const frontWinL = createMultipaneWindow(1.05, 1.15, trimWoodMat, windowGlowMat);
  frontWinL.position.set(-2.05, 2.25, 2.62);
  officeGroup.add(frontWinL);

  const frontWinR = createMultipaneWindow(1.05, 1.15, trimWoodMat, windowGlowMat);
  frontWinR.position.set(2.05, 2.25, 2.62);
  officeGroup.add(frontWinR);

  for (const wz of [-1.15, 1.15]) {
    const eastWin = createMultipaneWindow(1.0, 1.15, trimWoodMat, windowGlowMat);
    eastWin.position.set(3.52, 2.45, wz);
    eastWin.rotation.y = Math.PI / 2;
    officeGroup.add(eastWin);
  }
  const backWin = createMultipaneWindow(1.3, 1.15, trimWoodMat, windowGlowMat);
  backWin.position.set(0, 2.45, -2.62);
  backWin.rotation.y = Math.PI;
  officeGroup.add(backWin);

  // 紅白相間救生圈（掛於前廊白牆上）
  const lifeRingGroup = new THREE.Group();
  lifeRingGroup.position.set(1.12, 2.08, 2.72);
  const ringBody = new THREE.Mesh(new THREE.TorusGeometry(0.4, 0.11, 10, 20), whiteStuccoMat);
  lifeRingGroup.add(ringBody);
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * Math.PI * 2 + Math.PI / 4;
    const strap = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.25, 0.24), lifeRedMat);
    strap.position.set(Math.cos(a) * 0.4, Math.sin(a) * 0.4, 0);
    strap.rotation.z = a;
    lifeRingGroup.add(strap);
  }
  officeGroup.add(lifeRingGroup);

  // 舊化航海木牌（GREED ISLAND PORT / 貪婪之島港・港長事務所）立於前廊屋簷支架上方
  for (const bx of [-1.55, 1.55]) {
    const bracket = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.6, 0.16), trimWoodMat);
    bracket.position.set(bx, 3.55, 4.55);
    officeGroup.add(bracket);
  }
  const plaque = createNauticalPlaqueMesh();
  plaque.position.set(0, 4.35, 4.55);
  officeGroup.add(plaque);

  pg.add(officeGroup);
  ctx.addCircleCollider({ x: px, z: pz, r: 4.5 });
  ctx.addCameraOccluder?.(officeGroup);

  // =========================================================================
  // 3. 東北港灣清澈海灣水體（深海基底 + 蔚藍波紋水面 + 拍岸浪花）、
  //    石造防波堤碼頭、鐵繫船柱、港燈、Soufrabi_Dock.glb、
  //    堤端燈塔信標與 2 艘停泊海灣的搖曳帆船（Sailboat.glb）
  // =========================================================================
  const bayCx = px + 20.5; // -45.5
  const bayCz = pz - 17.5; // 36.5
  const bayRx = 21.5;
  const bayRz = 19.5;

  const deepSeaBase = new THREE.Mesh(
    new THREE.CircleGeometry(1, 48),
    new THREE.MeshStandardMaterial({ color: 0x0b4c6e, roughness: 0.92, metalness: 0.05 })
  );
  deepSeaBase.rotation.x = -Math.PI / 2;
  deepSeaBase.scale.set(bayRx, bayRz, 1);
  deepSeaBase.position.set(bayCx, 0.05, bayCz);
  deepSeaBase.receiveShadow = true;
  pg.add(deepSeaBase);

  const bayWaterTex = createBayWaterRippleTexture();
  const bayWaterSurface = new THREE.Mesh(
    new THREE.CircleGeometry(1, 48),
    new THREE.MeshStandardMaterial({
      map: bayWaterTex,
      color: 0x2ba8d9,
      transparent: true,
      opacity: 0.78,
      roughness: 0.18,
      metalness: 0.12,
      depthWrite: false,
    })
  );
  bayWaterSurface.rotation.x = -Math.PI / 2;
  bayWaterSurface.scale.set(bayRx - 0.3, bayRz - 0.3, 1);
  bayWaterSurface.position.set(bayCx, 0.09, bayCz);
  bayWaterSurface.receiveShadow = true;
  pg.add(bayWaterSurface);

  const shoreFoamMat = new THREE.MeshBasicMaterial({
    color: 0xeaf8ff,
    transparent: true,
    opacity: 0.52,
    depthWrite: false,
  });
  const shoreFoamBand = new THREE.Mesh(new THREE.RingGeometry(0.93, 1.0, 56), shoreFoamMat);
  shoreFoamBand.rotation.x = -Math.PI / 2;
  shoreFoamBand.scale.set(bayRx + 0.3, bayRz + 0.3, 1);
  shoreFoamBand.position.set(bayCx, 0.1, bayCz);
  pg.add(shoreFoamBand);

  const jettyAngle = 0.72; // 朝東北開闊海灣延伸（遠離狹窄海峽岸線）
  const jettyCx = px + 11.2; // -54.8
  const jettyCz = pz - 7.8;  // 46.2

  const jettyBody = new THREE.Mesh(new THREE.BoxGeometry(17.5, 1.9, 5.2), quayMat);
  jettyBody.position.set(jettyCx, -0.78, jettyCz);
  jettyBody.rotation.y = jettyAngle;
  jettyBody.receiveShadow = true;
  jettyBody.castShadow = true;
  pg.add(jettyBody);

  // 防波堤兩側石緣護條
  const cosJ = Math.cos(jettyAngle);
  const sinJ = Math.sin(jettyAngle);
  for (const side of [-1, 1]) {
    const curb = new THREE.Mesh(new THREE.BoxGeometry(17.6, 0.26, 0.42), quayEdgeMat);
    curb.position.set(jettyCx + sinJ * side * 2.4, 0.22, jettyCz + cosJ * side * 2.4);
    curb.rotation.y = jettyAngle;
    pg.add(curb);
  }

  // 防波堤鐵繫船柱（8 根）＋海港燈柱與暖光燈球（6 盞）— InstancedMesh
  const bollardCoords: Array<[number, number]> = [];
  const lanternCoords: Array<[number, number]> = [];
  for (let i = 0; i < 4; i++) {
    const along = -6.2 + i * 4.2;
    for (const side of [-1, 1]) {
      const bx = jettyCx + cosJ * along + sinJ * (side * 2.15);
      const bz = jettyCz - sinJ * along + cosJ * (side * 2.15);
      bollardCoords.push([bx, bz]);
    }
  }
  for (let i = 0; i < 3; i++) {
    const along = -4.2 + i * 4.6;
    for (const side of [-1, 1]) {
      const lx = jettyCx + cosJ * along + sinJ * (side * 2.22);
      const lz = jettyCz - sinJ * along + cosJ * (side * 2.22);
      lanternCoords.push([lx, lz]);
    }
  }

  const dummy = new THREE.Object3D();
  const bollardInst = new THREE.InstancedMesh(
    new THREE.CylinderGeometry(0.2, 0.26, 0.66, 10),
    darkIronMat,
    bollardCoords.length
  );
  const bollardCapInst = new THREE.InstancedMesh(
    new THREE.CylinderGeometry(0.26, 0.22, 0.14, 10),
    darkIronMat,
    bollardCoords.length
  );
  for (let i = 0; i < bollardCoords.length; i++) {
    const [bx, bz] = bollardCoords[i];
    dummy.rotation.set(0, 0, 0);
    dummy.scale.set(1, 1, 1);
    dummy.position.set(bx, 0.5, bz);
    dummy.updateMatrix();
    bollardInst.setMatrixAt(i, dummy.matrix);
    dummy.position.set(bx, 0.86, bz);
    dummy.updateMatrix();
    bollardCapInst.setMatrixAt(i, dummy.matrix);
  }

  const lanternPostInst = new THREE.InstancedMesh(
    new THREE.CylinderGeometry(0.08, 0.12, 3.1, 8),
    darkIronMat,
    lanternCoords.length
  );
  const lanternGlobeInst = new THREE.InstancedMesh(
    new THREE.SphereGeometry(0.26, 10, 8),
    new THREE.MeshBasicMaterial({ color: 0xffe49c }),
    lanternCoords.length
  );
  const lanternCapInst = new THREE.InstancedMesh(
    new THREE.ConeGeometry(0.36, 0.34, 8),
    darkIronMat,
    lanternCoords.length
  );
  lanternPostInst.castShadow = true;

  for (let i = 0; i < lanternCoords.length; i++) {
    const [lx, lz] = lanternCoords[i];
    dummy.rotation.set(0, 0, 0);
    dummy.scale.set(1, 1, 1);

    dummy.position.set(lx, 1.72, lz);
    dummy.updateMatrix();
    lanternPostInst.setMatrixAt(i, dummy.matrix);

    dummy.position.set(lx, 3.38, lz);
    dummy.updateMatrix();
    lanternGlobeInst.setMatrixAt(i, dummy.matrix);

    dummy.position.set(lx, 3.74, lz);
    dummy.updateMatrix();
    lanternCapInst.setMatrixAt(i, dummy.matrix);
  }

  for (const inst of [bollardInst, bollardCapInst, lanternPostInst, lanternGlobeInst, lanternCapInst]) {
    inst.instanceMatrix.needsUpdate = true;
    inst.computeBoundingSphere();
  }
  pg.add(bollardInst, bollardCapInst, lanternPostInst, lanternGlobeInst, lanternCapInst);

  // 本地 CC0 碼頭模型 Soufrabi_Dock.glb 銜接防波堤西北側翼（避開 jettyBody 主體不穿插）
  ctx.models.place(pg, 'Soufrabi_Dock.glb', {
    x: jettyCx + cosJ * 2.2 - sinJ * 5.2,
    y: 0.05,
    z: jettyCz - sinJ * 2.2 - cosJ * 5.2,
    targetHeight: 4.5,
    rotY: jettyAngle,
  });

  // 堤端石造燈塔信標（Coastal Stone Jetty Beacon Tower，穩立於海灣深水防波堤端）
  const beaconX = jettyCx + cosJ * 9.2; // ~px + 18.1 (-47.9)
  const beaconZ = jettyCz - sinJ * 9.2; // ~pz - 13.9 (40.1)
  const beaconGroup = new THREE.Group();
  beaconGroup.name = 'gi_port_jetty_beacon';
  beaconGroup.position.set(beaconX, 0, beaconZ);

  const beaconBase = new THREE.Mesh(new THREE.CylinderGeometry(2.1, 2.55, 2.4, 12), quayEdgeMat);
  beaconBase.position.y = -0.6;
  beaconBase.receiveShadow = true;
  beaconGroup.add(beaconBase);

  const beaconShaft = new THREE.Mesh(new THREE.CylinderGeometry(1.25, 1.78, 5.2, 12), whiteStuccoMat);
  beaconShaft.position.y = 3.1;
  beaconShaft.castShadow = true;
  beaconGroup.add(beaconShaft);

  const beaconBand = new THREE.Mesh(new THREE.CylinderGeometry(1.52, 1.62, 0.9, 12), slateRoofMat);
  beaconBand.position.y = 3.1;
  beaconGroup.add(beaconBand);

  const beaconGallery = new THREE.Mesh(new THREE.CylinderGeometry(1.62, 1.32, 0.34, 12), darkIronMat);
  beaconGallery.position.y = 5.82;
  beaconGroup.add(beaconGallery);

  const beaconLanternMat = new THREE.MeshStandardMaterial({
    color: 0xfff0b8,
    emissive: 0xffc95c,
    emissiveIntensity: 0.95,
    roughness: 0.2,
  });
  const beaconLantern = new THREE.Mesh(new THREE.CylinderGeometry(0.92, 0.92, 1.55, 12), beaconLanternMat);
  beaconLantern.position.y = 6.75;
  beaconGroup.add(beaconLantern);

  const beaconRoof = new THREE.Mesh(new THREE.ConeGeometry(1.38, 1.85, 12), slateRoofMat);
  beaconRoof.position.y = 8.42;
  beaconRoof.castShadow = true;
  beaconGroup.add(beaconRoof);

  const beaconTip = new THREE.Mesh(new THREE.SphereGeometry(0.18, 10, 8), goldMat);
  beaconTip.position.y = 9.42;
  beaconGroup.add(beaconTip);

  const beaconLight = new THREE.PointLight(0xffd27d, 1.9, 36, 1.4);
  beaconLight.position.y = 6.8;
  beaconGroup.add(beaconLight);

  pg.add(beaconGroup);
  ctx.addCircleCollider({ x: beaconX, z: beaconZ, r: 2.1 });
  ctx.addCameraOccluder?.(beaconGroup);

  // 2 艘停泊東北蔚藍海灣中輕輕搖曳的帆船（Sailboat.glb，自然微吃水漂浮於海灣水面）
  const sailboat1Wrap = new THREE.Group();
  sailboat1Wrap.position.set(px + 20.5, -0.1, pz - 24.0); // (-45.5, 30.0)
  pg.add(sailboat1Wrap);
  ctx.models.place(sailboat1Wrap, 'Sailboat.glb', { x: 0, y: 0, z: 0, targetHeight: 10.8, rotY: 0.62 });

  const sailboat2Wrap = new THREE.Group();
  sailboat2Wrap.position.set(px + 28.5, -0.1, pz - 18.0); // (-37.5, 36.0)
  pg.add(sailboat2Wrap);
  ctx.models.place(sailboat2Wrap, 'Sailboat.glb', { x: 0, y: 0, z: 0, targetHeight: 9.4, rotY: -0.88 });

  // =========================================================================
  // 4. 艾蓮娜之塔（Elena's Exit Tower at (px - 11, 0, pz - 12)，Shiso Tree 姊妹塔）
  // =========================================================================
  const elenaX = px - 11; // -77
  const elenaZ = pz - 12; // 42

  const elenaGroup = new THREE.Group();
  elenaGroup.name = 'gi_port_elena_tower';
  elenaGroup.position.set(elenaX, 0, elenaZ);

  const ivoryMasonryMat = new THREE.MeshStandardMaterial({ map: ivoryMasonryTex, roughness: 0.72 });
  const tealRoofMat = new THREE.MeshStandardMaterial({ map: tealTileTex, roughness: 0.56 });
  const tealTrimMat = new THREE.MeshStandardMaterial({ color: 0x229984, roughness: 0.55 });
  const darkTealMat = new THREE.MeshStandardMaterial({ color: 0x165e52, roughness: 0.68 });
  const ivoryTrimMat = new THREE.MeshStandardMaterial({ color: 0xeee8dc, roughness: 0.68 });

  // 雙層圓形石座（Plinth）
  const ePlinthOuter = new THREE.Mesh(new THREE.CylinderGeometry(4.25, 4.7, 0.65, 28), ivoryTrimMat);
  ePlinthOuter.position.y = 0.325;
  ePlinthOuter.receiveShadow = true;
  elenaGroup.add(ePlinthOuter);

  const ePlinthInner = new THREE.Mesh(new THREE.CylinderGeometry(3.65, 3.92, 0.55, 28), tealTrimMat);
  ePlinthInner.position.y = 0.9;
  ePlinthInner.receiveShadow = true;
  elenaGroup.add(ePlinthInner);

  // 象牙白石磚圓柱主塔（h = 16.5）
  const elenaShaft = new THREE.Mesh(new THREE.CylinderGeometry(2.82, 3.32, 16.5, 28), ivoryMasonryMat);
  elenaShaft.position.y = 9.4;
  elenaShaft.castShadow = true;
  elenaShaft.receiveShadow = true;
  elenaGroup.add(elenaShaft);

  // 3 道青綠水平石環腰線
  for (const [ry, rr] of [
    [5.4, 3.16],
    [10.6, 3.01],
    [15.8, 2.88],
  ] as const) {
    const band = new THREE.Mesh(new THREE.TorusGeometry(rr, 0.16, 8, 32), tealTrimMat);
    band.rotation.x = Math.PI / 2;
    band.position.y = ry;
    elenaGroup.add(band);
  }

  // 挑出石簷（Corbelled Cornice）＋12 塊青綠托架（InstancedMesh）
  const eCornice = new THREE.Mesh(new THREE.CylinderGeometry(3.6, 2.95, 0.92, 28), ivoryTrimMat);
  eCornice.position.y = 17.85;
  eCornice.castShadow = true;
  elenaGroup.add(eCornice);

  const eCorbelInst = new THREE.InstancedMesh(
    new THREE.BoxGeometry(0.32, 0.72, 0.56),
    tealTrimMat,
    12
  );
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2;
    dummy.position.set(Math.sin(a) * 3.1, 17.2, Math.cos(a) * 3.1);
    dummy.rotation.set(0, a, 0);
    dummy.scale.set(1, 1, 1);
    dummy.updateMatrix();
    eCorbelInst.setMatrixAt(i, dummy.matrix);
  }
  eCorbelInst.instanceMatrix.needsUpdate = true;
  eCorbelInst.computeBoundingSphere();
  elenaGroup.add(eCorbelInst);

  // 四面深凹發光塔窗
  const eWinGlowMat = new THREE.MeshBasicMaterial({ color: 0xbefcf0 });
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * Math.PI * 2 + Math.PI / 4;
    const wg = new THREE.Group();
    wg.position.set(Math.sin(a) * 2.98, 13.1, Math.cos(a) * 2.98);
    wg.rotation.y = a;

    const frame = new THREE.Mesh(new THREE.BoxGeometry(0.98, 2.15, 0.28), darkTealMat);
    wg.add(frame);
    const pane = new THREE.Mesh(new THREE.BoxGeometry(0.64, 1.75, 0.14), eWinGlowMat);
    pane.position.z = 0.1;
    wg.add(pane);
    const sill = new THREE.Mesh(new THREE.BoxGeometry(1.16, 0.18, 0.42), ivoryTrimMat);
    sill.position.y = -1.12;
    wg.add(sill);
    elenaGroup.add(wg);
  }

  // 青綠鱗片瓦圓錐尖頂屋頂＋金色塔尖
  const eRoof = new THREE.Mesh(new THREE.ConeGeometry(4.15, 6.6, 28), tealRoofMat);
  eRoof.position.y = 21.6;
  eRoof.castShadow = true;
  elenaGroup.add(eRoof);

  const eFinialRod = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.12, 2.8, 8), goldMat);
  eFinialRod.position.y = 26.2;
  elenaGroup.add(eFinialRod);

  const eFinialOrb = new THREE.Mesh(new THREE.SphereGeometry(0.28, 12, 10), goldMat);
  eFinialOrb.position.y = 25.1;
  elenaGroup.add(eFinialOrb);

  // 朝向港口碼頭東南方的發光青色離境拱門（Softly Glowing Cyan Exit Archway Door）
  const exitDoorAngle = Math.atan2(px - elenaX, pz - elenaZ); // 指向港口中心
  const doorWrap = new THREE.Group();
  doorWrap.rotation.y = exitDoorAngle;

  const doorArch = new THREE.Mesh(new THREE.TorusGeometry(1.22, 0.24, 10, 22, Math.PI), ivoryTrimMat);
  doorArch.position.set(0, 2.65, 3.34);
  doorWrap.add(doorArch);

  for (const side of [-1, 1]) {
    const pillar = new THREE.Mesh(new THREE.BoxGeometry(0.36, 2.1, 0.44), ivoryTrimMat);
    pillar.position.set(side * 1.22, 1.65, 3.34);
    doorWrap.add(pillar);
  }

  const cyanPortalMat = new THREE.MeshStandardMaterial({
    color: 0x62f5dc,
    emissive: 0x24d1b4,
    emissiveIntensity: 0.78,
    roughness: 0.22,
  });
  const portalRect = new THREE.Mesh(new THREE.BoxGeometry(2.05, 2.1, 0.26), cyanPortalMat);
  portalRect.position.set(0, 1.65, 3.24);
  doorWrap.add(portalRect);

  const portalArchFill = new THREE.Mesh(new THREE.CircleGeometry(1.02, 20, 0, Math.PI), cyanPortalMat);
  portalArchFill.position.set(0, 2.65, 3.38);
  doorWrap.add(portalArchFill);

  const portalStep = new THREE.Mesh(new THREE.BoxGeometry(3.1, 0.42, 1.25), ivoryTrimMat);
  portalStep.position.set(0, 0.21, 4.1);
  portalStep.receiveShadow = true;
  doorWrap.add(portalStep);

  elenaGroup.add(doorWrap);

  pg.add(elenaGroup);
  ctx.addCircleCollider({ x: elenaX, z: elenaZ, r: 4.2 });
  ctx.addCameraOccluder?.(elenaGroup);

  // 動畫：海灣波紋與拍岸浪花＋兩艘帆船輕柔搖曳＋燈塔信標微光脈動＋艾蓮娜離境青光呼吸
  ctx.addAnimated((t) => {
    bayWaterTex.offset.x = Math.sin(t * 0.22) * 0.08 + t * 0.015;
    bayWaterTex.offset.y = Math.cos(t * 0.18) * 0.06;
    shoreFoamMat.opacity = 0.42 + Math.sin(t * 1.8) * 0.14;

    sailboat1Wrap.position.y = -0.1 + Math.sin(t * 1.45) * 0.1;
    sailboat1Wrap.rotation.z = Math.sin(t * 1.15) * 0.036;
    sailboat1Wrap.rotation.x = Math.cos(t * 0.9) * 0.022;

    sailboat2Wrap.position.y = -0.1 + Math.cos(t * 1.65 + 1.1) * 0.09;
    sailboat2Wrap.rotation.z = Math.cos(t * 1.25 + 1.1) * 0.034;
    sailboat2Wrap.rotation.x = Math.sin(t * 0.95) * 0.02;

    const beaconPulse = 0.85 + Math.sin(t * 2.2) * 0.25;
    beaconLanternMat.emissiveIntensity = beaconPulse;
    beaconLight.intensity = 1.65 + Math.sin(t * 2.2) * 0.45;

    cyanPortalMat.emissiveIntensity = 0.65 + Math.sin(t * 2.4) * 0.22;
  });

  // =========================================================================
  // 5. 港長 NPC（npc_harbormaster）與木桶 Barrel.glb、長椅 Bench_1.glb
  //    嚴格保持 spawnPos [-56, 0, 64] 完全暢通無阻！
  // =========================================================================
  ctx.models.place(pg, 'Barrel.glb', { x: px + 4.4, y: 0.21, z: pz - 3.6, targetHeight: 0.58 });
  ctx.models.place(pg, 'Barrel.glb', { x: px + 5.4, y: 0.21, z: pz - 2.9, targetHeight: 0.58, rotY: 0.8 });
  ctx.models.place(pg, 'Barrel.glb', { x: px + 8.6, y: 0.18, z: pz - 1.5, targetHeight: 0.58, rotY: 1.4 });
  ctx.models.place(pg, 'Bench_1.glb', { x: px + 1.4, y: 0.21, z: pz + 5.8, targetHeight: 0.62, rotY: 0.35 });
  ctx.models.place(pg, 'Bench_1.glb', { x: px - 5.2, y: 0.21, z: pz + 4.6, targetHeight: 0.62, rotY: 0.85 });

  const harborNpc = ctx.createNpcMesh(0x2a4d69, 0xffe0bd, 0x4a4a4a);
  harborNpc.position.set(px + 5.2, 0.15, pz + 2);
  harborNpc.rotation.y = 0.65;
  pg.add(harborNpc);

  ctx.addInteractable({
    id: 'npc_harbormaster',
    label: '與貪婪之島港「港長」交涉（離境通行票）',
    position: new THREE.Vector3(px + 5.2, 0.15, pz + 2),
    radius: 3.8,
    kind: 'npc',
  });

  return pg;
}
