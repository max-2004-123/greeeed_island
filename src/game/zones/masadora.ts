import * as THREE from 'three';
import { ModelLibrary } from '../assets';

export interface MasadoraBuildContext {
  models: ModelLibrary;
  createNeonSignMesh: (title: string, subtitle: string) => THREE.Mesh;
  createNpcMesh: (clothColor: number, skinColor: number, hairColor: number) => THREE.Group;
  addAnimated: (fn: (t: number, dt: number) => void) => void;
  addCircleCollider: (c: { x: number; z: number; r: number }) => void;
  addBoxCollider: (b: { minX: number; maxX: number; minZ: number; maxZ: number }) => void;
  addInteractable: (item: {
    id: string;
    label: string;
    position: THREE.Vector3;
    radius: number;
    kind: 'npc' | 'portal' | 'shop' | 'pickup' | 'sign';
  }) => void;
}

interface TowerSpec {
  x: number;
  z: number;
  bodyColor: number;
  capColor: number;
  height: number;
  style: 'mushroom' | 'egg';
  faceAngle: number;
}

export const MASADORA_CENTER = { x: -42, z: -76 } as const;

/**
 * 瑪莎多拉手繪粉紫象牙魔法拼花石磚廣場貼圖（去除原本單色塑膠灰紫平面）。
 */
function createMasadoraPlazaTexture(): THREE.CanvasTexture {
  const size = 512;
  const c = document.createElement('canvas');
  c.width = size;
  c.height = size;
  const ctx = c.getContext('2d')!;

  ctx.fillStyle = '#bfb4d4';
  ctx.fillRect(0, 0, size, size);

  let seed = 7019;
  const rand = () => {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  };

  const step = 32;
  for (let y = 0; y < size; y += step) {
    for (let x = 0; x < size; x += step) {
      const alt = ((x / step) + (y / step)) % 2 === 0;
      const d = Math.floor((rand() - 0.5) * 18);
      const R = Math.min(255, Math.max(0, (alt ? 228 : 210) + d));
      const G = Math.min(255, Math.max(0, (alt ? 222 : 202) + d));
      const B = Math.min(255, Math.max(0, (alt ? 240 : 228) + d));
      ctx.fillStyle = `rgb(${R},${G},${B})`;
      ctx.fillRect(x + 1.5, y + 1.5, step - 3, step - 3);

      // 偶爾點綴淡金魔法菱形嵌片
      if ((x / step) % 4 === 0 && (y / step) % 4 === 0) {
        ctx.fillStyle = 'rgba(232, 198, 108, 0.35)';
        ctx.beginPath();
        ctx.moveTo(x + step / 2, y + 6);
        ctx.lineTo(x + step - 6, y + step / 2);
        ctx.lineTo(x + step / 2, y + step - 6);
        ctx.lineTo(x + 6, y + step / 2);
        ctx.closePath();
        ctx.fill();
      }
    }
  }

  for (let i = 0; i < 400; i++) {
    ctx.fillStyle = rand() > 0.5 ? 'rgba(255, 252, 245, 0.22)' : 'rgba(90, 76, 120, 0.14)';
    ctx.fillRect(rand() * size, rand() * size, 2, 2);
  }

  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(10, 10);
  tex.anisotropy = 4;
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/**
 * 歐式童話霧面灰泥牆面微顆粒貼圖（套用於熊貓圓頂與 8 座彩色糖果塔，徹底消除亮面塑膠感）。
 */
function createStuccoTexture(): THREE.CanvasTexture {
  const size = 256;
  const c = document.createElement('canvas');
  c.width = size;
  c.height = size;
  const ctx = c.getContext('2d')!;
  ctx.fillStyle = '#f2f0ec';
  ctx.fillRect(0, 0, size, size);

  let seed = 4813;
  const rand = () => {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  };
  for (let i = 0; i < 1600; i++) {
    const shade = rand() > 0.5 ? 'rgba(255,255,255,0.22)' : 'rgba(130,122,112,0.12)';
    ctx.fillStyle = shade;
    ctx.fillRect(rand() * size, rand() * size, 2 + rand() * 3, 2);
  }
  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(3, 3);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/**
 * 商店門口手繪木製立牌貼圖（咒語卡包價目與介紹）。
 */
function createShopMenuBoardTexture(): THREE.CanvasTexture {
  const c = document.createElement('canvas');
  c.width = 256;
  c.height = 320;
  const ctx = c.getContext('2d')!;

  ctx.fillStyle = '#23283c';
  ctx.fillRect(0, 0, 256, 320);
  ctx.strokeStyle = '#e8c460';
  ctx.lineWidth = 8;
  ctx.strokeRect(8, 8, 240, 304);

  ctx.textAlign = 'center';
  ctx.fillStyle = '#ffe58f';
  ctx.font = 'bold 26px Georgia, serif';
  ctx.fillText('SPELL PACKS', 128, 56);

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 22px "Microsoft JhengHei", sans-serif';
  ctx.fillText('咒語卡包熱賣中', 128, 98);

  ctx.fillStyle = '#7ad4ff';
  ctx.font = 'bold 19px "Microsoft JhengHei", sans-serif';
  ctx.fillText('標準卡包（3張）', 128, 158);
  ctx.fillStyle = '#ffe58f';
  ctx.font = 'bold 24px Georgia, serif';
  ctx.fillText('10,000 J', 128, 190);

  ctx.fillStyle = '#ff9ec4';
  ctx.font = 'bold 19px "Microsoft JhengHei", sans-serif';
  ctx.fillText('特級卡包（必出C+）', 128, 242);
  ctx.fillStyle = '#ffe58f';
  ctx.font = 'bold 24px Georgia, serif';
  ctx.fillText('25,000 J', 128, 274);

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/**
 * 魔法都市・瑪莎多拉（Magic City of Masadora）獨立場景模組
 * - 2011 動畫精雕白圓頂熊／熊貓頭咒語卡商店（雙層藍白耳、亮面藍圓眼窗、圓鼻、溫光拱門階梯、3 張環繞咒語卡）
 * - 10×4 黑白棋盤格紋迎賓步道（InstancedMesh 2 Draw Calls）＋雙層修剪綠籬、修剪球樹與粉彩花圃
 * - 8 座彩色條紋／圓點糖果蘑菇與彩蛋高塔群（共享幾何與材質＋InstancedMesh 圓點／拱窗／門框）
 * - 東南荒地峽谷入口粉彩迎賓拱門（mx + 14, mz + 21）＋外環櫻花與綠樹框景
 */
export function buildMasadoraZone(ctx: MasadoraBuildContext): THREE.Group {
  const mg = new THREE.Group();
  mg.name = 'zone_masadora';

  const mx = MASADORA_CENTER.x;
  const mz = MASADORA_CENTER.z;

  // =========================================================================
  // 1. 魔法都市手繪粉紫拼花石磚主廣場基底與裝飾石環
  // =========================================================================
  const stuccoTex = createStuccoTexture();
  const plazaMat = new THREE.MeshStandardMaterial({
    map: createMasadoraPlazaTexture(),
    roughness: 0.88,
  });
  const plazaTrimMat = new THREE.MeshStandardMaterial({ map: stuccoTex, color: 0xf4effa, roughness: 0.78 });
  const plazaAccentMat = new THREE.MeshStandardMaterial({ color: 0xb9a8dc, roughness: 0.82 });

  const plaza = new THREE.Mesh(new THREE.CylinderGeometry(31.5, 32.8, 0.2, 48), plazaMat);
  plaza.position.set(mx, 0.1, mz);
  plaza.receiveShadow = true;
  mg.add(plaza);

  const outerRim = new THREE.Mesh(new THREE.RingGeometry(29.8, 31.2, 56), plazaTrimMat);
  outerRim.rotation.x = -Math.PI / 2;
  outerRim.position.set(mx, 0.21, mz);
  outerRim.receiveShadow = true;
  mg.add(outerRim);

  const innerRing = new THREE.Mesh(new THREE.RingGeometry(15.6, 16.4, 48), plazaAccentMat);
  innerRing.rotation.x = -Math.PI / 2;
  innerRing.position.set(mx, 0.21, mz + 5);
  innerRing.receiveShadow = true;
  mg.add(innerRing);

  const plazaLight = new THREE.PointLight(0xffe4ad, 2.1, 56, 1.35);
  plazaLight.position.set(mx, 11.5, mz);
  mg.add(plazaLight);

  // =========================================================================
  // 2. 2011 動畫白圓頂熊／熊貓頭咒語卡商店（Spell Card Shop）
  // =========================================================================
  const shopZ = mz - 11; // -87
  const shop = new THREE.Group();
  shop.position.set(mx, 0.2, shopZ);

  const whiteDomeMat = new THREE.MeshStandardMaterial({ map: stuccoTex, color: 0xf7f7fb, roughness: 0.72, metalness: 0.02 });
  const creamTrimMat = new THREE.MeshStandardMaterial({ map: stuccoTex, color: 0xfcf2db, roughness: 0.76 });
  const blueAccentMat = new THREE.MeshStandardMaterial({ map: stuccoTex, color: 0x2a76d4, roughness: 0.66, metalness: 0.04 });
  const iceBlueTrimMat = new THREE.MeshStandardMaterial({ color: 0x8ad4ff, roughness: 0.52, metalness: 0.08 });
  const goldTrimMat = new THREE.MeshStandardMaterial({ color: 0xe6be54, roughness: 0.38, metalness: 0.52 });
  const eyeGlassMat = new THREE.MeshStandardMaterial({
    color: 0x3eb4ff,
    emissive: 0x1b7be0,
    emissiveIntensity: 0.48,
    roughness: 0.12,
    metalness: 0.35,
  });
  const eyeGlintMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
  const noseMat = new THREE.MeshStandardMaterial({ color: 0x1e2536, roughness: 0.24, metalness: 0.18 });
  const doorGlowMat = new THREE.MeshBasicMaterial({ color: 0xffe9a8 });

  // 圓形石階基座與藍邊腰線
  const shopPlinth = new THREE.Mesh(new THREE.CylinderGeometry(8.95, 9.35, 0.42, 36), creamTrimMat);
  shopPlinth.position.y = 0.21;
  shopPlinth.receiveShadow = true;
  shop.add(shopPlinth);

  const baseCollar = new THREE.Mesh(new THREE.TorusGeometry(8.62, 0.22, 10, 40), blueAccentMat);
  baseCollar.rotation.x = Math.PI / 2;
  baseCollar.position.y = 0.45;
  shop.add(baseCollar);

  // 圓潤白圓頂主體
  const headDome = new THREE.Mesh(
    new THREE.SphereGeometry(8.6, 36, 26, 0, Math.PI * 2, 0, Math.PI * 0.56),
    whiteDomeMat
  );
  headDome.position.y = 0.32;
  headDome.castShadow = true;
  headDome.receiveShadow = true;
  shop.add(headDome);

  // 藍白雙層圓耳＋亮藍耳緣飾條
  const earOuterGeo = new THREE.SphereGeometry(2.95, 22, 18);
  const earRimGeo = new THREE.TorusGeometry(2.26, 0.16, 10, 28);
  const earInnerGeo = new THREE.SphereGeometry(2.05, 18, 16);

  for (const side of [-1, 1]) {
    const earGroup = new THREE.Group();
    earGroup.position.set(side * 6.25, 6.95, 0.55);
    earGroup.rotation.y = side * 0.16;

    const earOuter = new THREE.Mesh(earOuterGeo, blueAccentMat);
    earOuter.scale.set(1.0, 1.0, 0.68);
    earOuter.castShadow = true;
    earGroup.add(earOuter);

    const earRim = new THREE.Mesh(earRimGeo, iceBlueTrimMat);
    earRim.position.z = 1.18;
    earGroup.add(earRim);

    const earInner = new THREE.Mesh(earInnerGeo, whiteDomeMat);
    earInner.scale.set(1.0, 1.0, 0.48);
    earInner.position.z = 1.26;
    earGroup.add(earInner);

    shop.add(earGroup);
  }

  // 亮面藍色大圓眼窗（外藍框＋內銀白圈＋亮面藍玻璃＋雙點動畫高光）
  const eyeOuterRimGeo = new THREE.TorusGeometry(1.62, 0.24, 12, 28);
  const eyeInnerRimGeo = new THREE.TorusGeometry(1.42, 0.075, 8, 24);
  const eyeGlassGeo = new THREE.CircleGeometry(1.42, 24);
  const glintBigGeo = new THREE.CircleGeometry(0.32, 14);
  const glintSmallGeo = new THREE.CircleGeometry(0.14, 12);

  for (const side of [-1, 1]) {
    const eyeGroup = new THREE.Group();
    eyeGroup.position.set(side * 2.95, 4.78, 6.86);
    eyeGroup.rotation.y = side * 0.36;
    eyeGroup.rotation.x = -0.22;

    eyeGroup.add(new THREE.Mesh(eyeOuterRimGeo, blueAccentMat));

    const innerBezel = new THREE.Mesh(eyeInnerRimGeo, iceBlueTrimMat);
    innerBezel.position.z = 0.08;
    eyeGroup.add(innerBezel);

    const glass = new THREE.Mesh(eyeGlassGeo, eyeGlassMat);
    glass.position.z = 0.04;
    eyeGroup.add(glass);

    const glintBig = new THREE.Mesh(glintBigGeo, eyeGlintMat);
    glintBig.position.set(-0.46, 0.48, 0.09);
    eyeGroup.add(glintBig);

    const glintSmall = new THREE.Mesh(glintSmallGeo, eyeGlintMat);
    glintSmall.position.set(0.42, -0.36, 0.09);
    eyeGroup.add(glintSmall);

    shop.add(eyeGroup);
  }

  // 立體白色口鼻吻部＋黑亮熊鼻
  const snout = new THREE.Mesh(new THREE.SphereGeometry(2.15, 20, 14), whiteDomeMat);
  snout.scale.set(1.25, 0.72, 0.55);
  snout.position.set(0, 3.35, 7.65);
  shop.add(snout);

  const bearNose = new THREE.Mesh(new THREE.SphereGeometry(0.76, 16, 14), noseMat);
  bearNose.scale.set(1.32, 0.86, 0.65);
  bearNose.position.set(0, 3.88, 8.48);
  shop.add(bearNose);

  const noseGlint = new THREE.Mesh(new THREE.SphereGeometry(0.16, 10, 8), eyeGlintMat);
  noseGlint.scale.set(1.3, 0.7, 0.5);
  noseGlint.position.set(-0.28, 4.08, 8.92);
  shop.add(noseGlint);

  // 溫光拱門入口＋雙層飾拱＋門柱＋雙階門檻
  const archOuter = new THREE.Mesh(new THREE.TorusGeometry(2.48, 0.42, 12, 28, Math.PI), blueAccentMat);
  archOuter.position.set(0, 1.35, 8.35);
  shop.add(archOuter);

  const archInner = new THREE.Mesh(new THREE.TorusGeometry(2.1, 0.12, 10, 24, Math.PI), goldTrimMat);
  archInner.position.set(0, 1.35, 8.52);
  shop.add(archInner);

  const jambGeo = new THREE.CylinderGeometry(0.38, 0.42, 1.35, 12);
  for (const side of [-1, 1]) {
    const jamb = new THREE.Mesh(jambGeo, blueAccentMat);
    jamb.position.set(side * 2.48, 0.68, 8.35);
    shop.add(jamb);
  }

  const doorRect = new THREE.Mesh(new THREE.PlaneGeometry(4.2, 1.4), doorGlowMat);
  doorRect.position.set(0, 0.72, 8.28);
  shop.add(doorRect);

  const doorArchGlow = new THREE.Mesh(new THREE.CircleGeometry(2.1, 24, 0, Math.PI), doorGlowMat);
  doorArchGlow.position.set(0, 1.35, 8.28);
  shop.add(doorArchGlow);

  const stepLower = new THREE.Mesh(new THREE.BoxGeometry(5.8, 0.16, 1.35), creamTrimMat);
  stepLower.position.set(0, 0.08, 8.75);
  stepLower.receiveShadow = true;
  shop.add(stepLower);

  const stepUpper = new THREE.Mesh(new THREE.BoxGeometry(5.0, 0.16, 0.85), whiteDomeMat);
  stepUpper.position.set(0, 0.24, 8.52);
  stepUpper.receiveShadow = true;
  shop.add(stepUpper);

  // 霓虹商店招牌與金色支撐架
  const signMesh = ctx.createNeonSignMesh('SPELL CARD SHOP', '瑪莎多拉・咒語卡商店');
  signMesh.scale.setScalar(0.88);
  signMesh.position.set(0, 10.65, 4.4);
  shop.add(signMesh);

  const strutGeo = new THREE.CylinderGeometry(0.1, 0.12, 2.2, 8);
  for (const side of [-1, 1]) {
    const strut = new THREE.Mesh(strutGeo, goldTrimMat);
    strut.position.set(side * 2.2, 9.15, 4.25);
    strut.rotation.x = 0.22;
    shop.add(strut);
  }

  // 3 張環繞官方原作咒語實卡（No.1039 同行、No.1005 磁力、No.1009 歸還）＋ 緩轉魔法符文金環
  const cardOrbit = new THREE.Group();
  cardOrbit.position.set(0, 14.3, 0);
  const spellCardTexLoader = new THREE.TextureLoader();
  const orbitCardIds = [1039, 1005, 1009];
  const cardFrameGeo = new THREE.BoxGeometry(2.02, 2.82, 0.12);
  const cardArtGeo = new THREE.PlaneGeometry(1.86, 2.6);
  const cardMeshes: THREE.Group[] = [];

  const runeHalo = new THREE.Mesh(
    new THREE.TorusGeometry(4.35, 0.075, 10, 48),
    new THREE.MeshBasicMaterial({ color: 0x7ef2dc, transparent: true, opacity: 0.55 })
  );
  runeHalo.rotation.x = Math.PI / 2;
  cardOrbit.add(runeHalo);

  for (let c = 0; c < 3; c++) {
    const a = (c / 3) * Math.PI * 2;
    const cardHolder = new THREE.Group();
    cardHolder.position.set(Math.cos(a) * 4.35, 0, Math.sin(a) * 4.35);
    cardHolder.rotation.y = -a + Math.PI / 2;

    const tex = spellCardTexLoader.load(`./cards/${orbitCardIds[c]}.webp`);
    tex.colorSpace = THREE.SRGBColorSpace;
    const faceMat = new THREE.MeshStandardMaterial({
      map: tex,
      emissiveMap: tex,
      emissive: new THREE.Color(0xffffff),
      emissiveIntensity: 0.22,
      roughness: 0.72,
    });

    const frame = new THREE.Mesh(cardFrameGeo, goldTrimMat);
    const front = new THREE.Mesh(cardArtGeo, faceMat);
    front.position.z = 0.068;
    const back = new THREE.Mesh(cardArtGeo, faceMat);
    back.position.z = -0.068;
    back.rotation.y = Math.PI;
    cardHolder.add(frame, front, back);
    cardOrbit.add(cardHolder);
    cardMeshes.push(cardHolder);
  }
  shop.add(cardOrbit);

  // 商店棋盤步道前端兩側手繪木製價目黑板立牌（移至綠籬前方淨空處，完全不被樹籬遮擋）
  const menuTex = createShopMenuBoardTexture();
  const menuBoardMat = new THREE.MeshStandardMaterial({ map: menuTex, roughness: 0.76 });
  const menuWoodMat = new THREE.MeshStandardMaterial({ color: 0x6b472d, roughness: 0.85 });
  for (const side of [-1, 1]) {
    const stand = new THREE.Group();
    stand.position.set(side * 3.15, 0.02, 21.85);
    stand.rotation.y = -side * 0.28;
    const board = new THREE.Mesh(new THREE.BoxGeometry(1.15, 1.42, 0.08), [
      menuWoodMat,
      menuWoodMat,
      menuWoodMat,
      menuWoodMat,
      menuBoardMat,
      menuWoodMat,
    ]);
    board.position.y = 0.82;
    board.rotation.x = -0.14;
    board.castShadow = true;
    stand.add(board);
    const legBack = new THREE.Mesh(new THREE.BoxGeometry(1.0, 1.35, 0.06), menuWoodMat);
    legBack.position.set(0, 0.75, -0.32);
    legBack.rotation.x = 0.22;
    stand.add(legBack);
    shop.add(stand);
  }

  ctx.addAnimated((t) => {
    cardOrbit.rotation.y = t * 0.72;
    runeHalo.rotation.z = -t * 0.45;
    for (let i = 0; i < cardMeshes.length; i++) {
      cardMeshes[i].position.y = Math.sin(t * 2.2 + i * 2.1) * 0.32;
    }
  });

  // =========================================================================
  // 3. 10×4 黑白棋盤格紋迎賓步道（InstancedMesh 僅 2 Draw Calls）＋雙層綠籬／球樹／粉彩花圃
  // =========================================================================
  const tileGeo = new THREE.BoxGeometry(1.2, 0.08, 1.2);
  const blackTiles = new THREE.InstancedMesh(
    tileGeo,
    new THREE.MeshStandardMaterial({ color: 0x1d202b, roughness: 0.62 }),
    20
  );
  const whiteTiles = new THREE.InstancedMesh(
    tileGeo,
    new THREE.MeshStandardMaterial({ color: 0xf7f8fc, roughness: 0.58 }),
    20
  );

  const dummy = new THREE.Object3D();
  let bi = 0;
  let wi = 0;
  for (let r = 0; r < 10; r++) {
    for (let c = 0; c < 4; c++) {
      dummy.position.set(-1.8 + c * 1.2, 0.04, 9.2 + r * 1.2);
      dummy.rotation.set(0, 0, 0);
      dummy.scale.set(1, 1, 1);
      dummy.updateMatrix();
      if ((r + c) % 2 === 0) blackTiles.setMatrixAt(bi++, dummy.matrix);
      else whiteTiles.setMatrixAt(wi++, dummy.matrix);
    }
  }
  blackTiles.instanceMatrix.needsUpdate = true;
  whiteTiles.instanceMatrix.needsUpdate = true;
  blackTiles.receiveShadow = true;
  whiteTiles.receiveShadow = true;
  shop.add(blackTiles, whiteTiles);

  // 步道雙側白色石緣邊條
  const curbGeo = new THREE.BoxGeometry(0.24, 0.14, 12.1);
  for (const side of [-1, 1]) {
    const curb = new THREE.Mesh(curbGeo, creamTrimMat);
    curb.position.set(side * 2.54, 0.07, 14.6);
    curb.receiveShadow = true;
    shop.add(curb);
  }

  // 雙層修剪綠籬（適度提亮葉色並加入柔和自發光補光，避免背光面過暗）
  const hedgeDarkMat = new THREE.MeshStandardMaterial({
    color: 0x368647,
    emissive: 0x102d18,
    emissiveIntensity: 0.24,
    roughness: 0.84,
  });
  const hedgeBrightMat = new THREE.MeshStandardMaterial({
    color: 0x4eab5c,
    emissive: 0x173a20,
    emissiveIntensity: 0.2,
    roughness: 0.8,
  });
  const lowerHedgeGeo = new THREE.BoxGeometry(1.35, 1.05, 11.8);
  const upperHedgeGeo = new THREE.BoxGeometry(0.95, 0.52, 11.3);

  for (const side of [-1, 1]) {
    const lowerHedge = new THREE.Mesh(lowerHedgeGeo, hedgeDarkMat);
    lowerHedge.position.set(side * 3.45, 0.525, 14.6);
    lowerHedge.castShadow = true;
    lowerHedge.receiveShadow = true;
    shop.add(lowerHedge);

    const upperHedge = new THREE.Mesh(upperHedgeGeo, hedgeBrightMat);
    upperHedge.position.set(side * 3.45, 1.28, 14.6);
    upperHedge.castShadow = true;
    shop.add(upperHedge);
  }

  // 修剪球樹（Topiary Spheres）— 6 顆合併為 1 個 InstancedMesh Draw Call
  const topiaryZ = [9.2, 14.6, 20.0];
  const topiaryInst = new THREE.InstancedMesh(new THREE.SphereGeometry(0.86, 14, 12), hedgeBrightMat, 6);
  const topiaryBaseInst = new THREE.InstancedMesh(
    new THREE.CylinderGeometry(0.45, 0.56, 0.36, 12),
    creamTrimMat,
    6
  );
  let ti = 0;
  for (const side of [-1, 1]) {
    for (const tz of topiaryZ) {
      dummy.position.set(side * 3.45, 2.02, tz);
      dummy.rotation.set(0, 0, 0);
      dummy.scale.set(1, 1, 1);
      dummy.updateMatrix();
      topiaryInst.setMatrixAt(ti, dummy.matrix);

      dummy.position.set(side * 3.45, 1.56, tz);
      dummy.updateMatrix();
      topiaryBaseInst.setMatrixAt(ti, dummy.matrix);
      ti++;
    }
  }
  topiaryInst.instanceMatrix.needsUpdate = true;
  topiaryBaseInst.instanceMatrix.needsUpdate = true;
  topiaryInst.castShadow = true;
  shop.add(topiaryInst, topiaryBaseInst);

  // 粉彩魔法花圃（8 座花槽＋24 簇粉彩花球，僅 2 個 InstancedMesh Draw Calls）
  const planterZ = [10.6, 13.3, 16.0, 18.7];
  const planterInst = new THREE.InstancedMesh(
    new THREE.BoxGeometry(0.86, 0.44, 1.9),
    new THREE.MeshStandardMaterial({ color: 0xe9dff5, roughness: 0.72 }),
    8
  );
  const flowerInst = new THREE.InstancedMesh(
    new THREE.DodecahedronGeometry(0.36, 0),
    new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.65 }),
    24
  );
  const pastelPalette = [0xff85b3, 0xb88cff, 0x62f0d2, 0xffe066, 0x7ac7ff, 0xffa372];
  const tmpColor = new THREE.Color();
  let pi = 0;
  let fi = 0;
  for (const side of [-1, 1]) {
    for (const pz of planterZ) {
      dummy.position.set(side * 4.55, 0.22, pz);
      dummy.rotation.set(0, 0, 0);
      dummy.scale.set(1, 1, 1);
      dummy.updateMatrix();
      planterInst.setMatrixAt(pi++, dummy.matrix);

      for (const dz of [-0.55, 0, 0.55]) {
        dummy.position.set(side * 4.55, 0.58, pz + dz);
        dummy.rotation.set(0.2 * fi, 0.6 * fi, 0);
        dummy.scale.set(1.0, 0.78, 1.0);
        dummy.updateMatrix();
        flowerInst.setMatrixAt(fi, dummy.matrix);
        tmpColor.setHex(pastelPalette[fi % pastelPalette.length]);
        flowerInst.setColorAt(fi, tmpColor);
        fi++;
      }
    }
  }
  planterInst.instanceMatrix.needsUpdate = true;
  flowerInst.instanceMatrix.needsUpdate = true;
  if (flowerInst.instanceColor) flowerInst.instanceColor.needsUpdate = true;
  planterInst.receiveShadow = true;
  shop.add(planterInst, flowerInst);

  mg.add(shop);

  // 咒語卡商店主體＋雙側綠籬精準碰撞盒（保留中央 5.5m 寬敞棋盤步道）
  ctx.addCircleCollider({ x: mx, z: shopZ, r: 9.1 });
  ctx.addBoxCollider({
    minX: mx - 5.0,
    maxX: mx - 2.75,
    minZ: shopZ + 8.5,
    maxZ: shopZ + 20.7,
  });
  ctx.addBoxCollider({
    minX: mx + 2.75,
    maxX: mx + 5.0,
    minZ: shopZ + 8.5,
    maxZ: shopZ + 20.7,
  });

  // =========================================================================
  // 4. 8 座彩色條紋／圓點糖果蘑菇與彩蛋高塔群（共享幾何＋InstancedMesh 圓點／拱窗／門框）
  // =========================================================================
  const towers: TowerSpec[] = [
    { x: mx - 19, z: mz - 10, bodyColor: 0xf6c945, capColor: 0xe85d99, height: 15.0, style: 'mushroom', faceAngle: 0.7 },
    { x: mx + 19, z: mz - 10, bodyColor: 0x62b6f5, capColor: 0xf28b30, height: 15.6, style: 'mushroom', faceAngle: -0.7 },
    { x: mx - 23, z: mz + 5, bodyColor: 0x9b6fd4, capColor: 0xf6c945, height: 13.2, style: 'egg', faceAngle: 1.35 },
    { x: mx + 24, z: mz + 2, bodyColor: 0xf27d9b, capColor: 0x38b2ac, height: 13.6, style: 'egg', faceAngle: -1.35 },
    { x: mx - 16, z: mz + 19, bodyColor: 0xf28b30, capColor: 0x7b52c7, height: 11.8, style: 'mushroom', faceAngle: 2.35 },
    { x: mx + 22, z: mz + 13, bodyColor: 0xe85a5a, capColor: 0xf6c945, height: 12.2, style: 'egg', faceAngle: -2.05 },
    { x: mx - 10, z: mz - 25, bodyColor: 0xe85d99, capColor: 0x4299e1, height: 17.0, style: 'mushroom', faceAngle: 0.3 },
    { x: mx + 10, z: mz - 25, bodyColor: 0xe85a5a, capColor: 0x9b6fd4, height: 16.4, style: 'egg', faceAngle: -0.3 },
  ];

  // 共享幾何與材質（最小化記憶體與 shader 切換）
  const stemGeo = new THREE.CylinderGeometry(2.55, 3.35, 1, 18);
  const baseTrimGeo = new THREE.CylinderGeometry(3.55, 3.78, 0.56, 18);
  const bandGeo = new THREE.CylinderGeometry(3.04, 3.16, 0.92, 18);
  const mushroomCapGeo = new THREE.SphereGeometry(4.5, 22, 16, 0, Math.PI * 2, 0, Math.PI * 0.58);
  const eggCapGeo = new THREE.SphereGeometry(3.55, 22, 18);
  const eggCollarGeo = new THREE.TorusGeometry(2.92, 0.34, 10, 24);
  const finialGeo = new THREE.SphereGeometry(0.65, 12, 10);

  const matCache = new Map<number, THREE.MeshStandardMaterial>();
  const getColorMat = (hex: number, roughness = 0.74): THREE.MeshStandardMaterial => {
    const r = Math.max(0.68, roughness);
    const key = hex * 10 + Math.round(r * 10);
    let m = matCache.get(key);
    if (!m) {
      m = new THREE.MeshStandardMaterial({ map: stuccoTex, color: hex, roughness: r, metalness: 0.02 });
      matCache.set(key, m);
    }
    return m;
  };

  const stripeWhiteMat = new THREE.MeshStandardMaterial({ map: stuccoTex, color: 0xfbf7ef, roughness: 0.74 });

  // InstancedMesh 批次：64 顆圓點＋24 扇拱窗（框＋暖光玻璃）＋8 組門框與門片
  const polkaDotInst = new THREE.InstancedMesh(
    new THREE.SphereGeometry(0.62, 10, 10),
    new THREE.MeshBasicMaterial({ color: 0xffffff }),
    towers.length * 8
  );
  const winFrameInst = new THREE.InstancedMesh(
    new THREE.BoxGeometry(1.18, 1.86, 0.24),
    stripeWhiteMat,
    towers.length * 3
  );
  const winGlassInst = new THREE.InstancedMesh(
    new THREE.BoxGeometry(0.86, 1.54, 0.28),
    new THREE.MeshBasicMaterial({ color: 0xfff0b3 }),
    towers.length * 3
  );
  const doorFrameInst = new THREE.InstancedMesh(
    new THREE.BoxGeometry(2.05, 2.75, 0.36),
    stripeWhiteMat,
    towers.length
  );
  const doorLeafInst = new THREE.InstancedMesh(
    new THREE.BoxGeometry(1.55, 2.35, 0.42),
    new THREE.MeshStandardMaterial({ color: 0x5c3c2e, roughness: 0.78 }),
    towers.length
  );

  let dotIdx = 0;
  let winIdx = 0;
  let doorIdx = 0;

  for (const tw of towers) {
    const tg = new THREE.Group();
    tg.position.set(tw.x, 0.2, tw.z);

    const stemH = tw.height * 0.62;
    const baseTrim = new THREE.Mesh(baseTrimGeo, stripeWhiteMat);
    baseTrim.position.y = 0.28;
    baseTrim.receiveShadow = true;
    tg.add(baseTrim);

    const stem = new THREE.Mesh(stemGeo, getColorMat(tw.bodyColor, 0.54));
    stem.scale.y = stemH;
    stem.position.y = stemH / 2;
    stem.castShadow = true;
    stem.receiveShadow = true;
    tg.add(stem);

    // 雙道白色環狀糖果條紋
    for (const frac of [0.28, 0.5]) {
      const band = new THREE.Mesh(bandGeo, stripeWhiteMat);
      band.position.y = tw.height * frac;
      const tScale = 1.04 - frac * 0.22;
      band.scale.set(tScale, 1, tScale);
      tg.add(band);
    }

    const capY = tw.height * 0.58;
    if (tw.style === 'mushroom') {
      const cap = new THREE.Mesh(mushroomCapGeo, getColorMat(tw.capColor, 0.44));
      cap.position.y = capY;
      cap.castShadow = true;
      tg.add(cap);

      // 6 顆下緣圓點＋2 顆頂冠圓點
      for (let i = 0; i < 6; i++) {
        const a = (i / 6) * Math.PI * 2 + tw.faceAngle;
        dummy.position.set(tw.x + Math.cos(a) * 3.92, 0.2 + capY + 1.65, tw.z + Math.sin(a) * 3.92);
        dummy.rotation.set(0, 0, 0);
        dummy.scale.set(1, 1, 1);
        dummy.updateMatrix();
        polkaDotInst.setMatrixAt(dotIdx++, dummy.matrix);
      }
      for (let i = 0; i < 2; i++) {
        const a = i * Math.PI + tw.faceAngle + 0.5;
        dummy.position.set(tw.x + Math.cos(a) * 2.15, 0.2 + capY + 3.45, tw.z + Math.sin(a) * 2.15);
        dummy.scale.setScalar(0.82);
        dummy.updateMatrix();
        polkaDotInst.setMatrixAt(dotIdx++, dummy.matrix);
      }
    } else {
      // 彩蛋高塔造型（蛋形圓頂＋荷葉邊領環＋頂部糖果珠）
      const collar = new THREE.Mesh(eggCollarGeo, stripeWhiteMat);
      collar.rotation.x = Math.PI / 2;
      collar.position.y = capY + 0.25;
      tg.add(collar);

      const eggCap = new THREE.Mesh(eggCapGeo, getColorMat(tw.capColor, 0.4));
      eggCap.scale.set(1.0, 1.38, 1.0);
      eggCap.position.y = capY + 2.55;
      eggCap.castShadow = true;
      tg.add(eggCap);

      const finial = new THREE.Mesh(finialGeo, goldTrimMat);
      finial.position.y = capY + 7.65;
      tg.add(finial);

      // 8 顆彩蛋裝飾圓點
      for (let i = 0; i < 6; i++) {
        const a = (i / 6) * Math.PI * 2 + tw.faceAngle;
        dummy.position.set(tw.x + Math.cos(a) * 3.35, 0.2 + capY + 2.5, tw.z + Math.sin(a) * 3.35);
        dummy.rotation.set(0, 0, 0);
        dummy.scale.setScalar(0.85);
        dummy.updateMatrix();
        polkaDotInst.setMatrixAt(dotIdx++, dummy.matrix);
      }
      for (let i = 0; i < 2; i++) {
        const a = i * Math.PI + tw.faceAngle + 0.5;
        dummy.position.set(tw.x + Math.cos(a) * 2.25, 0.2 + capY + 5.15, tw.z + Math.sin(a) * 2.25);
        dummy.scale.setScalar(0.7);
        dummy.updateMatrix();
        polkaDotInst.setMatrixAt(dotIdx++, dummy.matrix);
      }
    }

    // 3 扇發光窗戶（繞塔身面朝廣場一側分佈）
    for (let w = 0; w < 3; w++) {
      const wa = tw.faceAngle + (w - 1) * 1.15;
      const wy = 0.2 + tw.height * (w === 1 ? 0.42 : 0.36);
      const wr = 2.92;
      dummy.position.set(tw.x + Math.sin(wa) * wr, wy, tw.z + Math.cos(wa) * wr);
      dummy.rotation.set(0, wa, 0);
      dummy.scale.set(1, 1, 1);
      dummy.updateMatrix();
      winFrameInst.setMatrixAt(winIdx, dummy.matrix);
      winGlassInst.setMatrixAt(winIdx, dummy.matrix);
      winIdx++;
    }

    // 塔底裝飾木門（面朝廣場中心）
    const dr = 3.22;
    dummy.position.set(tw.x + Math.sin(tw.faceAngle) * dr, 0.2 + 1.4, tw.z + Math.cos(tw.faceAngle) * dr);
    dummy.rotation.set(0, tw.faceAngle, 0);
    dummy.scale.set(1, 1, 1);
    dummy.updateMatrix();
    doorFrameInst.setMatrixAt(doorIdx, dummy.matrix);
    doorLeafInst.setMatrixAt(doorIdx, dummy.matrix);
    doorIdx++;

    mg.add(tg);
    ctx.addCircleCollider({ x: tw.x, z: tw.z, r: 4.2 });
  }

  polkaDotInst.instanceMatrix.needsUpdate = true;
  winFrameInst.instanceMatrix.needsUpdate = true;
  winGlassInst.instanceMatrix.needsUpdate = true;
  doorFrameInst.instanceMatrix.needsUpdate = true;
  doorLeafInst.instanceMatrix.needsUpdate = true;
  mg.add(polkaDotInst, winFrameInst, winGlassInst, doorFrameInst, doorLeafInst);

  // =========================================================================
  // 5. 粉彩魔法都市迎賓拱門（東南荒地峽谷入口：mx + 14, mz + 21）
  // =========================================================================
  const gateX = mx + 14; // -28
  const gateZ = mz + 21; // -55
  const gateRotY = Math.atan2(14, 21); // 對齊荒地峽谷道路軸線並框住熊貓咒語卡商店

  const gateGroup = new THREE.Group();
  gateGroup.position.set(gateX, 0.2, gateZ);
  gateGroup.rotation.y = gateRotY;

  const gateLavMat = new THREE.MeshStandardMaterial({ color: 0xb794f4, roughness: 0.45 });
  const gatePinkMat = new THREE.MeshStandardMaterial({ color: 0xff85b3, roughness: 0.42 });
  const gateMintMat = new THREE.MeshStandardMaterial({ color: 0x68d8c8, roughness: 0.45 });

  const gatePedestalGeo = new THREE.CylinderGeometry(1.15, 1.32, 0.85, 14);
  const gatePillarGeo = new THREE.CylinderGeometry(0.68, 0.78, 6.4, 14);
  const gateRingGeo = new THREE.TorusGeometry(0.76, 0.14, 8, 18);
  const gateOrbGeo = new THREE.SphereGeometry(0.92, 14, 12);

  for (const side of [-1, 1]) {
    const px = side * 4.2;
    const ped = new THREE.Mesh(gatePedestalGeo, gateMintMat);
    ped.position.set(px, 0.425, 0);
    ped.castShadow = true;
    ped.receiveShadow = true;
    gateGroup.add(ped);

    const pillar = new THREE.Mesh(gatePillarGeo, gateLavMat);
    pillar.position.set(px, 4.0, 0);
    pillar.castShadow = true;
    gateGroup.add(pillar);

    for (const ry of [2.2, 4.0, 5.8]) {
      const band = new THREE.Mesh(gateRingGeo, stripeWhiteMat);
      band.rotation.x = Math.PI / 2;
      band.position.set(px, ry, 0);
      gateGroup.add(band);
    }

    const orb = new THREE.Mesh(gateOrbGeo, iceBlueTrimMat);
    orb.position.set(px, 7.6, 0);
    gateGroup.add(orb);

    // 精準轉換左右門柱世界座標並加入碰撞圓（中央保留 > 6m 寬通道）
    const worldPx = gateX + Math.cos(gateRotY) * px;
    const worldPz = gateZ - Math.sin(gateRotY) * px;
    ctx.addCircleCollider({ x: worldPx, z: worldPz, r: 1.2 });
  }

  const gateArchMain = new THREE.Mesh(new THREE.TorusGeometry(4.2, 0.42, 12, 32, Math.PI), gatePinkMat);
  gateArchMain.position.set(0, 6.8, 0);
  gateArchMain.castShadow = true;
  gateGroup.add(gateArchMain);

  const gateArchGold = new THREE.Mesh(new THREE.TorusGeometry(3.72, 0.12, 8, 28, Math.PI), goldTrimMat);
  gateArchGold.position.set(0, 6.8, 0);
  gateGroup.add(gateArchGold);

  const gateSign = ctx.createNeonSignMesh('MASADORA', '魔法都市・瑪莎多拉');
  gateSign.scale.setScalar(0.72);
  gateSign.position.set(0, 8.65, 0.32);
  gateGroup.add(gateSign);

  const gateCrest = new THREE.Mesh(
    new THREE.OctahedronGeometry(0.72, 0),
    new THREE.MeshStandardMaterial({ color: 0xffe58f, emissive: 0xf0c659, emissiveIntensity: 0.65, roughness: 0.25 })
  );
  gateCrest.position.set(0, 11.45, 0);
  gateGroup.add(gateCrest);

  ctx.addAnimated((t) => {
    gateCrest.rotation.y = t * 1.4;
    gateCrest.position.y = 11.45 + Math.sin(t * 2.5) * 0.22;
  });

  mg.add(gateGroup);

  // =========================================================================
  // 6. 廣場魔法路燈（InstancedMesh 2 Draw Calls：燈柱＋發光燈球）
  // =========================================================================
  const lampCoords: Array<[number, number]> = [
    [mx - 6.2, mz + 10.5],
    [mx + 6.2, mz + 10.5],
    [mx - 12.0, mz + 13.5],
    [mx + 10.5, mz + 13.5],
    [mx - 14.5, mz - 1.5],
    [mx + 14.5, mz - 1.5],
    [mx - 11.5, mz - 14.5],
    [mx + 11.5, mz - 14.5],
  ];

  const lampPostInst = new THREE.InstancedMesh(
    new THREE.CylinderGeometry(0.12, 0.2, 4.1, 8),
    new THREE.MeshStandardMaterial({ color: 0x4c406a, roughness: 0.58, metalness: 0.42 }),
    lampCoords.length
  );
  const lampCapInst = new THREE.InstancedMesh(
    new THREE.ConeGeometry(0.54, 0.72, 8),
    new THREE.MeshStandardMaterial({ color: 0x6f55a6, roughness: 0.62 }),
    lampCoords.length
  );
  const lampBulbInst = new THREE.InstancedMesh(
    new THREE.SphereGeometry(0.38, 12, 10),
    new THREE.MeshBasicMaterial({ color: 0xfff2ba }),
    lampCoords.length
  );

  for (let i = 0; i < lampCoords.length; i++) {
    const [lx, lz] = lampCoords[i];
    dummy.position.set(lx, 2.25, lz);
    dummy.rotation.set(0, 0, 0);
    dummy.scale.set(1, 1, 1);
    dummy.updateMatrix();
    lampPostInst.setMatrixAt(i, dummy.matrix);

    dummy.position.set(lx, 4.45, lz);
    dummy.updateMatrix();
    lampBulbInst.setMatrixAt(i, dummy.matrix);

    // 巫師帽尖頂燈罩，強化魔法都市童話輪廓
    dummy.position.set(lx, 5.05, lz);
    dummy.updateMatrix();
    lampCapInst.setMatrixAt(i, dummy.matrix);
  }
  lampPostInst.instanceMatrix.needsUpdate = true;
  lampBulbInst.instanceMatrix.needsUpdate = true;
  lampCapInst.instanceMatrix.needsUpdate = true;
  lampPostInst.castShadow = true;
  mg.add(lampPostInst, lampBulbInst, lampCapInst);

  // =========================================================================
  // 7. 瑪莎多拉交易市集攤位、長椅與 NPC（確保不覆蓋 (-32, -66) 拾取點）
  // =========================================================================
  // 東側市集攤位（遠離 pickup_pouch_2 (-32, -66) 超過 5m）
  const standEastX = mx + 13.0; // -29
  const standEastZ = mz + 4.5;  // -71.5
  ctx.models.place(mg, 'MarketStand_1.glb', {
    x: standEastX,
    y: 0.2,
    z: standEastZ,
    targetHeight: 3.5,
    rotY: -0.75,
  });
  ctx.addBoxCollider({
    minX: standEastX - 1.9,
    maxX: standEastX + 1.9,
    minZ: standEastZ - 1.7,
    maxZ: standEastZ + 1.7,
  });

  // 西側市集攤位（對稱配置）
  const standWestX = mx - 13.0; // -55
  const standWestZ = mz + 4.5;  // -71.5
  ctx.models.place(mg, 'MarketStand_2.glb', {
    x: standWestX,
    y: 0.2,
    z: standWestZ,
    targetHeight: 3.5,
    rotY: 0.75,
  });
  ctx.addBoxCollider({
    minX: standWestX - 1.9,
    maxX: standWestX + 1.9,
    minZ: standWestZ - 1.7,
    maxZ: standWestZ + 1.7,
  });

  // 廣場休憩長椅
  ctx.models.place(mg, 'Bench_1.glb', { x: mx - 8.5, y: 0.2, z: mz + 13.5, targetHeight: 1.05, rotY: 0.35 });
  ctx.models.place(mg, 'Bench_1.glb', { x: mx + 8.5, y: 0.2, z: mz + 13.5, targetHeight: 1.05, rotY: -0.35 });

  // 咒語卡商店店員（站立於棋盤步道北端門檻前，視野與互動距離最自然）
  const shopkeeperX = mx;
  const shopkeeperZ = mz - 0.5; // -76.5
  const shopkeeper = ctx.createNpcMesh(0x267be0, 0xffe0bd, 0xd44b8a);
  shopkeeper.position.set(shopkeeperX, 0.28, shopkeeperZ);
  mg.add(shopkeeper);
  ctx.addInteractable({
    id: 'masadora_shop',
    label: '進入「瑪莎多拉咒語卡商店」抽卡包',
    position: new THREE.Vector3(shopkeeperX, 0, shopkeeperZ),
    radius: 4.8,
    kind: 'shop',
  });

  // 交易商店情報員（站立於東側市集攤位前）
  const guideX = mx + 10.0; // -32
  const guideZ = mz + 5.8;  // -70.2
  const guideNpc = ctx.createNpcMesh(0xd96b98, 0xffe0bd, 0xf2d16b);
  guideNpc.position.set(guideX, 0.2, guideZ);
  guideNpc.rotation.y = -0.65;
  mg.add(guideNpc);
  ctx.addInteractable({
    id: 'npc_hunter_guide',
    label: '與瑪莎多拉交易商店情報員對話',
    position: new THREE.Vector3(guideX, 0, guideZ),
    radius: 3.8,
    kind: 'npc',
  });

  // =========================================================================
  // 8. 外環櫻花與綠樹框景（避開正南 spawnPos 與東南拱門視線走廊）
  // =========================================================================
  const perimeterTrees: Array<{ file: string; x: number; z: number; h: number; rotY: number }> = [
    { file: 'BlossomTree_1.glb', x: mx - 24, z: mz - 11, h: 7.4, rotY: 0.4 },
    { file: 'BlossomTree_1.glb', x: mx + 25, z: mz - 17, h: 7.6, rotY: 1.9 },
    { file: 'Tree_1.glb', x: mx - 29, z: mz - 4, h: 7.8, rotY: 1.1 },
    { file: 'Tree_2.glb', x: mx + 29, z: mz - 5, h: 7.5, rotY: 2.4 },
    { file: 'BlossomTree_1.glb', x: mx - 25, z: mz + 15, h: 7.0, rotY: 0.8 },
    { file: 'Tree_1.glb', x: mx - 10, z: mz + 26, h: 6.8, rotY: 2.1 },
    { file: 'BlossomTree_1.glb', x: mx + 28, z: mz + 10, h: 7.2, rotY: 1.5 },
    { file: 'BirchTree_1.glb', x: mx - 1, z: mz - 27, h: 8.2, rotY: 0.2 },
    { file: 'Tree_2.glb', x: mx - 11, z: mz - 22, h: 7.8, rotY: 2.8 },
    { file: 'Tree_1.glb', x: mx + 18, z: mz - 25, h: 7.6, rotY: 0.6 },
  ];

  for (const tr of perimeterTrees) {
    ctx.models
      .place(mg, tr.file, {
        x: tr.x,
        y: 0.2,
        z: tr.z,
        targetHeight: tr.h,
        rotY: tr.rotY,
      })
      .then((tree) => {
        if (!tree) return;
        // 柔和提亮內城樹木陰影面葉片材質，避免背光時過暗發黑
        tree.traverse((obj) => {
          const mesh = obj as THREE.Mesh;
          if (!mesh.isMesh || !mesh.material) return;
          const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
          const updated = mats.map((m) => {
            if (!(m instanceof THREE.MeshStandardMaterial)) return m;
            const cloned = m.clone();
            const hsl = { h: 0, s: 0, l: 0 };
            cloned.color.getHSL(hsl);
            if (hsl.l < 0.45) {
              cloned.color.setHSL(hsl.h, Math.min(1, hsl.s * 1.05), Math.min(0.55, hsl.l + 0.1));
            }
            cloned.emissive.copy(cloned.color);
            cloned.emissiveIntensity = 0.16;
            cloned.roughness = Math.max(0.75, cloned.roughness);
            return cloned;
          });
          mesh.material = Array.isArray(mesh.material) ? updated : updated[0];
        });
      });
    ctx.addCircleCollider({ x: tr.x, z: tr.z, r: 0.9 });
  }

  return mg;
}
