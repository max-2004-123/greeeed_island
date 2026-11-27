/**
 * 新版 Greed Island（v2）單一資料源地圖定義：
 * - 所有 12 座城鎮座標、整平地基高度（padY）與半徑（padRadius）、傳送點（spawnPos）、
 *   道路折線（roads）、跨水橋梁（bridges）、內陸湖泊（lakes）、大型山脈（mountains）、
 *   森林帶（forests）與 12 個野外卡片拾取點（沿用舊存檔 ID）全部由此檔統一提供。
 * - 尺度以角色正常步行速度（10.5 m/s）與視線節奏校準：
 *   起始塔（Shiso Tree）→ 安多奇拔南門實走約 106m（~10 秒），落在 8–12 秒目標區間。
 */

export interface V2MapBounds {
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
}

export interface V2TownPlacement {
  id: string;
  /** 世界中心座標 X, Z */
  x: number;
  z: number;
  /** 整平地基高度（m） */
  padY: number;
  /** 整平地基半徑（m，確保所有核心建築與廣場 100% 貼地不懸空） */
  padRadius: number;
  /** 區域偵測與小地圖半徑（m） */
  detectRadius: number;
  /** 該區原 zone builder 的內部基準原點（local coords） */
  buildOrigin: { x: number; z: number };
  /** 傳送點相對於世界中心 (x, z) 的偏移 [dx, dz]（y 自動對齊 padY） */
  spawnOffset: [number, number];
  /** 傳送初始朝向（rad） */
  spawnYaw: number;
  /** 額外旋轉角度（讓城門或入口精準對齊道路，預設 0） */
  rotY?: number;
  /** 移交狀態標記 */
  stage: 'core3' | 'rest9';
  /** 外環擴建最大允許半徑（local 單位，0 表示不加外環以避免超出地形台地） */
  expansionMaxLocalR: number;
}

export interface V2RoadSegment {
  x1: number;
  z1: number;
  x2: number;
  z2: number;
  width: number;
  kind?: 'meadow' | 'forest' | 'mountain' | 'coastal';
}

export interface V2BridgeDef {
  id: string;
  x1: number;
  z1: number;
  x2: number;
  z2: number;
  width: number;
  deckY: number;
  style: 'timber' | 'stone';
}

export interface V2LakeDef {
  x: number;
  z: number;
  rx: number;
  rz: number;
  waterY: number;
}

export interface V2MountainRidge {
  x: number;
  z: number;
  rx: number;
  rz: number;
  height: number;
  rot?: number;
  biome: 'alpine' | 'badlands' | 'wooded_ridge';
}

export interface V2ForestZone {
  cx: number;
  cz: number;
  rx: number;
  rz: number;
  count: number;
  minH: number;
  maxH: number;
}

export interface V2PickupDef {
  id: string;
  cardId: number;
  x: number;
  z: number;
  label: string;
}

/** V2 全島邊界（對齊官方島嶼縱長比例 453:640 ≈ 0.708） */
export const V2_MAP_BOUNDS: V2MapBounds = {
  minX: -430,
  maxX: 490,
  minZ: -580,
  maxZ: 640,
};

/**
 * 12 座城鎮與地標配置（先驗證核心三區：shiso_tree / antokiba / bunzen，其餘 9 區依同流程對齊）
 */
export const V2_TOWN_PLACEMENTS: Record<string, V2TownPlacement> = {
  // === 第一階段核心三區 ===
  shiso_tree: {
    id: 'shiso_tree',
    x: 34,
    z: 492,
    padY: 4.2, // 開闊陽光緩坡高台，落地先見草原道路與遠方安多奇拔鐘樓
    padRadius: 34,
    detectRadius: 48,
    buildOrigin: { x: 6, z: 178 },
    spawnOffset: [0, -14], // (34, 4.2, 478) 面對正北草原路直通安多奇拔南門
    spawnYaw: -0.08,
    stage: 'core3',
    expansionMaxLocalR: 0,
  },
  antokiba: {
    id: 'antokiba',
    x: 42,
    z: 332,
    padY: 1.8, // 寬闊腹地平臺（南門在 z = 332 + 44 = 376，距起始點 ~104m ≈ 9.9 秒步行）
    padRadius: 68,
    detectRadius: 76,
    buildOrigin: { x: 26, z: 70 },
    spawnOffset: [0, 56], // (42, 1.8, 388) 南門外進城大道上
    spawnYaw: 0,
    stage: 'core3',
    expansionMaxLocalR: 0, // 保持既有完整巴伐利亞古城與廣場，不讓外環擠進南側草原視線
  },
  bunzen: {
    id: 'bunzen',
    x: 268,
    z: 472,
    padY: 2.4, // 東南林邊平地，以獨立林道＋木橋與起始塔／安多奇拔區隔
    padRadius: 62,
    detectRadius: 68,
    buildOrigin: { x: 98, z: 136 },
    spawnOffset: [-68, 0], // (200, 2.4, 472) 雙白石柱入口外開闊空地，方便轉動視角
    spawnYaw: -Math.PI / 2,
    stage: 'core3',
    expansionMaxLocalR: 0,
  },

  // === 第二階段其餘 9 座城鎮 ===
  rubicuta: {
    id: 'rubicuta',
    x: 16,
    z: 142,
    padY: 1.6, // 南側狹長地峽樞紐
    padRadius: 46,
    detectRadius: 56,
    buildOrigin: { x: 4, z: 36 },
    spawnOffset: [0, 28],
    spawnYaw: 0,
    stage: 'rest9',
    expansionMaxLocalR: 0,
  },
  aiai: {
    id: 'aiai',
    x: -165,
    z: 420,
    padY: 2.2, // 西南綠地半島（巨型西內灣南岸）
    padRadius: 54,
    detectRadius: 62,
    buildOrigin: { x: -36, z: 88 },
    spawnOffset: [0, 38],
    spawnYaw: 0,
    stage: 'rest9',
    expansionMaxLocalR: 0,
  },
  gi_port: {
    id: 'gi_port',
    x: -315,
    z: 175,
    padY: 0.7, // 西側 C 型半島海灣，低矮港岸銜接西側大片內灣
    padRadius: 48,
    detectRadius: 56,
    buildOrigin: { x: -66, z: 54 },
    spawnOffset: [22, 22],
    spawnYaw: 0.65,
    stage: 'rest9',
    expansionMaxLocalR: 0,
  },
  badlands: {
    id: 'badlands',
    x: -32,
    z: -120,
    padY: 1.4, // 雙側紅岩峭壁峽谷通道，保留可穿越谷底
    padRadius: 50,
    detectRadius: 64,
    buildOrigin: { x: -16, z: -46 },
    spawnOffset: [12, 36],
    spawnYaw: 0.45,
    stage: 'rest9',
    expansionMaxLocalR: 0,
  },
  masadora: {
    id: 'masadora',
    x: -176,
    z: -268,
    padY: 2.6, // 西北內陸魔法盆地
    padRadius: 68,
    detectRadius: 74,
    buildOrigin: { x: -42, z: -76 },
    spawnOffset: [0, 48],
    spawnYaw: 0,
    stage: 'rest9',
    expansionMaxLocalR: 0,
  },
  dorias: {
    id: 'dorias',
    x: -235,
    z: -62,
    padY: 2.2, // 西中彎曲岬角高地
    padRadius: 52,
    detectRadius: 60,
    buildOrigin: { x: -52, z: -26 },
    spawnOffset: [30, 0],
    spawnYaw: Math.PI / 2,
    stage: 'rest9',
    expansionMaxLocalR: 0,
  },
  soufrabi: {
    id: 'soufrabi',
    x: 245,
    z: -72,
    padY: 0.55, // 東中弧形海灣港口，低港岸自然接上海灣
    padRadius: 64,
    detectRadius: 70,
    buildOrigin: { x: 64, z: -30 },
    spawnOffset: [-48, 0],
    spawnYaw: -Math.PI / 2,
    stage: 'rest9',
    expansionMaxLocalR: 0,
  },
  limeiro: {
    id: 'limeiro',
    x: 108,
    z: -368,
    padY: 6.2, // 東北高地山城王都，沿緩坡大道攀升而上
    padRadius: 82,
    detectRadius: 92,
    buildOrigin: { x: 14, z: -104 },
    spawnOffset: [0, 84],
    spawnYaw: 0,
    stage: 'rest9',
    expansionMaxLocalR: 0,
  },
  bandit_village: {
    id: 'bandit_village',
    x: -252,
    z: -435,
    padY: 3.6, // 北側崎嶇半島密林，經北側水道木橋抵達
    padRadius: 50,
    detectRadius: 58,
    buildOrigin: { x: -74, z: -124 },
    spawnOffset: [0, 34],
    spawnYaw: 0,
    stage: 'rest9',
    expansionMaxLocalR: 0,
  },
};

/**
 * 沿緩坡、谷地與橋梁鋪設的全島道路網（與小地圖、地形整平共用同一份資料）
 */
export const V2_ROADS: V2RoadSegment[] = [
  // 1. 起始塔（紫蘇樹）→ 蜿蜒草原道路 → 安多奇拔南門（實走 ~106m ≈ 10s）
  { x1: 24, z1: 486, x2: 24, z2: 472, width: 7.5, kind: 'meadow' },
  { x1: 24, z1: 472, x2: 14, z2: 444, width: 7.8, kind: 'meadow' },
  { x1: 14, z1: 444, x2: 26, z2: 416, width: 8.0, kind: 'meadow' },
  { x1: 26, z1: 416, x2: 42, z2: 392, width: 8.4, kind: 'meadow' },
  { x1: 42, z1: 392, x2: 42, z2: 372, width: 9.0, kind: 'meadow' },

  // 2. 獨立東南林道：自南部草原岔路往東繞過林脊、跨越木橋進入布恩森鎮口空地
  { x1: 20, z1: 452, x2: 88, z2: 462, width: 7.0, kind: 'forest' },
  { x1: 88, z1: 462, x2: 136, z2: 472, width: 7.0, kind: 'forest' },
  { x1: 136, z1: 472, x2: 200, z2: 472, width: 7.2, kind: 'forest' },
  { x1: 200, z1: 472, x2: 236, z2: 472, width: 7.6, kind: 'forest' },

  // 3. 安多奇拔北門 → 狹長地峽 → 魯比克塔
  { x1: 42, z1: 280, x2: 36, z2: 220, width: 8.0, kind: 'meadow' },
  { x1: 36, z1: 220, x2: 16, z2: 168, width: 8.0, kind: 'meadow' },

  // 4. 南部草原 → 西南半島 → 戀愛都市愛愛 → 跨海石橋 → 貪婪之島港
  { x1: 18, z1: 432, x2: -64, z2: 436, width: 7.0, kind: 'coastal' },
  { x1: -64, z1: 436, x2: -165, z2: 452, width: 7.2, kind: 'coastal' },
  { x1: -195, z1: 400, x2: -275, z2: 340, width: 6.8, kind: 'coastal' },
  { x1: -275, z1: 340, x2: -315, z2: 250, width: 6.8, kind: 'coastal' },
  { x1: -315, z1: 250, x2: -305, z2: 198, width: 7.0, kind: 'coastal' },

  // 5. 魯比克塔 → 中央平原 → 荒地峽谷 → 瑪莎多拉
  { x1: 16, z1: 108, x2: 4, z2: 12, width: 8.0, kind: 'meadow' },
  { x1: 4, z1: 12, x2: -22, z2: -86, width: 7.8, kind: 'mountain' },
  { x1: -44, z1: -156, x2: -115, z2: -214, width: 7.6, kind: 'mountain' },
  { x1: -115, z1: -214, x2: -176, z2: -222, width: 7.8, kind: 'meadow' },

  // 6. 中央平原 → 壽富拉比海港
  { x1: 12, z1: 66, x2: 112, z2: -18, width: 7.4, kind: 'coastal' },
  { x1: 112, z1: -18, x2: 196, z2: -72, width: 7.6, kind: 'coastal' },

  // 7. 荒地峽谷 → 賭博都市多里亞斯
  { x1: -32, z1: -88, x2: -135, z2: -72, width: 7.2, kind: 'coastal' },
  { x1: -135, z1: -72, x2: -202, z2: -62, width: 7.4, kind: 'coastal' },

  // 8. 荒地峽谷／中央平原 → 盤山王道 → 首都利梅洛
  { x1: -8, z1: -152, x2: 52, z2: -226, width: 8.2, kind: 'mountain' },
  { x1: 52, z1: -226, x2: 108, z2: -284, width: 8.6, kind: 'mountain' },

  // 9. 瑪莎多拉 → 北側水道木橋 → 山賊之村
  { x1: -188, z1: -310, x2: -228, z2: -362, width: 6.8, kind: 'forest' },
  { x1: -228, z1: -362, x2: -252, z2: -400, width: 6.8, kind: 'forest' },
];

/** 跨水路段實體可行走橋梁（附欄杆碰撞體） */
export const V2_BRIDGES: V2BridgeDef[] = [
  {
    id: 'bridge_bunzen_creek',
    x1: 142,
    z1: 472,
    x2: 184,
    z2: 472,
    width: 7.4,
    deckY: 2.35,
    style: 'timber',
  },
  {
    id: 'bridge_gi_port_inlet',
    x1: -292,
    z1: 306,
    x2: -314,
    z2: 248,
    width: 7.0,
    deckY: 1.5,
    style: 'stone',
  },
  {
    id: 'bridge_bandit_strait',
    x1: -208,
    z1: -336,
    x2: -238,
    z2: -378,
    width: 6.8,
    deckY: 3.1,
    style: 'timber',
  },
];

/** 中央開闊平原與分散湖泊（1:1 精準量測自官方附圖 5 座藍湖位置） */
export const V2_LAKES: V2LakeDef[] = [
  { x: 211, z: -181, rx: 42, rz: 24, waterY: 0.15 }, // 東北利梅洛南側大藍湖
  { x: -113, z: -258, rx: 32, rz: 24, waterY: 0.15 }, // 西北瑪莎多拉東側湖
  { x: 35, z: 30, rx: 20, rz: 15, waterY: 0.15 }, // 中央平原清湖
  { x: 123, z: -13, rx: 24, rz: 17, waterY: 0.15 }, // 中東雙池湖
  { x: -98, z: 499, rx: 44, rz: 23, waterY: 0.15 }, // 南部林間雙湖
];

/** 從附圖提取的大型山脈、紅岩峽谷與視線隔屏山脊 */
export const V2_MOUNTAIN_RIDGES: V2MountainRidge[] = [
  // 北側崎嶇半島山脊
  { x: -175, z: -385, rx: 82, rz: 48, height: 28, rot: -0.2, biome: 'alpine' },
  // 東北近岸山島高峰
  { x: 328, z: -435, rx: 64, rz: 66, height: 34, rot: 0.3, biome: 'alpine' },
  // 利梅洛西南護山脈
  { x: 30, z: -288, rx: 62, rz: 30, height: 21, rot: -0.1, biome: 'alpine' },
  // 中北橫亙山脈（瑪莎多拉南側）
  { x: -115, z: -182, rx: 76, rz: 28, height: 22, rot: 0.05, biome: 'alpine' },
  // 東中雙列大山脈（壽富拉比南側）
  { x: 248, z: 32, rx: 86, rz: 42, height: 28, rot: -0.15, biome: 'alpine' },
  { x: 256, z: 106, rx: 82, rz: 36, height: 24, rot: -0.12, biome: 'alpine' },
  // 中南紅岩台地（荒地峽谷左右夾峙峭壁，中間留谷底通道）
  { x: -96, z: -118, rx: 46, rz: 34, height: 22, rot: 0.15, biome: 'badlands' },
  { x: 34, z: -124, rx: 44, rz: 32, height: 21, rot: -0.12, biome: 'badlands' },
  // 地峽南側紅岩丘（安多奇拔與愛愛之間地標丘）
  { x: -72, z: 348, rx: 48, rz: 32, height: 17, rot: 0.1, biome: 'badlands' },
  // 東南近岸山島（布恩森北側隔海相望）
  { x: 205, z: 268, rx: 58, rz: 74, height: 29, rot: 0.25, biome: 'alpine' },
  // 起始塔／安多奇拔與布恩森之間的柔和林脊（形成獨立視覺區隔）
  { x: 132, z: 386, rx: 46, rz: 52, height: 10.5, rot: -0.18, biome: 'wooded_ridge' },
];

/** 森林區塊（與城鎮地基、道路自動避讓） */
export const V2_FOREST_ZONES: V2ForestZone[] = [
  { cx: 130, cz: 392, rx: 58, rz: 66, count: 44, minH: 6.5, maxH: 10.5 }, // 安多奇拔與布恩森之間的綠林脊
  { cx: 322, cz: 472, rx: 48, rz: 72, count: 42, minH: 7.0, maxH: 11.5 }, // 布恩森東側除念之森
  { cx: -252, cz: -435, rx: 86, rz: 74, count: 56, minH: 7.5, maxH: 12.5 }, // 西北半島山賊密林
  { cx: -118, cz: 505, rx: 82, rz: 58, count: 38, minH: 6.5, maxH: 10.2 }, // 南部林湖帶
  { cx: 165, cz: -145, rx: 72, rz: 56, count: 34, minH: 6.5, maxH: 10.0 }, // 中東森林平原
  { cx: -158, cz: -342, rx: 64, rz: 54, count: 30, minH: 6.8, maxH: 10.5 }, // 瑪莎多拉北林
];

/** 12 處野外卡片拾取點（100% 沿用既有拾取 ID，完全相容舊存檔 SaveData） */
export const V2_PICKUPS: V2PickupDef[] = [
  { id: 'pickup_rock', cardId: 100, x: 24, z: 454, label: '拾取野外卡片【一塊石頭】(No.100)' },
  { id: 'pickup_pouch_1', cardId: 101, x: 14, z: 378, label: '拾取安多奇拔城外【旅行者的錢袋】' },
  { id: 'pickup_pouch_2', cardId: 101, x: -136, z: -230, label: '拾取瑪莎多拉市集旁【旅行者的錢袋】' },
  { id: 'pickup_silver_dog', cardId: 49, x: 184, z: -98, label: '拾取壽富拉比海灣【銀犬】(No.049)' },
  { id: 'pickup_gold_box', cardId: 58, x: 108, z: -272, label: '拾取利梅洛王道旁【黃金寶箱】(No.058)' },
  { id: 'pickup_herb', cardId: 102, x: 176, z: 484, label: '拾取布恩森林道旁【除念草藥】' },
  { id: 'pickup_ruin_key', cardId: 11, x: -16, z: -118, label: '拾取荒地峽谷【黃金天秤】(No.011)' },
  { id: 'pickup_phantom_ore', cardId: 28, x: 34, z: 168, label: '拾取魯比克塔地峽【幻影礦石】(No.028)' },
  { id: 'pickup_risky_dice', cardId: 84, x: -188, z: -48, label: '拾取多里亞斯賭城【風險骰子】(No.084)' },
  { id: 'pickup_alexandrite', cardId: 75, x: -242, z: -386, label: '拾取山賊之村密林【奇運亞歷山大石】(No.075)' },
  { id: 'pickup_angel_breath', cardId: 17, x: -158, z: 378, label: '拾取愛愛櫻花林【大天使的氣息】(No.017)' },
  { id: 'pickup_coastline', cardId: 2, x: -286, z: 156, label: '拾取貪婪之島港海灣【一坪的海岸線】(No.002)' },
];
