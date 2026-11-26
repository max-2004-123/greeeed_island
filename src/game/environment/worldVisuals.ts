import * as THREE from 'three';

/**
 * 決定性偽隨機產生器（確保每次進入島嶼的地表筆觸、雲層與草花佈局穩定一致）。
 */
function makeSeededRand(seedInit: number): () => number {
  let s = seedInit;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

// ============================================================================
// 1. 動畫風格漸層天空球（GLSL Shader：天頂深藍 → 地平線柔霧 → 太陽暖暈）＋ 飄動立體積雲
// ============================================================================

export interface AnimeSkyController {
  group: THREE.Group;
  setThemeColors: (zenithHex: number, horizonHex: number, sunHex?: number) => void;
  lerpThemeColors: (zenith: THREE.Color, horizon: THREE.Color, blend: number) => void;
  update: (elapsed: number, centerPos: THREE.Vector3) => void;
}

export function createAnimeSkySystem(): AnimeSkyController {
  const group = new THREE.Group();

  const uniforms = {
    uZenithColor: { value: new THREE.Color(0x2b76cf) },
    uMidSkyColor: { value: new THREE.Color(0x6ec1f5) },
    uHorizonColor: { value: new THREE.Color(0xdef3fa) },
    uSunDir: { value: new THREE.Vector3(0.46, 0.76, 0.44).normalize() },
    uSunColor: { value: new THREE.Color(0xfff4cf) },
  };

  const skyGeo = new THREE.SphereGeometry(1250, 32, 20);
  const skyMat = new THREE.ShaderMaterial({
    side: THREE.BackSide,
    depthWrite: false,
    fog: false,
    uniforms,
    vertexShader: /* glsl */ `
      varying vec3 vWorldDir;
      void main() {
        vec4 wp = modelMatrix * vec4(position, 1.0);
        vWorldDir = normalize(position);
        gl_Position = projectionMatrix * viewMatrix * wp;
      }
    `,
    fragmentShader: /* glsl */ `
      uniform vec3 uZenithColor;
      uniform vec3 uMidSkyColor;
      uniform vec3 uHorizonColor;
      uniform vec3 uSunDir;
      uniform vec3 uSunColor;
      varying vec3 vWorldDir;
      void main() {
        vec3 d = normalize(vWorldDir);
        float h = clamp(d.y, 0.0, 1.0);
        vec3 col = mix(uHorizonColor, uMidSkyColor, smoothstep(0.0, 0.28, h));
        col = mix(col, uZenithColor, smoothstep(0.22, 0.85, h));

        // 太陽光暈與柔和米氏散射
        float sunDot = max(dot(d, normalize(uSunDir)), 0.0);
        float sunGlow = pow(sunDot, 12.0) * 0.28 + pow(sunDot, 120.0) * 0.65;
        float sunDisc = smoothstep(0.9965, 0.9992, sunDot) * 0.9;
        col += uSunColor * (sunGlow + sunDisc);

        gl_FragColor = vec4(col, 1.0);
      }
    `,
  });
  const skyDome = new THREE.Mesh(skyGeo, skyMat);
  group.add(skyDome);

  // 26 朵飄動動畫立體積雲（上暖白、下淡藍紫柔光，零額外 Draw Call 壓力）
  const cloudGroup = new THREE.Group();
  const cloudTopMat = new THREE.MeshBasicMaterial({
    color: 0xfffdf7,
    transparent: true,
    opacity: 0.9,
    fog: false,
  });
  const cloudUnderMat = new THREE.MeshBasicMaterial({
    color: 0xd4e5f5,
    transparent: true,
    opacity: 0.82,
    fog: false,
  });
  const puffGeo = new THREE.IcosahedronGeometry(1, 2);

  const rand = makeSeededRand(7741);
  const clouds: Array<{ obj: THREE.Group; baseX: number; baseZ: number; speed: number; range: number }> = [];
  for (let i = 0; i < 26; i++) {
    const cg = new THREE.Group();
    const angle = (i / 26) * Math.PI * 2 + (rand() - 0.5) * 0.25;
    const dist = 240 + rand() * 520;
    const cy = 115 + rand() * 82;
    const bx = Math.cos(angle) * dist;
    const bz = Math.sin(angle) * dist;
    const scale = 15 + rand() * 19;

    // 主雲頂＋左右副雲團＋下方平底淡影雲
    const puffs: Array<[number, number, number, number, number, number, boolean]> = [
      [0, 0.45, 0, 1.35, 0.88, 1.05, true],
      [-1.05, 0.12, 0.15, 0.95, 0.66, 0.86, true],
      [1.08, 0.18, -0.1, 1.02, 0.72, 0.88, true],
      [-0.45, 0.68, -0.25, 0.85, 0.68, 0.78, true],
      [0.52, 0.6, 0.28, 0.8, 0.62, 0.75, true],
      [0, -0.18, 0, 1.65, 0.42, 1.12, false],
    ];
    for (const [px, py, pz, sx, sy, sz, isTop] of puffs) {
      const m = new THREE.Mesh(puffGeo, isTop ? cloudTopMat : cloudUnderMat);
      m.position.set(px, py, pz);
      m.scale.set(sx, sy, sz);
      cg.add(m);
    }
    cg.position.set(bx, cy, bz);
    cg.scale.setScalar(scale);
    cg.rotation.y = rand() * Math.PI * 2;
    cloudGroup.add(cg);
    clouds.push({ obj: cg, baseX: bx, baseZ: bz, speed: 1.4 + rand() * 1.8, range: 760 });
  }
  group.add(cloudGroup);

  const tmpMid = new THREE.Color();

  return {
    group,
    setThemeColors(zenithHex: number, horizonHex: number, sunHex = 0xfff4cf) {
      uniforms.uZenithColor.value.setHex(zenithHex);
      uniforms.uHorizonColor.value.setHex(horizonHex);
      uniforms.uMidSkyColor.value.copy(uniforms.uZenithColor.value).lerp(uniforms.uHorizonColor.value, 0.45);
      uniforms.uSunColor.value.setHex(sunHex);
    },
    lerpThemeColors(zenith: THREE.Color, horizon: THREE.Color, blend: number) {
      uniforms.uZenithColor.value.lerp(zenith, blend);
      uniforms.uHorizonColor.value.lerp(horizon, blend);
      tmpMid.copy(uniforms.uZenithColor.value).lerp(uniforms.uHorizonColor.value, 0.48);
      uniforms.uMidSkyColor.value.lerp(tmpMid, blend);
    },
    update(elapsed: number, centerPos: THREE.Vector3) {
      skyDome.position.set(centerPos.x, 0, centerPos.z);
      for (const c of clouds) {
        const drift = ((c.baseX + elapsed * c.speed + c.range) % (c.range * 2)) - c.range;
        c.obj.position.x = drift;
      }
    },
  };
}

// ============================================================================
// 2. 高解析手繪動畫風格地表紋理（草原、砂灘、岩崖、石板鄉道、水波、樹皮與葉簇）
// ============================================================================

function createPaintedMeadowTexture(): THREE.CanvasTexture {
  const size = 512;
  const c = document.createElement('canvas');
  c.width = size;
  c.height = size;
  const ctx = c.getContext('2d')!;
  const rand = makeSeededRand(2025);

  // 溫潤翠綠基底
  ctx.fillStyle = '#5c9d46';
  ctx.fillRect(0, 0, size, size);

  // 1. 大片陽光與陰影油畫色斑（無縫平鋪 wrap）
  const blobPalette = [
    'rgba(124, 184, 72, 0.24)',
    'rgba(70, 134, 56, 0.24)',
    'rgba(148, 198, 84, 0.18)',
    'rgba(58, 112, 52, 0.20)',
    'rgba(164, 186, 86, 0.14)',
  ];
  for (let i = 0; i < 85; i++) {
    const x = rand() * size;
    const y = rand() * size;
    const r = 24 + rand() * 68;
    const col = blobPalette[i % blobPalette.length];
    ctx.fillStyle = col;
    for (const ox of [-size, 0, size]) {
      for (const oy of [-size, 0, size]) {
        if (x + ox + r < 0 || x + ox - r > size || y + oy + r < 0 || y + oy - r > size) continue;
        ctx.beginPath();
        ctx.arc(x + ox, y + oy, r, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  // 2. 細密手繪草葉筆觸與苜蓿紋理
  ctx.lineCap = 'round';
  for (let i = 0; i < 1600; i++) {
    const x = rand() * size;
    const y = rand() * size;
    const len = 5 + rand() * 11;
    const ang = -Math.PI / 2 + (rand() - 0.5) * 0.9;
    const tone = rand();
    ctx.strokeStyle =
      tone > 0.68
        ? 'rgba(170, 212, 92, 0.42)'
        : tone > 0.34
        ? 'rgba(84, 148, 60, 0.42)'
        : 'rgba(46, 94, 44, 0.38)';
    ctx.lineWidth = 1.2 + rand() * 1.4;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + Math.cos(ang) * len, y + Math.sin(ang) * len);
    ctx.stroke();
  }

  // 3. 零星細小白色／鵝黃野花點綴於草皮深處
  for (let i = 0; i < 56; i++) {
    const x = rand() * size;
    const y = rand() * size;
    ctx.fillStyle = i % 3 === 0 ? 'rgba(255, 246, 176, 0.65)' : 'rgba(255, 255, 246, 0.55)';
    ctx.beginPath();
    ctx.arc(x, y, 1.4 + rand() * 1.4, 0, Math.PI * 2);
    ctx.fill();
  }

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.anisotropy = 4;
  return tex;
}

function createCoastalCliffTexture(): THREE.CanvasTexture {
  const size = 256;
  const c = document.createElement('canvas');
  c.width = size;
  c.height = size;
  const ctx = c.getContext('2d')!;
  const rand = makeSeededRand(3311);

  // 層狀岩崖底色
  const g = ctx.createLinearGradient(0, 0, 0, size);
  g.addColorStop(0, '#5a8f43'); // 頂部垂掛草緣
  g.addColorStop(0.14, '#7d6b52');
  g.addColorStop(0.55, '#8c7e6a');
  g.addColorStop(1, '#6c6256');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);

  // 水平岩層裂縫與石塊明暗
  for (let y = 30; y < size; y += 18) {
    ctx.fillStyle = rand() > 0.5 ? 'rgba(54, 46, 38, 0.28)' : 'rgba(210, 198, 176, 0.16)';
    ctx.fillRect(0, y, size, 3 + rand() * 6);
  }
  for (let i = 0; i < 160; i++) {
    const x = rand() * size;
    const y = 24 + rand() * (size - 24);
    ctx.fillStyle = rand() > 0.5 ? 'rgba(48, 42, 36, 0.25)' : 'rgba(190, 178, 158, 0.2)';
    ctx.fillRect(x, y, 8 + rand() * 24, 5 + rand() * 12);
  }
  // 頂部青苔鋸齒草緣
  ctx.fillStyle = '#4e8a3c';
  for (let x = 0; x < size; x += 8) {
    const drop = 16 + rand() * 22;
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x + 9, 0);
    ctx.lineTo(x + 4, drop);
    ctx.closePath();
    ctx.fill();
  }

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.ClampToEdgeWrapping;
  tex.repeat.set(8, 1);
  return tex;
}

function createWarmSandTexture(): THREE.CanvasTexture {
  const size = 256;
  const c = document.createElement('canvas');
  c.width = size;
  c.height = size;
  const ctx = c.getContext('2d')!;
  const rand = makeSeededRand(4409);

  ctx.fillStyle = '#e5cf99';
  ctx.fillRect(0, 0, size, size);

  // 沙丘風紋波浪
  for (let y = 0; y < size; y += 14) {
    ctx.strokeStyle = 'rgba(196, 166, 108, 0.26)';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.bezierCurveTo(size * 0.33, y + 6, size * 0.66, y - 6, size, y);
    ctx.stroke();
  }
  for (let i = 0; i < 900; i++) {
    ctx.fillStyle = rand() > 0.5 ? 'rgba(255, 248, 224, 0.34)' : 'rgba(164, 134, 84, 0.24)';
    ctx.fillRect(rand() * size, rand() * size, 2, 2);
  }

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  return tex;
}

function createCountryRoadTexture(): THREE.CanvasTexture {
  const size = 512;
  const c = document.createElement('canvas');
  c.width = size;
  c.height = size;
  const ctx = c.getContext('2d')!;
  const rand = makeSeededRand(6123);

  // 暖色夯土與卵石路基
  ctx.fillStyle = '#c4b18c';
  ctx.fillRect(0, 0, size, size);

  // 兩側自然草土滲邊
  const edgeL = ctx.createLinearGradient(0, 0, 74, 0);
  edgeL.addColorStop(0, 'rgba(92, 138, 66, 0.65)');
  edgeL.addColorStop(1, 'rgba(92, 138, 66, 0)');
  ctx.fillStyle = edgeL;
  ctx.fillRect(0, 0, 74, size);

  const edgeR = ctx.createLinearGradient(size, 0, size - 74, 0);
  edgeR.addColorStop(0, 'rgba(92, 138, 66, 0.65)');
  edgeR.addColorStop(1, 'rgba(92, 138, 66, 0)');
  ctx.fillStyle = edgeR;
  ctx.fillRect(size - 74, 0, 74, size);

  // 兩條旅人馬車壓出的淺色車轍壓痕
  for (const cx of [size * 0.34, size * 0.66]) {
    const rut = ctx.createLinearGradient(cx - 42, 0, cx + 42, 0);
    rut.addColorStop(0, 'rgba(140, 118, 84, 0)');
    rut.addColorStop(0.5, 'rgba(140, 118, 84, 0.24)');
    rut.addColorStop(1, 'rgba(140, 118, 84, 0)');
    ctx.fillStyle = rut;
    ctx.fillRect(cx - 42, 0, 84, size);
  }

  // 嵌於土路中的手繪不規則石板與礫石
  for (let i = 0; i < 240; i++) {
    const sx = 34 + rand() * (size - 68);
    const sy = rand() * size;
    const rx = 10 + rand() * 20;
    const ry = 7 + rand() * 14;
    const tone = 178 + Math.floor((rand() - 0.5) * 44);
    ctx.fillStyle = `rgba(${tone}, ${tone - 14}, ${tone - 36}, 0.55)`;
    ctx.beginPath();
    ctx.ellipse(sx, sy, rx, ry, (rand() - 0.5) * 0.6, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(98, 84, 62, 0.28)';
    ctx.lineWidth = 1.4;
    ctx.stroke();
  }

  // 細砂與石屑質感
  for (let i = 0; i < 1200; i++) {
    ctx.fillStyle = rand() > 0.5 ? 'rgba(248, 240, 218, 0.32)' : 'rgba(104, 88, 64, 0.26)';
    ctx.fillRect(rand() * size, rand() * size, 2.2, 2.2);
  }

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.anisotropy = 4;
  return tex;
}

function createWaterRippleTexture(): THREE.CanvasTexture {
  const size = 512;
  const c = document.createElement('canvas');
  c.width = size;
  c.height = size;
  const ctx = c.getContext('2d')!;
  const rand = makeSeededRand(9901);

  ctx.fillStyle = '#187fb5';
  ctx.fillRect(0, 0, size, size);

  // 柔和深淺海流色塊
  for (let i = 0; i < 60; i++) {
    const x = rand() * size;
    const y = rand() * size;
    const r = 34 + rand() * 64;
    ctx.fillStyle = i % 2 === 0 ? 'rgba(48, 174, 214, 0.22)' : 'rgba(12, 86, 138, 0.22)';
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }

  // 動畫風格波光碎浪紋
  ctx.lineCap = 'round';
  for (let i = 0; i < 240; i++) {
    const x = rand() * size;
    const y = rand() * size;
    const w = 14 + rand() * 34;
    ctx.strokeStyle = i % 3 === 0 ? 'rgba(224, 248, 255, 0.42)' : 'rgba(130, 222, 246, 0.28)';
    ctx.lineWidth = 1.6 + rand() * 2.2;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.quadraticCurveTo(x + w * 0.5, y - 3.5, x + w, y);
    ctx.stroke();
  }

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(96, 96);
  return tex;
}

function createFoliageCanopyTexture(): THREE.CanvasTexture {
  const size = 256;
  const c = document.createElement('canvas');
  c.width = size;
  c.height = size;
  const ctx = c.getContext('2d')!;
  const rand = makeSeededRand(5512);

  ctx.fillStyle = '#b4c998';
  ctx.fillRect(0, 0, size, size);

  // 疊層手繪葉簇（搭配實例色可呈現從暖金綠到深松綠的立體冠層）
  for (let i = 0; i < 420; i++) {
    const x = rand() * size;
    const y = rand() * size;
    const r = 6 + rand() * 13;
    const v = 165 + Math.floor((rand() - 0.5) * 75);
    ctx.fillStyle = `rgba(${v - 14}, ${Math.min(255, v + 18)}, ${v - 26}, 0.78)`;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  return tex;
}

function createBarkTexture(): THREE.CanvasTexture {
  const size = 128;
  const c = document.createElement('canvas');
  c.width = size;
  c.height = size;
  const ctx = c.getContext('2d')!;
  const rand = makeSeededRand(8102);

  ctx.fillStyle = '#5c412c';
  ctx.fillRect(0, 0, size, size);
  for (let i = 0; i < 95; i++) {
    const x = rand() * size;
    ctx.fillStyle = rand() > 0.5 ? 'rgba(42, 28, 18, 0.42)' : 'rgba(122, 92, 64, 0.34)';
    ctx.fillRect(x, 0, 2 + rand() * 4, size);
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  return tex;
}

function createMossyRockTexture(): THREE.CanvasTexture {
  const size = 256;
  const c = document.createElement('canvas');
  c.width = size;
  c.height = size;
  const ctx = c.getContext('2d')!;
  const rand = makeSeededRand(7331);

  ctx.fillStyle = '#7e8389';
  ctx.fillRect(0, 0, size, size);
  for (let i = 0; i < 260; i++) {
    const x = rand() * size;
    const y = rand() * size;
    const r = 6 + rand() * 20;
    ctx.fillStyle =
      i % 7 === 0
        ? 'rgba(98, 134, 72, 0.35)' // 岩面青苔
        : rand() > 0.5
        ? 'rgba(182, 186, 188, 0.24)'
        : 'rgba(64, 68, 76, 0.32)';
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  return tex;
}

/**
 * 注入世界空間 XZ UV 與大尺度陽光草坪色彩明暗變化：
 * 徹底消除 20 塊圓盤陸地重疊接縫與拉扯感，讓整座島嶼呈現吉卜力／薩爾達般的自然日光牧場起伏色階！
 */
function injectWorldSpaceGroundShader(mat: THREE.MeshStandardMaterial, tileScale: number, biomeTint: boolean): void {
  mat.onBeforeCompile = (shader) => {
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\nvarying vec3 vGiWorldPos;')
      .replace(
        '#include <worldpos_vertex>',
        '#include <worldpos_vertex>\nvGiWorldPos = (modelMatrix * vec4(transformed, 1.0)).xyz;'
      );

    const tintSnippet = biomeTint
      ? /* glsl */ `
        // 大尺度陽光草坪明暗色帶＋荒地峽谷區域自動過渡為暖赭色乾草
        float macroWave = sin(vGiWorldPos.x * 0.042) * cos(vGiWorldPos.z * 0.038);
        float microPatch = sin(vGiWorldPos.x * 0.13 + vGiWorldPos.z * 0.09) * 0.5 + 0.5;
        vec3 sunGrass = vec3(1.12, 1.14, 0.86);
        vec3 shadeGrass = vec3(0.84, 0.94, 0.88);
        diffuseColor.rgb *= mix(shadeGrass, sunGrass, clamp(macroWave * 0.45 + 0.5 + (microPatch - 0.5) * 0.18, 0.0, 1.0));

        // 中部荒地峽谷 (-80, -230) 周圍自然染上暖黃土色調（對應 5× 世界尺度）
        float badDist = length(vGiWorldPos.xz - vec2(-80.0, -230.0));
        float badFactor = 1.0 - smoothstep(45.0, 145.0, badDist);
        diffuseColor.rgb = mix(diffuseColor.rgb, diffuseColor.rgb * vec3(1.26, 0.96, 0.62), badFactor * 0.72);
      `
      : '';

    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', '#include <common>\nvarying vec3 vGiWorldPos;')
      .replace(
        '#include <map_fragment>',
        /* glsl */ `
        #ifdef USE_MAP
          vec2 worldUv = vGiWorldPos.xz * ${tileScale.toFixed(4)};
          vec4 sampledDiffuseColor = texture2D( map, worldUv );
          diffuseColor *= sampledDiffuseColor;
        #endif
        ${tintSnippet}
      `
      );
  };
}

export interface IslandSurfaceMaterials {
  meadowTopMat: THREE.MeshStandardMaterial;
  cliffWallMat: THREE.MeshStandardMaterial;
  sandMat: THREE.MeshStandardMaterial;
  roadMat: THREE.MeshStandardMaterial;
  roadCurbMat: THREE.MeshStandardMaterial;
  seaMat: THREE.MeshStandardMaterial;
  lakeMat: THREE.MeshStandardMaterial;
  seaTex: THREE.CanvasTexture;
  lakeTex: THREE.CanvasTexture;
  foliageTex: THREE.CanvasTexture;
  barkTex: THREE.CanvasTexture;
  rockTex: THREE.CanvasTexture;
}

export function createIslandSurfaceMaterials(): IslandSurfaceMaterials {
  const meadowTex = createPaintedMeadowTexture();
  const cliffTex = createCoastalCliffTexture();
  const sandTex = createWarmSandTexture();
  const roadTex = createCountryRoadTexture();
  const seaTex = createWaterRippleTexture();
  const lakeTex = seaTex.clone();
  lakeTex.needsUpdate = true;
  lakeTex.repeat.set(3.5, 3.5);

  const meadowTopMat = new THREE.MeshStandardMaterial({
    map: meadowTex,
    color: 0xffffff,
    roughness: 0.94,
    metalness: 0.0,
  });
  injectWorldSpaceGroundShader(meadowTopMat, 0.068, true);

  const cliffWallMat = new THREE.MeshStandardMaterial({
    map: cliffTex,
    roughness: 0.95,
    metalness: 0.0,
  });

  const sandMat = new THREE.MeshStandardMaterial({
    map: sandTex,
    color: 0xffffff,
    roughness: 0.94,
    metalness: 0.0,
  });
  injectWorldSpaceGroundShader(sandMat, 0.075, false);

  const roadMat = new THREE.MeshStandardMaterial({
    map: roadTex,
    color: 0xffffff,
    roughness: 0.92,
    metalness: 0.0,
  });

  const roadCurbMat = new THREE.MeshStandardMaterial({
    color: 0x8d826e,
    roughness: 0.94,
    metalness: 0.0,
  });

  const seaMat = new THREE.MeshStandardMaterial({
    map: seaTex,
    color: 0x35a4d6,
    roughness: 0.24,
    metalness: 0.14,
  });

  const lakeMat = new THREE.MeshStandardMaterial({
    map: lakeTex,
    color: 0x4bc4e8,
    roughness: 0.18,
    metalness: 0.16,
  });

  return {
    meadowTopMat,
    cliffWallMat,
    sandMat,
    roadMat,
    roadCurbMat,
    seaMat,
    lakeMat,
    seaTex,
    lakeTex,
    foliageTex: createFoliageCanopyTexture(),
    barkTex: createBarkTexture(),
    rockTex: createMossyRockTexture(),
  };
}

// ============================================================================
// 3. 迎風搖曳手繪交叉草葉與野花群（Alpha-Cutout 交叉面片 + GPU 頂點微風動畫，僅 2 個 Draw Calls！）
// ============================================================================

function createGrassTuftTexture(withFlowers: boolean): THREE.CanvasTexture {
  const size = 256;
  const c = document.createElement('canvas');
  c.width = size;
  c.height = size;
  const ctx = c.getContext('2d')!;
  const rand = makeSeededRand(withFlowers ? 7711 : 4419);

  ctx.clearRect(0, 0, size, size);

  // 繪製 24 根自然弧曲的尖葉草束（根部深翠、葉尖暖陽金綠）
  const bladeCount = withFlowers ? 18 : 26;
  for (let i = 0; i < bladeCount; i++) {
    const baseX = 36 + rand() * (size - 72);
    const lean = (rand() - 0.5) * 95;
    const height = 105 + rand() * 118;
    const width = 7 + rand() * 8;

    const grad = ctx.createLinearGradient(baseX, size, baseX + lean, size - height);
    grad.addColorStop(0, '#3f843a');
    grad.addColorStop(0.55, '#6cb84e');
    grad.addColorStop(1, '#b8e26b');

    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.moveTo(baseX - width * 0.5, size);
    ctx.quadraticCurveTo(baseX + lean * 0.35 - width * 0.25, size - height * 0.58, baseX + lean, size - height);
    ctx.quadraticCurveTo(baseX + lean * 0.35 + width * 0.35, size - height * 0.55, baseX + width * 0.5, size);
    ctx.closePath();
    ctx.fill();
  }

  // 若為野花束，在草葉上方繪製精緻五瓣小白花／金黃毛茛／粉櫻花
  if (withFlowers) {
    const flowerPalette = ['#fffdf2', '#ffe26a', '#ffb2ce', '#a8deff'];
    for (let i = 0; i < 6; i++) {
      const fx = 52 + rand() * (size - 104);
      const fy = 56 + rand() * 92;
      const petalR = 7 + rand() * 4;
      const col = flowerPalette[i % flowerPalette.length];

      // 細綠花莖
      ctx.strokeStyle = '#3f7c34';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(fx, fy + 4);
      ctx.quadraticCurveTo(fx + (rand() - 0.5) * 16, (fy + size) * 0.5, fx + (rand() - 0.5) * 18, size);
      ctx.stroke();

      // 五瓣花冠
      ctx.fillStyle = col;
      for (let p = 0; p < 5; p++) {
        const a = (p / 5) * Math.PI * 2;
        ctx.beginPath();
        ctx.arc(fx + Math.cos(a) * petalR * 0.85, fy + Math.sin(a) * petalR * 0.85, petalR * 0.62, 0, Math.PI * 2);
        ctx.fill();
      }
      // 金黃花蕊
      ctx.fillStyle = '#f2b824';
      ctx.beginPath();
      ctx.arc(fx, fy, petalR * 0.44, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/**
 * 建立三面交叉草叢幾何體（從任何角度觀察都蓬鬆立體，不會像圓錐或單片紙板）。
 */
function createCrossedGrassGeometry(width: number, height: number): THREE.BufferGeometry {
  const planes = 3;
  const positions: number[] = [];
  const normals: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];

  for (let p = 0; p < planes; p++) {
    const a = (p / planes) * Math.PI;
    const cos = Math.cos(a);
    const sin = Math.sin(a);
    const hw = width * 0.5;
    const baseIdx = p * 4;

    positions.push(
      -hw * cos, 0, -hw * sin,
      hw * cos, 0, hw * sin,
      -hw * cos, height, -hw * sin,
      hw * cos, height, hw * sin
    );
    // 朝上法線使草叢接受柔和頂光，不產生生硬正反明暗割裂（吉卜力／薩爾達核心技巧！）
    for (let k = 0; k < 4; k++) normals.push(0, 1, 0);
    uvs.push(0, 0, 1, 0, 0, 1, 1, 1);
    indices.push(baseIdx, baseIdx + 1, baseIdx + 2, baseIdx + 2, baseIdx + 1, baseIdx + 3);
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geo.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geo.setIndex(indices);
  return geo;
}

export interface WindMeadowSystem {
  group: THREE.Group;
  update: (elapsed: number) => void;
}

export function createWindSwayingMeadowFlora(
  spots: Array<{ x: number; z: number; scale: number; isFlower: boolean }>
): WindMeadowSystem {
  const group = new THREE.Group();
  const windUniform = { value: 0 };

  const applyWindShader = (mat: THREE.MeshLambertMaterial) => {
    mat.onBeforeCompile = (shader) => {
      shader.uniforms.uWindTime = windUniform;
      shader.vertexShader = shader.vertexShader
        .replace('#include <common>', '#include <common>\nuniform float uWindTime;')
        .replace(
          '#include <begin_vertex>',
          /* glsl */ `
          #include <begin_vertex>
          float tipFactor = clamp(position.y, 0.0, 1.2);
          #ifdef USE_INSTANCING
            vec3 instOrigin = vec3(instanceMatrix[3][0], instanceMatrix[3][1], instanceMatrix[3][2]);
          #else
            vec3 instOrigin = vec3(0.0);
          #endif
          float gust = sin(uWindTime * 1.9 + instOrigin.x * 0.16 + instOrigin.z * 0.12) * 0.14
                     + sin(uWindTime * 3.4 + instOrigin.x * 0.42) * 0.04;
          transformed.x += gust * tipFactor * tipFactor;
          transformed.z += gust * 0.55 * tipFactor * tipFactor;
        `
        );
      // 防止 DoubleSide 背面將朝上法線 (0, 1, 0) 翻轉成朝下 (0, -1, 0) 導致草叢背光變純黑剪影
      shader.fragmentShader = shader.fragmentShader.replace(
        '#include <normal_fragment_begin>',
        /* glsl */ `
        #include <normal_fragment_begin>
        #ifndef FLAT_SHADED
          normal = normalize( vNormal );
        #endif
        `
      );
    };
  };

  const grassSpots = spots.filter((s) => !s.isFlower);
  const flowerSpots = spots.filter((s) => s.isFlower);

  const grassGeo = createCrossedGrassGeometry(1.15, 0.82);
  const grassMat = new THREE.MeshLambertMaterial({
    map: createGrassTuftTexture(false),
    color: 0xffffff,
    emissive: new THREE.Color(0x2d6124),
    emissiveIntensity: 0.34,
    alphaTest: 0.42,
    side: THREE.DoubleSide,
  });
  applyWindShader(grassMat);

  const flowerGeo = createCrossedGrassGeometry(1.1, 0.88);
  const flowerMat = new THREE.MeshLambertMaterial({
    map: createGrassTuftTexture(true),
    color: 0xffffff,
    emissive: new THREE.Color(0x3a6330),
    emissiveIntensity: 0.32,
    alphaTest: 0.42,
    side: THREE.DoubleSide,
  });
  applyWindShader(flowerMat);

  const dummy = new THREE.Object3D();
  const color = new THREE.Color();
  const rand = makeSeededRand(5150);

  if (grassSpots.length > 0) {
    const inst = new THREE.InstancedMesh(grassGeo, grassMat, grassSpots.length);
    inst.castShadow = false;
    inst.receiveShadow = false;
    for (let i = 0; i < grassSpots.length; i++) {
      const s = grassSpots[i];
      dummy.position.set(s.x, 0.0, s.z);
      dummy.rotation.set(0, rand() * Math.PI * 2, 0);
      dummy.scale.set(s.scale, s.scale * (0.75 + rand() * 0.5), s.scale);
      dummy.updateMatrix();
      inst.setMatrixAt(i, dummy.matrix);
      color.setHSL(0.28 + (rand() - 0.5) * 0.04, 0.32 + rand() * 0.14, 0.88 + rand() * 0.12);
      inst.setColorAt(i, color);
    }
    inst.instanceMatrix.needsUpdate = true;
    if (inst.instanceColor) inst.instanceColor.needsUpdate = true;
    inst.computeBoundingSphere();
    group.add(inst);
  }

  if (flowerSpots.length > 0) {
    const inst = new THREE.InstancedMesh(flowerGeo, flowerMat, flowerSpots.length);
    inst.castShadow = false;
    inst.receiveShadow = false;
    for (let i = 0; i < flowerSpots.length; i++) {
      const s = flowerSpots[i];
      dummy.position.set(s.x, 0.0, s.z);
      dummy.rotation.set(0, rand() * Math.PI * 2, 0);
      dummy.scale.set(s.scale, s.scale * (0.8 + rand() * 0.4), s.scale);
      dummy.updateMatrix();
      inst.setMatrixAt(i, dummy.matrix);
    }
    inst.instanceMatrix.needsUpdate = true;
    inst.computeBoundingSphere();
    group.add(inst);
  }

  return {
    group,
    update(elapsed: number) {
      windUniform.value = elapsed;
    },
  };
}

/**
 * 島嶼陽光浮塵／微風花瓣粒子（替 3D 戶外空間增添呼吸感與光影深度）。
 */
export function createIslandBreezeParticles(): { points: THREE.Points; update: (t: number, playerPos: THREE.Vector3) => void } {
  const count = 220;
  const positions = new Float32Array(count * 3);
  const rand = makeSeededRand(2099);
  for (let i = 0; i < count; i++) {
    positions[i * 3] = (rand() - 0.5) * 75;
    positions[i * 3 + 1] = 0.8 + rand() * 11;
    positions[i * 3 + 2] = (rand() - 0.5) * 75;
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  const mat = new THREE.PointsMaterial({
    color: 0xfff6cc,
    size: 0.19,
    transparent: true,
    opacity: 0.65,
    depthWrite: false,
  });
  const points = new THREE.Points(geo, mat);

  return {
    points,
    update(t: number, playerPos: THREE.Vector3) {
      points.position.set(
        playerPos.x + Math.sin(t * 0.25) * 2.2,
        Math.sin(t * 0.65) * 0.35,
        playerPos.z + Math.cos(t * 0.2) * 2.2
      );
      points.rotation.y = t * 0.025;
    },
  };
}
