import * as THREE from 'three';
import { ModelLibrary } from '../assets';

export interface AntokibaBuildContext {
  models: ModelLibrary;
  createNeonSignMesh: (title: string, subtitle: string) => THREE.Mesh;
  createNpcMesh: (clothColor: number, skinColor: number, hairColor: number) => THREE.Group;
  addAnimated?: (fn: (t: number, dt: number) => void) => void;
  addCircleCollider: (c: { x: number; z: number; r: number }) => void;
  addBoxCollider: (b: { minX: number; maxX: number; minZ: number; maxZ: number }) => void;
  addCameraOccluder?: (obj: THREE.Object3D) => void;
  addInteractable: (item: {
    id: string;
    label: string;
    position: THREE.Vector3;
    radius: number;
    kind: 'npc' | 'portal' | 'shop' | 'pickup' | 'sign';
  }) => void;
}

export const ANTOKIBA_CENTER = { x: 26, z: 70 } as const;
export const ANTOKIBA_GATE = { x: 26, z: 92 } as const;

/**
 * 手繪巴伐利亞暖石灰石圓形拼花廣場貼圖（含深淺石塊、砂縫與細微青苔點綴）。
 */
function createBavarianPlazaTexture(): THREE.CanvasTexture {
  const size = 512;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#8b8172';
  ctx.fillRect(0, 0, size, size);

  let seed = 3141;
  const rand = () => {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  };

  const rows = 16;
  const cols = 16;
  const rh = size / rows;
  const cw = size / cols;

  for (let r = 0; r < rows; r++) {
    const off = (r % 2) * (cw * 0.5);
    for (let c = -1; c <= cols; c++) {
      const shade = Math.floor((rand() - 0.5) * 30);
      const warm = Math.floor((rand() - 0.5) * 14);
      const R = Math.min(255, Math.max(0, 206 + shade + warm));
      const G = Math.min(255, Math.max(0, 194 + shade));
      const B = Math.min(255, Math.max(0, 174 + shade - Math.floor(warm * 0.5)));
      const x = c * cw + off + 2;
      const y = r * rh + 2;
      ctx.fillStyle = `rgb(${R},${G},${B})`;
      ctx.fillRect(x, y, cw - 4, rh - 4);
      // 上左微亮倒角＋下右微暗陰影，營造立體石磚感
      ctx.fillStyle = 'rgba(255, 250, 236, 0.22)';
      ctx.fillRect(x, y, cw - 4, 2);
      ctx.fillStyle = 'rgba(58, 50, 40, 0.22)';
      ctx.fillRect(x, y + rh - 6, cw - 4, 2);
    }
  }

  // 磚縫間細微青苔與風化砂點
  for (let i = 0; i < 420; i++) {
    ctx.fillStyle = i % 9 === 0 ? 'rgba(94, 126, 68, 0.28)' : 'rgba(72, 64, 52, 0.16)';
    ctx.fillRect(rand() * size, rand() * size, 3, 2);
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(9, 9);
  tex.anisotropy = 4;
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/**
 * 懸賞大賽紅金紋章掛旗貼圖（劍與金冠徽記）。
 */
function createHeraldicBannerTexture(): THREE.CanvasTexture {
  const c = document.createElement('canvas');
  c.width = 128;
  c.height = 256;
  const ctx = c.getContext('2d')!;

  const g = ctx.createLinearGradient(0, 0, 0, 256);
  g.addColorStop(0, '#b5282c');
  g.addColorStop(0.75, '#8c1d22');
  g.addColorStop(1, '#681418');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 128, 256);

  // 金色雙邊框
  ctx.strokeStyle = '#e8c460';
  ctx.lineWidth = 6;
  ctx.strokeRect(10, 10, 108, 224);
  ctx.lineWidth = 2;
  ctx.strokeRect(18, 18, 92, 208);

  // 中央金色皇冠與星芒徽章
  ctx.fillStyle = '#f2d06b';
  ctx.beginPath();
  ctx.moveTo(34, 124);
  ctx.lineTo(42, 88);
  ctx.lineTo(54, 106);
  ctx.lineTo(64, 78);
  ctx.lineTo(74, 106);
  ctx.lineTo(86, 88);
  ctx.lineTo(94, 124);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = '#fff0b8';
  ctx.font = 'bold 20px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.fillText('PRIZE', 64, 166);
  ctx.font = 'bold 16px "Microsoft JhengHei", sans-serif';
  ctx.fillText('懸賞大賽', 64, 194);

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/**
 * 原作「貓餐廳（Cat Restaurant）」手作木牌貼圖。
 */
function createWoodPlaqueTexture(title: string, sub: string, accent = '#f2c96b'): THREE.CanvasTexture {
  const c = document.createElement('canvas');
  c.width = 256;
  c.height = 112;
  const ctx = c.getContext('2d')!;

  ctx.fillStyle = '#4a311e';
  ctx.fillRect(0, 0, 256, 112);
  ctx.strokeStyle = accent;
  ctx.lineWidth = 6;
  ctx.strokeRect(6, 6, 244, 100);

  ctx.textAlign = 'center';
  ctx.fillStyle = '#fff5d6';
  ctx.font = 'bold 30px "Microsoft JhengHei", sans-serif';
  ctx.fillText(title, 128, 52);

  ctx.fillStyle = accent;
  ctx.font = 'bold 17px Georgia, serif';
  ctx.fillText(sub, 128, 86);

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/**
 * 懸賞都市・安多奇拔（Antokiba）高精細獨立場景模組
 * - 中心廣場 (26, 70)，半徑 24m 巴伐利亞拼花石砌廣場
 * - 可自由通行南城門 TownGate.glb（(26, 0, 92)，中央 8.0m 無阻礙拱門）＋ 左右延伸石城牆與角塔
 * - 高聳地標鐘塔 Bell_Tower.glb（(12, 0.14, 62)，高 20.5m，從 Shiso Tree 起點地平線清晰可辨）
 * - 每月懸賞大賽多層紅金圓形擂台、迎風紋章旗、旋轉黃金獎盃座與大賽主持 NPC
 * - 巴伐利亞木筋建築群、原作「貓餐廳」露天咖啡座、古井、市集攤位、慶典彩旗與鍛鐵暖光路燈
 */
export function buildAntokibaZone(ctx: AntokibaBuildContext): THREE.Group {
  const g = new THREE.Group();
  g.name = 'zone_antokiba';

  const cx = ANTOKIBA_CENTER.x; // 26
  const cz = ANTOKIBA_CENTER.z; // 70
  const gx = ANTOKIBA_GATE.x;   // 26
  const gz = ANTOKIBA_GATE.z;   // 92

  const swayBanners: THREE.Object3D[] = [];

  // 1. 巴伐利亞暖石灰石拼花圓形廣場＋同心石環＋城門中軸迎賓紅毯石道
  const plazaMat = new THREE.MeshStandardMaterial({
    map: createBavarianPlazaTexture(),
    roughness: 0.88,
  });
  const plaza = new THREE.Mesh(new THREE.CylinderGeometry(24.2, 25.4, 0.16, 44), plazaMat);
  plaza.position.set(cx, 0.08, cz);
  plaza.receiveShadow = true;
  g.add(plaza);

  const stoneBorderMat = new THREE.MeshStandardMaterial({ color: 0xd9cfc0, roughness: 0.82 });
  const outerRing = new THREE.Mesh(new THREE.RingGeometry(22.9, 24.1, 48), stoneBorderMat);
  outerRing.rotation.x = -Math.PI / 2;
  outerRing.position.set(cx, 0.168, cz);
  outerRing.receiveShadow = true;
  g.add(outerRing);

  const stageRing = new THREE.Mesh(
    new THREE.RingGeometry(6.8, 7.45, 44),
    new THREE.MeshStandardMaterial({ color: 0xb7a184, roughness: 0.84 })
  );
  stageRing.rotation.x = -Math.PI / 2;
  stageRing.position.set(cx, 0.168, cz);
  stageRing.receiveShadow = true;
  g.add(stageRing);

  // 南門至中央擂台的節慶石板步道（強化入城視線引導）
  const boulevardStrip = new THREE.Mesh(
    new THREE.PlaneGeometry(4.4, 16.5),
    new THREE.MeshStandardMaterial({ color: 0xc9b99c, roughness: 0.86 })
  );
  boulevardStrip.rotation.x = -Math.PI / 2;
  boulevardStrip.position.set(cx, 0.165, 83.2);
  boulevardStrip.receiveShadow = true;
  g.add(boulevardStrip);

  // 2. 可通行南城門（TownGate.glb）＋ 左右延伸護城石牆（TownWall.glb）與轉角守望塔（TownCornerTower.glb）
  //    中央嚴格保留 8.0m (x ∈ [22.0, 30.0]) 無阻礙步行拱門！
  ctx.models
    .place(g, 'TownGate.glb', { x: gx, y: 0, z: gz, targetHeight: 11.2, rotY: 0 })
    .then((m) => {
      if (m) ctx.addCameraOccluder?.(m);
    });
  ctx.addBoxCollider({ minX: 16.5, maxX: 22.0, minZ: 89.5, maxZ: 94.5 });
  ctx.addBoxCollider({ minX: 30.0, maxX: 35.5, minZ: 89.5, maxZ: 94.5 });

  // 城門左右延伸石城牆與雙角塔，營造完整堅固城邦輪廓
  const wallSpecs: Array<{ file: string; x: number; z: number; h: number; rotY: number; box?: [number, number, number, number]; circleR?: number }> = [
    { file: 'TownWall.glb', x: 11.2, z: 91.2, h: 7.4, rotY: 0.12, box: [6.8, 16.2, 89.2, 93.4] },
    { file: 'TownWall.glb', x: 40.8, z: 91.2, h: 7.4, rotY: -0.12, box: [35.8, 45.2, 89.2, 93.4] },
    { file: 'TownCornerTower.glb', x: 5.8, z: 89.6, h: 11.6, rotY: 0.35, circleR: 2.8 },
    { file: 'TownCornerTower.glb', x: 46.2, z: 89.6, h: 11.6, rotY: -0.35, circleR: 2.8 },
  ];
  for (const w of wallSpecs) {
    ctx.models
      .place(g, w.file, { x: w.x, y: 0, z: w.z, targetHeight: w.h, rotY: w.rotY })
      .then((m) => {
        if (m) ctx.addCameraOccluder?.(m);
      });
    if (w.box) ctx.addBoxCollider({ minX: w.box[0], maxX: w.box[1], minZ: w.box[2], maxZ: w.box[3] });
    if (w.circleR) ctx.addCircleCollider({ x: w.x, z: w.z, r: w.circleR });
  }

  // 城門門楣上方城市招牌（y = 12.2，絕不阻擋拱門步行通行）
  const sign = ctx.createNeonSignMesh('ANTOKIBA', '懸賞都市・安多奇拔');
  sign.scale.setScalar(0.68);
  sign.position.set(gx, 12.2, gz);
  g.add(sign);

  // 城門兩側迎賓紅金紋章掛旗
  const bannerTex = createHeraldicBannerTexture();
  const bannerClothMat = new THREE.MeshStandardMaterial({
    map: bannerTex,
    roughness: 0.85,
    side: THREE.DoubleSide,
  });
  const ironMat = new THREE.MeshStandardMaterial({ color: 0x353941, roughness: 0.52, metalness: 0.55 });
  const goldTrimMat = new THREE.MeshStandardMaterial({ color: 0xe6be54, metalness: 0.58, roughness: 0.34 });

  for (const bx of [20.6, 31.4]) {
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.09, 5.2, 8), ironMat);
    pole.position.set(bx, 2.6, 94.8);
    pole.castShadow = true;
    g.add(pole);

    const finial = new THREE.Mesh(new THREE.SphereGeometry(0.15, 10, 8), goldTrimMat);
    finial.position.set(bx, 5.25, 94.8);
    g.add(finial);

    const cloth = new THREE.Mesh(new THREE.PlaneGeometry(1.1, 2.2), bannerClothMat);
    cloth.position.set(bx, 3.85, 95.0);
    g.add(cloth);
    swayBanners.push(cloth);
  }

  // 3. 高聳地標鐘塔（20.5m 高尖頂，讓玩家從 Shiso Tree 起點一眼辨識安多奇拔）
  ctx.models
    .place(g, 'Bell_Tower.glb', {
      x: 12,
      y: 0.14,
      z: 62,
      targetHeight: 20.5,
      rotY: Math.PI / 2,
    })
    .then((m) => {
      if (m) ctx.addCameraOccluder?.(m);
    });
  ctx.addCircleCollider({ x: 12, z: 62, r: 3.5 });

  // 4. 巴伐利亞木筋建築群、雙市集攤位與街景生活道具（保留中央大道與北／西向出口）
  const buildings: Array<{
    file: string;
    x: number;
    y: number;
    z: number;
    h: number;
    rotY: number;
    r: number;
  }> = [
    { file: 'Inn.glb', x: 11, y: 0.14, z: 78, h: 9.0, rotY: Math.PI / 2, r: 4.5 },
    { file: 'Blacksmith.glb', x: 41, y: 0.14, z: 78, h: 8.2, rotY: -Math.PI / 2, r: 4.4 },
    { file: 'House_1.glb', x: 41, y: 0.14, z: 62, h: 8.0, rotY: -Math.PI / 2, r: 4.0 },
    { file: 'House_4.glb', x: 18, y: 0.14, z: 52, h: 8.0, rotY: 0.25, r: 4.0 },
    { file: 'House_2.glb', x: 35, y: 0.14, z: 52, h: 8.0, rotY: -0.25, r: 4.0 },
    { file: 'MarketStand_1.glb', x: 17, y: 0.16, z: 84, h: 3.3, rotY: 0.4, r: 1.8 },
    { file: 'MarketStand_2.glb', x: 35, y: 0.16, z: 84, h: 3.3, rotY: -0.4, r: 1.8 },
    // 廣場古井、市集木推車、長椅與木桶群
    { file: 'Well.glb', x: 34.8, y: 0.16, z: 61.8, h: 2.8, rotY: 0.4, r: 1.25 },
    { file: 'Cart.glb', x: 37.8, y: 0.16, z: 86.2, h: 1.9, rotY: -0.65, r: 1.3 },
    { file: 'Bench_1.glb', x: 19.2, y: 0.16, z: 63.0, h: 1.0, rotY: 0.78, r: 0.8 },
    { file: 'Bench_1.glb', x: 32.8, y: 0.16, z: 63.0, h: 1.0, rotY: -0.78, r: 0.8 },
    { file: 'Barrel.glb', x: 37.4, y: 0.16, z: 73.6, h: 1.05, rotY: 0.2, r: 0.6 },
    { file: 'Barrel.glb', x: 38.2, y: 0.16, z: 74.3, h: 0.95, rotY: 1.1, r: 0.6 },
  ];

  for (const b of buildings) {
    ctx.models
      .place(g, b.file, { x: b.x, y: b.y, z: b.z, targetHeight: b.h, rotY: b.rotY })
      .then((m) => {
        if (m) ctx.addCameraOccluder?.(m);
      });
    ctx.addCircleCollider({ x: b.x, z: b.z, r: b.r });
  }

  // 5. 原作彩蛋：安多奇拔「貓餐廳（Cat Restaurant）」手作木牌與露天咖啡桌椅（Inn 門前）
  const catSignGroup = new THREE.Group();
  catSignGroup.position.set(16.1, 0.16, 78.2);
  const signPost = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.1, 3.1, 8), ironMat);
  signPost.position.y = 1.55;
  signPost.castShadow = true;
  catSignGroup.add(signPost);

  const signArm = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.08, 0.08), ironMat);
  signArm.position.set(0.65, 2.95, 0);
  catSignGroup.add(signArm);

  const catPlaque = new THREE.Mesh(
    new THREE.BoxGeometry(1.55, 0.68, 0.08),
    new THREE.MeshStandardMaterial({ map: createWoodPlaqueTexture('🐱 貓餐廳', 'CAT RESTAURANT'), roughness: 0.78 })
  );
  catPlaque.position.set(0.75, 2.52, 0);
  catPlaque.castShadow = true;
  catSignGroup.add(catPlaque);
  g.add(catSignGroup);

  const woodMat = new THREE.MeshStandardMaterial({ color: 0x6f4a2d, roughness: 0.84 });
  const clothTableMat = new THREE.MeshStandardMaterial({ color: 0xf4ece0, roughness: 0.88 });
  for (const [tx, tz] of [
    [16.2, 74.6],
    [16.2, 80.8],
  ]) {
    const tbl = new THREE.Group();
    tbl.position.set(tx, 0.16, tz);
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.14, 0.78, 8), woodMat);
    leg.position.y = 0.39;
    tbl.add(leg);
    const top = new THREE.Mesh(new THREE.CylinderGeometry(0.72, 0.72, 0.08, 16), clothTableMat);
    top.position.y = 0.8;
    top.castShadow = true;
    tbl.add(top);
    // 餐桌小花瓶
    const vase = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.09, 0.2, 8), new THREE.MeshStandardMaterial({ color: 0xc84b31, roughness: 0.6 }));
    vase.position.y = 0.94;
    tbl.add(vase);
    g.add(tbl);
    ctx.addCircleCollider({ x: tx, z: tz, r: 0.85 });
  }

  // 6. 每月懸賞大賽多層紅金圓形擂台（(26, 0, 70), r = 4.4）＋ 旋轉黃金獎盃展示台
  const stageGroup = new THREE.Group();
  stageGroup.name = 'antokiba_contest_stage';
  stageGroup.position.set(cx, 0, cz);

  const stageMat = new THREE.MeshStandardMaterial({ color: 0x992a2c, roughness: 0.72 });
  const stageTopMat = new THREE.MeshStandardMaterial({ color: 0x822024, roughness: 0.8 });
  const stageStepMat = new THREE.MeshStandardMaterial({ color: 0xc5bba8, roughness: 0.84 });

  const stageStep = new THREE.Mesh(new THREE.CylinderGeometry(4.65, 4.88, 0.2, 32), stageStepMat);
  stageStep.position.y = 0.18;
  stageStep.receiveShadow = true;
  stageGroup.add(stageStep);

  const stage = new THREE.Mesh(new THREE.CylinderGeometry(4.2, 4.55, 0.68, 32), [stageMat, stageTopMat, stageMat]);
  stage.position.y = 0.5;
  stage.castShadow = true;
  stage.receiveShadow = true;
  stageGroup.add(stage);

  const stageGoldRim = new THREE.Mesh(new THREE.TorusGeometry(4.22, 0.085, 10, 40), goldTrimMat);
  stageGoldRim.rotation.x = Math.PI / 2;
  stageGoldRim.position.y = 0.85;
  stageGroup.add(stageGoldRim);

  // 舞台後方慶典拱架與「每月懸賞大賽」木牌
  for (const bx of [-2.5, 2.5]) {
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.1, 4.1, 8), goldTrimMat);
    pole.position.set(bx, 2.8, -2.55);
    pole.castShadow = true;
    stageGroup.add(pole);

    const orb = new THREE.Mesh(new THREE.SphereGeometry(0.16, 10, 8), goldTrimMat);
    orb.position.set(bx, 4.9, -2.55);
    stageGroup.add(orb);

    const banner = new THREE.Mesh(new THREE.PlaneGeometry(0.95, 1.9), bannerClothMat);
    banner.position.set(bx, 3.4, -2.42);
    stageGroup.add(banner);
    swayBanners.push(banner);
  }
  const archBeam = new THREE.Mesh(new THREE.BoxGeometry(5.2, 0.2, 0.18), goldTrimMat);
  archBeam.position.set(0, 4.65, -2.55);
  stageGroup.add(archBeam);

  const contestBoard = new THREE.Mesh(
    new THREE.BoxGeometry(3.3, 1.15, 0.14),
    new THREE.MeshStandardMaterial({ map: createWoodPlaqueTexture('每月懸賞大賽', 'MONTHLY PRIZE CONTEST', '#f5d26e'), roughness: 0.72 })
  );
  contestBoard.position.set(0, 3.85, -2.55);
  contestBoard.castShadow = true;
  stageGroup.add(contestBoard);

  // 舞台中央旋轉黃金獎盃展示柱
  const trophyPedestal = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.5, 0.85, 12), stageStepMat);
  trophyPedestal.position.set(0, 1.25, -0.4);
  trophyPedestal.castShadow = true;
  stageGroup.add(trophyPedestal);

  const trophyGroup = new THREE.Group();
  trophyGroup.position.set(0, 1.98, -0.4);
  const cupBase = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.26, 0.14, 12), goldTrimMat);
  const cupStem = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.08, 0.26, 8), goldTrimMat);
  cupStem.position.y = 0.2;
  const cupBowl = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.12, 0.34, 14), goldTrimMat);
  cupBowl.position.y = 0.46;
  trophyGroup.add(cupBase, cupStem, cupBowl);
  stageGroup.add(trophyGroup);

  g.add(stageGroup);
  ctx.addCircleCollider({ x: cx, z: cz, r: 4.4 });
  ctx.addCameraOccluder?.(stageGroup);

  // 7. 廣場六座古典鍛鐵懸臂路燈＋石砌花台（營造歐洲城邦街道層次）
  const lampCoords: ReadonlyArray<readonly [number, number]> = [
    [21.6, 88.0],
    [30.4, 88.0],
    [18.8, 76.2],
    [33.2, 76.2],
    [18.8, 63.8],
    [33.2, 63.8],
  ];
  const lanternGlowMat = new THREE.MeshBasicMaterial({ color: 0xffe49e });
  const planterStoneMat = new THREE.MeshStandardMaterial({ color: 0xbcb2a2, roughness: 0.88 });
  const flowerBushMat = new THREE.MeshStandardMaterial({ color: 0x4b8f42, roughness: 0.9 });
  const bloomColors = [0xff7b9c, 0xffd54f, 0xffffff, 0xff9452];

  for (let i = 0; i < lampCoords.length; i++) {
    const [lx, lz] = lampCoords[i];
    const lamp = new THREE.Group();
    lamp.position.set(lx, 0.16, lz);

    const plinth = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.3, 0.45, 8), planterStoneMat);
    plinth.position.y = 0.225;
    lamp.add(plinth);

    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.11, 3.8, 8), ironMat);
    post.position.y = 2.15;
    post.castShadow = true;
    lamp.add(post);

    const cap = new THREE.Mesh(new THREE.ConeGeometry(0.32, 0.24, 6), ironMat);
    cap.position.y = 4.35;
    lamp.add(cap);

    const globe = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.16, 0.38, 6), lanternGlowMat);
    globe.position.y = 4.05;
    lamp.add(globe);
    g.add(lamp);
  }

  // 入城大道兩側四座盛開石砌花台
  for (let i = 0; i < 4; i++) {
    const fx = i % 2 === 0 ? 22.0 : 30.0;
    const fz = i < 2 ? 82.0 : 75.0;
    const planter = new THREE.Group();
    planter.position.set(fx, 0.16, fz);

    const box = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.56, 1.0), planterStoneMat);
    box.position.y = 0.28;
    box.castShadow = true;
    planter.add(box);

    const bush = new THREE.Mesh(new THREE.DodecahedronGeometry(0.52, 1), flowerBushMat);
    bush.scale.set(1.25, 0.65, 0.82);
    bush.position.y = 0.68;
    planter.add(bush);

    const bMat = new THREE.MeshStandardMaterial({ color: bloomColors[i], roughness: 0.7 });
    for (let k = 0; k < 5; k++) {
      const bl = new THREE.Mesh(new THREE.SphereGeometry(0.11, 6, 5), bMat);
      bl.position.set((k - 2) * 0.24, 0.85 + (k % 2) * 0.08, ((k * 3) % 3 - 1) * 0.18);
      planter.add(bl);
    }
    g.add(planter);
  }

  // 8. 慶典彩旗拉繩（橫跨大道高空 y = 5.4m，絕不遮擋行走與鏡頭）
  const pennantColors = [0xd63b3b, 0xf2c852, 0x3b8ed6, 0x4ca85a];
  const pennantGeo = new THREE.ConeGeometry(0.24, 0.5, 3);
  for (const [zLine, spanHalf] of [
    [87.8, 4.4],
    [76.2, 7.2],
  ] as const) {
    const rope = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, spanHalf * 2, 6), ironMat);
    rope.rotation.z = Math.PI / 2;
    rope.position.set(cx, 5.45, zLine);
    g.add(rope);

    const flags = 9;
    for (let k = 0; k < flags; k++) {
      const t = (k + 0.5) / flags;
      const fx = cx - spanHalf + t * spanHalf * 2;
      const sag = Math.sin(t * Math.PI) * 0.55;
      const pMesh = new THREE.Mesh(
        pennantGeo,
        new THREE.MeshStandardMaterial({ color: pennantColors[k % pennantColors.length], roughness: 0.8 })
      );
      pMesh.rotation.x = Math.PI;
      pMesh.position.set(fx, 5.2 - sag, zLine);
      g.add(pMesh);
      swayBanners.push(pMesh);
    }
  }

  // 9. 安多奇拔每月懸賞大賽主持 NPC（(31.6, 0.16, 72.5)）
  const hostNpc = ctx.createNpcMesh(0xc84b31, 0xffe0bd, 0x222222);
  hostNpc.position.set(31.6, 0.16, 72.5);
  hostNpc.rotation.y = -0.35;
  g.add(hostNpc);

  ctx.addInteractable({
    id: 'npc_antokiba_host',
    label: '詢問「安多奇拔每月懸賞大賽 / 貓餐廳」',
    position: new THREE.Vector3(31.6, 0, 72.5),
    radius: 3.8,
    kind: 'npc',
  });

  // 僅在安多奇拔處於串流啟用狀態時執行的輕量動畫（獎盃緩轉＋紋章旗與彩旗迎風微擺）
  ctx.addAnimated?.((t) => {
    trophyGroup.rotation.y = t * 1.1;
    trophyGroup.position.y = 1.98 + Math.sin(t * 2.2) * 0.06;
    for (let i = 0; i < swayBanners.length; i++) {
      swayBanners[i].rotation.x = Math.sin(t * 2.4 + i * 0.65) * 0.14 + (i >= 4 ? Math.PI : 0);
    }
  });

  return g;
}
