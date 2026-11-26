import * as THREE from 'three';
import { ModelLibrary } from '../assets';

export interface LimeiroBuildContext {
  models: ModelLibrary;
  createNpcMesh: (clothColor: number, skinColor: number, hairColor: number) => THREE.Group;
  addCircleCollider: (c: { x: number; z: number; r: number }) => void;
  addInteractable: (item: {
    id: string;
    label: string;
    position: THREE.Vector3;
    radius: number;
    kind: 'npc' | 'portal' | 'shop' | 'pickup' | 'sign';
  }) => void;
}

function createRoyalStonePlaque(title: string, subtitle: string): THREE.Mesh {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 160;
  const ctx = canvas.getContext('2d')!;

  // 古典純白石雕金字王城銘牌
  ctx.fillStyle = '#f2efe8';
  ctx.fillRect(0, 0, 512, 160);
  ctx.strokeStyle = '#c99c38';
  ctx.lineWidth = 10;
  ctx.strokeRect(8, 8, 496, 144);
  ctx.strokeStyle = '#3b5878';
  ctx.lineWidth = 3;
  ctx.strokeRect(18, 18, 476, 124);

  ctx.textAlign = 'center';
  ctx.fillStyle = '#23354d';
  ctx.font = 'bold 38px sans-serif';
  ctx.fillText(title, 256, 74);

  ctx.fillStyle = '#996f1d';
  ctx.font = 'bold 25px sans-serif';
  ctx.fillText(subtitle, 256, 122);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return new THREE.Mesh(
    new THREE.BoxGeometry(7.6, 2.3, 0.34),
    new THREE.MeshStandardMaterial({ map: tex, roughness: 0.55 })
  );
}

export function buildLimeiroZone(ctx: LimeiroBuildContext): THREE.Group {
  const lg = new THREE.Group();
  const lx = 14;
  const lz = -104;

  const whiteLimestone = new THREE.MeshStandardMaterial({ color: 0xf5f3ed, roughness: 0.46 });
  const stoneWallMat = new THREE.MeshStandardMaterial({ color: 0xbab4a8, roughness: 0.82 });
  const slateRoofMat = new THREE.MeshStandardMaterial({ color: 0x3b5878, roughness: 0.48 });
  const goldTrimMat = new THREE.MeshStandardMaterial({ color: 0xe3b94b, metalness: 0.55, roughness: 0.3 });

  // 1. 三層爬升綠坡 + 貼合台地邊緣的石砌護坡環牆（正南階梯中軸留出精準開口，徹底消除橫切或浮空）
  const tiers: Array<{ rTop: number; rBot: number; h: number; y: number; col: number }> = [
    { rTop: 32, rBot: 37, h: 3.2, y: 1.6, col: 0x5c964c },
    { rTop: 23, rBot: 27, h: 3.8, y: 5.1, col: 0x6b9659 },
    { rTop: 15, rBot: 18, h: 4.2, y: 9.1, col: 0x9aa09a },
  ];
  for (const t of tiers) {
    const hill = new THREE.Mesh(
      new THREE.CylinderGeometry(t.rTop, t.rBot, t.h, 28),
      new THREE.MeshStandardMaterial({ color: t.col, roughness: 0.88 })
    );
    hill.position.set(lx, t.y, lz);
    hill.receiveShadow = true;
    lg.add(hill);

    // 護坡石環線：精準計算正南（+Z）階梯開口角度，內縮貼緊台地頂緣且兩端附落地石墩支撐
    const rimRadius = t.rTop - 0.12;
    const halfGap = Math.asin(Math.min(0.62, 4.7 / rimRadius));
    const arc = Math.PI * 2 - halfGap * 2;
    const rimTopY = t.y + t.h / 2;

    const rim = new THREE.Mesh(
      new THREE.TorusGeometry(rimRadius, 0.42, 8, 36, arc),
      stoneWallMat
    );
    rim.rotation.x = Math.PI / 2;
    // TorusGeometry 預設缺口中心在 (π + arc/2)，旋轉 z = 1.5π - arc/2 後缺口精準朝向正南 (+Z)
    rim.rotation.z = Math.PI * 1.5 - arc / 2;
    rim.position.set(lx, rimTopY - 0.18, lz);
    rim.receiveShadow = true;
    lg.add(rim);

    // 護坡環兩端落地支撐石柱，確保與台地穩固錨定
    for (const side of [-1, 1]) {
      const endAng = Math.PI / 2 + side * halfGap;
      const post = new THREE.Mesh(new THREE.CylinderGeometry(0.52, 0.62, 1.35, 10), whiteLimestone);
      post.position.set(lx + Math.cos(endAng) * rimRadius, rimTopY - 0.15, lz + Math.sin(endAng) * rimRadius);
      post.castShadow = true;
      lg.add(post);
    }
  }

  // 2. 人因比例 28 級王城階梯大道（外移至 z = lz+41 → lz+15，完全高出三層山坡斜面不穿模！）
  //    + 實體石砌底座與側牆 + 紅金榮耀中軸地毯 + 白石柱護欄與王室旗幟（InstancedMesh）
  const stepCount = 28;
  const stairStartZ = lz + 41.0;
  const stairEndZ = lz + 15.0;
  const stairRise = 11.2;
  const stairRun = stairStartZ - stairEndZ; // 26.0m

  const stepGeo = new THREE.BoxGeometry(6.8, 0.44, 1.08);
  const stepsInst = new THREE.InstancedMesh(
    stepGeo,
    new THREE.MeshStandardMaterial({ color: 0xe3dcd0, roughness: 0.72 }),
    stepCount
  );
  const carpetGeo = new THREE.BoxGeometry(2.6, 0.46, 1.1);
  const carpetInst = new THREE.InstancedMesh(
    carpetGeo,
    new THREE.MeshStandardMaterial({ color: 0xb52b3b, roughness: 0.8 }),
    stepCount
  );
  const foundationGeo = new THREE.BoxGeometry(7.6, 1, 1.12);
  const foundationInst = new THREE.InstancedMesh(foundationGeo, stoneWallMat, stepCount);
  const balusterGeo = new THREE.CylinderGeometry(0.24, 0.3, 1.5, 8);
  const balustersInst = new THREE.InstancedMesh(balusterGeo, whiteLimestone, 14);
  const flagPoleGeo = new THREE.CylinderGeometry(0.06, 0.08, 3.4, 6);
  const flagPolesInst = new THREE.InstancedMesh(flagPoleGeo, goldTrimMat, 10);
  const flagBannerGeo = new THREE.BoxGeometry(0.1, 1.6, 0.85);
  const flagBannersInst = new THREE.InstancedMesh(
    flagBannerGeo,
    new THREE.MeshStandardMaterial({ color: 0x26549c, roughness: 0.65 }),
    10
  );

  const dummy = new THREE.Object3D();
  for (let s = 0; s < stepCount; s++) {
    const frac = s / (stepCount - 1);
    const topY = 0.4 + frac * (stairRise - 0.4);
    const sy = topY - 0.22;
    const sz = stairStartZ - frac * stairRun;

    dummy.position.set(lx, sy, sz);
    dummy.scale.set(1, 1, 1);
    dummy.rotation.set(0, 0, 0);
    dummy.updateMatrix();
    stepsInst.setMatrixAt(s, dummy.matrix);

    // 紅毯略高出石階表面 0.025m，徹底杜絕閃爍與被吃掉
    dummy.position.set(lx, sy + 0.025, sz);
    dummy.updateMatrix();
    carpetInst.setMatrixAt(s, dummy.matrix);

    // 階梯下方實心石砌基座直達地面 y = 0，消除懸空與視角穿模
    const baseH = Math.max(0.25, topY - 0.18);
    dummy.position.set(lx, baseH / 2, sz);
    dummy.scale.set(1, baseH, 1);
    dummy.updateMatrix();
    foundationInst.setMatrixAt(s, dummy.matrix);
  }

  // 頂部銜接城堡平台的平階與紅毯延伸段
  const topLanding = new THREE.Mesh(
    new THREE.BoxGeometry(7.6, 0.44, 2.2),
    new THREE.MeshStandardMaterial({ color: 0xe3dcd0, roughness: 0.72 })
  );
  topLanding.position.set(lx, 11.0, stairEndZ - 0.9);
  topLanding.receiveShadow = true;
  lg.add(topLanding);
  const topCarpet = new THREE.Mesh(
    new THREE.BoxGeometry(2.6, 0.48, 2.2),
    new THREE.MeshStandardMaterial({ color: 0xb52b3b, roughness: 0.8 })
  );
  topCarpet.position.set(lx, 11.02, stairEndZ - 0.9);
  lg.add(topCarpet);

  let bIdx = 0;
  let fIdx = 0;
  for (let k = 0; k < 7; k++) {
    const frac = k / 6;
    const sy = 1.05 + frac * (stairRise - 0.35);
    const sz = stairStartZ - 0.4 - frac * (stairRun - 0.8);
    for (const side of [-1, 1]) {
      dummy.position.set(lx + side * 3.65, sy, sz);
      dummy.scale.set(1, 1, 1);
      dummy.rotation.set(0, 0, 0);
      dummy.updateMatrix();
      balustersInst.setMatrixAt(bIdx++, dummy.matrix);
      if (k < 5) {
        dummy.position.set(lx + side * 3.65, sy + 2.1, sz);
        dummy.updateMatrix();
        flagPolesInst.setMatrixAt(fIdx, dummy.matrix);
        dummy.position.set(lx + side * 3.65, sy + 2.9, sz + 0.42);
        dummy.updateMatrix();
        flagBannersInst.setMatrixAt(fIdx, dummy.matrix);
        fIdx++;
      }
    }
  }
  for (const inst of [stepsInst, carpetInst, foundationInst, balustersInst, flagPolesInst, flagBannersInst]) {
    inst.instanceMatrix.needsUpdate = true;
    inst.computeBoundingSphere();
  }
  stepsInst.receiveShadow = true;
  foundationInst.receiveShadow = true;
  lg.add(stepsInst, carpetInst, foundationInst, balustersInst, flagPolesInst, flagBannersInst);

  // 3. ★★★ 山頂純白多翼歐洲大城堡（Limeiro_Castle.glb + 純白連橋雙翼＋雙副尖塔＋金色旗桿）★★★
  ctx.models.place(lg, 'Limeiro_Castle.glb', {
    x: lx,
    y: 11.2,
    z: lz - 2,
    targetHeight: 26.5,
    rotY: 0,
  });

  // 左右白色拱廊連翼（消除主堡與副塔之間的空隙）
  for (const side of [-1, 1]) {
    const wing = new THREE.Mesh(new THREE.BoxGeometry(9.2, 8.8, 4.6), whiteLimestone);
    wing.position.set(lx + side * 7.2, 15.6, lz + 1.5);
    wing.castShadow = true;
    lg.add(wing);

    const wingRoof = new THREE.Mesh(new THREE.BoxGeometry(9.6, 1.4, 5.0), slateRoofMat);
    wingRoof.position.set(lx + side * 7.2, 20.6, lz + 1.5);
    lg.add(wingRoof);

    const wingTower = new THREE.Mesh(new THREE.CylinderGeometry(2.3, 2.7, 17.5, 16), whiteLimestone);
    wingTower.position.set(lx + side * 12.2, 19.9, lz + 2.0);
    wingTower.castShadow = true;
    lg.add(wingTower);

    // 副塔窄長發光拱窗
    const winMat = new THREE.MeshBasicMaterial({ color: 0xffe8a3 });
    const win = new THREE.Mesh(new THREE.BoxGeometry(0.65, 2.2, 0.16), winMat);
    win.position.set(lx + side * 12.2, 23.0, lz + 4.55);
    lg.add(win);

    const wingSpire = new THREE.Mesh(new THREE.ConeGeometry(3.05, 8.2, 16), slateRoofMat);
    wingSpire.position.set(lx + side * 12.2, 32.6, lz + 2.0);
    wingSpire.castShadow = true;
    lg.add(wingSpire);

    const finial = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.12, 3.0, 6), goldTrimMat);
    finial.position.set(lx + side * 12.2, 37.8, lz + 2.0);
    lg.add(finial);
  }
  ctx.addCircleCollider({ x: lx, z: lz, r: 21 });

  // 4. ★★★ 密集群聚的紅橘陶瓦山城屋海（10 棟切線對齊 GLB + 18 棟 InstancedMesh 紅橘瓦屋！）★★★
  const glbRing: Array<[number, number, string]> = [
    [-0.75, 28, 'House_1.glb'],
    [-1.18, 28, 'House_2.glb'],
    [-1.62, 27, 'House_3.glb'],
    [0.75, 28, 'House_4.glb'],
    [1.18, 28, 'House_1.glb'],
    [1.62, 27, 'House_2.glb'],
    [-0.95, 19.5, 'House_4.glb'],
    [0.95, 19.5, 'House_1.glb'],
    [-2.15, 20, 'House_2.glb'],
    [2.15, 20, 'House_3.glb'],
  ];
  for (const [ang, dist, file] of glbRing) {
    const hx = lx + Math.sin(ang) * dist;
    const hz = lz + Math.cos(ang) * dist;
    const hy = dist > 24 ? 3.2 : 7.0;
    ctx.models.place(lg, file, { x: hx, y: hy, z: hz, targetHeight: 6.8, rotY: ang });
  }

  // 額外 18 棟 InstancedMesh 紅橘屋頂山城小屋，鋪滿山腰形成動畫級「紅橘屋海」
  const houseCount = 18;
  const hBodyGeo = new THREE.BoxGeometry(3.8, 3.4, 3.4);
  const hRoofGeo = new THREE.ConeGeometry(3.2, 2.5, 4);
  const hBodies = new THREE.InstancedMesh(
    hBodyGeo,
    new THREE.MeshStandardMaterial({ color: 0xf2e8d5, roughness: 0.8 }),
    houseCount
  );
  const hRoofs = new THREE.InstancedMesh(
    hRoofGeo,
    new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.68 }),
    houseCount
  );
  const roofPalette = [0xc85a32, 0xd97236, 0xb84a2c, 0xd16230];
  const tmpColor = new THREE.Color();
  for (let i = 0; i < houseCount; i++) {
    const tier2 = i >= 10;
    const frac = tier2 ? (i - 10) / 8 : i / 10;
    // 避開正前方階梯中軸（ang ≈ 0）
    const ang = 0.42 + frac * (Math.PI * 2 - 0.84);
    const rad = tier2 ? 19.8 : 28.5;
    const hy = tier2 ? 7.0 : 3.2;
    const hx = lx + Math.sin(ang) * rad;
    const hz = lz + Math.cos(ang) * rad;

    dummy.position.set(hx, hy + 1.7, hz);
    dummy.scale.set(1, 1, 1);
    dummy.rotation.set(0, ang + (i % 3 - 1) * 0.15, 0);
    dummy.updateMatrix();
    hBodies.setMatrixAt(i, dummy.matrix);

    dummy.position.set(hx, hy + 4.55, hz);
    dummy.rotation.set(0, ang + Math.PI / 4 + (i % 3 - 1) * 0.15, 0);
    dummy.updateMatrix();
    hRoofs.setMatrixAt(i, dummy.matrix);

    tmpColor.setHex(roofPalette[i % roofPalette.length]);
    hRoofs.setColorAt(i, tmpColor);
  }
  hBodies.instanceMatrix.needsUpdate = true;
  hRoofs.instanceMatrix.needsUpdate = true;
  if (hRoofs.instanceColor) hRoofs.instanceColor.needsUpdate = true;
  hBodies.computeBoundingSphere();
  hRoofs.computeBoundingSphere();
  hBodies.castShadow = true;
  hRoofs.castShadow = true;
  lg.add(hBodies, hRoofs);

  // 5. 山腳石造凱旋拱門銘牌 + 雕花破關方尖碑 + 王城衛兵 NPC（對齊外移後的階梯入口）
  const archGroup = new THREE.Group();
  archGroup.position.set(lx, 0, lz + 43.2);
  for (const sx of [-4.6, 4.6]) {
    const pillar = new THREE.Mesh(new THREE.BoxGeometry(1.4, 6.8, 1.4), whiteLimestone);
    pillar.position.set(sx, 3.4, 0);
    pillar.castShadow = true;
    archGroup.add(pillar);
  }
  const archPlaque = createRoyalStonePlaque('CAPITAL LIMEIRO', '首都・利梅洛（杜恩與李斯特之城）');
  archPlaque.scale.setScalar(0.84);
  archPlaque.position.set(0, 7.6, 0);
  archGroup.add(archPlaque);
  lg.add(archGroup);

  // 雕花方尖碑（取代純金色方塊）
  const obeliskBase = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.9, 2.2), whiteLimestone);
  obeliskBase.position.set(lx + 6.5, 0.45, lz + 42.8);
  lg.add(obeliskBase);
  const obeliskShaft = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.78, 3.6, 4), whiteLimestone);
  obeliskShaft.rotation.y = Math.PI / 4;
  obeliskShaft.position.set(lx + 6.5, 2.7, lz + 42.8);
  lg.add(obeliskShaft);
  const obeliskTip = new THREE.Mesh(new THREE.ConeGeometry(0.48, 0.9, 4), goldTrimMat);
  obeliskTip.rotation.y = Math.PI / 4;
  obeliskTip.position.set(lx + 6.5, 4.95, lz + 42.8);
  lg.add(obeliskTip);

  const royalGuard = ctx.createNpcMesh(0x26549c, 0xffe0bd, 0xd9d2c3);
  royalGuard.position.set(lx - 5.2, 0, lz + 44.0);
  lg.add(royalGuard);

  ctx.addInteractable({
    id: 'sign_limeiro',
    label: '仰望「首都・利梅洛」破關石碑與王城衛兵',
    position: new THREE.Vector3(lx + 6.5, 0, lz + 42.8),
    radius: 5.0,
    kind: 'sign',
  });

  return lg;
}
