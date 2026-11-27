import { isV2Map } from './mapVersion';
import { V2_TOWN_PLACEMENTS } from './v2/mapDataV2';

export type CanonConfidence = 'high' | 'medium' | 'inferred';
export type AmbientAudioProfile =
  | 'lobby'
  | 'meadow'
  | 'town'
  | 'canyon'
  | 'magic'
  | 'harbor'
  | 'capital'
  | 'forest';

export interface LocationDef {
  id: string;
  name: string;
  enName: string;
  directionLabel: string;
  coords: { x: number; z: number; radius: number };
  spawnPos: [number, number, number];
  spawnYaw: number;
  visualTheme: {
    skyHex: number;
    fogHex: number;
    fogDensity: number;
    sunIntensity: number;
    accentHex: string;
    mapDotHex: string;
    description: string;
  };
  landmarks: string[];
  groundMaterial: {
    surfaceType: 'grass' | 'cobblestone' | 'sedimentary_dirt' | 'magic_plaza' | 'boardwalk' | 'hill_stone' | 'forest_floor';
    colorHex: number;
    roughness: number;
  };
  ambientAudio: AmbientAudioProfile;
  interactions: string[];
  canonConfidence: CanonConfidence;
  canonNote: string;
}

export const WORLD_SCALE = 5;
export const ARCH_SCALE = 2;

const RAW_GI_LOCATIONS: LocationDef[] = [
  {
    id: 'shiso_tree',
    name: '起始點・紫蘇樹高塔',
    enName: 'Shiso Tree (Starting Point)',
    directionLabel: '南部開闊草原',
    coords: { x: 6, z: 178, radius: 26 },
    spawnPos: [6, 0, 174],
    spawnYaw: 0,
    visualTheme: {
      skyHex: 0x7cc8f8,
      fogHex: 0xa6ddfc,
      fogDensity: 0.002,
      sunIntensity: 1.48,
      accentHex: '#b388ff',
      mapDotHex: '#c5a3ff',
      description: '2011 動畫版紫色圓柱石磚尖頂孤塔佇立於無垠綠草原，朝北可遠望安多奇拔鐘樓，沿曲折草原道路展開冒險。',
    },
    landmarks: ['紫色石磚圓柱尖頂塔', '塔前開闊起點陣盤與路旁石碑', '往安多奇拔的曲折草原道路'],
    groundMaterial: { surfaceType: 'grass', colorHex: 0x5ba44c, roughness: 0.92 },
    ambientAudio: 'meadow',
    interactions: ['sign_welcome', 'pickup_rock'],
    canonConfidence: 'high',
    canonNote: '依據 Hunterpedia 2011 動畫截圖（孤立紫色圓柱尖頂石塔於平坦綠草原）與伊妲（Eta）設定。',
  },
  {
    id: 'antokiba',
    name: '懸賞都市・安多奇拔',
    enName: 'City of Prizes, Antokiba',
    directionLabel: '中南（最靠近起始點）',
    coords: { x: 26, z: 70, radius: 34 },
    spawnPos: [26, 0, 102],
    spawnYaw: 0,
    visualTheme: {
      skyHex: 0x82ccf9,
      fogHex: 0xabdffb,
      fogDensity: 0.0024,
      sunIntensity: 1.45,
      accentHex: '#e07a5f',
      mapDotHex: '#c2a67a',
      description: '鄰近起點的紅瓦屋頂歐風古城（原型德國羅騰堡），高聳鐘樓遠處可辨，設月例懸賞大賽舞台與市集。',
    },
    landmarks: ['高聳地標鐘樓與紅瓦木骨屋群', '可穿行南側雙塔城門', '月例懸賞大賽舞台'],
    groundMaterial: { surfaceType: 'cobblestone', colorHex: 0xc2baa9, roughness: 0.85 },
    ambientAudio: 'town',
    interactions: ['npc_antokiba_host', 'pickup_pouch_1'],
    canonConfidence: 'high',
    canonNote: '依據 Hunterpedia：最靠近起點的紅瓦城鎮，建築原型為 Rothenburg ob der Tauber。',
  },
  {
    id: 'rubicuta',
    name: '魯比克塔',
    enName: 'Rubicuta',
    directionLabel: '中央偏南地峽（官方紅點）',
    coords: { x: 4, z: 36, radius: 20 },
    spawnPos: [4, 0, 48],
    spawnYaw: 0,
    visualTheme: {
      skyHex: 0x7dc6f5,
      fogHex: 0xa4d9f7,
      fogDensity: 0.003,
      sunIntensity: 1.42,
      accentHex: '#d64545',
      mapDotHex: '#d64545',
      description: '位於西側封閉海灣與東側橢圓海灣之間地峽的半木構紅棕瓦屋小鎮。',
    },
    landmarks: ['地峽石板廣場與古井', '歐風半木構屋舍', '北側中央屏障山脈門戶'],
    groundMaterial: { surfaceType: 'cobblestone', colorHex: 0xc9beab, roughness: 0.85 },
    ambientAudio: 'town',
    interactions: ['pickup_phantom_ore'],
    canonConfidence: 'high',
    canonNote: '座標 100% 對應 Hunterpedia 畫廊 Rubicuta_2011.png 的官方紅點地峽位置。',
  },
  {
    id: 'badlands',
    name: '荒地峽谷',
    enName: 'Badlands',
    directionLabel: '中北內陸（往瑪莎多拉必經之路）',
    coords: { x: -16, z: -46, radius: 26 },
    spawnPos: [-10, 0, -28],
    spawnYaw: 0.48,
    visualTheme: {
      skyHex: 0x8ea9bd,
      fogHex: 0xa2b8c9,
      fogDensity: 0.0046,
      sunIntensity: 1.28,
      accentHex: '#6c8499',
      mapDotHex: '#7d8fa1',
      description: '2011 動畫風格的水平分層灰藍沉積岩峭壁與峽谷走廊，比司吉訓練小傑奇犽的修行地。',
    },
    landmarks: ['水平分層沉積岩台地群', '雙側峭壁峽谷通道（遠景對準瑪莎多拉）', '廢棄露營石堆'],
    groundMaterial: { surfaceType: 'sedimentary_dirt', colorHex: 0x8c7f6c, roughness: 0.96 },
    ambientAudio: 'canyon',
    interactions: ['pickup_ruin_key'],
    canonConfidence: 'high',
    canonNote: '依據 Hunterpedia 2011 動畫截圖（灰藍分層沉積岩峭壁與薄霧）與前往瑪莎多拉的劇情動線。',
  },
  {
    id: 'masadora',
    name: '魔法都市・瑪莎多拉',
    enName: 'Magic City of Masadora',
    directionLabel: '西北內陸（穿過荒地峽谷）',
    coords: { x: -42, z: -76, radius: 32 },
    spawnPos: [-42, 0, -54],
    spawnYaw: 0,
    visualTheme: {
      skyHex: 0x85c4f8,
      fogHex: 0xc3d8fa,
      fogDensity: 0.0028,
      sunIntensity: 1.44,
      accentHex: '#38e4c5',
      mapDotHex: '#9b6fd4',
      description: '全島唯一販售咒語卡的奇幻魔法都市：粉彩迎賓拱門、白圓頂熊貓頭咒語卡商店、10×4 黑白棋盤步道與 8 座彩色糖果蘑菇彩蛋塔。',
    },
    landmarks: [
      '白圓頂熊貓頭造型咒語卡商店（雙層藍白耳＋亮面藍圓眼）',
      '10×4 黑白棋盤格紋步道、雙層綠籬與粉彩花圃',
      '8 座彩色條紋圓點糖果蘑菇與彩蛋高塔群',
      '粉彩魔法都市迎賓拱門（荒地峽谷入口）',
      '瑪莎多拉交易市集與情報員',
    ],
    groundMaterial: { surfaceType: 'magic_plaza', colorHex: 0xdad4e8, roughness: 0.78 },
    ambientAudio: 'magic',
    interactions: ['masadora_shop', 'npc_hunter_guide', 'pickup_pouch_2'],
    canonConfidence: 'high',
    canonNote: '建築造型嚴格對應 Hunterpedia 2011 動畫瑪莎多拉與 Spell Card Shop 畫廊截圖。',
  },
  {
    id: 'soufrabi',
    name: '海濱都市・壽富拉比',
    enName: 'Port City of Soufrabi',
    directionLabel: '東中海岸海灣',
    coords: { x: 64, z: -30, radius: 32 },
    spawnPos: [42, 0, -30],
    spawnYaw: -Math.PI / 2,
    visualTheme: {
      skyHex: 0x67b6eb,
      fogHex: 0x99d2f2,
      fogDensity: 0.0031,
      sunIntensity: 1.4,
      accentHex: '#f0a64c',
      mapDotHex: '#e09f4c',
      description: '磊札海盜團盤踞的弧形海灣港口：海崖多層燈塔要塞、深藍海盜據點、入海棧橋與磊札躲避球場。',
    },
    landmarks: ['海崖多層燈塔要塞（雙向旋轉探照光束）', '深藍尖頂海盜據點', '木造入海棧橋與海盜大帆船', '磊札躲避球場與 14 人的惡魔'],
    groundMaterial: { surfaceType: 'boardwalk', colorHex: 0x9c764e, roughness: 0.88 },
    ambientAudio: 'harbor',
    interactions: ['npc_razor', 'pickup_silver_dog'],
    canonConfidence: 'high',
    canonNote: '依據 Hunterpedia 壽富拉比弧形海灣、深藍海盜據點、海崖多層燈塔要塞與磊札躲避球設定。',
  },
  {
    id: 'limeiro',
    name: '首都・利梅洛',
    enName: 'Capital City of Limeiro',
    directionLabel: '東北高地（破關終點）',
    coords: { x: 14, z: -104, radius: 44 },
    spawnPos: [14, 0, -64],
    spawnYaw: 0,
    visualTheme: {
      skyHex: 0x8ccff8,
      fogHex: 0xc2e2fa,
      fogDensity: 0.0024,
      sunIntensity: 1.52,
      accentHex: '#f0c659',
      mapDotHex: '#e6c86e',
      description: '沿綠坡層層攀升的紅橘屋頂山城，頂端矗立杜恩與李斯特的純白多翼歐洲大城堡，全島北方遠景核心地標。',
    },
    landmarks: ['三層爬升紅橘屋頂山城民宅', '山頂純白多翼大城堡與尖塔群', '王城階梯大道與破關石碑'],
    groundMaterial: { surfaceType: 'hill_stone', colorHex: 0x889482, roughness: 0.84 },
    ambientAudio: 'capital',
    interactions: ['sign_limeiro', 'pickup_gold_box'],
    canonConfidence: 'high',
    canonNote: '依據 Hunterpedia 首都利梅洛畫廊：密集群聚的紅橘屋頂山坡城鎮＋山頂純白多翼城堡。',
  },
  {
    id: 'dorias',
    name: '賭博都市・多里亞斯',
    enName: 'Gambling City of Dorias',
    directionLabel: '西中彎曲岬角',
    coords: { x: -52, z: -26, radius: 24 },
    spawnPos: [-38, 0, -26],
    spawnYaw: Math.PI / 2,
    visualTheme: {
      skyHex: 0x93c8ee,
      fogHex: 0xd9cfa8,
      fogDensity: 0.0032,
      sunIntensity: 1.48,
      accentHex: '#e6bf73',
      mapDotHex: '#e6bf73',
      description: '金沙色華麗城堡高塔與藍色尖頂、棕櫚樹林立的賭博之城。',
    },
    landmarks: ['金沙色藍頂賭場城堡', '棕櫚大道', '賭場之王挑戰點'],
    groundMaterial: { surfaceType: 'cobblestone', colorHex: 0xd9b882, roughness: 0.78 },
    ambientAudio: 'town',
    interactions: ['npc_dorias_dealer', 'pickup_risky_dice'],
    canonConfidence: 'medium',
    canonNote: '建築視覺依據 Hunterpedia 畫廊（金沙色城堡＋藍尖頂＋棕櫚樹）；方位依西側內陸推估。',
  },
  {
    id: 'aiai',
    name: '戀愛都市・愛愛',
    enName: 'The City of Love, Aiai',
    directionLabel: '西南綠地半島',
    coords: { x: -52, z: 136, radius: 24 },
    spawnPos: [-52, 0, 154],
    spawnYaw: 0,
    visualTheme: {
      skyHex: 0x9bd2fa,
      fogHex: 0xe6d4ec,
      fogDensity: 0.0029,
      sunIntensity: 1.44,
      accentHex: '#ff66a3',
      mapDotHex: '#ff70a6',
      description: '粉紫與蔚藍夢幻宮殿城鎮，主塔高空懸浮巨大發光粉紅愛心徽章。',
    },
    landmarks: ['粉紫蔚藍夢幻宮殿', '高空巨型發光粉紅愛心', '環城櫻花林'],
    groundMaterial: { surfaceType: 'magic_plaza', colorHex: 0xf2d9eb, roughness: 0.8 },
    ambientAudio: 'town',
    interactions: [],
    canonConfidence: 'medium',
    canonNote: '建築視覺依據 Hunterpedia 2011 動畫畫廊；方位依南陸西部推估。',
  },
  {
    id: 'gi_port',
    name: '貪婪之島港 & 艾蓮娜之塔',
    enName: 'Greed Island Port',
    directionLabel: '西側 C 型半島海灣',
    coords: { x: -96, z: 22, radius: 24 },
    spawnPos: [-86, 0, 32],
    spawnYaw: 0.65,
    visualTheme: {
      skyHex: 0x72bce8,
      fogHex: 0xa2d6f2,
      fogDensity: 0.0032,
      sunIntensity: 1.4,
      accentHex: '#38e4c5',
      mapDotHex: '#62f5dc',
      description: '全島唯一離境港口：港長白色山牆建築、防波堤碼頭與雙胞胎管理者艾蓮娜（Elena）之塔。',
    },
    landmarks: ['港長白屋', '防波堤碼頭與帆船', '艾蓮娜（Elena）傳送之塔'],
    groundMaterial: { surfaceType: 'boardwalk', colorHex: 0xb8ad9a, roughness: 0.86 },
    ambientAudio: 'harbor',
    interactions: ['npc_harbormaster'],
    canonConfidence: 'medium',
    canonNote: '建築與艾蓮娜設定依據 Hunterpedia；設於西南 C 型封閉海灣出口處。',
  },
  {
    id: 'bunzen',
    name: '布恩森鎮',
    enName: 'Bunzen',
    directionLabel: '東南半島與除念之森',
    coords: { x: 80, z: 166, radius: 32 },
    spawnPos: [52, 0, 166],
    spawnYaw: -Math.PI / 2,
    visualTheme: {
      skyHex: 0x82ccf8,
      fogHex: 0xb0dff7,
      fogDensity: 0.0026,
      sunIntensity: 1.44,
      accentHex: '#e6cc6e',
      mapDotHex: '#e6cc6e',
      description: '位於東南林道盡頭的靜謐城鎮，入口外有開闊空地，穿過雙白石柱與陽光土路即抵黃牆歐風屋舍與除念之森。',
    },
    landmarks: ['東南林道與入口外開闊空地', '獨立雙白石柱鎮口', '黃牆歐風小屋與除念之森'],
    groundMaterial: { surfaceType: 'forest_floor', colorHex: 0x5c9c4e, roughness: 0.92 },
    ambientAudio: 'forest',
    interactions: ['pickup_herb'],
    canonConfidence: 'medium',
    canonNote: '視覺特徵依據 Hunterpedia 畫廊（雙白石柱、黃牆與森林）；方位配置於東南獨立半島。',
  },
  {
    id: 'bandit_village',
    name: '山賊之村',
    enName: 'Village of the Bandits',
    directionLabel: '西北半島密林',
    coords: { x: -74, z: -124, radius: 22 },
    spawnPos: [-74, 0, -108],
    spawnYaw: 0,
    visualTheme: {
      skyHex: 0x6ea6d4,
      fogHex: 0x7e9eb5,
      fogDensity: 0.0044,
      sunIntensity: 1.38,
      accentHex: '#68a678',
      mapDotHex: '#4f8f5b',
      description: '深藏於西北半島高聳密林中的傳統木屋村落，奇運亞歷山大石事件發生地。',
    },
    landmarks: ['西北密林高木冠層', '密林傳統木屋群'],
    groundMaterial: { surfaceType: 'forest_floor', colorHex: 0x3f6e38, roughness: 0.95 },
    ambientAudio: 'forest',
    interactions: ['pickup_alexandrite'],
    canonConfidence: 'inferred',
    canonNote: '密林木屋氛圍依據 Hunterpedia 畫廊；配置於官方地圖的西北密林半島。',
  },
];

/** 保留各區原始座標錨點，供 world.ts 與小地圖精準對齊 5× 地圖與 2× 建築縮放 */
export const RAW_LOCATION_ANCHORS: Record<string, { x: number; z: number }> = Object.fromEntries(
  RAW_GI_LOCATIONS.map((loc) => [loc.id, { x: loc.coords.x, z: loc.coords.z }])
);

const EXPANDED_CITY_IDS = new Set([
  'antokiba',
  'masadora',
  'limeiro',
  'soufrabi',
  'dorias',
  'aiai',
  'gi_port',
  'rubicuta',
  'bunzen',
  'bandit_village',
]);

/** 依目前啟用版本（v2 新版雕塑地形 / legacy 舊版地圖）由單一資料源統一轉換之全島地點表 */
export const GI_LOCATIONS: LocationDef[] = RAW_GI_LOCATIONS.map((loc) => {
  if (isV2Map()) {
    const v2 = V2_TOWN_PLACEMENTS[loc.id];
    if (v2) {
      return {
        ...loc,
        coords: {
          x: v2.x,
          z: v2.z,
          radius: v2.detectRadius,
        },
        spawnPos: [v2.x + v2.spawnOffset[0], v2.padY, v2.z + v2.spawnOffset[1]],
        spawnYaw: v2.spawnYaw,
        visualTheme: {
          ...loc.visualTheme,
          fogDensity: loc.visualTheme.fogDensity * 0.45,
        },
      };
    }
  }
  const ox = loc.coords.x;
  const oz = loc.coords.z;
  const wx = ox * WORLD_SCALE;
  const wz = oz * WORLD_SCALE;
  const radiusMult = EXPANDED_CITY_IDS.has(loc.id) ? 3.25 : 2.3;
  return {
    ...loc,
    coords: {
      x: wx,
      z: wz,
      radius: Math.round(loc.coords.radius * radiusMult),
    },
    spawnPos: [
      wx + (loc.spawnPos[0] - ox) * ARCH_SCALE,
      loc.spawnPos[1],
      wz + (loc.spawnPos[2] - oz) * ARCH_SCALE,
    ],
    visualTheme: {
      ...loc.visualTheme,
      fogDensity: loc.visualTheme.fogDensity * 0.42,
    },
  };
});

export function findLocationAt(x: number, z: number): LocationDef | null {
  let best: LocationDef | null = null;
  let bestDist = Infinity;
  for (const loc of GI_LOCATIONS) {
    const d = Math.hypot(x - loc.coords.x, z - loc.coords.z);
    if (d <= loc.coords.radius && d < bestDist) {
      best = loc;
      bestDist = d;
    }
  }
  return best;
}
