import * as THREE from 'three';
import {
  V2_BRIDGES,
  V2_LAKES,
  V2_MAP_BOUNDS,
  V2_MOUNTAIN_RIDGES,
  V2_ROADS,
  V2_TOWN_PLACEMENTS,
  V2BridgeDef,
} from './mapDataV2';

export interface SculptedTerrainV2Result {
  group: THREE.Group;
  landMesh: THREE.Mesh;
  bridgeDeckMeshes: THREE.Object3D[];
  bridgeColliders: Array<{ x: number; z: number; r: number }>;
  cameraOccluders: THREE.Object3D[];
  sampleHeight: (x: number, z: number) => number;
  isOnLand: (x: number, z: number) => boolean;
  update: (t: number) => void;
}

function smoothstep(edge0: number, edge1: number, x: number): number {
  const t = THREE.MathUtils.clamp((x - edge0) / (edge1 - edge0), 0, 1);
  return t * t * (3 - 2 * t);
}

function distToSegment2D(px: number, pz: number, x1: number, z1: number, x2: number, z2: number): { d: number; t: number } {
  const dx = x2 - x1;
  const dz = z2 - z1;
  const lenSq = dx * dx + dz * dz;
  if (lenSq < 1e-6) return { d: Math.hypot(px - x1, pz - z1), t: 0 };
  const t = THREE.MathUtils.clamp(((px - x1) * dx + (pz - z1) * dz) / lenSq, 0, 1);
  return { d: Math.hypot(px - (x1 + dx * t), pz - (z1 + dz * t)), t };
}

/** 輕量連續起伏雜訊，讓草原與山嶺在玩家視角高度有自然地形轉折 */
function rollingNoise(x: number, z: number): number {
  return (
    Math.sin(x * 0.017 + z * 0.013) * 0.85 +
    Math.cos(x * 0.031 - z * 0.023) * 0.45 +
    Math.sin(x * 0.008 - z * 0.009) * 0.65
  );
}

/**
 * 依據附圖大型地貌特徵建立「可步行 3D 雕塑地形」：
 * - 北側崎嶇半島與狹長水道、中央開闊平原與分散湖泊、西側大片內灣、南側狹長地峽、東南側近岸小島；
 * - 每個城鎮位置自動平滑整平地基至 `padY`，大型建築絕不懸空或埋入山坡；
 * - 道路走廊沿緩坡與谷地平滑削坡，跨水處建構真實可行走的木橋／石橋（含欄杆碰撞體）。
 */
export function createSculptedTerrainV2(
  roadMaterial?: THREE.Material,
  onOfficialMaskLoaded?: () => void
): SculptedTerrainV2Result {
  const group = new THREE.Group();
  group.name = 'sculpted_terrain_v2';

  const bounds = V2_MAP_BOUNDS;
  const spanX = bounds.maxX - bounds.minX;
  const spanZ = bounds.maxZ - bounds.minZ;
  const centerX = (bounds.minX + bounds.maxX) * 0.5;
  const centerZ = (bounds.minZ + bounds.maxZ) * 0.5;

  const segX = 168;
  const segZ = 224;
  const cols = segX + 1;
  const rows = segZ + 1;

  // 預先準備陸地遮罩（初始由解析輪廓＋城鎮／道路覆蓋產生，待官方 PNG 載入後 1:1 精準重烘網格）
  const landMask = new Uint8Array(cols * rows);
  const shoreDist = new Float32Array(cols * rows);

  // 輔助判斷：城鎮地基或道路（非跨水橋段）強制保底為陸地，確保所有移植城鎮 100% 穩固落地
  const townList = Object.values(V2_TOWN_PLACEMENTS);

  const isForcedLand = (wx: number, wz: number): boolean => {
    for (const t of townList) {
      if (Math.hypot(wx - t.x, wz - t.z) <= t.padRadius + 14) return true;
    }
    for (const seg of V2_ROADS) {
      const { d } = distToSegment2D(wx, wz, seg.x1, seg.z1, seg.x2, seg.z2);
      if (d <= seg.width * 1.15 + 6) {
        // 橋梁下方保留水道，不強填陸地
        let underBridge = false;
        for (const b of V2_BRIDGES) {
          const bd = distToSegment2D(wx, wz, b.x1, b.z1, b.x2, b.z2);
          if (bd.d < b.width * 1.6 && bd.t > 0.14 && bd.t < 0.86) {
            underBridge = true;
            break;
          }
        }
        if (!underBridge) return true;
      }
    }
    return false;
  };

  // 解析初期兜底陸地輪廓（對應附圖五大地貌：北崎嶇半島、中央平原、西內灣、南地峽、東南小島）
  const analyticalIsLand = (wx: number, wz: number): boolean => {
    if (isForcedLand(wx, wz)) return true;
    // 西側大片內灣挖空
    const wBay = Math.hypot((wx + 195) / 110, (wz - 170) / 145);
    if (wBay < 1.0) return false;
    // 東南主海灣挖空
    const eBay = Math.hypot((wx - 165) / 85, (wz - 265) / 115);
    if (eBay < 0.92 && Math.hypot((wx - 205) / 58, (wz - 268) / 74) > 0.95) return false;

    const lobes: Array<[number, number, number, number]> = [
      [-10, -180, 290, 260], // 北中大平原
      [-235, -420, 130, 125], // 西北半島
      [325, -430, 88, 92], // 東北山島
      [235, 10, 165, 185], // 東中山脈與壽富拉比
      [18, 165, 115, 185], // 南中狹長地峽
      [12, 430, 185, 165], // 南部開闊草原
      [-175, 415, 125, 115], // 西南半島
      [-320, 185, 72, 145], // 西側 C 型灣岸臂
      [268, 472, 115, 110], // 東南布恩森半島
      [205, 268, 72, 88], // 東南近岸山島
    ];
    for (const [lx, lz, rx, rz] of lobes) {
      const d = Math.hypot((wx - lx) / rx, (wz - lz) / rz);
      if (d <= 1.0) return true;
    }
    return false;
  };

  const computeShoreDist = () => {
    for (let iz = 0; iz < rows; iz++) {
      for (let ix = 0; ix < cols; ix++) {
        const idx = iz * cols + ix;
        if (!landMask[idx]) {
          shoreDist[idx] = 0;
          continue;
        }
        let minD = 4.0;
        for (let dz = -3; dz <= 3; dz++) {
          const nz = iz + dz;
          for (let dx = -3; dx <= 3; dx++) {
            const nx = ix + dx;
            if (nx < 0 || nx >= cols || nz < 0 || nz >= rows || !landMask[nz * cols + nx]) {
              const d = Math.hypot(dx, dz);
              if (d < minD) minD = d;
            }
          }
        }
        shoreDist[idx] = minD;
      }
    }
  };

  /** 計算世界座標 (wx, wz) 的自然地貌高度（含山脈、起伏草原、湖盆、道路削坡與城鎮整平地基） */
  const computeSculptedElevation = (wx: number, wz: number, sd: number): number => {
    if (sd <= 0.01) return -4.6;

    // 1. 基礎起伏草原（南側紫蘇樹至安多奇拔之間形成柔和丘谷轉折）
    let h = 1.4 + rollingNoise(wx, wz) * 0.95;

    // 起始塔 → 安多奇拔之間的草原小谷（z ≈ 425 略低至 0.7m，使玩家在起始高台先見鐘樓、走下緩坡後才見城門）
    const startValley = Math.exp(-Math.pow((wx - 28) / 56, 2) - Math.pow((wz - 426) / 38, 2));
    h -= startValley * 1.45;

    // 2. 大型山脈與紅岩峭壁
    for (const m of V2_MOUNTAIN_RIDGES) {
      const dx = wx - m.x;
      const dz = wz - m.z;
      const cosR = Math.cos(-(m.rot ?? 0));
      const sinR = Math.sin(-(m.rot ?? 0));
      const lx = (dx * cosR - dz * sinR) / m.rx;
      const lz = (dx * sinR + dz * cosR) / m.rz;
      const r = Math.hypot(lx, lz);
      if (r < 1.15) {
        const peak = Math.pow(1 - smoothstep(0.0, 1.15, r), 1.45);
        const ridgeDetail = 0.88 + 0.12 * Math.sin(wx * 0.07 + wz * 0.05);
        h += m.height * peak * ridgeDetail;
      }
    }

    // 3. 湖盆下凹
    for (const lk of V2_LAKES) {
      const r = Math.hypot((wx - lk.x) / (lk.rx + 8), (wz - lk.z) / (lk.rz + 8));
      if (r < 1.0) {
        const basin = 1 - smoothstep(0.55, 1.0, r);
        h = THREE.MathUtils.lerp(h, -1.2, basin);
      }
    }

    // 4. 道路沿緩坡與谷地平滑削坡（抑制過高山脊穿插道路）
    for (const seg of V2_ROADS) {
      const { d } = distToSegment2D(wx, wz, seg.x1, seg.z1, seg.x2, seg.z2);
      const roadOuter = seg.width * 1.45 + 9.0;
      if (d < roadOuter) {
        const blend = 1 - smoothstep(seg.width * 0.55, roadOuter, d);
        // 道路目標坡高：隨南北地勢平順過渡（利梅洛高地自動抬升，海港處平緩下降）
        const roadTargetH = Math.min(h, 4.6);
        h = THREE.MathUtils.lerp(h, Math.max(1.1, roadTargetH), blend * 0.85);
      }
    }

    // 5. 12 座城鎮整平地基（最高優先權，確保建築群 100% 穩固平貼不懸空）
    for (const t of townList) {
      const dist = Math.hypot(wx - t.x, wz - t.z);
      const blendOuter = t.padRadius + 24;
      if (dist < blendOuter) {
        const padBlend = 1 - smoothstep(t.padRadius - 2, blendOuter, dist);
        h = THREE.MathUtils.lerp(h, t.padY, padBlend);
      }
    }

    // 6. 海岸線平滑斜坡入海（避免懸崖斷切）
    if (sd < 2.2) {
      const coastT = smoothstep(0.55, 2.2, sd);
      h = THREE.MathUtils.lerp(-2.55, h, coastT);
    }

    return h;
  };

  // 建立 3D 地形網格與頂點色緩衝
  const geo = new THREE.PlaneGeometry(spanX, spanZ, segX, segZ);
  geo.rotateX(-Math.PI / 2);
  const colors = new Float32Array(cols * rows * 3);
  geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

  const heightGrid = new Float32Array(cols * rows);
  const tmpCol = new THREE.Color();

  const rebuildGeometry = () => {
    computeShoreDist();
    const pos = geo.attributes.position as THREE.BufferAttribute;
    const colAttr = geo.attributes.color as THREE.BufferAttribute;

    for (let iz = 0; iz < rows; iz++) {
      const wz = bounds.minZ + (iz / segZ) * spanZ;
      for (let ix = 0; ix < cols; ix++) {
        const wx = bounds.minX + (ix / segX) * spanX;
        const idx = iz * cols + ix;
        const sd = shoreDist[idx];
        const y = computeSculptedElevation(wx, wz, sd);
        heightGrid[idx] = y;
        pos.setY(idx, y);

        // 地貌頂點分色：海岸金沙 → 草原嫩綠 → 林坡深綠 → 紅岩峽谷 → 高山岩灰
        let nearRoad = false;
        for (const seg of V2_ROADS) {
          const { d } = distToSegment2D(wx, wz, seg.x1, seg.z1, seg.x2, seg.z2);
          if (d < seg.width * 0.62) {
            nearRoad = true;
            break;
          }
        }

        if (y < -0.5) {
          tmpCol.setHex(0xdcc78e); // 海岸金沙灘
        } else if (nearRoad) {
          tmpCol.setHex(0xd4c398); // 夯土鄉道暖色
        } else {
          // 湖畔卵石淺灘緣
          let nearLakeRim = false;
          for (const lk of V2_LAKES) {
            const lr = Math.hypot((wx - lk.x) / (lk.rx + 9), (wz - lk.z) / (lk.rz + 9));
            if (lr < 1.08 && lr > 0.72) {
              nearLakeRim = true;
              break;
            }
          }
          // 檢查是否在紅岩荒地帶
          let isBadland = false;
          for (const m of V2_MOUNTAIN_RIDGES) {
            if (m.biome === 'badlands' && Math.hypot((wx - m.x) / (m.rx * 1.15), (wz - m.z) / (m.rz * 1.15)) < 1.0) {
              isBadland = true;
              break;
            }
          }
          if (nearLakeRim) {
            tmpCol.setHex(0xd4c59e);
          } else if (isBadland) {
            tmpCol.setHex(y > 6.5 ? 0xb56d45 : 0xc48b5c);
          } else if (y > 14.5) {
            tmpCol.setHex(0x8e8373); // 高山岩脊
          } else if (y > 7.5) {
            tmpCol.setHex(0x6e854d); // 山腰苔綠
          } else {
            // 陽光草原微幅色調起伏
            const n = rollingNoise(wx * 1.4, wz * 1.4);
            tmpCol.setRGB(
              THREE.MathUtils.clamp(0.42 + n * 0.035, 0.34, 0.52),
              THREE.MathUtils.clamp(0.64 + n * 0.04, 0.54, 0.74),
              THREE.MathUtils.clamp(0.25 + n * 0.02, 0.19, 0.32)
            );
          }
        }
        colAttr.setXYZ(idx, tmpCol.r, tmpCol.g, tmpCol.b);
      }
    }

    pos.needsUpdate = true;
    colAttr.needsUpdate = true;
    geo.computeVertexNormals();
  };

  // 先以解析兜底輪廓初始化，確保首幀即有可步行地形
  for (let iz = 0; iz < rows; iz++) {
    const wz = bounds.minZ + (iz / segZ) * spanZ;
    for (let ix = 0; ix < cols; ix++) {
      const wx = bounds.minX + (ix / segX) * spanX;
      landMask[iz * cols + ix] = analyticalIsLand(wx, wz) ? 1 : 0;
    }
  }
  rebuildGeometry();

  // 手繪細緻地表筆觸與柔和凹凸紋理（與頂點分色相乘，近距離呈現溫潤草地／泥土／岩紋而非平滑多邊形）
  const detailCanvas = document.createElement('canvas');
  detailCanvas.width = 256;
  detailCanvas.height = 256;
  const dctx = detailCanvas.getContext('2d')!;
  dctx.fillStyle = '#f2f2f2';
  dctx.fillRect(0, 0, 256, 256);
  let dSeed = 9187;
  const dRand = () => {
    dSeed = (dSeed * 16807) % 2147483647;
    return (dSeed - 1) / 2147483646;
  };
  for (let i = 0; i < 1600; i++) {
    const px = dRand() * 256;
    const py = dRand() * 256;
    const w = 2 + dRand() * 6;
    const h = 1.5 + dRand() * 4;
    const v = Math.floor(212 + dRand() * 43);
    dctx.fillStyle = `rgba(${v},${v},${v},0.38)`;
    dctx.fillRect(px, py, w, h);
  }
  const detailTex = new THREE.CanvasTexture(detailCanvas);
  detailTex.wrapS = THREE.RepeatWrapping;
  detailTex.wrapT = THREE.RepeatWrapping;
  detailTex.repeat.set(88, 116);
  detailTex.anisotropy = 4;

  const landMat = new THREE.MeshStandardMaterial({
    map: detailTex,
    bumpMap: detailTex,
    bumpScale: 0.12,
    vertexColors: true,
    roughness: 0.93,
    metalness: 0.0,
  });
  const landMesh = new THREE.Mesh(geo, landMat);
  landMesh.position.set(centerX, 0, centerZ);
  landMesh.receiveShadow = true;
  landMesh.name = 'sculpted_island_v2_landmass';
  group.add(landMesh);

  // 載入官方島嶼 PNG 精準套用海岸線與離島輪廓（北側崎嶇半島、西側大片內灣、東南近岸小島）
  const foamMat = new THREE.MeshBasicMaterial({
    color: 0xeaf9ff,
    transparent: true,
    opacity: 0.42,
    depthWrite: false,
  });
  const img = new Image();
  img.crossOrigin = 'anonymous';
  img.onload = () => {
    const iw = img.naturalWidth || img.width;
    const ih = img.naturalHeight || img.height;
    if (iw <= 0 || ih <= 0) return;

    const c = document.createElement('canvas');
    c.width = iw;
    c.height = ih;
    const ctx = c.getContext('2d')!;
    ctx.drawImage(img, 0, 0);
    const data = ctx.getImageData(0, 0, iw, ih).data;

    for (let iz = 0; iz < rows; iz++) {
      const wz = bounds.minZ + (iz / segZ) * spanZ;
      const py = Math.min(ih - 1, Math.round((iz / segZ) * (ih - 1)));
      for (let ix = 0; ix < cols; ix++) {
        const wx = bounds.minX + (ix / segX) * spanX;
        const px = Math.min(iw - 1, Math.round((ix / segX) * (iw - 1)));
        const a = data[(py * iw + px) * 4 + 3];
        // 保留城鎮地基與道路陸地保底，同時在橋梁下方切出水道
        let underBridge = false;
        for (const b of V2_BRIDGES) {
          const bd = distToSegment2D(wx, wz, b.x1, b.z1, b.x2, b.z2);
          if (bd.d < b.width * 1.45 && bd.t > 0.14 && bd.t < 0.86) {
            underBridge = true;
            break;
          }
        }
        landMask[iz * cols + ix] = underBridge ? 0 : a >= 110 || isForcedLand(wx, wz) ? 1 : 0;
      }
    }
    rebuildGeometry();

    // 生成貼合官方海岸的動態白色浪花圈
    const fc = document.createElement('canvas');
    fc.width = iw;
    fc.height = ih;
    const fctx = fc.getContext('2d')!;
    const fImg = fctx.createImageData(iw, ih);
    const fd = fImg.data;
    for (let y = 2; y < ih - 2; y++) {
      for (let x = 2; x < iw - 2; x++) {
        const idx = (y * iw + x) * 4;
        if (data[idx + 3] >= 110) continue;
        let hit = false;
        for (let dy = -3; dy <= 3 && !hit; dy++) {
          for (let dx = -3; dx <= 3; dx++) {
            if (data[((y + dy) * iw + (x + dx)) * 4 + 3] >= 110) {
              hit = true;
              break;
            }
          }
        }
        if (hit) {
          fd[idx] = 232;
          fd[idx + 1] = 249;
          fd[idx + 2] = 255;
          fd[idx + 3] = 200;
        }
      }
    }
    fctx.putImageData(fImg, 0, 0);
    foamMat.map = new THREE.CanvasTexture(fc);
    foamMat.needsUpdate = true;

    const foamPlane = new THREE.Mesh(new THREE.PlaneGeometry(spanX, spanZ), foamMat);
    foamPlane.rotation.x = -Math.PI / 2;
    foamPlane.position.set(centerX, -2.72, centerZ);
    foamPlane.userData.nonWalkable = true;
    group.add(foamPlane);

    refreshRoadRibbons();
    onOfficialMaskLoaded?.();
  };
  img.src = './map/greed-island-map.png';

  // 快速雙線性內插高度查詢（供道路帶、路標、橋頭坡道與外部即時取樣共用）
  const sampleHeight = (x: number, z: number): number => {
    const fx = THREE.MathUtils.clamp(((x - bounds.minX) / spanX) * segX, 0, segX - 0.001);
    const fz = THREE.MathUtils.clamp(((z - bounds.minZ) / spanZ) * segZ, 0, segZ - 0.001);
    const ix = Math.floor(fx);
    const iz = Math.floor(fz);
    const tx = fx - ix;
    const tz = fz - iz;
    const h00 = heightGrid[iz * cols + ix];
    const h10 = heightGrid[iz * cols + (ix + 1)];
    const h01 = heightGrid[(iz + 1) * cols + ix];
    const h11 = heightGrid[(iz + 1) * cols + (ix + 1)];
    const hx0 = h00 + (h10 - h00) * tx;
    const hx1 = h01 + (h11 - h01) * tx;
    return hx0 + (hx1 - hx0) * tz;
  };

  const isOnLand = (x: number, z: number): boolean => {
    const ix = Math.round(THREE.MathUtils.clamp(((x - bounds.minX) / spanX) * segX, 0, segX));
    const iz = Math.round(THREE.MathUtils.clamp(((z - bounds.minZ) / spanZ) * segZ, 0, segZ));
    return landMask[iz * cols + ix] === 1;
  };

  // 3D 貼地手繪道路帶（沿 V2_ROADS 每 4m 細分取樣 sampleHeight，完美貼合每處緩坡與山谷且自動避開橋面中段）
  const roadRibbonGroup = new THREE.Group();
  roadRibbonGroup.name = 'v2_terrain_roads';
  const roadGeometries: Array<{
    geo: THREE.BufferGeometry;
    seg: (typeof V2_ROADS)[number];
    steps: number;
  }> = [];

  const ribbonMat = roadMaterial
    ? roadMaterial.clone()
    : new THREE.MeshStandardMaterial({ color: 0xd4c398, roughness: 0.9 });
  ribbonMat.polygonOffset = true;
  ribbonMat.polygonOffsetFactor = -2;
  ribbonMat.polygonOffsetUnits = -2;

  const isInsideBridgeDeck = (wx: number, wz: number): boolean => {
    for (const b of V2_BRIDGES) {
      const bd = distToSegment2D(wx, wz, b.x1, b.z1, b.x2, b.z2);
      if (bd.d < b.width * 0.85 && bd.t > 0.08 && bd.t < 0.92) return true;
    }
    return false;
  };

  for (const seg of V2_ROADS) {
    const dx = seg.x2 - seg.x1;
    const dz = seg.z2 - seg.z1;
    const len = Math.hypot(dx, dz);
    if (len < 1) continue;
    const steps = Math.max(4, Math.ceil(len / 4.0));
    const vertCount = (steps + 1) * 2;
    const positions = new Float32Array(vertCount * 3);
    const uvs = new Float32Array(vertCount * 2);
    const indices: number[] = [];

    for (let i = 0; i <= steps; i++) {
      const v = (i / steps) * (len / 7.5);
      uvs[i * 4 + 0] = 0;
      uvs[i * 4 + 1] = v;
      uvs[i * 4 + 2] = 1;
      uvs[i * 4 + 3] = v;
      if (i < steps) {
        const a = i * 2;
        const b = a + 1;
        const c = a + 2;
        const d = a + 3;
        indices.push(a, c, b, b, c, d);
      }
    }

    const rGeo = new THREE.BufferGeometry();
    rGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    rGeo.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
    rGeo.setIndex(indices);
    const rMesh = new THREE.Mesh(rGeo, ribbonMat);
    rMesh.receiveShadow = true;
    rMesh.userData.nonWalkable = true; // 高度由下方雕塑地形統一提供，避免重複 Raycast 抖動
    roadRibbonGroup.add(rMesh);
    roadGeometries.push({ geo: rGeo, seg, steps });
  }
  group.add(roadRibbonGroup);

  const refreshRoadRibbons = () => {
    for (const { geo: rGeo, seg, steps } of roadGeometries) {
      const dx = seg.x2 - seg.x1;
      const dz = seg.z2 - seg.z1;
      const len = Math.hypot(dx, dz) || 1;
      const nx = -dz / len;
      const nz = dx / len;
      const halfW = seg.width * 0.52;
      const posAttr = rGeo.attributes.position as THREE.BufferAttribute;

      for (let i = 0; i <= steps; i++) {
        const t = i / steps;
        const cx = seg.x1 + dx * t;
        const cz = seg.z1 + dz * t;
        const lx = cx - nx * halfW;
        const lz = cz - nz * halfW;
        const rx = cx + nx * halfW;
        const rz = cz + nz * halfW;
        const hideUnderBridge = isInsideBridgeDeck(cx, cz);
        const yL = hideUnderBridge ? -5.0 : sampleHeight(lx, lz) + 0.055;
        const yR = hideUnderBridge ? -5.0 : sampleHeight(rx, rz) + 0.055;
        posAttr.setXYZ(i * 2, lx, yL, lz);
        posAttr.setXYZ(i * 2 + 1, rx, yR, rz);
      }
      posAttr.needsUpdate = true;
      rGeo.computeVertexNormals();
      rGeo.computeBoundingSphere();
    }
  };

  // 主要岔路口木製方向路標（讓城鎮之間的草原與林道更具探索感）
  const signpostMat = new THREE.MeshStandardMaterial({ color: 0x6b4b2b, roughness: 0.88 });
  const signBoardMat = new THREE.MeshStandardMaterial({ color: 0xdcc79c, roughness: 0.82 });
  const forkSpots: Array<[number, number, number]> = [
    [26, 452, 0.3], // 起始塔 / 安多奇拔 / 布恩森三岔口
    [16, 72, -0.4], // 魯比克塔 / 壽富拉比 / 荒地峽谷岔口
    [-16, -146, 0.5], // 荒地峽谷 / 瑪莎多拉 / 利梅洛岔口
  ];
  for (const [fx, fz, frot] of forkSpots) {
    const fy = sampleHeight(fx, fz);
    const sp = new THREE.Group();
    sp.position.set(fx, fy, fz);
    sp.rotation.y = frot;
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.18, 3.2, 8), signpostMat);
    pole.position.y = 1.6;
    pole.castShadow = true;
    sp.add(pole);
    const arm1 = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.36, 0.12), signBoardMat);
    arm1.position.set(0.65, 2.75, 0);
    arm1.castShadow = true;
    sp.add(arm1);
    const arm2 = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.34, 0.12), signBoardMat);
    arm2.position.set(-0.55, 2.25, 0.06);
    arm2.rotation.y = 0.7;
    arm2.castShadow = true;
    sp.add(arm2);
    sp.userData.nonWalkable = true;
    group.add(sp);
  }

  // 建構跨水可行走橋梁（木橋／石橋＋橋柱＋依兩岸高度動態貼合的無縫斜坡引道＋欄杆碰撞體）
  const bridgeDeckMeshes: THREE.Object3D[] = [];
  const bridgeColliders: Array<{ x: number; z: number; r: number }> = [];
  const cameraOccluders: THREE.Object3D[] = [];

  const buildBridge = (b: V2BridgeDef) => {
    const dx = b.x2 - b.x1;
    const dz = b.z2 - b.z1;
    const len = Math.hypot(dx, dz);
    const yaw = Math.atan2(dx, dz);
    const mx = (b.x1 + b.x2) * 0.5;
    const mz = (b.z1 + b.z2) * 0.5;

    const bg = new THREE.Group();
    bg.position.set(mx, 0, mz);
    bg.rotation.y = yaw;

    const deckMat = new THREE.MeshStandardMaterial({
      color: b.style === 'stone' ? 0xc2b9a5 : 0x9c7246,
      roughness: 0.86,
    });
    const postMat = new THREE.MeshStandardMaterial({
      color: b.style === 'stone' ? 0x9e9584 : 0x6b4b2b,
      roughness: 0.88,
    });

    const deck = new THREE.Mesh(new THREE.BoxGeometry(b.width, 0.5, len + 4.0), deckMat);
    deck.position.y = b.deckY - 0.25;
    deck.castShadow = true;
    deck.receiveShadow = true;
    bg.add(deck);
    bridgeDeckMeshes.push(deck);

    // 橋頭雙側實心深裙座斜坡引道（頂面略高於岸面杜絕草地穿出，底部深埋 2.4m 杜絕側面懸空縫）
    const rampLen = 9.5;
    const rampThickness = 2.6;
    const dirX = dx / (len || 1);
    const dirZ = dz / (len || 1);
    for (const endSign of [-1, 1]) {
      const endWorldX = mx + dirX * endSign * (len * 0.5 + 2.0 + rampLen);
      const endWorldZ = mz + dirZ * endSign * (len * 0.5 + 2.0 + rampLen);
      const midWorldX = mx + dirX * endSign * (len * 0.5 + 2.0 + rampLen * 0.5);
      const midWorldZ = mz + dirZ * endSign * (len * 0.5 + 2.0 + rampLen * 0.5);
      const groundAtEnd = Math.max(0.2, sampleHeight(endWorldX, endWorldZ)) + 0.16;
      const groundAtMid = sampleHeight(midWorldX, midWorldZ) + 0.22;
      const topAtMid = Math.max((b.deckY + groundAtEnd) * 0.5, groundAtMid);
      const drop = b.deckY - groundAtEnd;
      const pitch = Math.atan2(drop, rampLen);
      const actualLen = Math.hypot(rampLen, drop) + 0.8;
      const ramp = new THREE.Mesh(new THREE.BoxGeometry(b.width, rampThickness, actualLen), deckMat);
      ramp.position.set(
        0,
        topAtMid - rampThickness * 0.5,
        endSign * (len * 0.5 + 2.0 + rampLen * 0.5)
      );
      ramp.rotation.x = endSign * pitch;
      ramp.receiveShadow = true;
      bg.add(ramp);
      bridgeDeckMeshes.push(ramp);
    }

    // 橋墩與兩側護欄
    const railH = 1.25;
    for (const side of [-1, 1]) {
      const rx = side * (b.width * 0.5 - 0.25);
      const rail = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.22, len + 2.0), postMat);
      rail.position.set(rx, b.deckY + railH, 0);
      rail.castShadow = true;
      bg.add(rail);
      cameraOccluders.push(rail);

      const postCount = Math.max(4, Math.floor(len / 7));
      for (let i = 0; i <= postCount; i++) {
        const lz = -len * 0.5 + (i / postCount) * len;
        const post = new THREE.Mesh(new THREE.BoxGeometry(0.45, railH + 0.32, 0.45), postMat);
        post.position.set(rx, b.deckY + (railH + 0.32) * 0.5 + 0.02, lz);
        post.castShadow = true;
        bg.add(post);

        // 下方橋墩入水
        if (i % 2 === 0) {
          const piling = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.52, b.deckY + 4.2, 8), postMat);
          piling.position.set(rx * 0.88, (b.deckY - 4.2) * 0.5, lz);
          bg.add(piling);
        }

        // 世界空間護欄碰撞體，避免玩家從橋側墜落
        const cosY = Math.cos(yaw);
        const sinY = Math.sin(yaw);
        bridgeColliders.push({
          x: mx + rx * cosY + lz * sinY,
          z: mz - rx * sinY + lz * cosY,
          r: 0.65,
        });
      }
    }

    group.add(bg);
  };

  for (const b of V2_BRIDGES) {
    buildBridge(b);
  }
  refreshRoadRibbons();

  return {
    group,
    landMesh,
    bridgeDeckMeshes,
    bridgeColliders,
    cameraOccluders,
    sampleHeight,
    isOnLand,
    update: (t: number) => {
      foamMat.opacity = 0.32 + Math.sin(t * 1.55) * 0.14;
    },
  };
}
