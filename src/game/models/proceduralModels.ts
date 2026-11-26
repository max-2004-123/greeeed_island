import * as THREE from 'three';
import { CardDef } from '../cards';

// ============================================================================
// 共用快取幾何體與紋理（避免重複配置 GPU 記憶體，零外部資源依賴）
// ============================================================================

let npcAnimIndex = 0;

interface SharedNpcGeometries {
  bootShaft: THREE.CylinderGeometry;
  bootCuff: THREE.CylinderGeometry;
  bootFoot: THREE.BoxGeometry;
  bootToe: THREE.SphereGeometry;
  bootSole: THREE.BoxGeometry;
  lowerLeg: THREE.CylinderGeometry;
  skirt: THREE.CylinderGeometry;
  skirtTrim: THREE.CylinderGeometry;
  bodice: THREE.CylinderGeometry;
  belt: THREE.CylinderGeometry;
  buckle: THREE.BoxGeometry;
  collar: THREE.CylinderGeometry;
  brooch: THREE.OctahedronGeometry;
  shoulder: THREE.SphereGeometry;
  upperSleeve: THREE.CylinderGeometry;
  sleeveCuff: THREE.CylinderGeometry;
  forearm: THREE.CylinderGeometry;
  hand: THREE.SphereGeometry;
  neck: THREE.CylinderGeometry;
  head: THREE.SphereGeometry;
  ear: THREE.SphereGeometry;
  sclera: THREE.SphereGeometry;
  iris: THREE.SphereGeometry;
  pupil: THREE.SphereGeometry;
  glintMain: THREE.SphereGeometry;
  glintSub: THREE.SphereGeometry;
  lash: THREE.BoxGeometry;
  brow: THREE.BoxGeometry;
  nose: THREE.SphereGeometry;
  smile: THREE.TorusGeometry;
  hairCap: THREE.SphereGeometry;
  hairBackMain: THREE.SphereGeometry;
  hairTuft: THREE.ConeGeometry;
  bangLock: THREE.ConeGeometry;
  sideLock: THREE.ConeGeometry;
  diamondOuter: THREE.OctahedronGeometry;
  diamondInner: THREE.OctahedronGeometry;
  diamondRing: THREE.TorusGeometry;
}

let cachedNpcGeo: SharedNpcGeometries | null = null;

function getNpcGeometries(): SharedNpcGeometries {
  if (cachedNpcGeo) return cachedNpcGeo;
  cachedNpcGeo = {
    bootShaft: new THREE.CylinderGeometry(0.092, 0.084, 0.24, 12),
    bootCuff: new THREE.CylinderGeometry(0.104, 0.095, 0.065, 12),
    bootFoot: new THREE.BoxGeometry(0.165, 0.095, 0.22),
    bootToe: new THREE.SphereGeometry(0.082, 10, 8),
    bootSole: new THREE.BoxGeometry(0.18, 0.038, 0.28),
    lowerLeg: new THREE.CylinderGeometry(0.084, 0.078, 0.22, 10),
    skirt: new THREE.CylinderGeometry(0.225, 0.39, 0.56, 16),
    skirtTrim: new THREE.CylinderGeometry(0.382, 0.398, 0.048, 16),
    bodice: new THREE.CylinderGeometry(0.245, 0.21, 0.5, 16),
    belt: new THREE.CylinderGeometry(0.228, 0.236, 0.08, 16),
    buckle: new THREE.BoxGeometry(0.11, 0.082, 0.035),
    collar: new THREE.CylinderGeometry(0.175, 0.24, 0.11, 14),
    brooch: new THREE.OctahedronGeometry(0.038, 0),
    shoulder: new THREE.SphereGeometry(0.098, 10, 10),
    upperSleeve: new THREE.CylinderGeometry(0.094, 0.098, 0.22, 12),
    sleeveCuff: new THREE.CylinderGeometry(0.102, 0.105, 0.04, 12),
    forearm: new THREE.CylinderGeometry(0.066, 0.056, 0.24, 10),
    hand: new THREE.SphereGeometry(0.064, 10, 10),
    neck: new THREE.CylinderGeometry(0.078, 0.092, 0.14, 12),
    head: new THREE.SphereGeometry(0.275, 18, 16),
    ear: new THREE.SphereGeometry(0.06, 8, 8),
    sclera: new THREE.SphereGeometry(0.052, 12, 10),
    iris: new THREE.SphereGeometry(0.038, 12, 10),
    pupil: new THREE.SphereGeometry(0.02, 10, 8),
    glintMain: new THREE.SphereGeometry(0.014, 8, 8),
    glintSub: new THREE.SphereGeometry(0.007, 6, 6),
    lash: new THREE.BoxGeometry(0.11, 0.017, 0.018),
    brow: new THREE.BoxGeometry(0.098, 0.017, 0.016),
    nose: new THREE.SphereGeometry(0.015, 8, 6),
    smile: new THREE.TorusGeometry(0.036, 0.0075, 6, 12, Math.PI * 0.72),
    hairCap: new THREE.SphereGeometry(0.294, 16, 14, 0, Math.PI * 2, 0, Math.PI * 0.39),
    hairBackMain: new THREE.SphereGeometry(0.274, 14, 12),
    hairTuft: new THREE.ConeGeometry(0.125, 0.38, 7),
    bangLock: new THREE.ConeGeometry(0.054, 0.135, 6),
    sideLock: new THREE.ConeGeometry(0.068, 0.34, 6),
    diamondOuter: new THREE.OctahedronGeometry(0.21, 0),
    diamondInner: new THREE.OctahedronGeometry(0.11, 0),
    diamondRing: new THREE.TorusGeometry(0.28, 0.017, 8, 24),
  };
  return cachedNpcGeo;
}

// ============================================================================
// 1. 精緻動漫風格 NPC 模型（總高 ~2.2m，正面朝 +Z，附浮空黃金任務菱晶）
// ============================================================================
export function createDetailedNpcMesh(
  clothColor: number,
  skinColor: number,
  hairColor: number,
  addAnimated: (fn: (t: number, dt: number) => void) => void
): THREE.Group {
  const g = new THREE.Group();
  const geo = getNpcGeometries();
  const phase = (npcAnimIndex++ * 1.47) % (Math.PI * 2);

  const clothMat = new THREE.MeshStandardMaterial({ color: clothColor, roughness: 0.66 });
  const clothAccent = new THREE.Color(clothColor).multiplyScalar(0.72);
  const clothDarkMat = new THREE.MeshStandardMaterial({ color: clothAccent, roughness: 0.72 });
  const skinMat = new THREE.MeshStandardMaterial({ color: skinColor, roughness: 0.58 });
  const skinShade = new THREE.Color(skinColor).multiplyScalar(0.93);
  const skinShadeMat = new THREE.MeshStandardMaterial({ color: skinShade, roughness: 0.62 });
  const hairMat = new THREE.MeshStandardMaterial({ color: hairColor, roughness: 0.74 });
  const hairHighlight = new THREE.Color(hairColor).lerp(new THREE.Color(0xffffff), 0.14);
  const hairHighlightMat = new THREE.MeshStandardMaterial({ color: hairHighlight, roughness: 0.68 });
  const irisColor = new THREE.Color(hairColor).lerp(new THREE.Color(0x2d1b12), 0.55);
  const irisMat = new THREE.MeshStandardMaterial({ color: irisColor, roughness: 0.28 });

  const bootMat = new THREE.MeshStandardMaterial({ color: 0x2c2832, roughness: 0.72 });
  const soleMat = new THREE.MeshStandardMaterial({ color: 0x19171e, roughness: 0.88 });
  const beltMat = new THREE.MeshStandardMaterial({ color: 0x452d1f, roughness: 0.78 });
  const goldMat = new THREE.MeshStandardMaterial({ color: 0xe6bc4e, roughness: 0.32, metalness: 0.65 });
  const collarMat = new THREE.MeshStandardMaterial({ color: 0xf4efe4, roughness: 0.7 });
  const scleraMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.35 });
  const pupilMat = new THREE.MeshStandardMaterial({ color: 0x120a08, roughness: 0.2 });
  const glintMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
  const mouthMat = new THREE.MeshStandardMaterial({ color: 0xc97b65, roughness: 0.6 });

  // 雙靴與小腿（穩固貼地 y = 0.00，鞋頭朝 +Z）
  for (const side of [-1, 1] as const) {
    const legGroup = new THREE.Group();
    legGroup.position.set(side * 0.145, 0, 0);
    g.add(legGroup);

    const sole = new THREE.Mesh(geo.bootSole, soleMat);
    sole.position.set(0, 0.019, 0.048);
    legGroup.add(sole);

    const foot = new THREE.Mesh(geo.bootFoot, bootMat);
    foot.position.set(0, 0.068, 0.032);
    foot.castShadow = true;
    legGroup.add(foot);

    const toe = new THREE.Mesh(geo.bootToe, bootMat);
    toe.position.set(0, 0.065, 0.132);
    toe.scale.set(1.0, 0.58, 0.9);
    legGroup.add(toe);

    const shaft = new THREE.Mesh(geo.bootShaft, bootMat);
    shaft.position.y = 0.19;
    shaft.castShadow = true;
    legGroup.add(shaft);

    const cuff = new THREE.Mesh(geo.bootCuff, clothDarkMat);
    cuff.position.y = 0.315;
    legGroup.add(cuff);

    const lowerLeg = new THREE.Mesh(geo.lowerLeg, skinMat);
    lowerLeg.position.y = 0.42;
    legGroup.add(lowerLeg);
  }

  // 上半身群組（微幅自然呼吸起伏）
  const bodyGroup = new THREE.Group();
  g.add(bodyGroup);

  // 收腰外放長袍／洋裝
  const skirt = new THREE.Mesh(geo.skirt, clothMat);
  skirt.position.y = 0.72;
  skirt.scale.set(1.06, 1, 0.88);
  skirt.castShadow = true;
  bodyGroup.add(skirt);

  const skirtTrim = new THREE.Mesh(geo.skirtTrim, goldMat);
  skirtTrim.position.y = 0.455;
  skirtTrim.scale.set(1.065, 1, 0.885);
  bodyGroup.add(skirtTrim);

  // 上身衣襟
  const bodice = new THREE.Mesh(geo.bodice, clothMat);
  bodice.position.y = 1.21;
  bodice.scale.set(1.08, 1, 0.76);
  bodice.castShadow = true;
  bodyGroup.add(bodice);

  // 腰帶與正面黃金帶扣（+Z）
  const belt = new THREE.Mesh(geo.belt, beltMat);
  belt.position.y = 0.975;
  belt.scale.set(1.09, 1, 0.8);
  bodyGroup.add(belt);

  const buckle = new THREE.Mesh(geo.buckle, goldMat);
  buckle.position.set(0, 0.975, 0.188);
  bodyGroup.add(buckle);

  // 象牙白領口與胸前黃金領針（+Z）
  const collar = new THREE.Mesh(geo.collar, collarMat);
  collar.position.y = 1.44;
  collar.scale.set(1.06, 1, 0.82);
  bodyGroup.add(collar);

  const brooch = new THREE.Mesh(geo.brooch, goldMat);
  brooch.position.set(0, 1.375, 0.19);
  brooch.scale.set(0.95, 1.2, 0.6);
  bodyGroup.add(brooch);

  // 雙臂與肩膀
  const arms: THREE.Group[] = [];
  for (const side of [-1, 1] as const) {
    const arm = new THREE.Group();
    arm.position.set(side * 0.315, 1.385, 0);
    arm.rotation.z = side * 0.09;
    bodyGroup.add(arm);
    arms.push(arm);

    const shoulder = new THREE.Mesh(geo.shoulder, clothMat);
    shoulder.position.y = -0.02;
    shoulder.castShadow = true;
    arm.add(shoulder);

    const sleeve = new THREE.Mesh(geo.upperSleeve, clothMat);
    sleeve.position.y = -0.12;
    sleeve.castShadow = true;
    arm.add(sleeve);

    const sleeveCuff = new THREE.Mesh(geo.sleeveCuff, collarMat);
    sleeveCuff.position.y = -0.225;
    arm.add(sleeveCuff);

    const forearm = new THREE.Mesh(geo.forearm, skinMat);
    forearm.position.y = -0.345;
    forearm.castShadow = true;
    arm.add(forearm);

    const hand = new THREE.Mesh(geo.hand, skinMat);
    hand.position.set(0, -0.48, 0.01);
    hand.scale.set(0.9, 1.12, 0.86);
    arm.add(hand);
  }

  // 頸部與頭雕
  const neck = new THREE.Mesh(geo.neck, skinShadeMat);
  neck.position.y = 1.51;
  bodyGroup.add(neck);

  const headGroup = new THREE.Group();
  headGroup.position.set(0, 1.76, 0);
  bodyGroup.add(headGroup);

  const head = new THREE.Mesh(geo.head, skinMat);
  head.scale.set(0.98, 1.04, 0.96);
  head.castShadow = true;
  headGroup.add(head);

  // 雙耳
  for (const side of [-1, 1] as const) {
    const ear = new THREE.Mesh(geo.ear, skinMat);
    ear.position.set(side * 0.264, -0.018, -0.01);
    ear.scale.set(0.45, 0.95, 0.72);
    headGroup.add(ear);
  }

  // 動漫五官（朝向 +Z 正面）
  for (const side of [-1, 1] as const) {
    const eyeGroup = new THREE.Group();
    eyeGroup.position.set(side * 0.098, -0.008, 0.238);
    eyeGroup.rotation.y = side * 0.28;
    headGroup.add(eyeGroup);

    const sclera = new THREE.Mesh(geo.sclera, scleraMat);
    sclera.scale.set(1.06, 1.24, 0.34);
    eyeGroup.add(sclera);

    const iris = new THREE.Mesh(geo.iris, irisMat);
    iris.position.set(-side * 0.005, -0.003, 0.01);
    iris.scale.set(0.95, 1.2, 0.34);
    eyeGroup.add(iris);

    const pupil = new THREE.Mesh(geo.pupil, pupilMat);
    pupil.position.set(-side * 0.005, -0.004, 0.016);
    pupil.scale.set(0.9, 1.15, 0.34);
    eyeGroup.add(pupil);

    const glintMain = new THREE.Mesh(geo.glintMain, glintMat);
    glintMain.position.set(-0.014, 0.02, 0.022);
    eyeGroup.add(glintMain);

    const glintSub = new THREE.Mesh(geo.glintSub, glintMat);
    glintSub.position.set(0.014, -0.018, 0.021);
    eyeGroup.add(glintSub);

    const lash = new THREE.Mesh(geo.lash, hairMat);
    lash.position.set(0, 0.058, 0.011);
    lash.rotation.z = side * 0.07;
    eyeGroup.add(lash);

    const brow = new THREE.Mesh(geo.brow, hairMat);
    brow.position.set(0, 0.098, 0.007);
    brow.rotation.z = side * 0.08;
    eyeGroup.add(brow);
  }

  const nose = new THREE.Mesh(geo.nose, skinShadeMat);
  nose.position.set(0, -0.055, 0.266);
  headGroup.add(nose);

  const smile = new THREE.Mesh(geo.smile, mouthMat);
  smile.position.set(0, -0.1, 0.246);
  smile.rotation.z = Math.PI + Math.PI * 0.14;
  headGroup.add(smile);

  // 分層動漫髮型＋前額斜瀏海（+Z，精準停於眉骨之上）＋後腦蓬鬆層次髮束（-Z）
  const hairCap = new THREE.Mesh(geo.hairCap, hairMat);
  hairCap.position.set(0, 0.03, -0.022);
  hairCap.scale.set(1.01, 1.03, 1.02);
  hairCap.castShadow = true;
  headGroup.add(hairCap);

  const hairBack = new THREE.Mesh(geo.hairBackMain, hairMat);
  hairBack.position.set(0, -0.05, -0.09);
  hairBack.scale.set(1.06, 1.12, 0.94);
  hairBack.castShadow = true;
  headGroup.add(hairBack);

  // 後腦三層柔順髮束（-Z 背面立體層次）
  for (const [tx, ty, tz, rx, rz, hi] of [
    [0, -0.22, -0.205, Math.PI + 0.18, 0, false],
    [-0.145, -0.2, -0.175, Math.PI + 0.14, -0.18, true],
    [0.145, -0.2, -0.175, Math.PI + 0.14, 0.18, true],
  ] as const) {
    const tuft = new THREE.Mesh(geo.hairTuft, hi ? hairHighlightMat : hairMat);
    tuft.position.set(tx, ty, tz);
    tuft.rotation.set(rx, 0, rz);
    tuft.castShadow = true;
    headGroup.add(tuft);
  }

  // 兩側垂落鬢髮
  for (const side of [-1, 1] as const) {
    const sideLock = new THREE.Mesh(geo.sideLock, hairMat);
    sideLock.position.set(side * 0.256, -0.11, 0.055);
    sideLock.rotation.set(Math.PI - 0.08, 0, side * 0.1);
    headGroup.add(sideLock);
  }

  // 5 束層次前額瀏海（朝向 +Z，完整露出眉眼與神采）
  for (const [bx, by, bz, rz, sx, hi] of [
    [-0.15, 0.185, 0.195, -0.34, 0.88, false],
    [-0.075, 0.2, 0.218, -0.15, 0.96, true],
    [0.0, 0.208, 0.226, 0.04, 0.94, false],
    [0.08, 0.2, 0.218, 0.18, 0.96, true],
    [0.155, 0.185, 0.195, 0.36, 0.88, false],
  ] as const) {
    const bang = new THREE.Mesh(geo.bangLock, hi ? hairHighlightMat : hairMat);
    bang.position.set(bx, by, bz);
    bang.rotation.set(Math.PI - 0.32, 0, rz);
    bang.scale.set(sx, 1, 0.62);
    headGroup.add(bang);
  }

  // 頭頂雙重切面發光貪婪之島黃金任務菱晶（位於 y ≈ 2.62）
  const markerGroup = new THREE.Group();
  markerGroup.position.y = 2.62;
  g.add(markerGroup);

  const diamondOuter = new THREE.Mesh(
    geo.diamondOuter,
    new THREE.MeshStandardMaterial({
      color: 0xffe58f,
      emissive: 0xf0b830,
      emissiveIntensity: 0.85,
      metalness: 0.55,
      roughness: 0.18,
    })
  );
  diamondOuter.scale.set(0.82, 1.38, 0.82);
  markerGroup.add(diamondOuter);

  const diamondInner = new THREE.Mesh(
    geo.diamondInner,
    new THREE.MeshBasicMaterial({ color: 0xfffce3 })
  );
  diamondInner.scale.set(0.85, 1.32, 0.85);
  markerGroup.add(diamondInner);

  const diamondHalo = new THREE.Mesh(
    geo.diamondRing,
    new THREE.MeshBasicMaterial({
      color: 0xffe58f,
      transparent: true,
      opacity: 0.82,
    })
  );
  diamondHalo.rotation.x = Math.PI / 2 - 0.32;
  markerGroup.add(diamondHalo);

  // 註冊待機呼吸與任務菱晶旋轉動畫
  addAnimated((t) => {
    const breath = Math.sin(t * 2.1 + phase);
    bodyGroup.position.y = breath * 0.02;
    arms[0].rotation.z = -0.09 - breath * 0.018;
    arms[1].rotation.z = 0.09 + breath * 0.018;

    markerGroup.position.y = 2.62 + Math.sin(t * 2.8 + phase) * 0.11;
    diamondOuter.rotation.y = t * 2.0 + phase;
    diamondInner.rotation.y = -t * 2.8 + phase;
    diamondHalo.rotation.z = t * 1.6 + phase;
  });

  return g;
}

// ============================================================================
// 2. 高精細 3D 貪婪之島卡片拾取物（0.78 × 1.12 × 0.09，靜態快取正反卡面＋雙反向光環）
// ============================================================================

let cachedCardFrameGeo: THREE.ExtrudeGeometry | null = null;
let cachedCardFaceGeo: THREE.PlaneGeometry | null = null;
let cachedCardOuterRingGeo: THREE.RingGeometry | null = null;
let cachedCardInnerRingGeo: THREE.RingGeometry | null = null;
let cachedCardDiscGeo: THREE.CircleGeometry | null = null;
let cachedCardPipGeo: THREE.OctahedronGeometry | null = null;

export type CardPickupStyle = 'red' | 'blue' | 'yellow';

const cardScanLoader = new THREE.TextureLoader();
const cachedFrontTexByCardId = new Map<string, THREE.Texture>();
let cachedCardBackTex: THREE.CanvasTexture | null = null;

function getCardFrameGeometry(): THREE.ExtrudeGeometry {
  if (cachedCardFrameGeo) return cachedCardFrameGeo;

  // 外框尺寸比例貼近官方 63:88 實卡（含斜角 ~0.78 × 1.09 × 0.09）
  const w = 0.72;
  const h = 1.02;
  const r = 0.05;
  const hw = w / 2;
  const hh = h / 2;

  const shape = new THREE.Shape();
  shape.moveTo(-hw + r, -hh);
  shape.lineTo(hw - r, -hh);
  shape.quadraticCurveTo(hw, -hh, hw, -hh + r);
  shape.lineTo(hw, hh - r);
  shape.quadraticCurveTo(hw, hh, hw - r, hh);
  shape.lineTo(-hw + r, hh);
  shape.quadraticCurveTo(-hw, hh, -hw, hh - r);
  shape.lineTo(-hw, -hh + r);
  shape.quadraticCurveTo(-hw, -hh, -hw + r, -hh);

  const geo = new THREE.ExtrudeGeometry(shape, {
    depth: 0.045,
    bevelEnabled: true,
    bevelSegments: 2,
    steps: 1,
    bevelSize: 0.028,
    bevelThickness: 0.018,
  });
  geo.translate(0, 0, -0.0225);
  cachedCardFrameGeo = geo;
  return geo;
}

let cachedPaperGrainCanvas: HTMLCanvasElement | null = null;
let cachedClothWeaveCanvas: HTMLCanvasElement | null = null;

function getGrainPatternCanvas(clothWeave: boolean): HTMLCanvasElement {
  if (clothWeave && cachedClothWeaveCanvas) return cachedClothWeaveCanvas;
  if (!clothWeave && cachedPaperGrainCanvas) return cachedPaperGrainCanvas;

  const size = 64;
  const c = document.createElement('canvas');
  c.width = size;
  c.height = size;
  const gctx = c.getContext('2d')!;

  if (clothWeave) {
    gctx.fillStyle = 'rgba(255, 252, 240, 0.036)';
    for (let y = 0; y < size; y += 4) gctx.fillRect(0, y, size, 1);
    gctx.fillStyle = 'rgba(10, 12, 20, 0.058)';
    for (let x = 0; x < size; x += 4) gctx.fillRect(x, 0, 1, size);
  }

  let s = clothWeave ? 7919 : 3571;
  const rand = () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
  for (let i = 0; i < 240; i++) {
    const x = Math.floor(rand() * size);
    const y = Math.floor(rand() * size);
    gctx.fillStyle = rand() > 0.5 ? 'rgba(24, 20, 14, 0.048)' : 'rgba(255, 252, 242, 0.036)';
    gctx.fillRect(x, y, 2, 1);
  }

  if (clothWeave) cachedClothWeaveCanvas = c;
  else cachedPaperGrainCanvas = c;
  return c;
}

function applyMatteFiberGrain(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  _seedInit: number,
  clothWeave = false
): void {
  const pat = ctx.createPattern(getGrainPatternCanvas(clothWeave), 'repeat');
  if (!pat) return;
  ctx.save();
  ctx.fillStyle = pat;
  ctx.fillRect(0, 0, w, h);
  ctx.restore();
}

/**
 * 繪製原作灰藍霧面布紋幾何卡背（512×716），共用單張快取紋理。
 */
function getAuthenticCardBackTexture(): THREE.CanvasTexture {
  if (cachedCardBackTex) return cachedCardBackTex;
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 716;
  const ctx = canvas.getContext('2d')!;

  const bgGrad = ctx.createLinearGradient(0, 0, 512, 716);
  bgGrad.addColorStop(0, '#484d6c');
  bgGrad.addColorStop(1, '#2c304a');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, 512, 716);

  ctx.strokeStyle = '#926b82';
  ctx.lineWidth = 10;
  ctx.strokeRect(28, 28, 456, 660);

  ctx.fillStyle = '#c5cec6';
  ctx.beginPath();
  ctx.arc(256, 358, 164, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#926b82';
  ctx.lineWidth = 8;
  ctx.stroke();

  // 四向方位三角＋同心圓靶心
  ctx.fillStyle = '#2d3839';
  const dirs = [
    [256, 206, 236, 236, 276, 236],
    [256, 510, 236, 480, 276, 480],
    [104, 358, 134, 338, 134, 378],
    [408, 358, 378, 338, 378, 378],
  ];
  for (const [x1, y1, x2, y2, x3, y3] of dirs) {
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.lineTo(x3, y3);
    ctx.closePath();
    ctx.fill();
  }

  for (const [r, fill] of [
    [116, '#2d3839'],
    [86, '#c3cdc6'],
    [56, '#b0bcb4'],
    [28, '#263031'],
  ] as const) {
    ctx.fillStyle = fill;
    ctx.beginPath();
    ctx.arc(256, 358, r, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.fillStyle = '#d6c8cf';
  ctx.font = 'bold 34px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.fillText('GREED ISLAND', 256, 106);
  ctx.font = 'bold 22px sans-serif';
  ctx.fillText('HUNTER × HUNTER · G·I', 256, 634);

  applyMatteFiberGrain(ctx, 512, 716, 8821, true);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  tex.needsUpdate = true;
  cachedCardBackTex = tex;
  return tex;
}

function getCachedCardFrontTexture(card: CardDef): THREE.Texture {
  const key = `${card.id}`;
  let tex = cachedFrontTexByCardId.get(key);
  if (!tex) {
    tex = cardScanLoader.load(`./cards/${card.id}.webp`);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = 4;
    cachedFrontTexByCardId.set(key, tex);
  }
  return tex;
}

export function createGreedIslandCardPickupMesh(
  cardOrVariant: CardDef | CardPickupStyle | boolean,
  addAnimated: (fn: (t: number, dt: number) => void) => void
): THREE.Group {
  const card: CardDef =
    typeof cardOrVariant === 'object'
      ? cardOrVariant
      : {
          id: cardOrVariant === true || cardOrVariant === 'red' ? 25 : 21449,
          code: cardOrVariant === true || cardOrVariant === 'red' ? '025' : '21449',
          name: cardOrVariant === true || cardOrVariant === 'red' ? '指定卡片' : '貪婪之島卡片',
          enName: 'Greed Island Card',
          category:
            cardOrVariant === true || cardOrVariant === 'red'
              ? 'specified'
              : cardOrVariant === 'blue'
              ? 'spell'
              : 'item',
          border:
            typeof cardOrVariant === 'boolean'
              ? cardOrVariant
                ? 'red'
                : 'yellow'
              : cardOrVariant,
          rank: 'B',
          limit: 30,
          icon: '✨',
          description: '貪婪之島卡片化道具。',
          sellPrice: 1000,
        };

  const g = new THREE.Group();
  const primaryHex =
    card.border === 'red' ? 0xe84858 : card.border === 'blue' ? 0x3b9eff : 0xf2c64d;
  const accentHex =
    card.border === 'red' ? 0xffcfd5 : card.border === 'blue' ? 0xc2e6ff : 0xfff0b0;

  if (!cachedCardFaceGeo) cachedCardFaceGeo = new THREE.PlaneGeometry(0.71, 1.0);
  if (!cachedCardOuterRingGeo) cachedCardOuterRingGeo = new THREE.RingGeometry(0.84, 0.96, 32);
  if (!cachedCardInnerRingGeo) cachedCardInnerRingGeo = new THREE.RingGeometry(0.56, 0.65, 28);
  if (!cachedCardDiscGeo) cachedCardDiscGeo = new THREE.CircleGeometry(0.52, 24);
  if (!cachedCardPipGeo) cachedCardPipGeo = new THREE.OctahedronGeometry(0.065, 0);

  // 漂浮旋轉的實體卡片群組（深炭黑外框＋高清正面實卡＋灰藍原著卡背）
  const cardPivot = new THREE.Group();
  g.add(cardPivot);

  const frameMat = new THREE.MeshStandardMaterial({
    color: 0x1d1e21,
    emissive: primaryHex,
    emissiveIntensity: 0.08,
    metalness: 0.06,
    roughness: 0.84,
  });
  const frameMesh = new THREE.Mesh(getCardFrameGeometry(), frameMat);
  frameMesh.castShadow = true;
  cardPivot.add(frameMesh);

  const frontTex = getCachedCardFrontTexture(card);
  const frontMat = new THREE.MeshStandardMaterial({
    map: frontTex,
    emissiveMap: frontTex,
    emissive: new THREE.Color(0xffffff),
    emissiveIntensity: 0.14,
    roughness: 0.84,
    metalness: 0.02,
  });

  const backTex = getAuthenticCardBackTexture();
  const backMat = new THREE.MeshStandardMaterial({
    map: backTex,
    emissiveMap: backTex,
    emissive: new THREE.Color(0xffffff),
    emissiveIntensity: 0.12,
    roughness: 0.86,
    metalness: 0.02,
  });

  // 正反兩面高清卡面貼圖（略微外推 0.042 避免與斜角邊框 Z 衝突）
  const frontFace = new THREE.Mesh(cachedCardFaceGeo, frontMat);
  frontFace.position.z = 0.042;
  cardPivot.add(frontFace);

  const backFace = new THREE.Mesh(cachedCardFaceGeo, backMat);
  backFace.position.z = -0.042;
  backFace.rotation.y = Math.PI;
  cardPivot.add(backFace);

  // 雙重反向旋轉地面光環（群組置於 y = 1.1 時，-1.02 恰貼地浮起 0.08m）
  const outerHaloGroup = new THREE.Group();
  outerHaloGroup.position.y = -1.02;
  g.add(outerHaloGroup);

  const outerRingMat = new THREE.MeshBasicMaterial({
    color: primaryHex,
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 0.68,
  });
  const outerRing = new THREE.Mesh(cachedCardOuterRingGeo, outerRingMat);
  outerRing.rotation.x = -Math.PI / 2;
  outerHaloGroup.add(outerRing);

  const pipMat = new THREE.MeshBasicMaterial({ color: accentHex });
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * Math.PI * 2;
    const pip = new THREE.Mesh(cachedCardPipGeo, pipMat);
    pip.position.set(Math.cos(a) * 0.9, 0.03, Math.sin(a) * 0.9);
    pip.scale.set(0.75, 1.35, 0.75);
    outerHaloGroup.add(pip);
  }

  const innerHaloGroup = new THREE.Group();
  innerHaloGroup.position.y = -1.0;
  g.add(innerHaloGroup);

  const innerRingMat = new THREE.MeshBasicMaterial({
    color: accentHex,
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 0.72,
  });
  const innerRing = new THREE.Mesh(cachedCardInnerRingGeo, innerRingMat);
  innerRing.rotation.x = -Math.PI / 2;
  innerHaloGroup.add(innerRing);

  for (let i = 0; i < 3; i++) {
    const a = (i / 3) * Math.PI * 2;
    const pip = new THREE.Mesh(cachedCardPipGeo, pipMat);
    pip.position.set(Math.cos(a) * 0.605, 0.025, Math.sin(a) * 0.605);
    pip.scale.set(0.55, 0.9, 0.55);
    innerHaloGroup.add(pip);
  }

  const floorGlow = new THREE.Mesh(
    cachedCardDiscGeo,
    new THREE.MeshBasicMaterial({
      color: primaryHex,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.16,
    })
  );
  floorGlow.rotation.x = -Math.PI / 2;
  floorGlow.position.y = -1.03;
  g.add(floorGlow);

  addAnimated((t) => {
    if (!g.visible) return;
    const offset = g.position.x * 0.25 + g.position.z * 0.15;
    cardPivot.rotation.y = t * 1.75 + offset;
    cardPivot.rotation.z = Math.sin(t * 2.1 + offset) * 0.075;
    cardPivot.position.y = Math.sin(t * 2.7 + offset) * 0.18;

    outerHaloGroup.rotation.y = t * 0.85;
    innerHaloGroup.rotation.y = -t * 1.35;
    outerRingMat.opacity = 0.54 + Math.sin(t * 3.0 + offset) * 0.16;
    innerRingMat.opacity = 0.6 + Math.cos(t * 3.4 + offset) * 0.18;
  });

  return g;
}

// ============================================================================
// 3. 起始大廳高解析放射大理石地板貼圖（512×512：象牙大理石磚＋黃金符文曼荼羅＋羅盤星紋）
// ============================================================================

let cachedLobbyMarbleTex: THREE.CanvasTexture | null = null;

export function createLobbyMarbleTexture(): THREE.CanvasTexture {
  if (cachedLobbyMarbleTex) return cachedLobbyMarbleTex;

  const size = 512;
  const cx = size / 2;
  const cy = size / 2;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  // 1. 象牙奶油色放射大理石基底
  const baseGrad = ctx.createRadialGradient(cx, cy, 12, cx, cy, 256);
  baseGrad.addColorStop(0, '#f6f1e4');
  baseGrad.addColorStop(0.45, '#ebe4d4');
  baseGrad.addColorStop(0.82, '#dfd7c5');
  baseGrad.addColorStop(1, '#cfc6b3');
  ctx.fillStyle = baseGrad;
  ctx.fillRect(0, 0, size, size);

  // 2. 交替深淺的 12 瓣放射石磚區塊（對齊大廳 12 根圓柱）
  const ringRadii = [58, 114, 174, 224, 254];
  for (let rIdx = 0; rIdx < ringRadii.length; rIdx++) {
    const rInner = rIdx === 0 ? 0 : ringRadii[rIdx - 1];
    const rOuter = ringRadii[rIdx];
    const segs = rIdx < 2 ? 12 : 24;
    for (let i = 0; i < segs; i++) {
      const a0 = (i / segs) * Math.PI * 2;
      const a1 = ((i + 1) / segs) * Math.PI * 2;
      ctx.beginPath();
      ctx.arc(cx, cy, rOuter, a0, a1);
      ctx.arc(cx, cy, rInner, a1, a0, true);
      ctx.closePath();
      const alt = (i + rIdx) % 2 === 0;
      ctx.fillStyle = alt ? 'rgba(255, 252, 245, 0.24)' : 'rgba(176, 162, 138, 0.14)';
      ctx.fill();
    }
  }

  // 3. 細緻有機大理石紋理脈絡（決定性偽隨機曲線）
  let seed = 4219;
  const rand = () => {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  };
  ctx.lineCap = 'round';
  for (let i = 0; i < 42; i++) {
    const startA = rand() * Math.PI * 2;
    const startR = 20 + rand() * 225;
    let x = cx + Math.cos(startA) * startR;
    let y = cy + Math.sin(startA) * startR;
    ctx.beginPath();
    ctx.moveTo(x, y);
    for (let step = 0; step < 4; step++) {
      const cpx = x + (rand() - 0.5) * 65;
      const cpy = y + (rand() - 0.5) * 65;
      x += (rand() - 0.5) * 75;
      y += (rand() - 0.5) * 75;
      ctx.quadraticCurveTo(cpx, cpy, x, y);
    }
    ctx.strokeStyle = i % 5 === 0 ? 'rgba(205, 173, 102, 0.16)' : 'rgba(148, 139, 124, 0.16)';
    ctx.lineWidth = 0.8 + rand() * 1.8;
    ctx.stroke();
  }

  // 4. 石磚接縫（同心圓與放射分割線）
  ctx.strokeStyle = 'rgba(145, 135, 118, 0.45)';
  ctx.lineWidth = 1.4;
  for (const r of ringRadii) {
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.stroke();
  }
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2;
    ctx.beginPath();
    ctx.moveTo(cx + Math.cos(a) * 58, cy + Math.sin(a) * 58);
    ctx.lineTo(cx + Math.cos(a) * 254, cy + Math.sin(a) * 254);
    ctx.stroke();
  }
  ctx.strokeStyle = 'rgba(145, 135, 118, 0.28)';
  ctx.lineWidth = 1.0;
  for (let i = 0; i < 24; i += 2) {
    const a = ((i + 1) / 24) * Math.PI * 2;
    ctx.beginPath();
    ctx.moveTo(cx + Math.cos(a) * 114, cy + Math.sin(a) * 114);
    ctx.lineTo(cx + Math.cos(a) * 254, cy + Math.sin(a) * 254);
    ctx.stroke();
  }

  // 5. 同心鑲金貪婪之島符文曼荼羅環
  const drawGoldRing = (r: number, width: number) => {
    ctx.strokeStyle = 'rgba(112, 82, 26, 0.55)';
    ctx.lineWidth = width + 2.4;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.stroke();

    ctx.strokeStyle = '#e5bd55';
    ctx.lineWidth = width;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.stroke();
  };

  drawGoldRing(62, 3.2);
  drawGoldRing(116, 4.0);
  drawGoldRing(142, 2.2);
  drawGoldRing(176, 4.0);
  drawGoldRing(202, 2.2);
  drawGoldRing(238, 3.6);

  // 兩道符文帶（內符文帶 r=129、外符文帶 r=189）
  const drawRuneBand = (r: number, count: number, scale: number) => {
    for (let i = 0; i < count; i++) {
      const a = (i / count) * Math.PI * 2;
      ctx.save();
      ctx.translate(cx + Math.cos(a) * r, cy + Math.sin(a) * r);
      ctx.rotate(a + Math.PI / 2);
      ctx.strokeStyle = '#c99b2e';
      ctx.fillStyle = '#e8c25c';
      ctx.lineWidth = 1.8;

      const glyphType = i % 3;
      if (glyphType === 0) {
        // 菱形印記
        ctx.beginPath();
        ctx.moveTo(0, -scale);
        ctx.lineTo(scale * 0.65, 0);
        ctx.lineTo(0, scale);
        ctx.lineTo(-scale * 0.65, 0);
        ctx.closePath();
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(0, 0, scale * 0.24, 0, Math.PI * 2);
        ctx.fill();
      } else if (glyphType === 1) {
        // 獵人雙折符文
        ctx.beginPath();
        ctx.moveTo(-scale * 0.65, scale * 0.6);
        ctx.lineTo(0, -scale * 0.75);
        ctx.lineTo(scale * 0.65, scale * 0.6);
        ctx.moveTo(-scale * 0.55, 0);
        ctx.lineTo(scale * 0.55, 0);
        ctx.stroke();
      } else {
        // 太陽圓環符文
        ctx.beginPath();
        ctx.arc(0, 0, scale * 0.62, 0, Math.PI * 2);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(0, -scale);
        ctx.lineTo(0, scale);
        ctx.stroke();
      }
      ctx.restore();
    }
  };

  drawRuneBand(129, 24, 7.5);
  drawRuneBand(189, 36, 7.8);

  // 6. 中央八角鑲金羅盤星紋
  ctx.save();
  ctx.translate(cx, cy);

  // 內側青金石鑲嵌底環
  ctx.fillStyle = 'rgba(34, 72, 92, 0.22)';
  ctx.beginPath();
  ctx.arc(0, 0, 56, 0, Math.PI * 2);
  ctx.fill();

  const drawCompassStar = (points: number, outerR: number, innerR: number, angleOffset: number) => {
    for (let i = 0; i < points; i++) {
      const a = angleOffset + (i / points) * Math.PI * 2;
      const aPrev = a - Math.PI / points;
      const aNext = a + Math.PI / points;

      // 左亮金切面
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(Math.cos(a) * outerR, Math.sin(a) * outerR);
      ctx.lineTo(Math.cos(aPrev) * innerR, Math.sin(aPrev) * innerR);
      ctx.closePath();
      ctx.fillStyle = '#f3d16e';
      ctx.fill();

      // 右古銅金切面（營造立體倒角反光）
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(Math.cos(a) * outerR, Math.sin(a) * outerR);
      ctx.lineTo(Math.cos(aNext) * innerR, Math.sin(aNext) * innerR);
      ctx.closePath();
      ctx.fillStyle = '#b98924';
      ctx.fill();
    }
  };

  // 次四方位短星角＋主四方位長星角
  drawCompassStar(4, 42, 13, Math.PI / 4);
  drawCompassStar(4, 58, 16, 0);

  // 羅盤中心翡翠金徽點
  ctx.fillStyle = '#248c7c';
  ctx.beginPath();
  ctx.arc(0, 0, 11, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#fae08c';
  ctx.lineWidth = 2.6;
  ctx.stroke();

  ctx.fillStyle = '#fff5cc';
  ctx.beginPath();
  ctx.arc(0, 0, 4, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  tex.needsUpdate = true;
  cachedLobbyMarbleTex = tex;
  return tex;
}

// ============================================================================
// 4. 原作 100% 還原 3D 翻開版「BOOK」集卡書（擺放於伊妲接待桌，底部嚴格貼齊 y = 0）
//    灰藍精裝硬殼＋三組黃銅活頁夾＋左頁獨立 000 十字黑凹槽＋右頁 3×3（001–009）凹槽
// ============================================================================

let cachedLeftPageTex: THREE.CanvasTexture | null = null;
let cachedRightPageTex: THREE.CanvasTexture | null = null;
let cachedBookClothTex: THREE.CanvasTexture | null = null;

function getBookClothTexture(): THREE.CanvasTexture {
  if (cachedBookClothTex) return cachedBookClothTex;
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = '#3f4463';
  ctx.fillRect(0, 0, 256, 256);
  applyMatteFiberGrain(ctx, 256, 256, 5193, true);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.needsUpdate = true;
  cachedBookClothTex = tex;
  return tex;
}

function drawRecessedSlotOnCanvas(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  code: string
): void {
  ctx.fillStyle = '#1b1d1f';
  ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = '#7c7768';
  ctx.lineWidth = 2;
  ctx.strokeRect(x, y, w, h);

  // 四向十字對準細線
  ctx.strokeStyle = 'rgba(196, 198, 188, 0.44)';
  ctx.lineWidth = 1.4;
  const cx = x + w / 2;
  const cy = y + h / 2;
  ctx.beginPath();
  ctx.moveTo(cx, y);
  ctx.lineTo(cx, y + h * 0.3);
  ctx.moveTo(cx, y + h);
  ctx.lineTo(cx, y + h * 0.7);
  ctx.moveTo(x, cy);
  ctx.lineTo(x + w * 0.16, cy);
  ctx.moveTo(x + w, cy);
  ctx.lineTo(x + w * 0.84, cy);
  ctx.stroke();

  ctx.fillStyle = '#cacdc2';
  ctx.font = `bold ${Math.round(w * 0.28)}px monospace`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(code, cx, cy);
}

function createBookOpeningPageTexture(isLeftZeroPage: boolean): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 340;
  const ctx = canvas.getContext('2d')!;

  // 溫潤厚棉紙底色
  const grad = ctx.createLinearGradient(0, 0, 256, 340);
  grad.addColorStop(0, '#ebe7d7');
  grad.addColorStop(1, '#dcd6c1');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 256, 340);

  ctx.strokeStyle = '#a8a18c';
  ctx.lineWidth = 2.5;
  ctx.strokeRect(8, 8, 240, 324);

  if (isLeftZeroPage) {
    const sw = 96;
    const sh = 132;
    drawRecessedSlotOnCanvas(ctx, (256 - sw) / 2, (340 - sh) / 2, sw, sh, '000');
  } else {
    const marginX = 16;
    const marginY = 20;
    const gap = 10;
    const cellW = (256 - marginX * 2 - gap * 2) / 3;
    const cellH = (340 - marginY * 2 - gap * 2) / 3;
    for (let r = 0; r < 3; r++) {
      for (let c = 0; c < 3; c++) {
        const slotNo = r * 3 + c + 1;
        const x = marginX + c * (cellW + gap);
        const y = marginY + r * (cellH + gap);
        drawRecessedSlotOnCanvas(ctx, x, y, cellW, cellH, String(slotNo).padStart(3, '0'));
      }
    }
  }

  // 書溝自然彎曲陰影（左頁靠右緣、右頁靠左緣）＋ 綿紙纖維微噪點
  const gutter = isLeftZeroPage
    ? ctx.createLinearGradient(204, 0, 256, 0)
    : ctx.createLinearGradient(52, 0, 0, 0);
  gutter.addColorStop(0, 'rgba(30, 24, 16, 0)');
  gutter.addColorStop(1, 'rgba(24, 20, 14, 0.42)');
  ctx.fillStyle = gutter;
  ctx.fillRect(isLeftZeroPage ? 204 : 0, 0, 52, 340);

  applyMatteFiberGrain(ctx, 256, 340, isLeftZeroPage ? 3107 : 6209, false);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  tex.needsUpdate = true;
  return tex;
}

function createArchedPageGeometry(side: -1 | 1, width: number, depth: number): THREE.PlaneGeometry {
  const geo = new THREE.PlaneGeometry(width, depth, 12, 2);
  geo.rotateX(-Math.PI / 2);

  const pos = geo.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const u = side === -1 ? (width / 2 - x) / width : (x + width / 2) / width;
    const arch = Math.sin(u * Math.PI) * 0.022 + Math.sin(u * Math.PI * 0.5) * 0.006;
    pos.setY(i, arch);
  }
  geo.computeVertexNormals();
  return geo;
}

export function createOpenBookMesh(): THREE.Group {
  const g = new THREE.Group();

  if (!cachedLeftPageTex) cachedLeftPageTex = createBookOpeningPageTexture(true);
  if (!cachedRightPageTex) cachedRightPageTex = createBookOpeningPageTexture(false);
  const clothTex = getBookClothTexture();

  // 霧面亞麻精裝布殼＋古銅霧面黃銅活頁夾＋純霧面棉紙（消除 3D 塑膠高光）
  const coverMat = new THREE.MeshStandardMaterial({ map: clothTex, roughness: 0.92, metalness: 0.02 });
  const spineMat = new THREE.MeshStandardMaterial({ map: clothTex, color: 0xbfc2d4, roughness: 0.94, metalness: 0.02 });
  const mauveTrimMat = new THREE.MeshStandardMaterial({ color: 0x926b82, roughness: 0.88, metalness: 0.0 });
  const brassHingeMat = new THREE.MeshStandardMaterial({ color: 0xb6a66c, roughness: 0.52, metalness: 0.55 });
  const pageBlockMat = new THREE.MeshStandardMaterial({ color: 0xddd7c2, roughness: 0.94, metalness: 0.0 });

  // 中央書脊（底面貼齊 y = 0）
  const spine = new THREE.Mesh(new THREE.BoxGeometry(0.085, 0.032, 0.52), spineMat);
  spine.position.set(0, 0.016, 0);
  spine.castShadow = true;
  spine.receiveShadow = true;
  g.add(spine);

  // 書脊前端經典古銅黃銅扣片
  const clasp = new THREE.Mesh(new THREE.BoxGeometry(0.095, 0.04, 0.038), brassHingeMat);
  clasp.position.set(0, 0.02, 0.255);
  g.add(clasp);

  // 左右攤開的灰藍硬殼封面與米白厚活頁紙
  for (const side of [-1, 1] as const) {
    const coverPivot = new THREE.Group();
    coverPivot.position.set(side * 0.038, 0.016, 0);
    coverPivot.rotation.z = side * 0.038;
    g.add(coverPivot);

    const cover = new THREE.Mesh(new THREE.BoxGeometry(0.355, 0.024, 0.52), coverMat);
    cover.position.set(side * 0.178, 0, 0);
    cover.castShadow = true;
    cover.receiveShadow = true;
    coverPivot.add(cover);

    const outerTrim = new THREE.Mesh(new THREE.BoxGeometry(0.014, 0.028, 0.524), mauveTrimMat);
    outerTrim.position.set(side * 0.354, 0, 0);
    coverPivot.add(outerTrim);

    const pageBlock = new THREE.Mesh(new THREE.BoxGeometry(0.315, 0.038, 0.455), pageBlockMat);
    pageBlock.position.set(side * 0.168, 0.031, 0);
    pageBlock.castShadow = true;
    pageBlock.receiveShadow = true;
    coverPivot.add(pageBlock);

    const pageGeo = createArchedPageGeometry(side, 0.318, 0.458);
    const pageMat = new THREE.MeshStandardMaterial({
      map: side === -1 ? cachedLeftPageTex : cachedRightPageTex,
      roughness: 0.94,
      metalness: 0.0,
    });
    const archedPage = new THREE.Mesh(pageGeo, pageMat);
    archedPage.position.set(side * 0.166, 0.051, 0);
    archedPage.receiveShadow = true;
    coverPivot.add(archedPage);
  }

  // 三組原作古銅黃銅矩形活頁夾鉸鏈
  for (const rz of [-0.145, 0, 0.145]) {
    const hinge = new THREE.Mesh(new THREE.BoxGeometry(0.068, 0.024, 0.044), brassHingeMat);
    hinge.position.set(0, 0.064, rz);
    g.add(hinge);
  }

  return g;
}
