import * as THREE from 'three';
import { ModelLibrary } from '../assets';

export interface BadlandsBuildContext {
  models: ModelLibrary;
  addAnimated: (fn: (t: number, dt: number) => void) => void;
  addCircleCollider: (c: { x: number; z: number; r: number }) => void;
  addCameraOccluder?: (obj: THREE.Object3D) => void;
}

function createStratifiedRockTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  // 2011 動畫灰藍與赭土交錯的水平分層沉積岩紋理
  const bands: Array<{ h: number; color: string }> = [
    { h: 52, color: '#435568' },
    { h: 28, color: '#5b6f82' },
    { h: 22, color: '#8e785e' },
    { h: 64, color: '#4a5d70' },
    { h: 34, color: '#64778a' },
    { h: 18, color: '#9c8365' },
    { h: 56, color: '#3e4f61' },
    { h: 42, color: '#55687a' },
    { h: 24, color: '#877158' },
    { h: 72, color: '#4c5f73' },
    { h: 36, color: '#617487' },
    { h: 64, color: '#3c4c5c' },
  ];

  let y = 0;
  for (const b of bands) {
    ctx.fillStyle = b.color;
    ctx.fillRect(0, y, 512, b.h + 2);
    // 細微岩層裂縫陰影線
    ctx.fillStyle = 'rgba(18, 24, 34, 0.35)';
    ctx.fillRect(0, y + b.h - 2, 512, 3);
    y += b.h;
  }

  // 垂直節理風化細紋
  ctx.fillStyle = 'rgba(20, 28, 38, 0.16)';
  for (let x = 24; x < 512; x += 48) {
    ctx.fillRect(x, 0, 3, 512);
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(2, 1);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function createIrregularMesaGeometry(radiusTop: number, radiusBottom: number, height: number, seedOffset: number): THREE.BufferGeometry {
  const geo = new THREE.CylinderGeometry(radiusTop, radiusBottom, height, 11, 4);
  const pos = geo.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const vx = pos.getX(i);
    const vy = pos.getY(i);
    const vz = pos.getZ(i);
    const ang = Math.atan2(vz, vx);
    const r = Math.hypot(vx, vz);
    if (r > 0.2) {
      // 決定性多邊形不規則擾動，消除正圓柱「千層蛋糕」感
      const warp =
        1 +
        Math.sin(ang * 3 + seedOffset) * 0.16 +
        Math.cos(ang * 5 - seedOffset * 1.3) * 0.09 +
        Math.sin(vy * 0.8 + seedOffset) * 0.05;
      pos.setX(i, vx * warp);
      pos.setZ(i, vz * warp);
    }
  }
  geo.computeVertexNormals();
  return geo;
}

function createDirectionSignMesh(): THREE.Mesh {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 96;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = '#5e4229';
  ctx.fillRect(0, 0, 256, 96);
  ctx.strokeStyle = '#382515';
  ctx.lineWidth = 6;
  ctx.strokeRect(3, 3, 250, 90);
  ctx.fillStyle = '#f5e4c3';
  ctx.font = 'bold 26px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('↖ MASADORA', 128, 42);
  ctx.font = 'bold 20px sans-serif';
  ctx.fillText('往 魔法都市・瑪莎多拉', 128, 74);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return new THREE.Mesh(
    new THREE.BoxGeometry(2.8, 1.05, 0.16),
    new THREE.MeshStandardMaterial({ map: tex, roughness: 0.88 })
  );
}

export function buildBadlandsZone(ctx: BadlandsBuildContext): THREE.Group {
  const bg = new THREE.Group();
  const cx = -16;
  const cz = -46;

  const rockTex = createStratifiedRockTexture();
  const mesaMat = new THREE.MeshStandardMaterial({
    map: rockTex,
    roughness: 0.94,
    flatShading: true,
  });
  const talusMat = new THREE.MeshStandardMaterial({
    color: 0x6f675b,
    roughness: 0.96,
    flatShading: true,
  });

  // 1. 乾燥荒地基底（雙層柔和色差過渡）
  const outerDirt = new THREE.Mesh(
    new THREE.CylinderGeometry(31, 33, 0.08, 28),
    new THREE.MeshStandardMaterial({ color: 0x7d8a62, roughness: 0.96 })
  );
  outerDirt.position.set(cx, 0.01, cz);
  outerDirt.receiveShadow = true;
  bg.add(outerDirt);

  const innerDirt = new THREE.Mesh(
    new THREE.CylinderGeometry(26, 28, 0.12, 24),
    new THREE.MeshStandardMaterial({ color: 0x8c7f6c, roughness: 0.96 })
  );
  innerDirt.position.set(cx, 0.03, cz);
  innerDirt.receiveShadow = true;
  bg.add(innerDirt);

  // 2. 夾道式 6 座不規則分層沉積岩峭壁台地（+ 坡腳碎石坡 Talus Cone，留出多里亞斯賭城視野）
  const mesas: Array<[number, number, number, number]> = [
    [-23, -43, 14.5, 1.1],
    [-37, -54, 17.5, 2.4],
    [-27, -63, 13.0, 3.7],
    [-1, -34, 13.8, 4.9],
    [-3, -50, 19.0, 6.2],
    [-10, -64, 12.5, 7.5],
  ];

  const mesaAvoidZones: Array<{ x: number; z: number; r: number }> = [];

  for (const [mx, mz, mh, seed] of mesas) {
    const rBot = 6.2 + (mh / 18) * 2.2;
    const rTop = rBot * 0.68;

    const mesaGeo = createIrregularMesaGeometry(rTop, rBot, mh, seed);
    const mesa = new THREE.Mesh(mesaGeo, mesaMat);
    mesa.position.set(mx, mh / 2, mz);
    mesa.castShadow = true;
    mesa.receiveShadow = true;
    bg.add(mesa);

    // 坡腳碎石斜坡（自然融入荒地地面）
    const talus = new THREE.Mesh(new THREE.ConeGeometry(rBot * 1.28, 3.2, 9), talusMat);
    talus.position.set(mx, 1.6, mz);
    talus.rotation.y = seed;
    talus.receiveShadow = true;
    bg.add(talus);

    ctx.addCameraOccluder?.(mesa);
    ctx.addCircleCollider({ x: mx, z: mz, r: rBot * 1.06 });
    mesaAvoidZones.push({ x: mx, z: mz, r: rBot + 2.5 });
  }

  // 3. 比司吉特訓岩壁掘洞痕跡 + 修行營地遺跡（位於 mesas[0] 東南側開闊崖腳空地，完全不被岩體遮蔽）
  const caveGroup = new THREE.Group();
  caveGroup.position.set(-13.4, 0, -38.5);
  caveGroup.rotation.y = 1.13;
  const caveDark = new THREE.Mesh(
    new THREE.CircleGeometry(2.1, 14, 0, Math.PI),
    new THREE.MeshBasicMaterial({ color: 0x12151c })
  );
  caveDark.position.set(0, 0.2, 0.08);
  caveGroup.add(caveDark);
  const caveRim = new THREE.Mesh(
    new THREE.TorusGeometry(2.15, 0.45, 8, 16, Math.PI),
    talusMat
  );
  caveRim.position.set(0, 0.2, 0);
  caveGroup.add(caveRim);
  bg.add(caveGroup);

  // 石圈營火與餘燼
  const campX = -12.2;
  const campZ = -40.8;
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    const st = new THREE.Mesh(new THREE.DodecahedronGeometry(0.28, 0), talusMat);
    st.position.set(campX + Math.cos(a) * 0.95, 0.2, campZ + Math.sin(a) * 0.95);
    bg.add(st);
  }
  const ember = new THREE.Mesh(
    new THREE.OctahedronGeometry(0.32),
    new THREE.MeshBasicMaterial({ color: 0xff7b29 })
  );
  ember.position.set(campX, 0.35, campZ);
  bg.add(ember);
  ctx.addAnimated((t) => {
    ember.scale.setScalar(0.85 + Math.sin(t * 5.2) * 0.18);
  });

  ctx.models.place(bg, 'Canyon_Rocks.glb', { x: -15.0, z: -52.0, targetHeight: 1.8, rotY: 0.6 });
  ctx.models.place(bg, 'Canyon_Rocks.glb', { x: -16.5, z: -33.0, targetHeight: 1.6, rotY: -0.9 });
  ctx.models.place(bg, 'Barrel.glb', { x: -11.8, z: -42.2, targetHeight: 0.58 });

  // 風化木製「往瑪莎多拉」方向路標（峽谷入口）
  const signGroup = new THREE.Group();
  signGroup.position.set(-10.5, 0, -34.5);
  signGroup.rotation.y = 0.55;
  const signPost = new THREE.Mesh(
    new THREE.CylinderGeometry(0.14, 0.18, 3.0, 8),
    new THREE.MeshStandardMaterial({ color: 0x4d3622, roughness: 0.9 })
  );
  signPost.position.y = 1.5;
  signGroup.add(signPost);
  const signBoard = createDirectionSignMesh();
  signBoard.position.y = 2.65;
  signGroup.add(signBoard);
  bg.add(signGroup);
  ctx.addCircleCollider({ x: -10.5, z: -34.5, r: 0.45 });

  // 4. 耐旱枯灌木與碎石群（InstancedMesh 2 Draw Calls，嚴格避開多里亞斯廣場、6 座台地、出生點與營火）
  const isBlockedScatterPos = (x: number, z: number): boolean => {
    if (Math.hypot(x - -52, z - -26) < 25) return true;
    if (Math.hypot(x - -10, z - -28) < 6) return true;
    if (Math.hypot(x - campX, z - campZ) < 3.5) return true;
    for (const m of mesaAvoidZones) {
      if (Math.hypot(x - m.x, z - m.z) < m.r) return true;
    }
    return false;
  };

  const scrubGeo = new THREE.DodecahedronGeometry(0.55, 0);
  const scrubInst = new THREE.InstancedMesh(
    scrubGeo,
    new THREE.MeshStandardMaterial({ color: 0x7a734b, roughness: 0.95, flatShading: true }),
    36
  );
  const pebbleGeo = new THREE.DodecahedronGeometry(0.45, 0);
  const pebbleInst = new THREE.InstancedMesh(pebbleGeo, talusMat, 48);

  const dummy = new THREE.Object3D();
  let seed = 777;
  const rand = () => {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  };
  let scrubPlaced = 0;
  for (let i = 0; i < 180 && scrubPlaced < 36; i++) {
    const a = rand() * Math.PI * 2;
    const r = 6 + Math.sqrt(rand()) * 21;
    const sc = 0.5 + rand() * 0.9;
    const sx = cx + Math.cos(a) * r;
    const sz = cz + Math.sin(a) * r;
    if (isBlockedScatterPos(sx, sz)) continue;
    dummy.position.set(sx, 0.25 * sc, sz);
    dummy.scale.set(sc * 1.2, sc * 0.7, sc);
    dummy.rotation.set(0, rand() * 3, 0);
    dummy.updateMatrix();
    scrubInst.setMatrixAt(scrubPlaced++, dummy.matrix);
  }
  scrubInst.count = scrubPlaced;

  let pebblePlaced = 0;
  for (let i = 0; i < 220 && pebblePlaced < 48; i++) {
    const a = rand() * Math.PI * 2;
    const r = 4 + Math.sqrt(rand()) * 23;
    const sc = 0.5 + rand() * 1.3;
    const px = cx + Math.cos(a) * r;
    const pz = cz + Math.sin(a) * r;
    if (isBlockedScatterPos(px, pz)) continue;
    dummy.position.set(px, 0.2 * sc, pz);
    dummy.scale.set(sc * 1.3, sc * 0.65, sc);
    dummy.rotation.set(rand(), rand() * 3, rand());
    dummy.updateMatrix();
    pebbleInst.setMatrixAt(pebblePlaced++, dummy.matrix);
  }
  pebbleInst.count = pebblePlaced;
  scrubInst.instanceMatrix.needsUpdate = true;
  pebbleInst.instanceMatrix.needsUpdate = true;
  scrubInst.computeBoundingSphere();
  pebbleInst.computeBoundingSphere();
  bg.add(scrubInst, pebbleInst);

  // 5. 飄浮沙塵微粒（THREE.Points，強化乾燥風蝕感）
  const dustCount = 90;
  const dustPos = new Float32Array(dustCount * 3);
  for (let i = 0; i < dustCount; i++) {
    const a = rand() * Math.PI * 2;
    const r = Math.sqrt(rand()) * 24;
    dustPos[i * 3] = cx + Math.cos(a) * r;
    dustPos[i * 3 + 1] = 0.8 + rand() * 10;
    dustPos[i * 3 + 2] = cz + Math.sin(a) * r;
  }
  const dustGeo = new THREE.BufferGeometry();
  dustGeo.setAttribute('position', new THREE.BufferAttribute(dustPos, 3));
  const dustPoints = new THREE.Points(
    dustGeo,
    new THREE.PointsMaterial({ color: 0xcfc2a8, size: 0.22, transparent: true, opacity: 0.55 })
  );
  bg.add(dustPoints);
  ctx.addAnimated((t) => {
    dustPoints.position.x = Math.sin(t * 0.4) * 1.8;
    dustPoints.position.y = Math.cos(t * 0.5) * 0.4;
  });

  return bg;
}
