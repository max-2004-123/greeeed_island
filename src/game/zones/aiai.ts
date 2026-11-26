import * as THREE from 'three';
import { ModelLibrary } from '../assets';

export interface AiaiBuildContext {
  models: ModelLibrary;
  addAnimated: (fn: (t: number, dt: number) => void) => void;
  addCircleCollider: (c: { x: number; z: number; r: number }) => void;
  addCameraOccluder?: (obj: THREE.Object3D) => void;
}

export const AIAI_CENTER = { x: -36, z: 88 } as const;

function createPastelCobbleTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#d8c2d8';
  ctx.fillRect(0, 0, 512, 512);

  let seed = 2011;
  const rand = () => {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  };

  const rows = 14;
  const cols = 14;
  const rh = 512 / rows;
  const cw = 512 / cols;

  for (let r = 0; r < rows; r++) {
    const off = (r % 2) * (cw * 0.5);
    for (let c = -1; c <= cols; c++) {
      const shade = Math.floor((rand() - 0.5) * 18);
      const R = Math.min(255, Math.max(0, 246 + shade));
      const G = Math.min(255, Math.max(0, 224 + shade));
      const B = Math.min(255, Math.max(0, 238 + shade));
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

function createRoseWindowTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#33204a';
  ctx.fillRect(0, 0, 256, 256);

  const cx = 128;
  const cy = 128;
  const grad = ctx.createRadialGradient(cx, cy, 8, cx, cy, 118);
  grad.addColorStop(0, '#fff7cc');
  grad.addColorStop(0.35, '#ff8fc3');
  grad.addColorStop(0.7, '#b794f4');
  grad.addColorStop(1, '#63b3ed');

  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(cx, cy, 118, 0, Math.PI * 2);
  ctx.fill();

  // Stained-glass petal spokes
  const petals = 12;
  ctx.strokeStyle = '#fff5fa';
  ctx.lineWidth = 5;
  for (let i = 0; i < petals; i++) {
    const a = (i / petals) * Math.PI * 2;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx + Math.cos(a) * 116, cy + Math.sin(a) * 116);
    ctx.stroke();

    ctx.fillStyle = i % 2 === 0 ? 'rgba(255, 112, 166, 0.72)' : 'rgba(138, 212, 255, 0.72)';
    ctx.beginPath();
    ctx.arc(cx + Math.cos(a + Math.PI / petals) * 74, cy + Math.sin(a + Math.PI / petals) * 74, 18, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.strokeStyle = '#ffe58f';
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.arc(cx, cy, 46, 0, Math.PI * 2);
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(cx, cy, 114, 0, Math.PI * 2);
  ctx.stroke();

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function createParasolStripeTexture(stripeHex: string): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 128;
  const ctx = canvas.getContext('2d')!;

  const stripes = 12;
  const sw = 256 / stripes;
  for (let i = 0; i < stripes; i++) {
    ctx.fillStyle = i % 2 === 0 ? stripeHex : '#fff8fc';
    ctx.fillRect(i * sw, 0, sw + 1, 128);
  }
  ctx.fillStyle = '#f5d27a';
  ctx.fillRect(0, 116, 256, 12);

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.ClampToEdgeWrapping;
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function createAiaiPlaqueMesh(): THREE.Group {
  const plaqueGroup = new THREE.Group();

  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 160;
  const ctx = canvas.getContext('2d')!;

  const bg = ctx.createLinearGradient(0, 0, 512, 160);
  bg.addColorStop(0, '#ffe8f4');
  bg.addColorStop(0.5, '#fff6fb');
  bg.addColorStop(1, '#ede3ff');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, 512, 160);

  ctx.strokeStyle = '#ff7eb3';
  ctx.lineWidth = 10;
  ctx.strokeRect(8, 8, 496, 144);

  ctx.strokeStyle = '#e8c468';
  ctx.lineWidth = 3;
  ctx.strokeRect(18, 18, 476, 124);

  // Cute corner hearts
  ctx.fillStyle = '#ff5e9e';
  ctx.font = 'bold 24px sans-serif';
  ctx.textAlign = 'center';
  for (const [hx, hy] of [
    [40, 46],
    [472, 46],
    [40, 130],
    [472, 130],
  ]) {
    ctx.fillText('♥', hx, hy);
  }

  ctx.fillStyle = '#7c2159';
  ctx.font = 'bold 36px sans-serif';
  ctx.fillText('AIAI CITY OF LOVE', 256, 72);

  ctx.fillStyle = '#c42e73';
  ctx.font = 'bold 26px sans-serif';
  ctx.fillText('戀愛都市・愛愛', 256, 120);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;

  const borderMat = new THREE.MeshStandardMaterial({ color: 0xf4c6d9, roughness: 0.42 });
  const backing = new THREE.Mesh(new THREE.BoxGeometry(5.6, 1.75, 0.24), borderMat);
  backing.castShadow = true;
  plaqueGroup.add(backing);

  const faceMat = new THREE.MeshStandardMaterial({ map: tex, roughness: 0.45 });
  const front = new THREE.Mesh(new THREE.PlaneGeometry(5.38, 1.58), faceMat);
  front.position.z = 0.13;
  plaqueGroup.add(front);

  const back = new THREE.Mesh(new THREE.PlaneGeometry(5.38, 1.58), faceMat);
  back.position.z = -0.13;
  back.rotation.y = Math.PI;
  plaqueGroup.add(back);

  return plaqueGroup;
}

function createHeartShape(scale = 1): THREE.Shape {
  const s = scale;
  const shape = new THREE.Shape();
  shape.moveTo(0, -1.8 * s);
  shape.bezierCurveTo(2.4 * s, 0.2 * s, 3.0 * s, 2.8 * s, 1.4 * s, 3.4 * s);
  shape.bezierCurveTo(0.5 * s, 3.7 * s, 0, 2.6 * s, 0, 2.2 * s);
  shape.bezierCurveTo(0, 2.6 * s, -0.5 * s, 3.7 * s, -1.4 * s, 3.4 * s);
  shape.bezierCurveTo(-3.0 * s, 2.8 * s, -2.4 * s, 0.2 * s, 0, -1.8 * s);
  return shape;
}

function createCafeTerrace(
  stripeHex: string,
  materials: {
    ivoryMat: THREE.Material;
    goldMat: THREE.Material;
    seatMat: THREE.Material;
    teaMat: THREE.Material;
  }
): THREE.Group {
  const cafe = new THREE.Group();

  // Bistro table
  const tableBase = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.56, 0.12, 12), materials.ivoryMat);
  tableBase.position.y = 0.06;
  cafe.add(tableBase);

  const tableLeg = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.1, 0.85, 8), materials.ivoryMat);
  tableLeg.position.y = 0.48;
  cafe.add(tableLeg);

  const tableTop = new THREE.Mesh(new THREE.CylinderGeometry(0.95, 0.92, 0.1, 18), materials.ivoryMat);
  tableTop.position.y = 0.92;
  tableTop.castShadow = true;
  tableTop.receiveShadow = true;
  cafe.add(tableTop);

  // Cute teapot & cups
  const pot = new THREE.Mesh(new THREE.SphereGeometry(0.14, 10, 8), materials.teaMat);
  pot.position.set(0.18, 1.08, 0.1);
  cafe.add(pot);
  for (const [cx, cz] of [
    [-0.36, 0.14],
    [0.36, -0.18],
  ]) {
    const cup = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.05, 0.1, 8), materials.ivoryMat);
    cup.position.set(cx, 1.02, cz);
    cafe.add(cup);
  }

  // Striped parasol
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.06, 2.75, 8), materials.goldMat);
  pole.position.y = 1.4;
  pole.castShadow = true;
  cafe.add(pole);

  const canopy = new THREE.Mesh(
    new THREE.ConeGeometry(1.95, 0.72, 16, 1, true),
    new THREE.MeshStandardMaterial({
      map: createParasolStripeTexture(stripeHex),
      roughness: 0.62,
      side: THREE.DoubleSide,
    })
  );
  canopy.position.y = 2.68;
  canopy.castShadow = true;
  cafe.add(canopy);

  const finial = new THREE.Mesh(new THREE.SphereGeometry(0.11, 10, 8), materials.goldMat);
  finial.position.y = 3.08;
  cafe.add(finial);

  // Two cute romantic bistro chairs
  for (const side of [-1, 1]) {
    const chair = new THREE.Group();
    chair.position.set(side * 1.25, 0, side * 0.25);
    chair.rotation.y = side === -1 ? Math.PI / 2 : -Math.PI / 2;

    const seat = new THREE.Mesh(new THREE.CylinderGeometry(0.36, 0.34, 0.08, 12), materials.seatMat);
    seat.position.y = 0.52;
    seat.castShadow = true;
    chair.add(seat);

    const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.24, 0.5, 8), materials.ivoryMat);
    leg.position.y = 0.25;
    chair.add(leg);

    const backLoop = new THREE.Mesh(new THREE.TorusGeometry(0.28, 0.04, 8, 16), materials.ivoryMat);
    backLoop.position.set(0, 0.88, -0.32);
    chair.add(backLoop);

    cafe.add(chair);
  }

  return cafe;
}

/**
 * 戀愛都市・愛愛（The City of Love, Aiai）獨立場景模組
 * - 柔和玫瑰象牙石磚廣場（r = 21）＋薰衣草愛心鑲嵌花環
 * - 雙層粉紫蔚藍童話宮殿（奶油石隅角砌石、浪漫花窗陽台、玫瑰彩繪玻璃窗、山牆、4 座角塔與中央藍頂尖塔）
 * - 主塔高空（y = 21）懸浮導角發光粉紅大愛心＋6 顆環繞粉紅水晶星芒
 * - 南側粉紅花卉迎賓拱門（y = 6.6 高掛童話銘牌，玩家可直穿拱門走向宮殿）
 * - 東西兩座條紋遮陽傘浪漫露天咖啡座、涼亭 Gazebo.glb、長椅、愛心路燈（InstancedMesh）與 8 株外環櫻花樹
 */
export function buildAiaiZone(ctx: AiaiBuildContext): THREE.Group {
  const ag = new THREE.Group();
  ag.name = 'zone_aiai';

  const ax = AIAI_CENTER.x; // -36
  const az = AIAI_CENTER.z; // 88

  const cobbleTex = createPastelCobbleTexture();
  const roseWinTex = createRoseWindowTexture();

  const lilacWallMat = new THREE.MeshStandardMaterial({ color: 0xb794f4, roughness: 0.48 });
  const softLilacMat = new THREE.MeshStandardMaterial({ color: 0xcbb0f7, roughness: 0.52 });
  const skyBlueRoofMat = new THREE.MeshStandardMaterial({ color: 0x63b3ed, roughness: 0.4 });
  const creamStoneMat = new THREE.MeshStandardMaterial({ color: 0xfff6f2, roughness: 0.52 });
  const pastelPinkMat = new THREE.MeshStandardMaterial({ color: 0xff85b8, roughness: 0.44 });
  const deepRoseMat = new THREE.MeshStandardMaterial({ color: 0xd94884, roughness: 0.52 });
  const goldMat = new THREE.MeshStandardMaterial({
    color: 0xf5cf6b,
    metalness: 0.56,
    roughness: 0.28,
  });
  const warmWinMat = new THREE.MeshBasicMaterial({ color: 0xfff1c9 });

  // =========================================================================
  // 1. 柔和玫瑰象牙石磚廣場（r = 21）＋薰衣草愛心鑲嵌環
  // =========================================================================
  const plaza = new THREE.Mesh(
    new THREE.CylinderGeometry(20.6, 21.4, 0.18, 48),
    new THREE.MeshStandardMaterial({ map: cobbleTex, roughness: 0.8 })
  );
  plaza.position.set(ax, 0.09, az);
  plaza.receiveShadow = true;
  ag.add(plaza);

  // 薰衣草花環與奶油石邊條
  const lavenderRing = new THREE.Mesh(
    new THREE.RingGeometry(15.6, 17.4, 56),
    new THREE.MeshStandardMaterial({ color: 0xcab0f5, roughness: 0.72, side: THREE.DoubleSide })
  );
  lavenderRing.rotation.x = -Math.PI / 2;
  lavenderRing.position.set(ax, 0.186, az);
  lavenderRing.receiveShadow = true;
  ag.add(lavenderRing);

  for (const [rIn, rOut] of [
    [15.35, 15.62],
    [17.38, 17.68],
    [19.9, 20.45],
  ] as const) {
    const border = new THREE.Mesh(
      new THREE.RingGeometry(rIn, rOut, 56),
      new THREE.MeshStandardMaterial({ color: 0xfff7fa, roughness: 0.65, side: THREE.DoubleSide })
    );
    border.rotation.x = -Math.PI / 2;
    border.position.set(ax, 0.189, az);
    border.receiveShadow = true;
    ag.add(border);
  }

  // 16 枚平貼於薰衣草石環的粉紅愛心石雕鑲嵌（InstancedMesh）
  const inlayHeartGeo = new THREE.ExtrudeGeometry(createHeartShape(0.18), {
    depth: 0.03,
    bevelEnabled: false,
  });
  inlayHeartGeo.center();
  const inlayHearts = new THREE.InstancedMesh(inlayHeartGeo, pastelPinkMat, 16);
  const dummy = new THREE.Object3D();
  for (let i = 0; i < 16; i++) {
    const a = (i / 16) * Math.PI * 2;
    dummy.position.set(ax + Math.cos(a) * 16.5, 0.198, az + Math.sin(a) * 16.5);
    dummy.rotation.set(-Math.PI / 2, 0, -a + Math.PI / 2);
    dummy.scale.set(1, 1, 1);
    dummy.updateMatrix();
    inlayHearts.setMatrixAt(i, dummy.matrix);
  }
  inlayHearts.instanceMatrix.needsUpdate = true;
  inlayHearts.computeBoundingSphere();
  inlayHearts.receiveShadow = true;
  ag.add(inlayHearts);

  // 柔和浪漫粉光點光源
  const plazaLight = new THREE.PointLight(0xffd2e8, 1.75, 46, 1.4);
  plazaLight.position.set(ax, 10.5, az + 2);
  ag.add(plazaLight);

  // =========================================================================
  // 2. 粉紫蔚藍童話宮殿（Fairytale Pastel Palace at (ax, 0.18, az - 7)，面朝南 +Z）
  // =========================================================================
  const palaceGroup = new THREE.Group();
  palaceGroup.name = 'aiai_fairytale_palace';
  palaceGroup.position.set(ax, 0.18, az - 7);

  // 奶油白石基座與南向三層迎賓台階＋粉紅長地毯
  const plinth = new THREE.Mesh(new THREE.BoxGeometry(11.8, 0.62, 9.2), creamStoneMat);
  plinth.position.y = 0.31;
  plinth.receiveShadow = true;
  plinth.castShadow = true;
  palaceGroup.add(plinth);

  for (let s = 0; s < 3; s++) {
    const sh = 0.2 * (3 - s);
    const step = new THREE.Mesh(new THREE.BoxGeometry(5.2 + s * 0.6, sh, 0.72), creamStoneMat);
    step.position.set(0, sh * 0.5, 4.9 + s * 0.62);
    step.receiveShadow = true;
    palaceGroup.add(step);
  }
  const carpet = new THREE.Mesh(new THREE.BoxGeometry(2.5, 0.04, 4.4), deepRoseMat);
  carpet.position.set(0, 0.02, 7.2);
  carpet.receiveShadow = true;
  palaceGroup.add(carpet);

  // 第一層與第二層粉紫宮殿牆體（0xb794f4）
  const lowerHall = new THREE.Mesh(new THREE.BoxGeometry(10.2, 5.0, 7.6), lilacWallMat);
  lowerHall.position.y = 3.1;
  lowerHall.castShadow = true;
  lowerHall.receiveShadow = true;
  palaceGroup.add(lowerHall);

  const midCornice = new THREE.Mesh(new THREE.BoxGeometry(10.75, 0.36, 8.15), creamStoneMat);
  midCornice.position.y = 5.65;
  palaceGroup.add(midCornice);

  const upperHall = new THREE.Mesh(new THREE.BoxGeometry(7.2, 4.1, 5.8), softLilacMat);
  upperHall.position.y = 7.8;
  upperHall.castShadow = true;
  upperHall.receiveShadow = true;
  palaceGroup.add(upperHall);

  const upperCornice = new THREE.Mesh(new THREE.BoxGeometry(7.7, 0.32, 6.3), creamStoneMat);
  upperCornice.position.y = 9.9;
  palaceGroup.add(upperCornice);

  // 奶油白石隅角砌石（Corner Quoins — InstancedMesh）
  const quoinCoords: Array<[number, number, number]> = [];
  for (const sx of [-1, 1]) {
    for (const sz of [-1, 1]) {
      for (let q = 0; q < 5; q++) {
        quoinCoords.push([sx * 5.08, 1.05 + q * 0.96, sz * 3.78]);
      }
      for (let q = 0; q < 4; q++) {
        quoinCoords.push([sx * 3.58, 6.2 + q * 0.96, sz * 2.88]);
      }
    }
  }
  const quoinInst = new THREE.InstancedMesh(
    new THREE.BoxGeometry(0.42, 0.56, 0.42),
    creamStoneMat,
    quoinCoords.length
  );
  for (let i = 0; i < quoinCoords.length; i++) {
    const [qx, qy, qz] = quoinCoords[i];
    dummy.position.set(qx, qy, qz);
    dummy.rotation.set(0, 0, 0);
    dummy.scale.set(1, 1, 1);
    dummy.updateMatrix();
    quoinInst.setMatrixAt(i, dummy.matrix);
  }
  quoinInst.instanceMatrix.needsUpdate = true;
  quoinInst.computeBoundingSphere();
  palaceGroup.add(quoinInst);

  // 中央階梯式童話山牆（Central Stepped Gable，南向正面）
  const gableSteps: Array<[number, number, number]> = [
    [4.4, 0.72, 10.35],
    [3.2, 0.72, 11.05],
    [2.0, 0.72, 11.75],
    [0.9, 0.65, 12.4],
  ];
  for (const [gw, gh, gy] of gableSteps) {
    const stepBlock = new THREE.Mesh(new THREE.BoxGeometry(gw, gh, 0.55), lilacWallMat);
    stepBlock.position.set(0, gy, 2.88);
    stepBlock.castShadow = true;
    palaceGroup.add(stepBlock);

    const cap = new THREE.Mesh(new THREE.BoxGeometry(gw + 0.24, 0.14, 0.68), creamStoneMat);
    cap.position.set(0, gy + gh * 0.5 + 0.05, 2.88);
    palaceGroup.add(cap);
  }
  const gableFinial = new THREE.Mesh(new THREE.OctahedronGeometry(0.32, 0), goldMat);
  gableFinial.position.set(0, 13.05, 2.88);
  palaceGroup.add(gableFinial);

  // 一樓南向白框拱形雙開大門
  const doorOuterArch = new THREE.Mesh(new THREE.TorusGeometry(1.62, 0.24, 10, 24, Math.PI), creamStoneMat);
  doorOuterArch.position.set(0, 2.75, 3.84);
  palaceGroup.add(doorOuterArch);

  const doorLeafMat = new THREE.MeshStandardMaterial({ color: 0x7b3e68, roughness: 0.55 });
  const doorPanel = new THREE.Mesh(new THREE.BoxGeometry(2.8, 3.5, 0.22), doorLeafMat);
  doorPanel.position.set(0, 2.35, 3.78);
  palaceGroup.add(doorPanel);

  const doorSeam = new THREE.Mesh(new THREE.BoxGeometry(0.1, 3.55, 0.28), goldMat);
  doorSeam.position.set(0, 2.35, 3.82);
  palaceGroup.add(doorSeam);

  const doorTransom = new THREE.Mesh(new THREE.CircleGeometry(1.4, 20, 0, Math.PI), warmWinMat);
  doorTransom.position.set(0, 2.75, 3.92);
  palaceGroup.add(doorTransom);

  for (const side of [-1, 1]) {
    const jamb = new THREE.Mesh(new THREE.BoxGeometry(0.34, 2.3, 0.36), creamStoneMat);
    jamb.position.set(side * 1.62, 1.65, 3.85);
    palaceGroup.add(jamb);
  }

  // 二樓南向浪漫石造陽台＋欄杆（InstancedMesh）
  const balconySlab = new THREE.Mesh(new THREE.BoxGeometry(5.2, 0.3, 1.75), creamStoneMat);
  balconySlab.position.set(0, 5.65, 4.15);
  balconySlab.castShadow = true;
  palaceGroup.add(balconySlab);

  const balRail = new THREE.Mesh(new THREE.BoxGeometry(5.15, 0.14, 0.2), creamStoneMat);
  balRail.position.set(0, 6.62, 4.92);
  palaceGroup.add(balRail);
  for (const side of [-1, 1]) {
    const sideRail = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.14, 1.65), creamStoneMat);
    sideRail.position.set(side * 2.48, 6.62, 4.15);
    palaceGroup.add(sideRail);
  }

  const balCoords: Array<[number, number]> = [];
  for (let i = 0; i < 9; i++) {
    balCoords.push([-2.4 + i * 0.6, 4.92]);
  }
  for (const side of [-1, 1]) {
    balCoords.push([side * 2.48, 4.3], [side * 2.48, 3.7]);
  }
  const balInst = new THREE.InstancedMesh(
    new THREE.CylinderGeometry(0.07, 0.09, 0.85, 8),
    creamStoneMat,
    balCoords.length
  );
  for (let i = 0; i < balCoords.length; i++) {
    dummy.position.set(balCoords[i][0], 6.18, balCoords[i][1]);
    dummy.rotation.set(0, 0, 0);
    dummy.scale.set(1, 1, 1);
    dummy.updateMatrix();
    balInst.setMatrixAt(i, dummy.matrix);
  }
  balInst.instanceMatrix.needsUpdate = true;
  balInst.computeBoundingSphere();
  palaceGroup.add(balInst);

  // 陽台正上方發光彩繪玫瑰玻璃圓窗（Glowing Stained-Glass Rose Window）
  const roseRim = new THREE.Mesh(new THREE.TorusGeometry(1.22, 0.18, 10, 28), creamStoneMat);
  roseRim.position.set(0, 7.9, 2.94);
  palaceGroup.add(roseRim);

  const roseGlass = new THREE.Mesh(
    new THREE.CircleGeometry(1.15, 28),
    new THREE.MeshBasicMaterial({ map: roseWinTex })
  );
  roseGlass.position.set(0, 7.9, 2.96);
  palaceGroup.add(roseGlass);

  // 宮殿兩側與正面暖光拱窗
  for (const side of [-1, 1]) {
    const frontWinFrame = new THREE.Mesh(new THREE.BoxGeometry(1.15, 1.95, 0.22), creamStoneMat);
    frontWinFrame.position.set(side * 3.1, 3.1, 3.82);
    palaceGroup.add(frontWinFrame);

    const frontWinPane = new THREE.Mesh(new THREE.PlaneGeometry(0.84, 1.62), warmWinMat);
    frontWinPane.position.set(side * 3.1, 3.1, 3.94);
    palaceGroup.add(frontWinPane);

    const sideWinFrame = new THREE.Mesh(new THREE.BoxGeometry(0.22, 1.9, 1.15), creamStoneMat);
    sideWinFrame.position.set(side * 5.12, 3.1, 0);
    palaceGroup.add(sideWinFrame);

    const sideWinPane = new THREE.Mesh(new THREE.PlaneGeometry(0.85, 1.56), warmWinMat);
    sideWinPane.position.set(side * 5.24, 3.1, 0);
    sideWinPane.rotation.y = side * (Math.PI / 2);
    palaceGroup.add(sideWinPane);
  }

  // 4 座角塔＋1 座中央蔚藍高聳尖塔（0x63b3ed + 金色塔尖）
  const cornerTurrets: Array<{ x: number; z: number; h: number; r: number; roofH: number }> = [
    { x: -5.35, z: 3.55, h: 10.2, r: 1.42, roofH: 4.5 },
    { x: 5.35, z: 3.55, h: 10.2, r: 1.42, roofH: 4.5 },
    { x: -5.35, z: -3.55, h: 11.4, r: 1.52, roofH: 4.9 },
    { x: 5.35, z: -3.55, h: 11.4, r: 1.52, roofH: 4.9 },
  ];

  for (const ct of cornerTurrets) {
    const tPlinth = new THREE.Mesh(new THREE.CylinderGeometry(ct.r + 0.2, ct.r + 0.3, 0.72, 16), creamStoneMat);
    tPlinth.position.set(ct.x, 0.36, ct.z);
    palaceGroup.add(tPlinth);

    const tShaft = new THREE.Mesh(new THREE.CylinderGeometry(ct.r * 0.94, ct.r * 1.06, ct.h, 18), lilacWallMat);
    tShaft.position.set(ct.x, ct.h * 0.5 + 0.4, ct.z);
    tShaft.castShadow = true;
    palaceGroup.add(tShaft);

    const tCollar = new THREE.Mesh(
      new THREE.CylinderGeometry(ct.r + 0.32, ct.r + 0.08, 0.48, 18),
      creamStoneMat
    );
    tCollar.position.set(ct.x, ct.h + 0.45, ct.z);
    palaceGroup.add(tCollar);

    const tRoof = new THREE.Mesh(new THREE.ConeGeometry(ct.r + 0.58, ct.roofH, 18), skyBlueRoofMat);
    tRoof.position.set(ct.x, ct.h + 0.65 + ct.roofH * 0.5, ct.z);
    tRoof.castShadow = true;
    palaceGroup.add(tRoof);

    const tGoldRim = new THREE.Mesh(new THREE.TorusGeometry(ct.r + 0.52, 0.08, 8, 20), goldMat);
    tGoldRim.rotation.x = Math.PI / 2;
    tGoldRim.position.set(ct.x, ct.h + 0.68, ct.z);
    palaceGroup.add(tGoldRim);

    const tTopY = ct.h + 0.65 + ct.roofH;
    const tFinial = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.09, 1.55, 8), goldMat);
    tFinial.position.set(ct.x, tTopY + 0.72, ct.z);
    palaceGroup.add(tFinial);

    const tOrb = new THREE.Mesh(new THREE.SphereGeometry(0.2, 10, 8), goldMat);
    tOrb.position.set(ct.x, tTopY + 0.12, ct.z);
    palaceGroup.add(tOrb);
  }

  // 中央主尖塔塔鼓與高聳蔚藍尖頂（0x63b3ed）
  const centralDrum = new THREE.Mesh(new THREE.CylinderGeometry(2.25, 2.55, 3.6, 22), lilacWallMat);
  centralDrum.position.set(0, 11.4, -0.2);
  centralDrum.castShadow = true;
  palaceGroup.add(centralDrum);

  const centralCollar = new THREE.Mesh(new THREE.CylinderGeometry(2.75, 2.35, 0.52, 22), creamStoneMat);
  centralCollar.position.set(0, 13.25, -0.2);
  palaceGroup.add(centralCollar);

  const centralSpire = new THREE.Mesh(new THREE.ConeGeometry(3.05, 6.2, 24), skyBlueRoofMat);
  centralSpire.position.set(0, 16.55, -0.2);
  centralSpire.castShadow = true;
  palaceGroup.add(centralSpire);

  const centralFinial = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.11, 1.3, 8), goldMat);
  centralFinial.position.set(0, 20.1, -0.2);
  palaceGroup.add(centralFinial);

  // =========================================================================
  // 3. 高空巨型導角發光粉紅愛心（世界 y = 21）＋6 顆環繞發光粉紅水晶星芒
  // =========================================================================
  const heartBaseY = 20.82; // 20.82 + palaceGroup.y (0.18) = 21.0
  const heartPivot = new THREE.Group();
  heartPivot.position.set(0, heartBaseY, -0.2);

  const heartGeo = new THREE.ExtrudeGeometry(createHeartShape(0.88), {
    depth: 0.65,
    bevelEnabled: true,
    bevelSize: 0.24,
    bevelThickness: 0.24,
    bevelSegments: 4,
  });
  heartGeo.center();

  const heartMesh = new THREE.Mesh(
    heartGeo,
    new THREE.MeshStandardMaterial({
      color: 0xff66a3,
      emissive: 0xe62978,
      emissiveIntensity: 0.72,
      roughness: 0.22,
      metalness: 0.14,
    })
  );
  heartPivot.add(heartMesh);

  // 6 顆環繞發光粉紅水晶星芒
  const sparkleOrbit = new THREE.Group();
  const sparkleGeo = new THREE.OctahedronGeometry(0.32, 0);
  const sparkleMatA = new THREE.MeshBasicMaterial({ color: 0xffa6d4 });
  const sparkleMatB = new THREE.MeshBasicMaterial({ color: 0xffe4f3 });
  const sparkles: Array<{ mesh: THREE.Mesh; radius: number; baseAngle: number; yAmp: number; speed: number }> = [];

  for (let i = 0; i < 6; i++) {
    const ang = (i / 6) * Math.PI * 2;
    const rad = 3.25 + (i % 2) * 0.65;
    const sp = new THREE.Mesh(sparkleGeo, i % 2 === 0 ? sparkleMatA : sparkleMatB);
    sp.scale.set(0.85, 1.45, 0.85);
    sp.position.set(Math.cos(ang) * rad, Math.sin(ang * 2) * 0.9, Math.sin(ang) * rad);
    sparkleOrbit.add(sp);
    sparkles.push({ mesh: sp, radius: rad, baseAngle: ang, yAmp: 0.75 + (i % 3) * 0.28, speed: 0.85 + (i % 2) * 0.25 });
  }
  heartPivot.add(sparkleOrbit);
  palaceGroup.add(heartPivot);

  ctx.addAnimated((t) => {
    heartMesh.rotation.y = t * 0.85;
    heartPivot.position.y = heartBaseY + Math.sin(t * 2.0) * 0.42;

    for (let i = 0; i < sparkles.length; i++) {
      const s = sparkles[i];
      const a = s.baseAngle + t * s.speed;
      s.mesh.position.set(Math.cos(a) * s.radius, Math.sin(t * 2.4 + i) * s.yAmp, Math.sin(a) * s.radius);
      s.mesh.rotation.y = t * 2.5 + i;
      const pulse = 0.85 + Math.sin(t * 4.2 + i * 1.3) * 0.25;
      s.mesh.scale.set(0.85 * pulse, 1.45 * pulse, 0.85 * pulse);
    }
  });

  ag.add(palaceGroup);
  ctx.addCircleCollider({ x: ax, z: az - 7, r: 6.5 });
  ctx.addCameraOccluder?.(palaceGroup);

  // =========================================================================
  // 4. 粉紅花卉迎賓拱門（(ax, 0.18, az + 13)，童話銘牌高掛於 y = 6.6）
  // =========================================================================
  const archGroup = new THREE.Group();
  archGroup.name = 'aiai_entrance_arch';
  archGroup.position.set(ax, 0.18, az + 13);

  for (const side of [-1, 1]) {
    const px = side * 4.2;
    const ped = new THREE.Mesh(new THREE.BoxGeometry(1.32, 0.95, 1.32), creamStoneMat);
    ped.position.set(px, 0.475, 0);
    ped.castShadow = true;
    ped.receiveShadow = true;
    archGroup.add(ped);

    const col = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.5, 5.2, 14), creamStoneMat);
    col.position.set(px, 3.55, 0);
    col.castShadow = true;
    archGroup.add(col);

    const pinkRing = new THREE.Mesh(new THREE.TorusGeometry(0.5, 0.1, 8, 16), pastelPinkMat);
    pinkRing.rotation.x = Math.PI / 2;
    pinkRing.position.set(px, 5.95, 0);
    archGroup.add(pinkRing);

    const cap = new THREE.Mesh(new THREE.BoxGeometry(1.18, 0.36, 1.18), creamStoneMat);
    cap.position.set(px, 6.22, 0);
    archGroup.add(cap);

    const orb = new THREE.Mesh(new THREE.SphereGeometry(0.38, 12, 10), pastelPinkMat);
    orb.position.set(px, 6.72, 0);
    archGroup.add(orb);

    ctx.addCircleCollider({ x: ax + px, z: az + 13, r: 0.7 });
  }

  // 上方雙層粉紅花藝拱券（淨高 > 5.8m，玩家暢通無阻）
  const mainArch = new THREE.Mesh(new THREE.TorusGeometry(4.2, 0.34, 10, 32, Math.PI), pastelPinkMat);
  mainArch.position.set(0, 5.65, 0);
  mainArch.castShadow = true;
  archGroup.add(mainArch);

  const goldInnerArch = new THREE.Mesh(new THREE.TorusGeometry(3.82, 0.09, 8, 28, Math.PI), goldMat);
  goldInnerArch.position.set(0, 5.65, 0);
  archGroup.add(goldInnerArch);

  // 拱門纏繞花卉與綠葉簇（InstancedMesh）
  const garlandPoints: Array<[number, number, number]> = [];
  for (let i = 0; i <= 10; i++) {
    const a = (i / 10) * Math.PI;
    garlandPoints.push([Math.cos(a) * 4.2, 5.65 + Math.sin(a) * 4.2, 0.36]);
    garlandPoints.push([Math.cos(a) * 4.2, 5.65 + Math.sin(a) * 4.2, -0.36]);
  }
  const roseInst = new THREE.InstancedMesh(
    new THREE.DodecahedronGeometry(0.28, 0),
    new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.55 }),
    garlandPoints.length
  );
  const rosePalette = [0xff66a3, 0xffa6c9, 0xd4a5ff, 0xfff0f7];
  const tmpCol = new THREE.Color();
  for (let i = 0; i < garlandPoints.length; i++) {
    const [gx, gy, gz] = garlandPoints[i];
    dummy.position.set(gx, gy, gz);
    dummy.rotation.set(i * 0.4, i * 0.7, 0);
    dummy.scale.setScalar(0.85 + (i % 3) * 0.14);
    dummy.updateMatrix();
    roseInst.setMatrixAt(i, dummy.matrix);
    tmpCol.setHex(rosePalette[i % rosePalette.length]);
    roseInst.setColorAt(i, tmpCol);
  }
  roseInst.instanceMatrix.needsUpdate = true;
  if (roseInst.instanceColor) roseInst.instanceColor.needsUpdate = true;
  roseInst.computeBoundingSphere();
  archGroup.add(roseInst);

  // 拱門水平雕花橫樑（穩固托起童話銘牌並連結雙側花柱，淨高 > 5.7m）
  const archTieBeam = new THREE.Mesh(new THREE.BoxGeometry(8.2, 0.24, 0.26), goldMat);
  archTieBeam.position.set(0, 6.42, 0);
  archGroup.add(archTieBeam);

  // 童話粉彩銘牌（AIAI CITY OF LOVE / 戀愛都市・愛愛），高掛於世界 y = 6.6（local y = 6.42）
  const aiaiPlaque = createAiaiPlaqueMesh();
  aiaiPlaque.position.set(0, 6.42, 0);
  archGroup.add(aiaiPlaque);

  ag.add(archGroup);
  ctx.addCameraOccluder?.(archGroup);

  // =========================================================================
  // 5. 浪漫城鎮細節：雙露天咖啡座、涼亭 Gazebo.glb、長椅、粉彩愛心路燈、8 株櫻花樹
  // =========================================================================
  const cafeMaterials = {
    ivoryMat: creamStoneMat,
    goldMat,
    seatMat: pastelPinkMat,
    teaMat: skyBlueRoofMat,
  };

  const westCafe = createCafeTerrace('#ff7eb3', cafeMaterials);
  westCafe.position.set(ax - 10.5, 0.18, az + 3);
  ag.add(westCafe);
  ctx.addCircleCollider({ x: ax - 10.5, z: az + 3, r: 1.55 });

  const eastCafe = createCafeTerrace('#9c82f2', cafeMaterials);
  eastCafe.position.set(ax + 10.5, 0.18, az + 3);
  eastCafe.rotation.y = Math.PI;
  ag.add(eastCafe);
  ctx.addCircleCollider({ x: ax + 10.5, z: az + 3, r: 1.55 });

  // 浪漫涼亭 Gazebo.glb（(ax - 12, 0.18, az - 5), h = 5.0, r = 2.4）
  ctx.models.place(ag, 'Gazebo.glb', { x: ax - 12, y: 0.18, z: az - 5, targetHeight: 5.0, rotY: 0.45 });
  ctx.addCircleCollider({ x: ax - 12, z: az - 5, r: 2.4 });

  // 廣場休憩長椅 Bench_1.glb
  ctx.models.place(ag, 'Bench_1.glb', { x: ax - 7.6, y: 0.18, z: az + 9.2, targetHeight: 0.64, rotY: 0.5 });
  ctx.models.place(ag, 'Bench_1.glb', { x: ax + 7.6, y: 0.18, z: az + 9.2, targetHeight: 0.64, rotY: -0.5 });
  ctx.models.place(ag, 'Bench_1.glb', { x: ax + 11.8, y: 0.18, z: az - 4.6, targetHeight: 0.64, rotY: -1.3 });

  // 6 盞粉彩愛心路燈（InstancedMesh）
  const lampCoords: ReadonlyArray<readonly [number, number]> = [
    [ax - 6.8, az + 5.8],
    [ax + 6.8, az + 5.8],
    [ax - 11.4, az - 0.8],
    [ax + 11.4, az - 0.8],
    [ax - 8.4, az - 13.0],
    [ax + 8.4, az - 13.0],
  ];

  const lampPostInst = new THREE.InstancedMesh(
    new THREE.CylinderGeometry(0.08, 0.14, 3.65, 10),
    creamStoneMat,
    lampCoords.length
  );
  const lampCollarInst = new THREE.InstancedMesh(
    new THREE.CylinderGeometry(0.24, 0.16, 0.24, 10),
    lilacWallMat,
    lampCoords.length
  );
  const lampHeartGeo = new THREE.ExtrudeGeometry(createHeartShape(0.14), {
    depth: 0.16,
    bevelEnabled: true,
    bevelSize: 0.04,
    bevelThickness: 0.04,
  });
  lampHeartGeo.center();
  const lampHeartInst = new THREE.InstancedMesh(
    lampHeartGeo,
    new THREE.MeshBasicMaterial({ color: 0xffa8d4 }),
    lampCoords.length
  );
  lampPostInst.castShadow = true;

  for (let i = 0; i < lampCoords.length; i++) {
    const [lx, lz] = lampCoords[i];
    dummy.rotation.set(0, Math.atan2(ax - lx, az - lz), 0);
    dummy.scale.set(1, 1, 1);

    dummy.position.set(lx, 2.0, lz);
    dummy.updateMatrix();
    lampPostInst.setMatrixAt(i, dummy.matrix);

    dummy.position.set(lx, 3.88, lz);
    dummy.updateMatrix();
    lampCollarInst.setMatrixAt(i, dummy.matrix);

    dummy.position.set(lx, 4.35, lz);
    dummy.updateMatrix();
    lampHeartInst.setMatrixAt(i, dummy.matrix);

    ctx.addCircleCollider({ x: lx, z: lz, r: 0.38 });
  }
  for (const inst of [lampPostInst, lampCollarInst, lampHeartInst]) {
    inst.instanceMatrix.needsUpdate = true;
    inst.computeBoundingSphere();
  }
  ag.add(lampPostInst, lampCollarInst, lampHeartInst);

  // 8 株環城粉櫻樹 BlossomTree_1.glb（將 GLB 預設橘秋葉材質轉色為粉嫩櫻花瓣，徹底保留南向出生點通道）
  const sakuraLightMat = new THREE.MeshStandardMaterial({
    color: 0xffbad7,
    emissive: 0x3d1025,
    emissiveIntensity: 0.16,
    roughness: 0.72,
    metalness: 0.02,
    flatShading: true,
  });
  const sakuraDeepMat = new THREE.MeshStandardMaterial({
    color: 0xff8bb9,
    emissive: 0x330d1e,
    emissiveIntensity: 0.14,
    roughness: 0.76,
    metalness: 0.02,
    flatShading: true,
  });
  const sakuraBarkMat = new THREE.MeshStandardMaterial({
    color: 0xd8cec8,
    roughness: 0.88,
    metalness: 0.04,
  });
  const sakuraBarkDarkMat = new THREE.MeshStandardMaterial({
    color: 0x5c4b4e,
    roughness: 0.9,
    metalness: 0.04,
  });

  const blossomAnglesDeg = [124, 156, 188, 208, 252, 288, 322, 10];
  for (let i = 0; i < blossomAnglesDeg.length; i++) {
    const rad = (blossomAnglesDeg[i] * Math.PI) / 180;
    const tx = ax + Math.cos(rad) * 19.5;
    const tz = az + Math.sin(rad) * 19.5;
    ctx.models
      .place(ag, 'BlossomTree_1.glb', {
        x: tx,
        y: 0,
        z: tz,
        targetHeight: 7.4 + (i % 3) * 0.55,
        rotY: rad * 1.7,
      })
      .then((tree) => {
        if (!tree) return;
        tree.traverse((obj) => {
          if (!(obj instanceof THREE.Mesh)) return;
          const remap = (mat: THREE.Material): THREE.Material => {
            if (mat.name === 'LightOrange') return sakuraLightMat;
            if (mat.name === 'Orange') return sakuraDeepMat;
            if (mat.name === 'White') return sakuraBarkMat;
            if (mat.name === 'Black') return sakuraBarkDarkMat;
            return mat;
          };
          obj.material = Array.isArray(obj.material) ? obj.material.map(remap) : remap(obj.material);
        });
      });
  }

  return ag;
}
