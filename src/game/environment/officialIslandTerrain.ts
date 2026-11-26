import * as THREE from 'three';

export interface OfficialTerrainBounds {
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
}

export interface OfficialIslandTerrainResult {
  group: THREE.Group;
  update: (t: number) => void;
}

/**
 * 依據官方 Greed Island 地圖 PNG（./map/greed-island-map.png）的精準像素輪廓，
 * 即時建構 1:1 對應全島海岸線、西北四離島、東北山島、巨型 C 型西海灣、東南半島與沙灘斜坡的 3D 島嶼地形。
 * - 內陸區域維持 y = 0 平坦基準，確保所有 12 座城鎮、建築與道路 100% 穩固貼地；
 * - 海岸線自動平滑過渡至海面下（y = -4.6），搭配動態海岸浪花圈與官方手繪地貌色彩。
 */
export function createOfficialIslandTerrain(
  bounds: OfficialTerrainBounds,
  onTerrainReady: (landMesh: THREE.Mesh) => void
): OfficialIslandTerrainResult {
  const group = new THREE.Group();
  group.name = 'official_island_terrain';

  const foamMat = new THREE.MeshBasicMaterial({
    color: 0xeaf9ff,
    transparent: true,
    opacity: 0.44,
    depthWrite: false,
  });

  const spanX = bounds.maxX - bounds.minX;
  const spanZ = bounds.maxZ - bounds.minZ;
  const centerX = (bounds.minX + bounds.maxX) * 0.5;
  const centerZ = (bounds.minZ + bounds.maxZ) * 0.5;

  const img = new Image();
  img.crossOrigin = 'anonymous';
  img.onload = () => {
    const iw = img.naturalWidth || img.width;
    const ih = img.naturalHeight || img.height;
    if (iw <= 0 || ih <= 0) return;

    // 1. 讀取官方地圖像素並製作無黑邊滲色（Bleed）的高清地貌貼圖
    const sampleCanvas = document.createElement('canvas');
    sampleCanvas.width = iw;
    sampleCanvas.height = ih;
    const sctx = sampleCanvas.getContext('2d')!;
    sctx.drawImage(img, 0, 0);
    const srcData = sctx.getImageData(0, 0, iw, ih).data;

    // 製作貼圖用畫布：海面區填暖沙金底色，避免邊緣雙線性取樣出現黑邊
    const texCanvas = document.createElement('canvas');
    texCanvas.width = iw;
    texCanvas.height = ih;
    const tctx = texCanvas.getContext('2d')!;
    tctx.fillStyle = '#c8b47c';
    tctx.fillRect(0, 0, iw, ih);
    tctx.drawImage(img, 0, 0);

    // 疊加細微繪畫顆粒感，讓近距離看地面也有溫潤手繪質感
    const texImg = tctx.getImageData(0, 0, iw, ih);
    const td = texImg.data;
    for (let y = 0; y < ih; y++) {
      for (let x = 0; x < iw; x++) {
        const idx = (y * iw + x) * 4;
        const a = srcData[idx + 3];
        if (a < 180) {
          // 海岸淺灘統一為柔和暖金沙色
          td[idx] = 212;
          td[idx + 1] = 192;
          td[idx + 2] = 138;
          td[idx + 3] = 255;
        } else {
          const grain = (((x * 37 + y * 17) ^ (x * 13)) & 15) - 7;
          td[idx] = Math.min(255, Math.max(0, td[idx] + grain));
          td[idx + 1] = Math.min(255, Math.max(0, td[idx + 1] + grain));
          td[idx + 2] = Math.min(255, Math.max(0, td[idx + 2] + Math.round(grain * 0.7)));
          td[idx + 3] = 255;
        }
      }
    }
    tctx.putImageData(texImg, 0, 0);

    const mapTex = new THREE.CanvasTexture(texCanvas);
    mapTex.colorSpace = THREE.SRGBColorSpace;
    mapTex.anisotropy = 8;

    // 2. 建立高解析度網格並依官方輪廓計算海岸距離場（Smooth Coastline SDF）
    const segX = 176;
    const segZ = 248;
    const cols = segX + 1;
    const rows = segZ + 1;

    const isLand = new Uint8Array(cols * rows);
    for (let iz = 0; iz < rows; iz++) {
      const py = Math.min(ih - 1, Math.round((iz / segZ) * (ih - 1)));
      for (let ix = 0; ix < cols; ix++) {
        const px = Math.min(iw - 1, Math.round((ix / segX) * (iw - 1)));
        const a = srcData[(py * iw + px) * 4 + 3];
        isLand[iz * cols + ix] = a >= 110 ? 1 : 0;
      }
    }

    // 計算每個格點距離最近海面格點的距離（簡化 3 格半徑距離場，供平滑沙灘坡度）
    const shoreDist = new Float32Array(cols * rows);
    const foamMask = new Uint8Array(cols * rows);
    for (let iz = 0; iz < rows; iz++) {
      for (let ix = 0; ix < cols; ix++) {
        const idx = iz * cols + ix;
        if (!isLand[idx]) {
          // 檢查海面格點是否緊鄰陸地（作為浪花帶）
          let nearLand = false;
          for (let dz = -1; dz <= 1 && !nearLand; dz++) {
            const nz = iz + dz;
            if (nz < 0 || nz >= rows) continue;
            for (let dx = -1; dx <= 1; dx++) {
              const nx = ix + dx;
              if (nx < 0 || nx >= cols) continue;
              if (isLand[nz * cols + nx]) {
                nearLand = true;
                break;
              }
            }
          }
          foamMask[idx] = nearLand ? 1 : 0;
          shoreDist[idx] = 0;
          continue;
        }
        let minD = 4.0;
        for (let dz = -3; dz <= 3; dz++) {
          const nz = iz + dz;
          for (let dx = -3; dx <= 3; dx++) {
            const nx = ix + dx;
            if (nx < 0 || nx >= cols || nz < 0 || nz >= rows || !isLand[nz * cols + nx]) {
              const d = Math.hypot(dx, dz);
              if (d < minD) minD = d;
            }
          }
        }
        shoreDist[idx] = minD;
      }
    }

    // 3. 建立 3D 島嶼地形網格
    const geo = new THREE.PlaneGeometry(spanX, spanZ, segX, segZ);
    geo.rotateX(-Math.PI / 2);

    const pos = geo.attributes.position as THREE.BufferAttribute;
    for (let iz = 0; iz < rows; iz++) {
      for (let ix = 0; ix < cols; ix++) {
        const idx = iz * cols + ix;
        let y = -4.6; // 海底深處（低於 y = -2.8 海面）
        if (isLand[idx]) {
          const sd = shoreDist[idx];
          if (sd >= 2.1) {
            y = 0.0; // 內陸平坦基準，100% 承托所有城鎮與道路
          } else {
            // 平滑沙灘斜坡（海岸邊 -2.35m → 內陸 0.0m）
            const t = THREE.MathUtils.clamp((sd - 0.65) / 1.45, 0, 1);
            const smooth = t * t * (3 - 2 * t);
            y = THREE.MathUtils.lerp(-2.35, 0.0, smooth);
          }
        } else if (foamMask[idx]) {
          y = -3.25; // 淺水近岸海底
        }
        pos.setY(idx, y);
      }
    }
    pos.needsUpdate = true;
    geo.computeVertexNormals();

    const landMat = new THREE.MeshStandardMaterial({
      map: mapTex,
      roughness: 0.92,
      metalness: 0.0,
    });
    const landMesh = new THREE.Mesh(geo, landMat);
    landMesh.position.set(centerX, 0, centerZ);
    landMesh.receiveShadow = true;
    landMesh.name = 'official_island_landmass';
    group.add(landMesh);

    // 4. 沿官方海岸線生成動態白色浪花貼圖面（y = -2.72）
    const foamCanvas = document.createElement('canvas');
    foamCanvas.width = iw;
    foamCanvas.height = ih;
    const fctx = foamCanvas.getContext('2d')!;
    const fImg = fctx.createImageData(iw, ih);
    const fd = fImg.data;
    for (let y = 2; y < ih - 2; y++) {
      for (let x = 2; x < iw - 2; x++) {
        const idx = (y * iw + x) * 4;
        if (srcData[idx + 3] >= 110) continue;
        // 僅在緊貼海岸外 1..3 像素繪製柔和浪花
        let hit = false;
        for (let dy = -3; dy <= 3 && !hit; dy++) {
          for (let dx = -3; dx <= 3; dx++) {
            if (srcData[((y + dy) * iw + (x + dx)) * 4 + 3] >= 110) {
              hit = true;
              break;
            }
          }
        }
        if (hit) {
          fd[idx] = 232;
          fd[idx + 1] = 249;
          fd[idx + 2] = 255;
          fd[idx + 3] = 210;
        }
      }
    }
    fctx.putImageData(fImg, 0, 0);
    const foamTex = new THREE.CanvasTexture(foamCanvas);
    foamMat.map = foamTex;
    foamMat.needsUpdate = true;

    const foamPlane = new THREE.Mesh(new THREE.PlaneGeometry(spanX, spanZ), foamMat);
    foamPlane.rotation.x = -Math.PI / 2;
    foamPlane.position.set(centerX, -2.72, centerZ);
    foamPlane.userData.nonWalkable = true;
    group.add(foamPlane);

    onTerrainReady(landMesh);
  };
  img.src = './map/greed-island-map.png';

  return {
    group,
    update: (t: number) => {
      foamMat.opacity = 0.34 + Math.sin(t * 1.6) * 0.14;
    },
  };
}
