import * as THREE from 'three';
import { ModelLibrary } from '../assets';
import { ARCH_SCALE, WORLD_SCALE } from '../locations';
import { BoxCollider, CircleCollider, RoadSegment } from '../world';

export interface CityExpansionConfig {
  id: string;
  /** 外環街區起始半徑（local 單位，實際世界尺寸為 × ARCH_SCALE） */
  innerR: number;
  /** 外環街區最大半徑（local 單位） */
  outerR: number;
  /** 城市擴建總半徑（用於地面鋪裝與外牆） */
  cityRadiusLocal: number;
  /** 地面鋪裝顏色與材質風格 */
  pavingColor: number;
  roadColor: number;
  /** 建築配置群組 */
  ring1Count: number;
  ring2Count: number;
  buildingPool: Array<{ file: string; minH: number; maxH: number }>;
  propPool: Array<{ file: string; minH: number; maxH: number }>;
  treePool: Array<{ file: string; minH: number; maxH: number }>;
  /** 角度範圍（弧度，用於海港避開海面）；省略代表 360° 全向擴建 */
  landArc?: { start: number; end: number };
  /** 海面停泊船隻區域（僅海港城市使用） */
  harborArc?: { start: number; end: number; shipCount: number; shipFiles: string[] };
  /** 外城牆大門缺口角度（弧度） */
  gateAngles?: number[];
  /** 外城牆風格 */
  wallStyle: 'stone_medieval' | 'white_royal' | 'timber_palisade' | 'none';
  /** 特色主題建築風格 */
  themeLandmark: 'antokiba' | 'masadora' | 'limeiro' | 'soufrabi' | 'dorias' | 'aiai' | 'gi_port' | 'rubicuta' | 'bunzen' | 'bandit_village';
  /** 街燈顏色 */
  lanternColor: number;
  /** 外圍城鎮居民數 */
  npcCount: number;
  npcClothPalette: number[];
}

export const CITY_EXPANSION_CONFIGS: Record<string, CityExpansionConfig> = {
  antokiba: {
    id: 'antokiba',
    innerR: 33,
    outerR: 51,
    cityRadiusLocal: 56,
    pavingColor: 0xc2b7a1,
    roadColor: 0xb3a58c,
    ring1Count: 14,
    ring2Count: 18,
    buildingPool: [
      { file: 'House_1.glb', minH: 6.2, maxH: 8.6 },
      { file: 'House_2.glb', minH: 6.4, maxH: 8.8 },
      { file: 'House_3.glb', minH: 6.0, maxH: 8.2 },
      { file: 'House_4.glb', minH: 6.6, maxH: 9.0 },
      { file: 'Inn.glb', minH: 8.5, maxH: 10.2 },
      { file: 'Blacksmith.glb', minH: 6.4, maxH: 7.8 },
      { file: 'Mill.glb', minH: 9.2, maxH: 11.0 },
    ],
    propPool: [
      { file: 'MarketStand_1.glb', minH: 3.1, maxH: 3.6 },
      { file: 'MarketStand_2.glb', minH: 3.1, maxH: 3.6 },
      { file: 'Cart.glb', minH: 1.9, maxH: 2.3 },
      { file: 'Well.glb', minH: 2.7, maxH: 3.1 },
      { file: 'Bench_1.glb', minH: 0.62, maxH: 0.72 },
    ],
    treePool: [
      { file: 'Tree_1.glb', minH: 6.5, maxH: 9.0 },
      { file: 'BirchTree_1.glb', minH: 6.2, maxH: 8.5 },
    ],
    gateAngles: [Math.PI / 2, -Math.PI / 2, Math.PI],
    wallStyle: 'stone_medieval',
    themeLandmark: 'antokiba',
    lanternColor: 0xffd27d,
    npcCount: 10,
    npcClothPalette: [0x3b6ea5, 0xa84a3b, 0x4f7d4a, 0x8c6239, 0x6b4c8a],
  },

  masadora: {
    id: 'masadora',
    innerR: 36,
    outerR: 53,
    cityRadiusLocal: 57,
    pavingColor: 0xd6cde8,
    roadColor: 0xe6dff2,
    ring1Count: 12,
    ring2Count: 16,
    buildingPool: [
      { file: 'SpellShop_Hall.glb', minH: 7.4, maxH: 9.6 },
      { file: 'House_2.glb', minH: 6.0, maxH: 8.2 },
      { file: 'House_3.glb', minH: 6.2, maxH: 8.4 },
      { file: 'Inn.glb', minH: 8.0, maxH: 9.8 },
      { file: 'Gazebo.glb', minH: 4.8, maxH: 6.0 },
    ],
    propPool: [
      { file: 'MarketStand_1.glb', minH: 3.2, maxH: 3.8 },
      { file: 'MarketStand_2.glb', minH: 3.2, maxH: 3.8 },
      { file: 'Bench_1.glb', minH: 0.62, maxH: 0.72 },
      { file: 'Well.glb', minH: 2.6, maxH: 3.0 },
    ],
    treePool: [
      { file: 'BlossomTree_1.glb', minH: 6.5, maxH: 9.2 },
      { file: 'BirchTree_1.glb', minH: 6.2, maxH: 8.4 },
    ],
    wallStyle: 'none',
    themeLandmark: 'masadora',
    lanternColor: 0x62f5dc,
    npcCount: 10,
    npcClothPalette: [0x6e4bc4, 0x2ca89a, 0xc75c96, 0x4b74c4, 0xd49c3d],
  },

  limeiro: {
    id: 'limeiro',
    innerR: 44,
    outerR: 61,
    cityRadiusLocal: 66,
    pavingColor: 0xc9c2b2,
    roadColor: 0xded8c8,
    ring1Count: 16,
    ring2Count: 22,
    buildingPool: [
      { file: 'House_1.glb', minH: 6.8, maxH: 9.2 },
      { file: 'House_2.glb', minH: 7.0, maxH: 9.4 },
      { file: 'House_3.glb', minH: 6.6, maxH: 8.8 },
      { file: 'House_4.glb', minH: 7.2, maxH: 9.8 },
      { file: 'Inn.glb', minH: 9.0, maxH: 11.2 },
      { file: 'Blacksmith.glb', minH: 6.8, maxH: 8.2 },
      { file: 'Bell_Tower.glb', minH: 12.0, maxH: 14.5 },
      { file: 'Gazebo.glb', minH: 5.0, maxH: 6.2 },
    ],
    propPool: [
      { file: 'MarketStand_1.glb', minH: 3.2, maxH: 3.7 },
      { file: 'MarketStand_2.glb', minH: 3.2, maxH: 3.7 },
      { file: 'Well.glb', minH: 2.9, maxH: 3.3 },
      { file: 'Cart.glb', minH: 2.0, maxH: 2.4 },
      { file: 'Bench_1.glb', minH: 0.62, maxH: 0.72 },
    ],
    treePool: [
      { file: 'Tree_1.glb', minH: 7.0, maxH: 9.5 },
      { file: 'BlossomTree_1.glb', minH: 6.8, maxH: 9.0 },
    ],
    gateAngles: [Math.PI / 2],
    wallStyle: 'white_royal',
    themeLandmark: 'limeiro',
    lanternColor: 0xffe48c,
    npcCount: 12,
    npcClothPalette: [0x2a4e8c, 0xa83244, 0xd4a638, 0x3f6e5c, 0x7a488c],
  },

  soufrabi: {
    id: 'soufrabi',
    innerR: 35,
    outerR: 49,
    cityRadiusLocal: 53,
    pavingColor: 0xb59c7b,
    roadColor: 0xa18766,
    ring1Count: 12,
    ring2Count: 14,
    buildingPool: [
      { file: 'House_1.glb', minH: 6.0, maxH: 8.0 },
      { file: 'House_3.glb', minH: 6.2, maxH: 8.2 },
      { file: 'Inn.glb', minH: 8.2, maxH: 9.8 },
      { file: 'Soufrabi_Port.glb', minH: 7.4, maxH: 9.2 },
      { file: 'Blacksmith.glb', minH: 6.2, maxH: 7.6 },
    ],
    propPool: [
      { file: 'MarketStand_1.glb', minH: 3.0, maxH: 3.5 },
      { file: 'Barrel.glb', minH: 0.52, maxH: 0.68 },
      { file: 'Cart.glb', minH: 1.9, maxH: 2.3 },
    ],
    treePool: [
      { file: 'Tree_2.glb', minH: 6.2, maxH: 8.5 },
    ],
    // 東側 (-65°..+65°) 為海灣，城鎮往西/北/南擴建
    landArc: { start: Math.PI * 0.38, end: Math.PI * 1.62 },
    harborArc: { start: -Math.PI * 0.32, end: Math.PI * 0.32, shipCount: 5, shipFiles: ['Pirate_Ship.glb', 'Sailboat.glb'] },
    wallStyle: 'none',
    themeLandmark: 'soufrabi',
    lanternColor: 0xffb35c,
    npcCount: 9,
    npcClothPalette: [0x254b73, 0x9c3d3d, 0x3b6e66, 0x5c4738, 0x2c364d],
  },

  dorias: {
    id: 'dorias',
    innerR: 24,
    outerR: 38,
    cityRadiusLocal: 42,
    pavingColor: 0xdcc292,
    roadColor: 0xebd4a7,
    ring1Count: 12,
    ring2Count: 14,
    buildingPool: [
      { file: 'Inn.glb', minH: 8.5, maxH: 10.8 },
      { file: 'House_4.glb', minH: 6.8, maxH: 9.0 },
      { file: 'House_2.glb', minH: 6.4, maxH: 8.4 },
      { file: 'Gazebo.glb', minH: 5.0, maxH: 6.4 },
      { file: 'SpellShop_Hall.glb', minH: 7.6, maxH: 9.6 },
    ],
    propPool: [
      { file: 'MarketStand_2.glb', minH: 3.1, maxH: 3.6 },
      { file: 'Bench_1.glb', minH: 0.62, maxH: 0.72 },
      { file: 'Well.glb', minH: 2.8, maxH: 3.2 },
    ],
    treePool: [
      { file: 'Tree_2.glb', minH: 6.8, maxH: 9.2 },
    ],
    // 避開南側與西南側海灣，保留西～北～東～東南安全陸地弧段，確保外環鋪裝與環城大道 100% 落在陸塊內
    landArc: { start: Math.PI * 0.82, end: Math.PI * 2.25 },
    wallStyle: 'none',
    themeLandmark: 'dorias',
    lanternColor: 0xffd666,
    npcCount: 9,
    npcClothPalette: [0xc48f2b, 0x2d5a9e, 0x9c3556, 0x3d7d6e, 0x6b478f],
  },

  aiai: {
    id: 'aiai',
    innerR: 24,
    outerR: 43,
    cityRadiusLocal: 48,
    pavingColor: 0xf0d8ea,
    roadColor: 0xf7e6f2,
    ring1Count: 12,
    ring2Count: 14,
    buildingPool: [
      { file: 'House_2.glb', minH: 6.2, maxH: 8.2 },
      { file: 'House_4.glb', minH: 6.6, maxH: 8.8 },
      { file: 'Inn.glb', minH: 8.2, maxH: 9.8 },
      { file: 'Gazebo.glb', minH: 4.8, maxH: 6.0 },
    ],
    propPool: [
      { file: 'MarketStand_1.glb', minH: 3.0, maxH: 3.5 },
      { file: 'Bench_1.glb', minH: 0.62, maxH: 0.72 },
      { file: 'Well.glb', minH: 2.6, maxH: 3.0 },
    ],
    treePool: [
      { file: 'BlossomTree_1.glb', minH: 6.8, maxH: 9.8 },
      { file: 'BirchTree_1.glb', minH: 6.2, maxH: 8.4 },
    ],
    wallStyle: 'none',
    themeLandmark: 'aiai',
    lanternColor: 0xff85c0,
    npcCount: 9,
    npcClothPalette: [0xd9669f, 0x6b8cd9, 0xb36fd9, 0xe08d6c, 0x5ca8a8],
  },

  gi_port: {
    id: 'gi_port',
    innerR: 20,
    outerR: 32,
    cityRadiusLocal: 36,
    pavingColor: 0xbab09e,
    roadColor: 0xa89e8c,
    ring1Count: 10,
    ring2Count: 12,
    buildingPool: [
      { file: 'House_1.glb', minH: 5.8, maxH: 7.8 },
      { file: 'House_3.glb', minH: 6.0, maxH: 8.0 },
      { file: 'Inn.glb', minH: 7.8, maxH: 9.4 },
      { file: 'Soufrabi_Port.glb', minH: 7.0, maxH: 8.8 },
    ],
    propPool: [
      { file: 'MarketStand_1.glb', minH: 3.0, maxH: 3.5 },
      { file: 'Barrel.glb', minH: 0.52, maxH: 0.68 },
      { file: 'Cart.glb', minH: 1.9, maxH: 2.2 },
    ],
    treePool: [
      { file: 'Tree_1.glb', minH: 6.0, maxH: 8.2 },
    ],
    // 東北／東側為防波堤與海灣，陸地側往南～西～西北擴建（並由 isOnLand 保護）
    landArc: { start: Math.PI * 0.25, end: Math.PI * 1.45 },
    harborArc: { start: -Math.PI * 0.45, end: Math.PI * 0.1, shipCount: 4, shipFiles: ['Sailboat.glb'] },
    wallStyle: 'none',
    themeLandmark: 'gi_port',
    lanternColor: 0x70f0da,
    npcCount: 7,
    npcClothPalette: [0x35698c, 0x4f7d6e, 0x8f6b47, 0x455a80],
  },

  rubicuta: {
    id: 'rubicuta',
    innerR: 20,
    outerR: 36,
    cityRadiusLocal: 40,
    pavingColor: 0xc7bba6,
    roadColor: 0xb5a892,
    ring1Count: 9,
    ring2Count: 12,
    buildingPool: [
      { file: 'House_1.glb', minH: 5.8, maxH: 7.8 },
      { file: 'House_2.glb', minH: 6.0, maxH: 8.0 },
      { file: 'House_3.glb', minH: 5.8, maxH: 7.6 },
      { file: 'Blacksmith.glb', minH: 6.0, maxH: 7.4 },
      { file: 'Mill.glb', minH: 8.8, maxH: 10.5 },
      { file: 'Inn.glb', minH: 7.8, maxH: 9.4 },
    ],
    propPool: [
      { file: 'MarketStand_1.glb', minH: 3.0, maxH: 3.5 },
      { file: 'Cart.glb', minH: 1.9, maxH: 2.3 },
      { file: 'Well.glb', minH: 2.6, maxH: 3.0 },
    ],
    treePool: [
      { file: 'Tree_1.glb', minH: 6.2, maxH: 8.4 },
      { file: 'BirchTree_1.glb', minH: 6.0, maxH: 8.0 },
    ],
    wallStyle: 'none',
    themeLandmark: 'rubicuta',
    lanternColor: 0xffcf7a,
    npcCount: 7,
    npcClothPalette: [0x9e4238, 0x466d91, 0x5c7d48, 0x8a6943],
  },

  bunzen: {
    id: 'bunzen',
    innerR: 25,
    outerR: 44,
    cityRadiusLocal: 50,
    pavingColor: 0x99a677,
    roadColor: 0xc9b896,
    ring1Count: 10,
    ring2Count: 14,
    buildingPool: [
      { file: 'House_1.glb', minH: 5.8, maxH: 7.6 },
      { file: 'House_2.glb', minH: 6.0, maxH: 8.0 },
      { file: 'House_4.glb', minH: 6.2, maxH: 8.2 },
      { file: 'Mill.glb', minH: 9.0, maxH: 10.8 },
      { file: 'Inn.glb', minH: 7.8, maxH: 9.4 },
    ],
    propPool: [
      { file: 'MarketStand_2.glb', minH: 3.0, maxH: 3.5 },
      { file: 'Cart.glb', minH: 1.9, maxH: 2.3 },
      { file: 'Bench_1.glb', minH: 0.62, maxH: 0.72 },
    ],
    treePool: [
      { file: 'BirchTree_1.glb', minH: 6.5, maxH: 9.2 },
      { file: 'Tree_1.glb', minH: 6.5, maxH: 9.0 },
      { file: 'BlossomTree_1.glb', minH: 6.2, maxH: 8.5 },
    ],
    wallStyle: 'none',
    themeLandmark: 'bunzen',
    lanternColor: 0xffe08a,
    npcCount: 7,
    npcClothPalette: [0x59804a, 0xa88a3e, 0x4c7391, 0x8c5a44],
  },

  bandit_village: {
    id: 'bandit_village',
    innerR: 22,
    outerR: 40,
    cityRadiusLocal: 46,
    pavingColor: 0x6e624d,
    roadColor: 0x807058,
    ring1Count: 10,
    ring2Count: 12,
    buildingPool: [
      { file: 'House_1.glb', minH: 5.4, maxH: 7.2 },
      { file: 'House_3.glb', minH: 5.6, maxH: 7.4 },
      { file: 'Blacksmith.glb', minH: 5.8, maxH: 7.2 },
      { file: 'WatchTower.glb', minH: 8.4, maxH: 10.2 },
    ],
    propPool: [
      { file: 'Barrel.glb', minH: 0.52, maxH: 0.68 },
      { file: 'Cart.glb', minH: 1.9, maxH: 2.2 },
    ],
    treePool: [
      { file: 'Tree_1.glb', minH: 7.5, maxH: 10.8 },
      { file: 'Tree_2.glb', minH: 7.5, maxH: 10.8 },
    ],
    gateAngles: [Math.PI / 2],
    wallStyle: 'timber_palisade',
    themeLandmark: 'bandit_village',
    lanternColor: 0xff8c3b,
    npcCount: 6,
    npcClothPalette: [0x4a3d33, 0x6b3a2e, 0x3b4d3b, 0x5c4f3d],
  },
};

export interface ExpandCityContext {
  id: string;
  origCx: number;
  origCz: number;
  worldCx?: number;
  worldCz?: number;
  worldSpawnPos: [number, number, number];
  roads: RoadSegment[];
  lakes: Array<{ x: number; z: number; rx: number; rz: number }>;
  landLobes?: Array<{ x: number; z: number; rx: number; rz: number; rot?: number }>;
  models: ModelLibrary;
  addCircleCollider: (c: CircleCollider) => void;
  addBoxCollider: (b: BoxCollider) => void;
  addAnimated: (fn: (t: number, dt: number) => void) => void;
  addCameraOccluder?: (obj: THREE.Object3D) => void;
  createNpcMesh: (cloth: number, skin: number, hair: number) => THREE.Group;
}

function makeSeededRand(seedStr: string): () => number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < seedStr.length; i++) {
    h ^= seedStr.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return () => {
    h = (Math.imul(h, 1664525) + 1013904223) >>> 0;
    return h / 4294967296;
  };
}

function distToSegment2D(px: number, pz: number, s: RoadSegment): number {
  const dx = s.x2 - s.x1;
  const dz = s.z2 - s.z1;
  const lenSq = dx * dx + dz * dz;
  if (lenSq < 0.0001) return Math.hypot(px - s.x1, pz - s.z1);
  const t = THREE.MathUtils.clamp(((px - s.x1) * dx + (pz - s.z1) * dz) / lenSq, 0, 1);
  return Math.hypot(px - (s.x1 + t * dx), pz - (s.z1 + t * dz));
}

function angleInArc(angle: number, start: number, end: number): boolean {
  let a = angle;
  while (a < start) a += Math.PI * 2;
  while (a >= start + Math.PI * 2) a -= Math.PI * 2;
  return a <= end;
}

function angleDiff(a: number, b: number): number {
  let d = (a - b) % (Math.PI * 2);
  if (d > Math.PI) d -= Math.PI * 2;
  if (d < -Math.PI) d += Math.PI * 2;
  return Math.abs(d);
}

/**
 * 為貪婪之島 10 大城鎮附加外環街區、環城大道、特色主題地標、外城牆／木柵、街燈與城鎮居民。
 * 所有模型皆經由 zoneModels Proxy 放置，自動具備真實尺寸防重疊與精準 AABB 防穿模碰撞。
 */
export function buildExpandedCityDistricts(ctx: ExpandCityContext): THREE.Group | null {
  const cfg = CITY_EXPANSION_CONFIGS[ctx.id];
  if (!cfg) return null;

  const group = new THREE.Group();
  group.name = `city_expansion_${ctx.id}`;

  const rand = makeSeededRand(`gi_expand_v1_${ctx.id}`);
  const wx = ctx.worldCx ?? ctx.origCx * WORLD_SCALE;
  const wz = ctx.worldCz ?? ctx.origCz * WORLD_SCALE;

  const toWorld = (lx: number, lz: number): [number, number] => [
    wx + (lx - ctx.origCx) * ARCH_SCALE,
    wz + (lz - ctx.origCz) * ARCH_SCALE,
  ];

  /** 檢查世界座標是否位於陸塊橢圓內（保留 6m 內縮邊距，避免浮於海面或懸崖外） */
  const isOnLand = (tx: number, tz: number, inset = 6.0): boolean => {
    if (!ctx.landLobes || ctx.landLobes.length === 0) return true;
    for (const lobe of ctx.landLobes) {
      const erx = lobe.rx - inset;
      const erz = lobe.rz - inset;
      if (erx <= 1 || erz <= 1) continue;
      const dx = tx - lobe.x;
      const dz = tz - lobe.z;
      let ux = dx;
      let uz = dz;
      if (lobe.rot) {
        const c = Math.cos(lobe.rot);
        const s = Math.sin(lobe.rot);
        ux = dx * c - dz * s;
        uz = dx * s + dz * c;
      }
      if ((ux * ux) / (erx * erx) + (uz * uz) / (erz * erz) <= 1.0) {
        return true;
      }
    }
    return false;
  };

  /** 檢查該候選點是否安全（位於陸地、不擋道路、不擋出生點、不落入湖泊） */
  const isClearForPlacement = (lx: number, lz: number, extraRoadMargin = 13.5, extraSpawnMargin = 15.0): boolean => {
    const [tx, tz] = toWorld(lx, lz);
    // 必須落在陸塊安全範圍內
    if (!isOnLand(tx, tz, 6.0)) {
      return false;
    }
    // 避開出生點廣場
    if (Math.hypot(tx - ctx.worldSpawnPos[0], tz - ctx.worldSpawnPos[2]) < extraSpawnMargin) {
      return false;
    }
    // 避開所有聯外道路走廊
    for (const r of ctx.roads) {
      if (distToSegment2D(tx, tz, r) < r.width * 0.5 + extraRoadMargin) {
        return false;
      }
    }
    // 避開湖泊
    for (const lk of ctx.lakes) {
      const dx = (tx - lk.x) / (lk.rx + 12);
      const dz = (tz - lk.z) / (lk.rz + 12);
      if (dx * dx + dz * dz < 1) return false;
    }
    return true;
  };

  /** 本地物件防互疊清單（建築、地標、道具、樹木、街燈、角塔） */
  const placedLocalItems: Array<{ x: number; z: number; r: number }> = [];
  const isClearOfLocalItems = (lx: number, lz: number, r: number, padding = 0.85): boolean => {
    for (const item of placedLocalItems) {
      if (Math.hypot(lx - item.x, lz - item.z) < item.r + r + padding) {
        return false;
      }
    }
    return true;
  };

  // 1. 外環城市石板鋪裝＋環城大道（尊重 landArc，RingGeometry rotation.x = -PI/2 後局部 +y -> -z 故角度取負）
  const ringThetaStart = cfg.landArc ? -cfg.landArc.end : 0;
  const ringThetaLength = cfg.landArc ? cfg.landArc.end - cfg.landArc.start : Math.PI * 2;

  const apronGeo = new THREE.RingGeometry(
    Math.max(12, cfg.innerR - 6),
    cfg.cityRadiusLocal,
    48,
    1,
    ringThetaStart,
    ringThetaLength
  );
  const apronMat = new THREE.MeshStandardMaterial({
    color: cfg.pavingColor,
    roughness: 0.9,
    metalness: 0.02,
    polygonOffset: true,
    polygonOffsetFactor: -1,
    polygonOffsetUnits: -1,
  });
  const apron = new THREE.Mesh(apronGeo, apronMat);
  apron.rotation.x = -Math.PI / 2;
  apron.position.set(ctx.origCx, 0.011, ctx.origCz);
  apron.receiveShadow = true;
  group.add(apron);

  // 環城主幹道（位於兩層街區之間）
  const ringRoadR = (cfg.innerR + cfg.outerR) * 0.5;
  const ringRoadGeo = new THREE.RingGeometry(
    ringRoadR - 2.3,
    ringRoadR + 2.3,
    56,
    1,
    ringThetaStart,
    ringThetaLength
  );
  const ringRoadMat = new THREE.MeshStandardMaterial({
    color: cfg.roadColor,
    roughness: 0.84,
    metalness: 0.04,
    polygonOffset: true,
    polygonOffsetFactor: -1,
    polygonOffsetUnits: -1,
  });
  const ringRoad = new THREE.Mesh(ringRoadGeo, ringRoadMat);
  ringRoad.rotation.x = -Math.PI / 2;
  ringRoad.position.set(ctx.origCx, 0.021, ctx.origCz);
  ringRoad.receiveShadow = true;
  group.add(ringRoad);

  // 2. 兩層外環街區 GLB 建築群（經 zoneModels 自動防重疊＋實測 AABB 碰撞＋本地防互疊）
  const placeBuildingRing = (radius: number, count: number, ringJitter: number, phaseOffset: number) => {
    const startA = cfg.landArc ? cfg.landArc.start : 0;
    const endA = cfg.landArc ? cfg.landArc.end : Math.PI * 2;
    const span = endA - startA;
    for (let i = 0; i < count; i++) {
      const frac = (i + 0.5) / count;
      const ang = startA + frac * span + (rand() - 0.5) * 0.09 + phaseOffset;
      if (cfg.landArc && !angleInArc(ang, startA, endA)) continue;
      const r = radius + (rand() - 0.5) * ringJitter;
      const lx = ctx.origCx + Math.cos(ang) * r;
      const lz = ctx.origCz + Math.sin(ang) * r;
      if (!isClearForPlacement(lx, lz, 14.5, 16.5)) continue;

      const pick = cfg.buildingPool[Math.floor(rand() * cfg.buildingPool.length)];
      const h = pick.minH + rand() * (pick.maxH - pick.minH);
      const footprintR = Math.max(3.8, h * 0.52);
      if (!isClearOfLocalItems(lx, lz, footprintR, 1.2)) continue;
      placedLocalItems.push({ x: lx, z: lz, r: footprintR });

      // 面向城心或環城大道
      const rotY = Math.atan2(ctx.origCx - lx, ctx.origCz - lz) + (rand() - 0.5) * 0.25;

      void ctx.models.place(group, pick.file, {
        x: lx,
        y: 0,
        z: lz,
        targetHeight: h,
        rotY,
      });
    }
  };

  placeBuildingRing(cfg.innerR + 2.5, cfg.ring1Count, 3.8, 0.0);
  placeBuildingRing(cfg.outerR - 2.0, cfg.ring2Count, 5.2, 0.14);

  // 3. 各城市專屬外環特色地標（先於道具與樹木放置，確保地標與建築／樹木互不穿插）
  if (cfg.themeLandmark === 'masadora') {
    const candyColors = [0xff7eb6, 0x62f5dc, 0xffe066, 0xa288ff, 0x70c8ff, 0xff9f66];
    const stoneBaseMat = new THREE.MeshStandardMaterial({ color: 0xb8b2c4, roughness: 0.85 });
    const stemMat = new THREE.MeshStandardMaterial({ color: 0xf7f2ff, roughness: 0.62 });
    const dotMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.45 });
    const winFrameMat = new THREE.MeshStandardMaterial({ color: 0x6c5699, roughness: 0.55 });
    const winGlowMat = new THREE.MeshStandardMaterial({
      color: 0xfff0b3,
      emissive: 0xffd266,
      emissiveIntensity: 0.75,
      roughness: 0.3,
    });
    const doorWoodMat = new THREE.MeshStandardMaterial({ color: 0x6e442b, roughness: 0.82 });
    const doorTrimMat = new THREE.MeshStandardMaterial({ color: 0xd9b36c, roughness: 0.5, metalness: 0.3 });

    for (let i = 0; i < 8; i++) {
      const ang = (i / 8) * Math.PI * 2 + 0.22;
      const r = cfg.outerR + 2.5;
      const lx = ctx.origCx + Math.cos(ang) * r;
      const lz = ctx.origCz + Math.sin(ang) * r;
      if (!isClearForPlacement(lx, lz, 15.0, 16.0)) continue;
      if (!isClearOfLocalItems(lx, lz, 3.2, 1.0)) continue;
      placedLocalItems.push({ x: lx, z: lz, r: 3.2 });

      const tower = new THREE.Group();
      tower.position.set(lx, 0, lz);
      tower.rotation.y = Math.atan2(ctx.origCx - lx, ctx.origCz - lz);

      const bodyH = 7.5 + (i % 3) * 2.2;
      const capColor = candyColors[i % candyColors.length];
      const stripeColor = candyColors[(i + 2) % candyColors.length];

      // 石造基座環
      const plinth = new THREE.Mesh(new THREE.CylinderGeometry(2.25, 2.5, 0.7, 14), stoneBaseMat);
      plinth.position.y = 0.35;
      plinth.castShadow = true;
      plinth.receiveShadow = true;
      tower.add(plinth);

      // 主塔身
      const stem = new THREE.Mesh(new THREE.CylinderGeometry(1.4, 1.9, bodyH, 14), stemMat);
      stem.position.y = bodyH * 0.5 + 0.4;
      stem.castShadow = true;
      stem.receiveShadow = true;
      tower.add(stem);

      // 彩色糖果橫條紋
      const stripeMat = new THREE.MeshStandardMaterial({ color: stripeColor, roughness: 0.48 });
      for (const frac of [0.28, 0.52, 0.76]) {
        const sy = 0.4 + bodyH * frac;
        const sr = THREE.MathUtils.lerp(1.9, 1.4, frac) + 0.05;
        const stripe = new THREE.Mesh(new THREE.CylinderGeometry(sr, sr + 0.03, 0.45, 14), stripeMat);
        stripe.position.y = sy;
        tower.add(stripe);
      }

      // 木門（面向城心 +Z）
      const doorFrame = new THREE.Mesh(new THREE.BoxGeometry(1.18, 2.05, 0.28), doorTrimMat);
      doorFrame.position.set(0, 1.65, 1.78);
      tower.add(doorFrame);
      const door = new THREE.Mesh(new THREE.BoxGeometry(0.92, 1.85, 0.32), doorWoodMat);
      door.position.set(0, 1.6, 1.82);
      tower.add(door);

      // 發光拱窗（3 面向）
      for (let w = 0; w < 3; w++) {
        const wa = (w - 1) * (Math.PI * 0.65);
        const wy = bodyH * 0.66;
        const wr = THREE.MathUtils.lerp(1.9, 1.4, 0.66);
        const winGrp = new THREE.Group();
        winGrp.position.set(Math.sin(wa) * wr, wy, Math.cos(wa) * wr);
        winGrp.rotation.y = wa;

        const wFrame = new THREE.Mesh(new THREE.BoxGeometry(0.76, 1.05, 0.16), winFrameMat);
        winGrp.add(wFrame);
        const wGlass = new THREE.Mesh(new THREE.BoxGeometry(0.56, 0.82, 0.2), winGlowMat);
        winGrp.add(wGlass);
        const wArch = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.28, 0.2, 10), winGlowMat);
        wArch.rotation.x = Math.PI / 2;
        wArch.position.y = 0.41;
        winGrp.add(wArch);
        tower.add(winGrp);
      }

      // 蘑菇傘頂
      const capR = 2.95;
      const capY = bodyH + 0.1;
      const cap = new THREE.Mesh(
        new THREE.SphereGeometry(capR, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.58),
        new THREE.MeshStandardMaterial({ color: capColor, roughness: 0.44 })
      );
      cap.position.y = capY;
      cap.castShadow = true;
      tower.add(cap);

      // 蘑菇傘白圓點
      for (let d = 0; d < 7; d++) {
        const phi = d < 5 ? 0.82 : 0.42;
        const theta = d < 5 ? (d / 5) * Math.PI * 2 + i * 0.4 : (d - 5) * Math.PI + 0.7;
        const dot = new THREE.Mesh(new THREE.SphereGeometry(0.36, 8, 6), dotMat);
        dot.scale.set(1, 0.45, 1);
        dot.position.set(
          Math.sin(phi) * Math.cos(theta) * (capR - 0.04),
          capY + Math.cos(phi) * (capR - 0.04),
          Math.sin(phi) * Math.sin(theta) * (capR - 0.04)
        );
        dot.lookAt(
          dot.position.x * 2,
          capY + (dot.position.y - capY) * 2,
          dot.position.z * 2
        );
        dot.rotateX(Math.PI / 2);
        tower.add(dot);
      }

      group.add(tower);
      ctx.addCameraOccluder?.(tower);
      ctx.addCircleCollider({ x: lx, z: lz, r: 2.35 });
    }
  } else if (cfg.themeLandmark === 'dorias') {
    const stepMat = new THREE.MeshStandardMaterial({ color: 0xd9c293, roughness: 0.82 });
    const sandMat = new THREE.MeshStandardMaterial({ color: 0xe6c88a, roughness: 0.7 });
    const goldMat = new THREE.MeshStandardMaterial({ color: 0xe8bc45, roughness: 0.3, metalness: 0.65 });
    const domeMat = new THREE.MeshStandardMaterial({ color: 0x2a66b8, roughness: 0.32, metalness: 0.28 });
    const archGlowMat = new THREE.MeshStandardMaterial({
      color: 0xffe8a3,
      emissive: 0xffb833,
      emissiveIntensity: 0.8,
      roughness: 0.25,
    });

    for (let i = 0; i < 6; i++) {
      const ang = (i / 6) * Math.PI * 2 + 0.4;
      const r = cfg.outerR - 1.0;
      const lx = ctx.origCx + Math.cos(ang) * r;
      const lz = ctx.origCz + Math.sin(ang) * r;
      if (!isClearForPlacement(lx, lz, 15.0, 16.0)) continue;
      if (!isClearOfLocalItems(lx, lz, 4.0, 1.2)) continue;
      placedLocalItems.push({ x: lx, z: lz, r: 4.0 });

      const pav = new THREE.Group();
      pav.position.set(lx, 0, lz);

      // 階梯圓台
      const step1 = new THREE.Mesh(new THREE.CylinderGeometry(3.85, 4.05, 0.38, 16), stepMat);
      step1.position.y = 0.19;
      step1.receiveShadow = true;
      pav.add(step1);

      const step2 = new THREE.Mesh(new THREE.CylinderGeometry(3.45, 3.65, 0.36, 16), stepMat);
      step2.position.y = 0.56;
      step2.receiveShadow = true;
      pav.add(step2);

      // 八角砂岩涼亭主體
      const base = new THREE.Mesh(new THREE.CylinderGeometry(2.8, 3.15, 5.2, 8), sandMat);
      base.position.y = 3.3;
      base.castShadow = true;
      base.receiveShadow = true;
      pav.add(base);

      // 四向發光拱門窗
      for (let side = 0; side < 4; side++) {
        const sa = (side * Math.PI) / 2;
        const archGrp = new THREE.Group();
        archGrp.position.set(Math.sin(sa) * 2.86, 2.75, Math.cos(sa) * 2.86);
        archGrp.rotation.y = sa;

        const frame = new THREE.Mesh(new THREE.BoxGeometry(1.48, 2.6, 0.22), goldMat);
        archGrp.add(frame);
        const glass = new THREE.Mesh(new THREE.BoxGeometry(1.16, 2.25, 0.26), archGlowMat);
        archGrp.add(glass);
        const archTop = new THREE.Mesh(new THREE.CylinderGeometry(0.58, 0.58, 0.26, 12), archGlowMat);
        archTop.rotation.x = Math.PI / 2;
        archTop.position.y = 1.12;
        archGrp.add(archTop);
        pav.add(archGrp);
      }

      // 金色簷口環
      const cornice = new THREE.Mesh(new THREE.TorusGeometry(2.88, 0.22, 8, 24), goldMat);
      cornice.rotation.x = Math.PI / 2;
      cornice.position.y = 5.92;
      pav.add(cornice);

      // 藍金穹頂
      const dome = new THREE.Mesh(new THREE.SphereGeometry(2.75, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.56), domeMat);
      dome.position.y = 5.88;
      dome.castShadow = true;
      pav.add(dome);

      // 穹頂金色尖塔飾
      const spireCollar = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.65, 0.35, 10), goldMat);
      spireCollar.position.y = 8.55;
      pav.add(spireCollar);
      const spire = new THREE.Mesh(new THREE.ConeGeometry(0.28, 1.55, 8), goldMat);
      spire.position.y = 9.48;
      pav.add(spire);
      const finialOrb = new THREE.Mesh(new THREE.SphereGeometry(0.22, 8, 6), goldMat);
      finialOrb.position.y = 10.3;
      pav.add(finialOrb);

      group.add(pav);
      ctx.addCameraOccluder?.(pav);
      ctx.addCircleCollider({ x: lx, z: lz, r: 3.45 });
    }
  } else if (cfg.themeLandmark === 'aiai') {
    const pinkMat = new THREE.MeshStandardMaterial({
      color: 0xff85b8,
      emissive: 0x661a3a,
      emissiveIntensity: 0.42,
      roughness: 0.35,
    });
    const whiteMat = new THREE.MeshStandardMaterial({ color: 0xfff2f8, roughness: 0.6 });
    const roseGoldMat = new THREE.MeshStandardMaterial({
      color: 0xf0b6b8,
      emissive: 0x5c2638,
      emissiveIntensity: 0.28,
      roughness: 0.28,
      metalness: 0.68,
    });

    for (let i = 0; i < 6; i++) {
      const ang = (i / 6) * Math.PI * 2 + 0.3;
      const r = cfg.outerR;
      const lx = ctx.origCx + Math.cos(ang) * r;
      const lz = ctx.origCz + Math.sin(ang) * r;
      if (!isClearForPlacement(lx, lz, 14.0, 15.0)) continue;
      if (!isClearOfLocalItems(lx, lz, 1.8, 1.0)) continue;
      placedLocalItems.push({ x: lx, z: lz, r: 1.8 });

      const arch = new THREE.Group();
      arch.position.set(lx, 0, lz);

      // 階梯大理石基座
      const base1 = new THREE.Mesh(new THREE.CylinderGeometry(1.25, 1.4, 0.34, 8), whiteMat);
      base1.position.y = 0.17;
      base1.receiveShadow = true;
      arch.add(base1);

      const base2 = new THREE.Mesh(new THREE.CylinderGeometry(0.92, 1.08, 0.34, 8), whiteMat);
      base2.position.y = 0.51;
      base2.receiveShadow = true;
      arch.add(base2);

      // 大理石主柱
      const col = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.56, 4.8, 12), whiteMat);
      col.position.y = 3.05;
      col.castShadow = true;
      arch.add(col);

      // 柱底與柱頭金環
      const botRing = new THREE.Mesh(new THREE.TorusGeometry(0.58, 0.08, 8, 16), roseGoldMat);
      botRing.rotation.x = Math.PI / 2;
      botRing.position.y = 0.72;
      arch.add(botRing);

      const capRing = new THREE.Mesh(new THREE.TorusGeometry(0.56, 0.1, 8, 16), roseGoldMat);
      capRing.rotation.x = Math.PI / 2;
      capRing.position.y = 5.42;
      arch.add(capRing);

      const capPlate = new THREE.Mesh(new THREE.CylinderGeometry(0.76, 0.54, 0.28, 8), whiteMat);
      capPlate.position.y = 5.58;
      arch.add(capPlate);

      // 懸浮水晶與旋轉粉金光環
      const crystal = new THREE.Mesh(new THREE.OctahedronGeometry(1.05, 0), pinkMat);
      crystal.position.y = 6.85;
      arch.add(crystal);

      const halo = new THREE.Mesh(new THREE.TorusGeometry(1.42, 0.075, 8, 28), roseGoldMat);
      halo.position.y = 6.85;
      halo.rotation.x = Math.PI * 0.36;
      arch.add(halo);

      ctx.addAnimated((t) => {
        const bob = Math.sin(t * 2.0 + i) * 0.25;
        crystal.rotation.y = t * 1.1 + i;
        crystal.position.y = 6.85 + bob;
        halo.position.y = 6.85 + bob;
        halo.rotation.z = t * 1.35 + i;
        halo.rotation.y = t * 0.75;
      });
      group.add(arch);
      ctx.addCircleCollider({ x: lx, z: lz, r: 1.05 });
    }
  }

  // 4. 環城大道街景設施（市集攤位、水井、馬車、長椅）與行道樹
  const propCount = Math.round((cfg.ring1Count + cfg.ring2Count) * 0.55);
  const startA = cfg.landArc ? cfg.landArc.start : 0;
  const endA = cfg.landArc ? cfg.landArc.end : Math.PI * 2;
  const spanA = endA - startA;

  for (let i = 0; i < propCount; i++) {
    const ang = startA + ((i + 0.35) / propCount) * spanA;
    const r = ringRoadR + (i % 2 === 0 ? -3.4 : 3.4);
    const lx = ctx.origCx + Math.cos(ang) * r;
    const lz = ctx.origCz + Math.sin(ang) * r;
    if (!isClearForPlacement(lx, lz, 11.5, 13.0)) continue;

    const pick = cfg.propPool[Math.floor(rand() * cfg.propPool.length)];
    const h = pick.minH + rand() * (pick.maxH - pick.minH);
    const propR = Math.max(1.3, h * 0.55);
    if (!isClearOfLocalItems(lx, lz, propR, 0.9)) continue;
    placedLocalItems.push({ x: lx, z: lz, r: propR });

    const rotY = Math.atan2(ctx.origCx - lx, ctx.origCz - lz);
    void ctx.models.place(group, pick.file, {
      x: lx,
      y: 0,
      z: lz,
      targetHeight: h,
      rotY,
    });
  }

  // 行道樹與公園綠帶
  const treeCount = Math.round(cfg.cityRadiusLocal * 0.42);
  for (let i = 0; i < treeCount; i++) {
    const ang = startA + ((i + 0.62) / treeCount) * spanA;
    const r = cfg.outerR + 3.2 + (rand() - 0.5) * 3.0;
    const lx = ctx.origCx + Math.cos(ang) * r;
    const lz = ctx.origCz + Math.sin(ang) * r;
    if (!isClearForPlacement(lx, lz, 12.0, 14.0)) continue;

    const pick = cfg.treePool[Math.floor(rand() * cfg.treePool.length)];
    const h = pick.minH + rand() * (pick.maxH - pick.minH);
    const treeR = Math.max(2.3, h * 0.34);
    if (!isClearOfLocalItems(lx, lz, treeR, 1.0)) continue;
    placedLocalItems.push({ x: lx, z: lz, r: treeR });

    void ctx.models.place(group, pick.file, {
      x: lx,
      y: 0,
      z: lz,
      targetHeight: h,
      rotY: rand() * Math.PI * 2,
    });
  }

  // 5. 環城街燈（石造底座＋錐形鐵柱＋鍛鐵橫臂＋傘形燈頂蓋＋發光玻璃核心）
  const lanternCount = 12;
  const lampStoneMat = new THREE.MeshStandardMaterial({ color: 0x8f8b82, roughness: 0.88 });
  const postMat = new THREE.MeshStandardMaterial({ color: 0x323540, roughness: 0.48, metalness: 0.55 });
  const bulbMat = new THREE.MeshStandardMaterial({
    color: cfg.lanternColor,
    emissive: cfg.lanternColor,
    emissiveIntensity: 0.9,
    roughness: 0.22,
  });

  const lampPlinthGeo = new THREE.CylinderGeometry(0.28, 0.36, 0.42, 8);
  const lampPlinthTopGeo = new THREE.CylinderGeometry(0.2, 0.28, 0.16, 8);
  const lampPoleGeo = new THREE.CylinderGeometry(0.06, 0.13, 3.25, 8);
  const lampArmGeo = new THREE.BoxGeometry(0.08, 0.08, 0.72);
  const lampBraceGeo = new THREE.BoxGeometry(0.06, 0.06, 0.46);
  const lampCapGeo = new THREE.ConeGeometry(0.38, 0.26, 8);
  const lampGlassGeo = new THREE.CylinderGeometry(0.16, 0.12, 0.34, 8);
  const lampFinialGeo = new THREE.ConeGeometry(0.09, 0.16, 6);

  for (let i = 0; i < lanternCount; i++) {
    const ang = startA + ((i + 0.5) / lanternCount) * spanA;
    const r = ringRoadR - 2.4;
    const lx = ctx.origCx + Math.cos(ang) * r;
    const lz = ctx.origCz + Math.sin(ang) * r;
    if (!isClearForPlacement(lx, lz, 10.5, 11.5)) continue;
    if (!isClearOfLocalItems(lx, lz, 0.85, 0.6)) continue;
    placedLocalItems.push({ x: lx, z: lz, r: 0.85 });

    const lamp = new THREE.Group();
    lamp.position.set(lx, 0, lz);
    // 讓鍛鐵橫臂朝向環城大道外側
    lamp.rotation.y = Math.atan2(lx - ctx.origCx, lz - ctx.origCz);

    const plinth = new THREE.Mesh(lampPlinthGeo, lampStoneMat);
    plinth.position.y = 0.21;
    plinth.castShadow = true;
    lamp.add(plinth);

    const plinthTop = new THREE.Mesh(lampPlinthTopGeo, lampStoneMat);
    plinthTop.position.y = 0.5;
    lamp.add(plinthTop);

    const pole = new THREE.Mesh(lampPoleGeo, postMat);
    pole.position.y = 2.18;
    pole.castShadow = true;
    lamp.add(pole);

    const arm = new THREE.Mesh(lampArmGeo, postMat);
    arm.position.set(0, 3.68, 0.3);
    lamp.add(arm);

    const brace = new THREE.Mesh(lampBraceGeo, postMat);
    brace.position.set(0, 3.46, 0.18);
    brace.rotation.x = -Math.PI / 4;
    lamp.add(brace);

    const topCap = new THREE.Mesh(lampCapGeo, postMat);
    topCap.position.set(0, 3.55, 0.58);
    lamp.add(topCap);

    const glass = new THREE.Mesh(lampGlassGeo, bulbMat);
    glass.position.set(0, 3.28, 0.58);
    lamp.add(glass);

    const bottomTip = new THREE.Mesh(lampFinialGeo, postMat);
    bottomTip.rotation.x = Math.PI;
    bottomTip.position.set(0, 3.04, 0.58);
    lamp.add(bottomTip);

    group.add(lamp);
    ctx.addCircleCollider({ x: lx, z: lz, r: 0.42 });
  }

  // 6. 外城牆／木柵欄（尊重 gateAngles 與道路缺口、密集碰撞體、攝影機遮蔽、城垛／扶壁／排樁細節）
  if (cfg.wallStyle !== 'none') {
    const wallR = cfg.cityRadiusLocal - 1.2;
    const segments = cfg.wallStyle === 'white_royal' ? 28 : 24;
    const segArc = (Math.PI * 2) / segments;
    const segLen = 2 * wallR * Math.sin(segArc * 0.5);

    const wallMat =
      cfg.wallStyle === 'white_royal'
        ? new THREE.MeshStandardMaterial({ color: 0xedeae0, roughness: 0.68 })
        : cfg.wallStyle === 'timber_palisade'
          ? new THREE.MeshStandardMaterial({ color: 0x6b4b32, roughness: 0.92 })
          : new THREE.MeshStandardMaterial({ color: 0x9c9484, roughness: 0.85 });

    const wallAccentMat =
      cfg.wallStyle === 'white_royal'
        ? new THREE.MeshStandardMaterial({ color: 0xd9d3c3, roughness: 0.72 })
        : cfg.wallStyle === 'timber_palisade'
          ? new THREE.MeshStandardMaterial({ color: 0x523722, roughness: 0.94 })
          : new THREE.MeshStandardMaterial({ color: 0x827a6c, roughness: 0.88 });

    const roofTrimMat =
      cfg.wallStyle === 'white_royal'
        ? new THREE.MeshStandardMaterial({ color: 0xd4af37, roughness: 0.4, metalness: 0.45 })
        : cfg.wallStyle === 'timber_palisade'
          ? new THREE.MeshStandardMaterial({ color: 0x4d3421, roughness: 0.94 })
          : new THREE.MeshStandardMaterial({ color: 0xa64b3a, roughness: 0.78 });

    const wallH = cfg.wallStyle === 'white_royal' ? 5.2 : cfg.wallStyle === 'timber_palisade' ? 3.8 : 4.4;
    const isNearGate = (a: number): boolean => Boolean(cfg.gateAngles?.some((ga) => angleDiff(a, ga) < 0.24));

    const builtFlags: boolean[] = new Array(segments).fill(false);

    for (let i = 0; i < segments; i++) {
      const ang = (i + 0.5) * segArc;
      if (isNearGate(ang)) continue;

      const lx = ctx.origCx + Math.cos(ang) * wallR;
      const lz = ctx.origCz + Math.sin(ang) * wallR;

      // 道路入口與出生點保留寬敞大門通道，且不可超出陸塊
      if (!isClearForPlacement(lx, lz, 16.0, 18.0)) {
        continue;
      }

      builtFlags[i] = true;

      const wallGrp = new THREE.Group();
      wallGrp.position.set(lx, 0, lz);
      wallGrp.rotation.y = -ang + Math.PI / 2;

      if (cfg.wallStyle === 'timber_palisade') {
        // 多根尖頭圓木排樁＋雙條橫木綁帶
        const stakeSpacing = 0.64;
        const stakeCount = Math.max(6, Math.round((segLen * 0.98) / stakeSpacing));
        const actualStep = (segLen * 0.96) / stakeCount;
        const logGeo = new THREE.CylinderGeometry(0.24, 0.29, wallH - 0.55, 7);
        const tipGeo = new THREE.ConeGeometry(0.24, 0.72, 7);

        for (let s = 0; s < stakeCount; s++) {
          const sx = -segLen * 0.48 + (s + 0.5) * actualStep;
          const hJitter = ((s * 37 + i * 13) % 5 - 2) * 0.14;
          const stakeH = wallH - 0.55 + hJitter;

          const log = new THREE.Mesh(logGeo, s % 2 === 0 ? wallMat : wallAccentMat);
          log.scale.y = stakeH / (wallH - 0.55);
          log.position.set(sx, stakeH * 0.5, 0);
          log.castShadow = true;
          log.receiveShadow = true;
          wallGrp.add(log);

          const tip = new THREE.Mesh(tipGeo, wallMat);
          tip.position.set(sx, stakeH + 0.34, 0);
          tip.castShadow = true;
          wallGrp.add(tip);
        }

        // 雙條橫木綁帶
        const railGeo = new THREE.BoxGeometry(segLen * 0.98, 0.28, 0.72);
        for (const ry of [wallH * 0.3, wallH * 0.68]) {
          const rail = new THREE.Mesh(railGeo, roofTrimMat);
          rail.position.set(0, ry, 0);
          rail.castShadow = true;
          wallGrp.add(rail);
        }
      } else {
        // 石造／王城外牆：牆身＋頂冠＋城垛（merlons）＋立面扶壁石柱
        const wallMesh = new THREE.Mesh(new THREE.BoxGeometry(segLen * 0.98, wallH, 1.3), wallMat);
        wallMesh.position.y = wallH * 0.5;
        wallMesh.castShadow = true;
        wallMesh.receiveShadow = true;
        wallGrp.add(wallMesh);

        const capMesh = new THREE.Mesh(new THREE.BoxGeometry(segLen * 1.0, 0.42, 1.56), roofTrimMat);
        capMesh.position.y = wallH + 0.21;
        capMesh.castShadow = true;
        wallGrp.add(capMesh);

        // 城垛（merlons）
        const merlonCount = Math.max(4, Math.floor(segLen / 1.65));
        const mStep = (segLen * 0.9) / merlonCount;
        const merlonGeo = new THREE.BoxGeometry(mStep * 0.56, 0.72, 0.58);
        for (let m = 0; m < merlonCount; m++) {
          const mx = -segLen * 0.45 + (m + 0.5) * mStep;
          const merlon = new THREE.Mesh(merlonGeo, wallMat);
          merlon.position.set(mx, wallH + 0.76, 0.46);
          merlon.castShadow = true;
          wallGrp.add(merlon);
        }

        // 立面扶壁石柱（buttresses）
        const buttressGeo = new THREE.BoxGeometry(0.75, wallH * 0.96, 1.85);
        for (const bx of [-segLen * 0.32, 0, segLen * 0.32]) {
          const buttress = new THREE.Mesh(buttressGeo, wallAccentMat);
          buttress.position.set(bx, wallH * 0.48, 0);
          buttress.castShadow = true;
          buttress.receiveShadow = true;
          wallGrp.add(buttress);
        }
      }

      group.add(wallGrp);
      ctx.addCameraOccluder?.(wallGrp);

      // 依 segLen 動態計算密集圓形碰撞體（間距 <= 1.45 局部單位，r = 1.15）
      const colliderCount = Math.max(3, Math.ceil(segLen / 1.45) + 1);
      const tangentX = -Math.sin(ang);
      const tangentZ = Math.cos(ang);
      for (let c = 0; c < colliderCount; c++) {
        const frac = c / (colliderCount - 1) - 0.5;
        const offset = frac * (segLen * 0.94);
        ctx.addCircleCollider({
          x: lx + tangentX * offset,
          z: lz + tangentZ * offset,
          r: 1.15,
        });
      }

      // 每隔 4 段放置一座角塔
      if (i % 4 === 0) {
        const tx = ctx.origCx + Math.cos(ang - segArc * 0.5) * wallR;
        const tz = ctx.origCz + Math.sin(ang - segArc * 0.5) * wallR;
        if (isClearForPlacement(tx, tz, 15.0, 17.0) && isClearOfLocalItems(tx, tz, 2.8, 0.6)) {
          placedLocalItems.push({ x: tx, z: tz, r: 2.8 });
          const towerFile = cfg.wallStyle === 'timber_palisade' ? 'WatchTower.glb' : 'TownCornerTower.glb';
          void ctx.models.place(group, towerFile, {
            x: tx,
            y: 0,
            z: tz,
            targetHeight: cfg.wallStyle === 'white_royal' ? 11.5 : 9.2,
            rotY: -ang,
          });
        }
      }
    }

    // 門洞兩側對稱石柱／木門柱（凡缺口與已建牆體交界處自動立雙門柱）
    const gateBrazierMat = new THREE.MeshStandardMaterial({
      color: cfg.lanternColor,
      emissive: cfg.lanternColor,
      emissiveIntensity: 0.85,
      roughness: 0.25,
    });
    const placeGatePillar = (pillarAng: number) => {
      const px = ctx.origCx + Math.cos(pillarAng) * wallR;
      const pz = ctx.origCz + Math.sin(pillarAng) * wallR;
      const [twx, twz] = toWorld(px, pz);
      if (!isOnLand(twx, twz, 5.0)) return;
      if (!isClearOfLocalItems(px, pz, 1.3, 0.2)) return;
      placedLocalItems.push({ x: px, z: pz, r: 1.3 });

      const pillar = new THREE.Group();
      pillar.position.set(px, 0, pz);
      pillar.rotation.y = -pillarAng + Math.PI / 2;

      if (cfg.wallStyle === 'timber_palisade') {
        const pH = wallH + 1.4;
        const mainPost = new THREE.Mesh(new THREE.CylinderGeometry(0.56, 0.68, pH, 8), wallMat);
        mainPost.position.y = pH * 0.5;
        mainPost.castShadow = true;
        pillar.add(mainPost);

        const capCone = new THREE.Mesh(new THREE.ConeGeometry(0.68, 0.9, 8), roofTrimMat);
        capCone.position.y = pH + 0.42;
        pillar.add(capCone);

        const torch = new THREE.Mesh(new THREE.SphereGeometry(0.32, 8, 6), gateBrazierMat);
        torch.position.y = pH + 0.95;
        pillar.add(torch);
      } else {
        const pH = wallH + 1.8;
        const base = new THREE.Mesh(new THREE.BoxGeometry(2.1, 0.9, 2.1), wallAccentMat);
        base.position.y = 0.45;
        base.castShadow = true;
        pillar.add(base);

        const shaft = new THREE.Mesh(new THREE.BoxGeometry(1.65, pH, 1.65), wallMat);
        shaft.position.y = pH * 0.5 + 0.5;
        shaft.castShadow = true;
        shaft.receiveShadow = true;
        pillar.add(shaft);

        const capital = new THREE.Mesh(new THREE.BoxGeometry(2.05, 0.48, 2.05), roofTrimMat);
        capital.position.y = pH + 0.65;
        pillar.add(capital);

        const finial = new THREE.Mesh(new THREE.OctahedronGeometry(0.45, 0), gateBrazierMat);
        finial.position.y = pH + 1.35;
        pillar.add(finial);
      }

      group.add(pillar);
      ctx.addCameraOccluder?.(pillar);
      ctx.addCircleCollider({ x: px, z: pz, r: 1.15 });
    };

    for (let i = 0; i < segments; i++) {
      if (!builtFlags[i]) continue;
      const prevIdx = (i - 1 + segments) % segments;
      const nextIdx = (i + 1) % segments;
      const ang = (i + 0.5) * segArc;
      if (!builtFlags[prevIdx]) {
        placeGatePillar(ang - segArc * 0.5);
      }
      if (!builtFlags[nextIdx]) {
        placeGatePillar(ang + segArc * 0.5);
      }
    }
  }

  // 海港城市於海灣停泊額外船隊（吃水深度 y = -1.46 對應 world y = -2.92，自然吃水於 -2.8 海面）
  if (cfg.harborArc) {
    const { start, end, shipCount, shipFiles } = cfg.harborArc;
    for (let i = 0; i < shipCount; i++) {
      const ang = start + ((i + 0.5) / shipCount) * (end - start);
      const r = cfg.outerR + 8 + (i % 2) * 8;
      const lx = ctx.origCx + Math.cos(ang) * r;
      const lz = ctx.origCz + Math.sin(ang) * r;
      const file = shipFiles[i % shipFiles.length];
      void ctx.models.place(group, file, {
        x: lx,
        y: -1.46,
        z: lz,
        targetHeight: file === 'Pirate_Ship.glb' ? 12.5 : 8.5,
        rotY: ang + Math.PI * 0.5,
      });
    }
  }

  // 7. 外環城鎮居民（透過 createNpcMesh 自動反向縮放，維持 1.8m 真實人高）
  const skinPalette = [0xf5d0b5, 0xe8bc9b, 0xdba984, 0xf2c8a8];
  const hairPalette = [0x2b211a, 0x5c3c24, 0x8f6236, 0x1e2436, 0x7a3434];
  for (let i = 0; i < cfg.npcCount; i++) {
    const ang = startA + ((i + 0.45) / cfg.npcCount) * spanA;
    const r = ringRoadR + (rand() - 0.5) * 3.0;
    const lx = ctx.origCx + Math.cos(ang) * r;
    const lz = ctx.origCz + Math.sin(ang) * r;
    if (!isClearForPlacement(lx, lz, 9.0, 10.0)) continue;
    if (!isClearOfLocalItems(lx, lz, 0.7, 0.45)) continue;

    const cloth = cfg.npcClothPalette[i % cfg.npcClothPalette.length];
    const skin = skinPalette[i % skinPalette.length];
    const hair = hairPalette[i % hairPalette.length];
    const npc = ctx.createNpcMesh(cloth, skin, hair);
    npc.position.set(lx, 0, lz);
    npc.rotation.y = rand() * Math.PI * 2;
    group.add(npc);
    ctx.addCircleCollider({ x: lx, z: lz, r: 0.45 });
  }

  return group;
}
