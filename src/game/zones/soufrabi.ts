import * as THREE from 'three';
import { ModelLibrary } from '../assets';

export interface SoufrabiBuildContext {
  models: ModelLibrary;
  createNpcMesh: (clothColor: number, skinColor: number, hairColor: number) => THREE.Group;
  addAnimated: (fn: (t: number, dt: number) => void) => void;
  addCircleCollider: (c: { x: number; z: number; r: number }) => void;
  addBoxCollider: (b: { minX: number; maxX: number; minZ: number; maxZ: number }) => void;
  addInteractable: (item: {
    id: string;
    label: string;
    position: THREE.Vector3;
    radius: number;
    kind: 'npc' | 'portal' | 'shop' | 'pickup' | 'sign' | 'interior_enter' | 'interior_exit';
    interiorId?: string;
  }) => void;
}

function createBoardwalkPlankTexture(repeatX: number, repeatY: number): THREE.CanvasTexture {
  const size = 256;
  const c = document.createElement('canvas');
  c.width = size;
  c.height = size;
  const ctx = c.getContext('2d')!;

  ctx.fillStyle = '#6f5136';
  ctx.fillRect(0, 0, size, size);

  let seed = 6611;
  const rand = () => {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  };

  const plankH = 32;
  for (let y = 0; y < size; y += plankH) {
    const shade = Math.floor((rand() - 0.5) * 28);
    ctx.fillStyle = `rgb(${156 + shade}, ${118 + Math.floor(shade * 0.8)}, ${78 + Math.floor(shade * 0.6)})`;
    ctx.fillRect(0, y + 2, size, plankH - 3);
    // 木紋細線
    ctx.fillStyle = 'rgba(62, 40, 22, 0.16)';
    for (let g = 0; g < 3; g++) {
      ctx.fillRect(0, y + 6 + g * 8, size, 1.5);
    }
    // 木板橫向接縫與鐵釘頭
    const joint = Math.floor(rand() * size);
    ctx.fillStyle = '#3d2817';
    ctx.fillRect(joint, y, 2.5, plankH);
    ctx.fillStyle = '#261b12';
    ctx.fillRect(joint - 7, y + 8, 3, 3);
    ctx.fillRect(joint - 7, y + plankH - 11, 3, 3);
    ctx.fillRect(joint + 6, y + 8, 3, 3);
    ctx.fillRect(joint + 6, y + plankH - 11, 3, 3);
  }

  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(repeatX, repeatY);
  tex.anisotropy = 4;
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function createFortressStoneTexture(): THREE.CanvasTexture {
  const size = 256;
  const c = document.createElement('canvas');
  c.width = size;
  c.height = size;
  const ctx = c.getContext('2d')!;
  ctx.fillStyle = '#4e5662';
  ctx.fillRect(0, 0, size, size);

  let seed = 8803;
  const rand = () => {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  };
  const rows = 8;
  const cols = 4;
  const rh = size / rows;
  const cw = size / cols;
  for (let r = 0; r < rows; r++) {
    const off = (r % 2) * (cw * 0.5);
    for (let col = -1; col <= cols; col++) {
      const s = Math.floor((rand() - 0.5) * 28);
      ctx.fillStyle = `rgb(${112 + s}, ${120 + s}, ${130 + s})`;
      ctx.fillRect(col * cw + off + 2, r * rh + 2, cw - 4, rh - 4);
    }
  }
  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(3, 2);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function createPirateFlagTexture(): THREE.CanvasTexture {
  const c = document.createElement('canvas');
  c.width = 256;
  c.height = 144;
  const ctx = c.getContext('2d')!;

  ctx.fillStyle = '#181a22';
  ctx.fillRect(0, 0, 256, 144);
  ctx.strokeStyle = '#c93838';
  ctx.lineWidth = 6;
  ctx.strokeRect(6, 6, 244, 132);

  // 交叉雙骨
  ctx.strokeStyle = '#efe9d8';
  ctx.lineWidth = 10;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(84, 38);
  ctx.lineTo(172, 108);
  ctx.moveTo(172, 38);
  ctx.lineTo(84, 108);
  ctx.stroke();

  // 骷髏頭與眼眶
  ctx.fillStyle = '#f5f1e4';
  ctx.beginPath();
  ctx.arc(128, 64, 24, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillRect(114, 78, 28, 16);
  ctx.fillStyle = '#181a22';
  ctx.beginPath();
  ctx.arc(118, 64, 6, 0, Math.PI * 2);
  ctx.arc(138, 64, 6, 0, Math.PI * 2);
  ctx.fill();

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function createWeatheredWoodSign(title: string, subtitle: string): THREE.Mesh {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 160;
  const ctx = canvas.getContext('2d')!;

  // 舊化深木海港牌匾底紋
  ctx.fillStyle = '#3b2618';
  ctx.fillRect(0, 0, 512, 160);
  ctx.fillStyle = '#4a3120';
  for (let y = 16; y < 160; y += 26) {
    ctx.fillRect(0, y, 512, 4);
  }
  ctx.strokeStyle = '#d4a656';
  ctx.lineWidth = 10;
  ctx.strokeRect(8, 8, 496, 144);
  ctx.strokeStyle = '#8c6239';
  ctx.lineWidth = 3;
  ctx.strokeRect(18, 18, 476, 124);

  ctx.textAlign = 'center';
  ctx.fillStyle = '#ffe9b0';
  ctx.font = 'bold 38px sans-serif';
  ctx.fillText(title, 256, 74);

  ctx.fillStyle = '#e0c088';
  ctx.font = 'bold 25px sans-serif';
  ctx.fillText(subtitle, 256, 122);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return new THREE.Mesh(
    new THREE.BoxGeometry(7.2, 2.25, 0.3),
    new THREE.MeshStandardMaterial({ map: tex, roughness: 0.78 })
  );
}

function createBayWaterTexture(): THREE.CanvasTexture {
  const size = 256;
  const c = document.createElement('canvas');
  c.width = size;
  c.height = size;
  const ctx = c.getContext('2d')!;

  ctx.fillStyle = '#1ca3de';
  ctx.fillRect(0, 0, size, size);

  let seed = 3197;
  const rand = () => {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  };

  for (let i = 0; i < 90; i++) {
    const x = rand() * size;
    const y = rand() * size;
    const w = 18 + rand() * 34;
    const h = 3 + rand() * 4;
    ctx.fillStyle = rand() > 0.35 ? 'rgba(180, 238, 255, 0.28)' : 'rgba(12, 92, 138, 0.22)';
    ctx.beginPath();
    ctx.ellipse(x, y, w * 0.5, h * 0.5, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(7, 9);
  tex.anisotropy = 4;
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export function buildSoufrabiZone(ctx: SoufrabiBuildContext): THREE.Group {
  const sg = new THREE.Group();
  const sx = 64;
  const sz = -30;

  const woodDark = new THREE.MeshStandardMaterial({ color: 0x5c3e26, roughness: 0.9 });
  const woodWet = new THREE.MeshStandardMaterial({ color: 0x382518, roughness: 0.78 });
  const boardwalkMat = new THREE.MeshStandardMaterial({
    map: createBoardwalkPlankTexture(8, 12),
    roughness: 0.9,
  });
  const pierPlankMat = new THREE.MeshStandardMaterial({
    map: createBoardwalkPlankTexture(7, 2),
    roughness: 0.88,
  });
  const cliffRockMat = new THREE.MeshStandardMaterial({ color: 0x4b5563, roughness: 0.94, flatShading: true });
  const stoneFortMat = new THREE.MeshStandardMaterial({
    map: createFortressStoneTexture(),
    roughness: 0.88,
  });
  const darkIronMat = new THREE.MeshStandardMaterial({ color: 0x22262e, metalness: 0.55, roughness: 0.42 });

  // 1. 海港日曬木板主廣場（手繪木板拼縫與鐵釘質感，頂面 y = 0.28）
  const boardwalk = new THREE.Mesh(new THREE.BoxGeometry(38, 0.28, 52), boardwalkMat);
  boardwalk.position.set(sx, 0.14, sz);
  boardwalk.receiveShadow = true;
  sg.add(boardwalk);

  // 1b. 東側海灣清澈蔚藍水面（略高於 y = 0 地面、低於 y = 0.28 木棧板）與淡白岸邊浪花
  const bayDeepMat = new THREE.MeshStandardMaterial({
    color: 0x0d5c8a,
    roughness: 0.45,
    transparent: true,
    opacity: 0.92,
  });
  const bayDeep = new THREE.Mesh(new THREE.PlaneGeometry(72, 92), bayDeepMat);
  bayDeep.rotation.x = -Math.PI / 2;
  bayDeep.position.set(sx + 51.5, 0.05, sz - 2);
  bayDeep.receiveShadow = true;
  sg.add(bayDeep);

  const bayWaterTex = createBayWaterTexture();
  const bayWaterMat = new THREE.MeshStandardMaterial({
    map: bayWaterTex,
    color: 0x28b5ec,
    emissive: 0x0b486b,
    emissiveIntensity: 0.2,
    roughness: 0.18,
    metalness: 0.12,
    transparent: true,
    opacity: 0.74,
  });
  const bayWater = new THREE.Mesh(new THREE.PlaneGeometry(72, 92), bayWaterMat);
  bayWater.rotation.x = -Math.PI / 2;
  bayWater.position.set(sx + 51.5, 0.09, sz - 2);
  bayWater.receiveShadow = true;
  sg.add(bayWater);

  // 岸邊淡白浪花條帶（緊貼木棧道東緣與海崖礁岩外側）
  const foamMat = new THREE.MeshBasicMaterial({
    color: 0xeefaff,
    transparent: true,
    opacity: 0.72,
    side: THREE.DoubleSide,
  });
  const shoreFoamMain = new THREE.Mesh(new THREE.PlaneGeometry(1.15, 52), foamMat);
  shoreFoamMain.rotation.x = -Math.PI / 2;
  shoreFoamMain.position.set(sx + 19.65, 0.115, sz);
  sg.add(shoreFoamMain);

  const shoreFoamOuter = new THREE.Mesh(new THREE.PlaneGeometry(0.55, 50), foamMat);
  shoreFoamOuter.rotation.x = -Math.PI / 2;
  shoreFoamOuter.position.set(sx + 21.1, 0.112, sz);
  sg.add(shoreFoamOuter);

  const cliffFoam = new THREE.Mesh(new THREE.RingGeometry(6.8, 7.9, 24, 1, -Math.PI * 0.55, Math.PI * 1.1), foamMat);
  cliffFoam.rotation.x = -Math.PI / 2;
  cliffFoam.position.set(sx + 13.5, 0.115, sz - 22);
  sg.add(cliffFoam);

  // 港灣暖光點光源
  const harborLight = new THREE.PointLight(0xffcb80, 1.8, 46, 1.4);
  harborLight.position.set(sx + 4, 9.5, sz);
  sg.add(harborLight);

  // 2. 西側舊化木造海港牌樓（SOUFRABI PORT）
  const arch = new THREE.Group();
  arch.position.set(sx - 19, 0.2, sz);
  arch.rotation.y = Math.PI / 2;
  for (const px of [-4.4, 4.4]) {
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.58, 7.6, 10), woodDark);
    post.position.set(px, 3.8, 0);
    post.castShadow = true;
    arch.add(post);
  }
  const crossBeam = new THREE.Mesh(new THREE.BoxGeometry(10.8, 0.72, 0.78), woodDark);
  crossBeam.position.set(0, 7.4, 0);
  arch.add(crossBeam);
  const archSign = createWeatheredWoodSign('SOUFRABI PORT', '海濱都市・壽富拉比');
  archSign.scale.setScalar(0.68);
  archSign.position.set(0, 9.0, 0);
  arch.add(archSign);
  sg.add(arch);

  // 3. 延伸入海木樁棧橋（頂面與主木棧平台齊平 y = 0.28，含接縫壓條、水線濕潤木樁、繫船柱與提燈）
  const pier = new THREE.Mesh(new THREE.BoxGeometry(22.4, 0.28, 6.0), pierPlankMat);
  pier.position.set(sx + 30.1, 0.14, sz + 4);
  pier.castShadow = true;
  pier.receiveShadow = true;
  sg.add(pier);

  // 平台與棧橋接縫壓條（平順過渡無高低落差）
  const pierJointStrip = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.02, 6.12), woodDark);
  pierJointStrip.position.set(sx + 19.0, 0.285, sz + 4);
  pierJointStrip.receiveShadow = true;
  sg.add(pierJointStrip);

  const pilingGeo = new THREE.CylinderGeometry(0.28, 0.34, 3.6, 8);
  const pilings = new THREE.InstancedMesh(pilingGeo, woodWet, 14);
  const bollardGeo = new THREE.CylinderGeometry(0.24, 0.28, 0.72, 10);
  const bollards = new THREE.InstancedMesh(bollardGeo, darkIronMat, 8);
  const lampPostGeo = new THREE.CylinderGeometry(0.09, 0.13, 3.2, 8);
  const lampPosts = new THREE.InstancedMesh(lampPostGeo, darkIronMat, 6);
  const lampBulbGeo = new THREE.SphereGeometry(0.28, 10, 8);
  const lampBulbs = new THREE.InstancedMesh(
    lampBulbGeo,
    new THREE.MeshBasicMaterial({ color: 0xffe49e }),
    6
  );

  const dummy = new THREE.Object3D();
  let pIdx = 0;
  let bIdx = 0;
  let lIdx = 0;
  for (let i = 0; i < 7; i++) {
    const px = sx + 19.4 + i * 3.55;
    for (const pz of [sz + 1.1, sz + 6.9]) {
      dummy.position.set(px, -0.58, pz);
      dummy.scale.set(1, 1, 1);
      dummy.rotation.set(0, 0, 0);
      dummy.updateMatrix();
      pilings.setMatrixAt(pIdx++, dummy.matrix);
    }
    if (i % 2 === 0 && bIdx < 8) {
      for (const pz of [sz + 1.35, sz + 6.65]) {
        dummy.position.set(px, 0.62, pz);
        dummy.updateMatrix();
        bollards.setMatrixAt(bIdx++, dummy.matrix);
      }
    }
    if (i % 2 === 1 && lIdx < 6) {
      for (const pz of [sz + 1.3, sz + 6.7]) {
        dummy.position.set(px, 1.85, pz);
        dummy.updateMatrix();
        lampPosts.setMatrixAt(lIdx, dummy.matrix);
        dummy.position.set(px, 3.55, pz);
        dummy.updateMatrix();
        lampBulbs.setMatrixAt(lIdx, dummy.matrix);
        lIdx++;
      }
    }
  }
  for (const inst of [pilings, bollards, lampPosts, lampBulbs]) {
    inst.instanceMatrix.needsUpdate = true;
    inst.computeBoundingSphere();
  }
  sg.add(pilings, bollards, lampPosts, lampBulbs);

  // 港口倉庫與貨物道具（CC0 GLB）
  ctx.models.place(sg, 'Soufrabi_Port.glb', { x: sx + 14, y: 0.28, z: sz - 8, targetHeight: 11.0, rotY: -Math.PI / 2 });
  ctx.models.place(sg, 'Barrel.glb', { x: sx + 37, y: 0.28, z: sz + 2.2, targetHeight: 1.15 });
  ctx.models.place(sg, 'Barrel.glb', { x: sx + 38.4, y: 0.28, z: sz + 3.0, targetHeight: 1.15 });
  ctx.models.place(sg, 'Cart.glb', { x: sx + 7, y: 0.28, z: sz - 5, targetHeight: 2.2, rotY: 0.5 });
  ctx.models.place(sg, 'Bench_1.glb', { x: sx - 3, y: 0.28, z: sz - 4, targetHeight: 0.65 });
  ctx.addCircleCollider({ x: sx + 14, z: sz - 8, r: 5.0 });

  // 停泊於東側海灣水面（y = 0.09）微吃水漂浮的海盜大帆船 & 海岸帆船
  const pirateShipWrap = new THREE.Group();
  pirateShipWrap.position.set(sx + 46, -0.18, sz + 8);
  sg.add(pirateShipWrap);
  ctx.models.place(pirateShipWrap, 'Pirate_Ship.glb', { x: 0, y: 0, z: 0, targetHeight: 17.5, rotY: -0.35 });

  const sailboatWrap = new THREE.Group();
  sailboatWrap.position.set(sx + 38, -0.1, sz - 24);
  sg.add(sailboatWrap);
  ctx.models.place(sailboatWrap, 'Sailboat.glb', { x: 0, y: 0, z: 0, targetHeight: 11.2, rotY: 0.55 });

  ctx.addAnimated((t) => {
    pirateShipWrap.position.y = -0.18 + Math.sin(t * 1.4) * 0.08;
    pirateShipWrap.rotation.z = Math.sin(t * 1.1) * 0.032;
    sailboatWrap.position.y = -0.1 + Math.cos(t * 1.7) * 0.06;
    sailboatWrap.rotation.z = Math.cos(t * 1.3) * 0.035;
    bayWaterTex.offset.x = (t * 0.025) % 1;
    bayWaterTex.offset.y = Math.sin(t * 0.4) * 0.03;
    shoreFoamMain.position.x = sx + 19.65 + Math.sin(t * 1.8) * 0.16;
    shoreFoamOuter.position.x = sx + 21.1 + Math.cos(t * 1.5) * 0.22;
    foamMat.opacity = 0.58 + Math.sin(t * 2.1) * 0.14;
  });

  // 4. ★★★ 海崖多層石造燈塔要塞（磊札海盜團基地）★★★
  const lhGroup = new THREE.Group();
  lhGroup.position.set(sx + 12, 0, sz - 22);

  // 嶙峋深灰礁岩海崖底座（5 塊交錯巨岩構成真實海岸懸崖）
  const cliffOffsets: Array<[number, number, number, number, number]> = [
    [0, 2.0, 0, 7.6, 4.4],
    [-4.8, 1.5, 2.2, 4.2, 3.4],
    [4.4, 1.4, -2.5, 4.4, 3.2],
    [-2.5, 1.2, -4.5, 3.8, 2.8],
    [3.8, 1.3, 3.6, 3.6, 3.0],
  ];
  for (const [cx, cy, cz, cr, ch] of cliffOffsets) {
    const rock = new THREE.Mesh(new THREE.DodecahedronGeometry(cr, 0), cliffRockMat);
    rock.scale.set(1.0, ch / cr, 0.95);
    rock.position.set(cx, cy, cz);
    rock.rotation.set(cx * 0.2, cz * 0.3, 0);
    rock.castShadow = true;
    rock.receiveShadow = true;
    lhGroup.add(rock);
  }

  // 雙層石造要塞堡壘（附頂部城垛與側翼哨塔）
  const fort1 = new THREE.Mesh(new THREE.BoxGeometry(11.6, 4.4, 9.8), stoneFortMat);
  fort1.position.y = 5.4;
  fort1.castShadow = true;
  lhGroup.add(fort1);

  // 石堡頂部城垛（InstancedMesh）
  const merlonGeo = new THREE.BoxGeometry(1.1, 0.9, 0.9);
  const merlons = new THREE.InstancedMesh(merlonGeo, stoneFortMat, 16);
  let mIdx = 0;
  for (const mx of [-5.2, -2.6, 0, 2.6, 5.2]) {
    for (const mz of [-4.4, 4.4]) {
      dummy.position.set(mx, 8.05, mz);
      dummy.scale.set(1, 1, 1);
      dummy.rotation.set(0, 0, 0);
      dummy.updateMatrix();
      merlons.setMatrixAt(mIdx++, dummy.matrix);
    }
  }
  for (const mz of [-2.2, 0, 2.2]) {
    for (const mx of [-5.3, 5.3]) {
      dummy.position.set(mx, 8.05, mz);
      dummy.updateMatrix();
      merlons.setMatrixAt(mIdx++, dummy.matrix);
    }
  }
  merlons.instanceMatrix.needsUpdate = true;
  merlons.computeBoundingSphere();
  lhGroup.add(merlons);

  const fort2 = new THREE.Mesh(new THREE.BoxGeometry(7.6, 3.2, 7.2), stoneFortMat);
  fort2.position.y = 9.2;
  lhGroup.add(fort2);

  // 側翼圓哨塔＋尖頂
  const sideTower = new THREE.Mesh(new THREE.CylinderGeometry(1.65, 1.95, 11.2, 12), stoneFortMat);
  sideTower.position.set(-5.6, 8.2, 3.2);
  sideTower.castShadow = true;
  lhGroup.add(sideTower);
  const sideRoof = new THREE.Mesh(new THREE.ConeGeometry(2.2, 3.2, 12), darkIronMat);
  sideRoof.position.set(-5.6, 15.3, 3.2);
  lhGroup.add(sideRoof);

  // 6 節紅白條紋燈塔主體
  const whiteMat = new THREE.MeshStandardMaterial({ color: 0xf5f5f0, roughness: 0.56 });
  const redMat = new THREE.MeshStandardMaterial({ color: 0xc93838, roughness: 0.56 });
  for (let i = 0; i < 6; i++) {
    const seg = new THREE.Mesh(
      new THREE.CylinderGeometry(2.6 - i * 0.18, 2.8 - i * 0.18, 3.1, 18),
      i % 2 === 0 ? whiteMat : redMat
    );
    seg.position.y = 10.8 + 1.55 + i * 3.1;
    seg.castShadow = true;
    lhGroup.add(seg);
  }

  // 黑色鑄鐵觀景陽台 + 燈室 + 圓頂 + 雙向旋轉探照光束
  const gallery = new THREE.Mesh(new THREE.CylinderGeometry(2.45, 2.1, 0.45, 18), darkIronMat);
  gallery.position.y = 29.6;
  lhGroup.add(gallery);

  const lantern = new THREE.Mesh(
    new THREE.CylinderGeometry(1.6, 1.6, 2.4, 16),
    new THREE.MeshBasicMaterial({ color: 0xfff3b0 })
  );
  lantern.position.y = 31.0;
  lhGroup.add(lantern);

  const lanternCap = new THREE.Mesh(new THREE.ConeGeometry(2.25, 2.8, 16), redMat);
  lanternCap.position.y = 33.6;
  lhGroup.add(lanternCap);

  const beamPivot = new THREE.Group();
  beamPivot.position.y = 31.0;
  for (const dir of [-1, 1]) {
    const beam = new THREE.Mesh(
      new THREE.ConeGeometry(3.6, 34, 16, 1, true),
      new THREE.MeshBasicMaterial({ color: 0xfff3b0, transparent: true, opacity: 0.16, side: THREE.DoubleSide })
    );
    beam.rotation.z = dir * (Math.PI / 2);
    beam.position.set(dir * 17, 0, 0);
    beamPivot.add(beam);
  }
  lhGroup.add(beamPivot);
  ctx.addAnimated((t) => {
    beamPivot.rotation.y = t * 0.85;
  });

  sg.add(lhGroup);
  ctx.addCircleCollider({ x: sx + 12, z: sz - 22, r: 7.4 });

  // 5. ★★★ 宏偉深藍海盜據點／室內體育館外觀（放大 1.45×，進門按 E 傳送至獨立室內躲避球館！）★★★
  const pirateBase = new THREE.Group();
  pirateBase.position.set(sx - 10.5, 0.28, sz - 12.5);

  const pbBody = new THREE.Mesh(
    new THREE.BoxGeometry(13.6, 8.6, 11.4),
    new THREE.MeshStandardMaterial({ color: 0x223a63, roughness: 0.72 })
  );
  pbBody.position.y = 4.3;
  pbBody.castShadow = true;
  pbBody.receiveShadow = true;
  pirateBase.add(pbBody);

  const pbRoof = new THREE.Mesh(
    new THREE.ConeGeometry(10.8, 6.8, 4),
    new THREE.MeshStandardMaterial({ color: 0x152440, roughness: 0.62 })
  );
  pbRoof.rotation.y = Math.PI / 4;
  pbRoof.position.y = 11.9;
  pbRoof.castShadow = true;
  pirateBase.add(pbRoof);

  // 發光圓形舷窗＋厚實門廊＋顯眼拱門入口門框、階梯台階與暖色入口燈光（標示室內體育館入口）
  const winGlow = new THREE.MeshBasicMaterial({ color: 0xffdf8e });
  const goldTrimMat = new THREE.MeshStandardMaterial({ color: 0xe2b355, roughness: 0.4, metalness: 0.48 });
  const stepStoneMat = new THREE.MeshStandardMaterial({ color: 0xc9bfa8, roughness: 0.78 });

  for (const wz of [-3.6, 3.6]) {
    const portWin = new THREE.Mesh(new THREE.CircleGeometry(0.85, 16), winGlow);
    portWin.position.set(6.85, 5.8, wz);
    portWin.rotation.y = Math.PI / 2;
    pirateBase.add(portWin);
  }
  // 朝向鎮內廣場南側補上發光舷窗與方向導引牌
  for (const wx of [-3.4, 3.4]) {
    const southWin = new THREE.Mesh(new THREE.CircleGeometry(0.82, 16), winGlow);
    southWin.position.set(wx, 5.4, 5.74);
    pirateBase.add(southWin);
  }
  const southGuideSign = createWeatheredWoodSign("RAZOR'S GYM →", '磊札室內體育館入口（東側大門）');
  southGuideSign.scale.setScalar(0.58);
  southGuideSign.position.set(0, 3.1, 5.86);
  pirateBase.add(southGuideSign);

  // 東側主入口雨棚與雙門廊支撐柱
  const porchRoof = new THREE.Mesh(new THREE.BoxGeometry(3.4, 0.34, 6.8), woodDark);
  porchRoof.position.set(8.0, 5.15, 0);
  porchRoof.rotation.z = -0.15;
  porchRoof.castShadow = true;
  pirateBase.add(porchRoof);

  for (const pz of [-2.85, 2.85]) {
    const porchPost = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.3, 4.9, 10), woodDark);
    porchPost.position.set(9.1, 2.45, pz);
    porchPost.castShadow = true;
    pirateBase.add(porchPost);

    const postBase = new THREE.Mesh(new THREE.BoxGeometry(0.75, 0.42, 0.75), stepStoneMat);
    postBase.position.set(9.1, 0.21, pz);
    pirateBase.add(postBase);

    // 入口暖光吊燈
    const lanternGlass = new THREE.Mesh(
      new THREE.CylinderGeometry(0.26, 0.22, 0.56, 8),
      new THREE.MeshBasicMaterial({ color: 0xffe8a6 })
    );
    lanternGlass.position.set(9.1, 4.3, pz * 0.88);
    pirateBase.add(lanternGlass);
    const lanternTop = new THREE.Mesh(new THREE.ConeGeometry(0.36, 0.28, 8), darkIronMat);
    lanternTop.position.set(9.1, 4.7, pz * 0.88);
    pirateBase.add(lanternTop);
  }

  // 顯眼金邊拱門入口門框（圓拱＋左右立柱）
  const archPortal = new THREE.Mesh(new THREE.TorusGeometry(2.25, 0.34, 12, 24, Math.PI), goldTrimMat);
  archPortal.rotation.y = Math.PI / 2;
  archPortal.position.set(6.92, 2.35, 0);
  pirateBase.add(archPortal);

  for (const pz of [-2.25, 2.25]) {
    const archPillar = new THREE.Mesh(new THREE.BoxGeometry(0.68, 2.55, 0.68), goldTrimMat);
    archPillar.position.set(6.92, 1.28, pz);
    pirateBase.add(archPillar);
  }

  // 溫暖發光的拱門室內通道背景＋微敞開的雙開厚重木門
  const doorWarmRect = new THREE.Mesh(new THREE.PlaneGeometry(4.1, 2.35), winGlow);
  doorWarmRect.rotation.y = Math.PI / 2;
  doorWarmRect.position.set(6.88, 1.25, 0);
  pirateBase.add(doorWarmRect);

  const doorWarmArch = new THREE.Mesh(new THREE.CircleGeometry(2.05, 24, 0, Math.PI), winGlow);
  doorWarmArch.rotation.y = Math.PI / 2;
  doorWarmArch.position.set(6.88, 2.35, 0);
  pirateBase.add(doorWarmArch);

  for (const side of [-1, 1]) {
    const leaf = new THREE.Mesh(new THREE.BoxGeometry(0.24, 3.2, 1.55), woodDark);
    leaf.position.set(7.28, 1.72, side * 1.85);
    leaf.rotation.y = side * 0.42;
    pirateBase.add(leaf);
  }

  // 三階入口石質階梯台階（自然銜接木棧道廣場）
  const stepWidths = [5.4, 5.8, 6.2];
  for (let i = 0; i < 3; i++) {
    const step = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.16, stepWidths[i]), stepStoneMat);
    step.position.set(7.15 + i * 0.56, 0.38 - i * 0.14, 0);
    step.receiveShadow = true;
    pirateBase.add(step);
  }

  // 入口專屬暖色點光源，照亮拱門、階梯與招牌
  const entranceLight = new THREE.PointLight(0xffcf78, 2.8, 22, 1.35);
  entranceLight.position.set(9.2, 4.1, 0);
  pirateBase.add(entranceLight);

  // 門口地上翡翠傳送入口光環提示
  const doorRing = new THREE.Mesh(
    new THREE.RingGeometry(1.15, 1.5, 28),
    new THREE.MeshBasicMaterial({ color: 0x38e4c5, side: THREE.DoubleSide, transparent: true, opacity: 0.8 })
  );
  doorRing.rotation.x = -Math.PI / 2;
  doorRing.position.set(9.5, 0.08, 0);
  pirateBase.add(doorRing);

  // 屋頂海盜旗桿與飄揚骷髏海盜旗
  const flagPole = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.12, 4.8, 8), darkIronMat);
  flagPole.position.set(0, 17.2, 0);
  pirateBase.add(flagPole);
  const pirateFlagPivot = new THREE.Group();
  pirateFlagPivot.position.set(0, 18.6, 0);
  const pirateFlag = new THREE.Mesh(
    new THREE.PlaneGeometry(3.4, 1.85),
    new THREE.MeshStandardMaterial({
      map: createPirateFlagTexture(),
      roughness: 0.86,
      side: THREE.DoubleSide,
    })
  );
  pirateFlag.position.set(1.7, 0, 0);
  pirateFlagPivot.add(pirateFlag);
  pirateBase.add(pirateFlagPivot);
  ctx.addAnimated((t) => {
    pirateFlagPivot.rotation.y = Math.sin(t * 2.6) * 0.22;
    doorRing.scale.setScalar(1 + Math.sin(t * 2.8) * 0.06);
  });

  const pbSign = createWeatheredWoodSign("PIRATES' ARENA", '海盜據點・磊札室內體育館 [按E進入]');
  pbSign.scale.setScalar(0.76);
  pbSign.position.set(7.4, 7.25, 0);
  pbSign.rotation.y = Math.PI / 2;
  pirateBase.add(pbSign);

  sg.add(pirateBase);
  ctx.addBoxCollider({ minX: sx - 17.5, maxX: sx - 3.4, minZ: sz - 18.4, maxZ: sz - 6.6 });

  // 按 E 傳送進入獨立室內空間「壽富拉比・磊札室內排球／躲避球館」
  ctx.addInteractable({
    id: 'enter_razor_gym',
    label: '推開海盜據點大門 → 進入「磊札室內體育館（排球／躲避球決戰）」',
    position: new THREE.Vector3(sx - 1.2, 0, sz - 12.5),
    radius: 4.5,
    kind: 'interior_enter',
    interiorId: 'razor_gym',
  });

  // 6. 乾淨開闊的海濱漁村市集與觀海休憩廣場（取代原本露天碼頭球場，還原港灣海風空間感）
  ctx.models.place(sg, 'Gazebo.glb', { x: sx - 4, y: 0.28, z: sz + 11, targetHeight: 5.2, rotY: 0.3 });
  ctx.models.place(sg, 'MarketStand_1.glb', { x: sx - 11, y: 0.28, z: sz + 8, targetHeight: 3.3, rotY: 0.8 });
  ctx.models.place(sg, 'MarketStand_2.glb', { x: sx - 11, y: 0.28, z: sz + 16, targetHeight: 3.3, rotY: 1.1 });
  ctx.models.place(sg, 'Bench_1.glb', { x: sx + 5, y: 0.28, z: sz + 14, targetHeight: 0.65, rotY: -Math.PI / 2 });
  ctx.models.place(sg, 'Barrel.glb', { x: sx + 7.5, y: 0.28, z: sz + 10, targetHeight: 1.1 });
  ctx.addCircleCollider({ x: sx - 4, z: sz + 11, r: 2.6 });
  ctx.addCircleCollider({ x: sx - 11, z: sz + 8, r: 1.8 });
  ctx.addCircleCollider({ x: sx - 11, z: sz + 16, r: 1.8 });

  return sg;
}
