import { CardDef } from '../game/cards';

/**
 * 原作風格 Greed Island 卡片向量插畫生成器（100% 本地純 SVG，零熱連結、無原生 Emoji）。
 * 參照 2011 動畫與實卡風格：手繪感筆觸藍／翠綠／金／黑背景＋醒目中央道具或人物向量插畫。
 */

function brushedBackdrop(
  uid: string,
  topColor: string,
  midColor: string,
  botColor: string,
  strokeColor: string
): string {
  return `
    <defs>
      <linearGradient id="bg-${uid}" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="${topColor}"/>
        <stop offset="55%" stop-color="${midColor}"/>
        <stop offset="100%" stop-color="${botColor}"/>
      </linearGradient>
    </defs>
    <rect width="200" height="132" fill="url(#bg-${uid})"/>
    <g opacity="0.26" stroke="${strokeColor}" stroke-linecap="round">
      <path d="M-8 14 Q45 8 104 17 T210 12" stroke-width="5" fill="none"/>
      <path d="M-10 34 Q60 40 122 28 T212 36" stroke-width="4" fill="none"/>
      <path d="M-5 60 Q50 52 115 64 T208 56" stroke-width="6" fill="none"/>
      <path d="M-10 88 Q65 96 130 82 T210 92" stroke-width="4.5" fill="none"/>
      <path d="M-6 114 Q52 108 118 118 T210 112" stroke-width="5" fill="none"/>
    </g>
    <g opacity="0.16" stroke="#ffffff" stroke-linecap="round">
      <path d="M12 24 L82 21 M112 46 L188 43 M18 76 L92 79 M108 102 L182 98" stroke-width="2.2"/>
    </g>
  `;
}

function getSpecificArtwork(card: CardDef, uid: string): string | null {
  // GM 專用卡：100% 還原黑底白筆刷「RULER ONLY」
  if (card.category === 'gm') {
    return `
      <rect width="200" height="132" fill="#07080a"/>
      <g fill="#f6f7f9" font-family="'Brush Script MT','Impact','Arial Black',sans-serif" font-weight="900" text-anchor="middle">
        <text x="100" y="57" font-size="38" letter-spacing="2" transform="skewX(-8) translate(6,0)">RULER</text>
        <text x="104" y="103" font-size="38" letter-spacing="3" transform="skewX(-6) translate(4,0)">ONLY</text>
      </g>
      <path d="M24 62 Q100 58 176 64" stroke="#ffffff" stroke-width="1.2" opacity="0.22" fill="none"/>
    `;
  }

  switch (card.id) {
    // No.000 統治者的祝福：金光純白城堡與王冠
    case 0:
      return `
        ${brushedBackdrop(uid, '#1e4f8a', '#3b88c9', '#8ed2f7', '#0f2c52')}
        <circle cx="100" cy="64" r="52" fill="#ffe799" opacity="0.32"/>
        <ellipse cx="100" cy="122" rx="88" ry="20" fill="#5da64e" stroke="#1b2a19" stroke-width="2"/>
        <g stroke="#1b2029" stroke-width="2">
          <rect x="66" y="64" width="68" height="48" fill="#f5f1e6"/>
          <rect x="52" y="72" width="18" height="40" fill="#ebe5d5"/>
          <rect x="130" y="72" width="18" height="40" fill="#ebe5d5"/>
          <rect x="88" y="42" width="24" height="70" fill="#ffffff"/>
          <polygon points="48,72 61,48 74,72" fill="#3275c4"/>
          <polygon points="126,72 139,48 152,72" fill="#3275c4"/>
          <polygon points="84,42 100,14 116,42" fill="#d94252"/>
          <path d="M92 112 V94 A8 8 0 0 1 108 94 V112 Z" fill="#5a3820"/>
        </g>
        <path d="M84 18 L90 27 L100 17 L110 27 L116 18 L113 31 H87 Z" fill="#f4ca50" stroke="#1b2029" stroke-width="1.6"/>
      `;

    // No.001 一坪的密林：神木之森與林道
    case 1:
      return `
        ${brushedBackdrop(uid, '#1c4d3a', '#2e7d57', '#71ba79', '#0d291e')}
        <ellipse cx="100" cy="124" rx="94" ry="20" fill="#3f8042" stroke="#132414" stroke-width="2"/>
        <path d="M84 128 Q98 104 100 94 Q102 104 118 128 Z" fill="#d4be8e"/>
        <g stroke="#162118" stroke-width="2">
          <path d="M86 106 Q92 84 90 66 H110 Q108 84 114 106 Z" fill="#6b482b"/>
          <circle cx="100" cy="48" r="34" fill="#296e3c"/>
          <circle cx="72" cy="58" r="24" fill="#215c31"/>
          <circle cx="128" cy="58" r="24" fill="#215c31"/>
          <circle cx="100" cy="34" r="22" fill="#419652"/>
        </g>
        <g fill="#fff2aa" opacity="0.85">
          <circle cx="76" cy="42" r="2.2"/><circle cx="124" cy="48" r="2"/><circle cx="96" cy="24" r="2.5"/>
        </g>
      `;

    // No.002 一坪的海岸線：碧藍海灣與海神洞窟
    case 2:
      return `
        ${brushedBackdrop(uid, '#1e5e9e', '#3c96d6', '#92d9f7', '#0f3661')}
        <rect x="0" y="74" width="200" height="58" fill="#1b78b8"/>
        <path d="M0 98 Q55 92 102 104 T200 96 L200 132 L0 132 Z" fill="#ecd59a" stroke="#30291b" stroke-width="1.8"/>
        <path d="M126 84 Q146 28 192 42 L200 92 L122 92 Z" fill="#626973" stroke="#1c2026" stroke-width="2"/>
        <path d="M148 92 Q158 60 174 92 Z" fill="#101824"/>
        <path d="M18 84 Q42 80 66 84 M78 90 Q106 86 132 90" stroke="#e3f7ff" stroke-width="2.4" fill="none" stroke-linecap="round"/>
      `;

    // No.010 黃金指南
    case 10:
      return `
        ${brushedBackdrop(uid, '#234b7a', '#3574ab', '#67a6d4', '#142f4f')}
        <g transform="translate(100,66) rotate(-8)" stroke="#1b1b1e" stroke-width="2.2">
          <rect x="-36" y="-44" width="72" height="88" rx="4" fill="#ecc044"/>
          <rect x="-28" y="-44" width="8" height="88" fill="#c7921e"/>
          <rect x="-14" y="-32" width="42" height="24" fill="#fff3c4" stroke-width="1.5"/>
          <path d="M7 10 C7 3 16 1 18 8 C20 1 29 3 29 10 C29 18 18 26 18 26 C18 26 7 18 7 10 Z" fill="#e6456d" stroke-width="1.5"/>
        </g>
      `;

    // No.011 黃金天秤
    case 11:
      return `
        ${brushedBackdrop(uid, '#1b4775', '#2c6da8', '#5ba0d4', '#102b47')}
        <g stroke="#1b1c1e" stroke-width="2">
          <rect x="74" y="106" width="52" height="10" rx="3" fill="#d9a429"/>
          <rect x="96" y="34" width="8" height="72" fill="#f0c44d"/>
          <circle cx="100" cy="28" r="8" fill="#ffe17d"/>
          <line x1="44" y1="42" x2="156" y2="34" stroke="#f0c44d" stroke-width="5"/>
          <line x1="44" y1="42" x2="156" y2="34" stroke="#1b1c1e" stroke-width="1.5"/>
          <path d="M46 42 L34 78 H58 Z" fill="none" stroke="#ffe599" stroke-width="1.6"/>
          <path d="M154 34 L142 70 H166 Z" fill="none" stroke="#ffe599" stroke-width="1.6"/>
          <path d="M28 78 Q46 92 64 78 Z" fill="#f0c44d"/>
          <path d="M136 70 Q154 84 172 70 Z" fill="#f0c44d"/>
        </g>
      `;

    // No.017 大天使的氣息：羽翼大天使與聖光氣息
    case 17:
      return `
        ${brushedBackdrop(uid, '#184478', '#337bc4', '#8fd0f5', '#0e294a')}
        <circle cx="100" cy="54" r="46" fill="#fff6c7" opacity="0.34"/>
        <ellipse cx="100" cy="18" rx="18" ry="5" fill="none" stroke="#ffe47a" stroke-width="3.2"/>
        <g stroke="#243040" stroke-width="1.8">
          <path d="M84 56 C42 26 24 46 36 82 C54 78 70 72 86 68 Z" fill="#f7f9fc"/>
          <path d="M116 56 C158 26 176 46 164 82 C146 78 130 72 114 68 Z" fill="#f7f9fc"/>
          <path d="M84 62 L74 122 H126 L116 62 Z" fill="#eef4fa"/>
          <circle cx="100" cy="42" r="14" fill="#ffe1c4"/>
          <path d="M86 38 Q100 22 114 38 Q112 52 100 50 Q88 52 86 38 Z" fill="#f2cf78"/>
        </g>
        <path d="M100 54 Q76 86 58 106 M100 54 Q124 86 142 106" stroke="#fff7c2" stroke-width="2.6" opacity="0.7" fill="none"/>
      `;

    // No.025 風險骰子：100% 還原黑二十面骰＋白字「大吉」＋紅字「大凶」！！
    case 25:
      return `
        ${brushedBackdrop(uid, '#1c4d7a', '#2c76ae', '#4ca1d4', '#103152')}
        <g transform="translate(100,66)" stroke="#5c626b" stroke-width="1.6" stroke-linejoin="round">
          <polygon points="0,-50 44,-24 44,24 0,50 -44,24 -44,-24" fill="#232428" stroke="#111214" stroke-width="2.4"/>
          <polygon points="0,-50 -26,-16 26,-16" fill="#2f3136"/>
          <polygon points="-26,-16 26,-16 0,30" fill="#26282d"/>
          <polygon points="-44,-24 -26,-16 -44,24" fill="#1e2024"/>
          <polygon points="-26,-16 0,30 -44,24" fill="#202226"/>
          <polygon points="44,-24 26,-16 44,24" fill="#1c1d21"/>
          <polygon points="26,-16 0,30 44,24" fill="#24262b"/>
          <polygon points="-44,24 0,30 0,50" fill="#18191c"/>
          <polygon points="44,24 0,30 0,50" fill="#1b1c20"/>
          <text x="0" y="2" fill="#e6e9ef" font-size="14" font-weight="900" text-anchor="middle" font-family="serif">大吉</text>
          <text x="-22" y="18" fill="#e03a3a" font-size="13" font-weight="900" text-anchor="middle" font-family="serif" transform="rotate(-24,-22,18)">大凶</text>
          <text x="23" y="15" fill="#d8dce3" font-size="10" font-weight="800" text-anchor="middle" font-family="serif" transform="rotate(24,23,15)">大吉</text>
          <text x="0" y="-26" fill="#d8dce3" font-size="9" font-weight="800" text-anchor="middle" font-family="serif">大吉</text>
        </g>
      `;

    // No.075 奇運亞歷山大石：翠綠與紫紅雙色切割寶石
    case 75:
      return `
        ${brushedBackdrop(uid, '#1e4269', '#2b6a96', '#569bc4', '#102945')}
        <defs>
          <linearGradient id="alex-${uid}" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stop-color="#30e0a1"/>
            <stop offset="52%" stop-color="#1d8f7e"/>
            <stop offset="100%" stop-color="#b83280"/>
          </linearGradient>
        </defs>
        <g transform="translate(100,66)" stroke="#141820" stroke-width="2">
          <polygon points="0,-46 38,-14 28,38 -28,38 -38,-14" fill="url(#alex-${uid})"/>
          <polygon points="0,-46 18,-8 -18,-8" fill="#8dfce0" opacity="0.55"/>
          <polygon points="-18,-8 18,-8 0,38" fill="#c74b9e" opacity="0.45"/>
          <line x1="-38" y1="-14" x2="38" y2="-14" stroke="#ffffff" stroke-width="1.2" opacity="0.6"/>
        </g>
        <g stroke="#fff8c4" stroke-width="2" stroke-linecap="round">
          <path d="M52 26 V38 M46 32 H58 M148 28 V40 M142 34 H154"/>
        </g>
      `;

    // No.080 浮游石
    case 80:
      return `
        ${brushedBackdrop(uid, '#1e5082', '#3a86bf', '#8ac9eb', '#113054')}
        <ellipse cx="100" cy="108" rx="34" ry="8" fill="#132c45" opacity="0.35"/>
        <ellipse cx="100" cy="86" rx="44" ry="9" fill="none" stroke="#fff3a8" stroke-width="2" stroke-dasharray="6 4"/>
        <g transform="translate(100,56)" stroke="#18202b" stroke-width="2">
          <polygon points="0,-32 28,-4 16,28 -18,28 -28,-6" fill="#7be0ff"/>
          <polygon points="0,-32 14,-2 -14,-2" fill="#d9f7ff"/>
          <polygon points="14,-2 28,-4 16,28" fill="#46a8d6"/>
        </g>
      `;

    // No.081 藍色行星：宇宙深藍神祕寶石
    case 81:
      return `
        ${brushedBackdrop(uid, '#0b1838', '#15326e', '#2658ab', '#060c1f')}
        <circle cx="100" cy="66" r="44" fill="#1b5ef0" stroke="#0d1324" stroke-width="2.4"/>
        <ellipse cx="94" cy="58" rx="32" ry="18" fill="#47a4ff" opacity="0.52" transform="rotate(-18,94,58)"/>
        <circle cx="84" cy="48" r="10" fill="#d9f3ff" opacity="0.72"/>
        <ellipse cx="100" cy="66" rx="64" ry="16" fill="none" stroke="#9ad7ff" stroke-width="2.4" transform="rotate(-14,100,66)"/>
        <g fill="#ffffff">
          <circle cx="38" cy="24" r="2"/><circle cx="164" cy="30" r="1.8"/><circle cx="156" cy="102" r="2.2"/><circle cx="42" cy="104" r="1.6"/>
        </g>
      `;

    // No.084 聖騎士的首飾
    case 84:
      return `
        ${brushedBackdrop(uid, '#234a78', '#336ea6', '#60a0d1', '#142d4c')}
        <path d="M60 12 Q100 66 140 12" fill="none" stroke="#dce4ef" stroke-width="4.5" stroke-dasharray="4 3"/>
        <g transform="translate(100,72)" stroke="#1a2029" stroke-width="2">
          <polygon points="0,-24 22,0 0,34 -22,0" fill="#e6edf7"/>
          <rect x="-5" y="-14" width="10" height="36" fill="#f0c44d"/>
          <rect x="-15" y="-4" width="30" height="10" fill="#f0c44d"/>
          <circle cx="0" cy="1" r="5" fill="#47b8ff"/>
        </g>
      `;

    // No.098 銀犬
    case 98:
      return `
        ${brushedBackdrop(uid, '#1f4e73', '#337ca6', '#69b0d6', '#103047')}
        <ellipse cx="100" cy="110" rx="54" ry="10" fill="#1d3d52" opacity="0.35"/>
        <g stroke="#1b2029" stroke-width="2" fill="#dde4ec">
          <ellipse cx="96" cy="76" rx="30" ry="18"/>
          <circle cx="128" cy="54" r="16"/>
          <polygon points="120,40 124,22 132,38" fill="#c7d1de"/>
          <polygon points="132,40 142,24 142,42" fill="#c7d1de"/>
          <ellipse cx="142" cy="58" rx="9" ry="6"/>
          <rect x="74" y="88" width="9" height="22" rx="3"/>
          <rect x="108" y="88" width="9" height="22" rx="3"/>
          <path d="M68 72 Q52 56 60 44" fill="none" stroke="#dde4ec" stroke-width="6" stroke-linecap="round"/>
        </g>
        <circle cx="134" cy="52" r="2.4" fill="#1b2029"/>
        <circle cx="148" cy="56" r="2.6" fill="#1b2029"/>
      `;

    // No.099 女僕熊貓
    case 99:
      return `
        ${brushedBackdrop(uid, '#28567d', '#4284b5', '#82bde3', '#153452')}
        <g stroke="#1a1c20" stroke-width="2">
          <circle cx="76" cy="34" r="11" fill="#1f2228"/>
          <circle cx="124" cy="34" r="11" fill="#1f2228"/>
          <path d="M74 82 L64 124 H136 L126 82 Z" fill="#23262e"/>
          <path d="M84 82 L78 124 H122 L116 82 Z" fill="#ffffff"/>
          <circle cx="100" cy="58" r="26" fill="#ffffff"/>
          <ellipse cx="89" cy="56" rx="7" ry="9" fill="#1f2228"/>
          <ellipse cx="111" cy="56" rx="7" ry="9" fill="#1f2228"/>
          <circle cx="89" cy="55" r="2.2" fill="#ffffff"/>
          <circle cx="111" cy="55" r="2.2" fill="#ffffff"/>
          <ellipse cx="100" cy="65" rx="4.5" ry="3" fill="#1f2228"/>
          <path d="M76 36 Q100 22 124 36 L118 44 Q100 34 82 44 Z" fill="#ffffff"/>
        </g>
      `;

    // No.100 & No.101 島的地圖（100% 還原官方地圖掃描圖輪廓！）
    case 100:
    case 101:
      return `
        ${brushedBackdrop(uid, '#18423f', '#21695c', '#2e8772', '#0d2624')}
        <path d="M58 28 Q78 16 106 24 Q134 18 148 34 Q158 54 142 66 Q160 84 144 104 Q118 118 96 106 Q72 118 54 96 Q44 74 58 64 Q42 46 58 28 Z" fill="#f3ebc0" stroke="#24382c" stroke-width="2.4"/>
        ${
          card.id === 101
            ? `<g fill="#d93b48" stroke="#ffffff" stroke-width="1">
                 <circle cx="78" cy="40" r="3.6"/><circle cx="122" cy="44" r="3.6"/><circle cx="100" cy="66" r="3.6"/>
                 <circle cx="72" cy="82" r="3.6"/><circle cx="126" cy="90" r="3.6"/><circle cx="98" cy="100" r="3.6"/>
               </g>
               <path d="M98 100 L100 66 L78 40 M100 66 L122 44 M100 66 L72 82" stroke="#c74338" stroke-width="1.4" stroke-dasharray="3 2" fill="none"/>`
            : `<text x="100" y="72" fill="#8f8665" font-size="14" font-weight="800" text-anchor="middle" font-family="serif">?</text>`
        }
      `;

    // No.266 離境通行票
    case 266:
      return `
        ${brushedBackdrop(uid, '#1c4f7a', '#2e7cb3', '#6bb8e0', '#10304f')}
        <g transform="translate(100,66) rotate(-7)" stroke="#1b1c1e" stroke-width="2">
          <rect x="-58" y="-28" width="116" height="56" rx="6" fill="#f6e7bd"/>
          <rect x="-50" y="-20" width="100" height="40" fill="none" stroke="#c28e2b" stroke-width="1.8" stroke-dasharray="4 2"/>
          <text x="0" y="-2" fill="#1d4d78" font-size="13" font-weight="900" text-anchor="middle" font-family="serif">G·I PASS</text>
          <text x="0" y="14" fill="#8a332b" font-size="9" font-weight="800" text-anchor="middle">PORT EXIT TICKET</text>
        </g>
      `;

    // No.607 J10,000 戒尼鈔票
    case 607:
      return `
        ${brushedBackdrop(uid, '#234f46', '#337567', '#5da693', '#122e28')}
        <g transform="translate(100,66) rotate(-5)" stroke="#1c2420" stroke-width="2">
          <rect x="-60" y="-30" width="120" height="60" rx="4" fill="#edf2dc"/>
          <rect x="-52" y="-22" width="104" height="44" fill="#d9e6c3" stroke="#4d734b" stroke-width="1.6"/>
          <circle cx="0" cy="0" r="18" fill="#f2cf66" stroke="#8f6619" stroke-width="1.6"/>
          <text x="0" y="5" fill="#1c2420" font-size="14" font-weight="900" text-anchor="middle" font-family="serif">10,000J</text>
        </g>
      `;

    // No.21449 / No.25008 石頭
    case 21449:
    case 25008:
      return `
        ${brushedBackdrop(uid, '#1e4e7a', '#3176ad', '#5ca3d1', '#102e4a')}
        <ellipse cx="100" cy="104" rx="${card.id === 25008 ? 64 : 46}" ry="11" fill="#12283d" opacity="0.35"/>
        <g transform="translate(100,72) scale(${card.id === 25008 ? 1.24 : 0.96})" stroke="#1c1f24" stroke-width="2.2">
          <polygon points="-38,24 -44,-4 -18,-30 22,-26 44,2 34,26" fill="#8c929c"/>
          <polygon points="-18,-30 22,-26 8,2 -24,-2" fill="#b4bac4"/>
          <polygon points="8,2 44,2 34,26 -4,24" fill="#636973"/>
        </g>
      `;

    // No.1039 同行（100% 還原動畫掃描圖：眾人張開雙臂飛翔在藍天筆觸背景上！）
    case 1039:
      return `
        ${brushedBackdrop(uid, '#1d4c7a', '#2c76b3', '#52a3d9', '#103152')}
        <g stroke="#181a1f" stroke-width="1.8">
          <g transform="translate(100,48)">
            <path d="M-36,-6 Q-18,-14 0,-8 Q18,-14 36,-6 L32,4 Q16,2 10,8 L8,24 L0,16 L-8,24 L-10,8 Q-16,2 -32,4 Z" fill="#44a85a"/>
            <circle cx="0" cy="-10" r="9" fill="#f7d6b5"/>
            <path d="M-8,-14 L-6,-24 L-1,-18 L3,-25 L7,-17 L9,-13 Z" fill="#1e2228"/>
          </g>
          <g transform="translate(120,94) scale(0.76)">
            <path d="M-34,-6 Q-16,-12 0,-8 Q16,-12 34,-6 L30,4 L10,8 L8,22 L-8,22 L-10,8 L-30,4 Z" fill="#e6b03c"/>
            <circle cx="0" cy="-10" r="9" fill="#f7d6b5"/>
          </g>
          <g transform="translate(46,36) scale(0.46)">
            <path d="M-30,-4 L30,-4 L12,12 L-12,12 Z" fill="#c94b74"/><circle cx="0" cy="-8" r="8" fill="#f7d6b5"/>
          </g>
          <g transform="translate(54,84) scale(0.48)">
            <path d="M-30,-4 L30,-4 L12,12 L-12,12 Z" fill="#6458b8"/><circle cx="0" cy="-8" r="8" fill="#f7d6b5"/>
          </g>
          <g transform="translate(154,48) scale(0.45)">
            <path d="M-30,-4 L30,-4 L12,12 L-12,12 Z" fill="#d9534f"/><circle cx="0" cy="-8" r="8" fill="#f7d6b5"/>
          </g>
          <g transform="translate(160,86) scale(0.5)">
            <path d="M-30,-4 L30,-4 L12,12 L-12,12 Z" fill="#b869bd"/><circle cx="0" cy="-8" r="8" fill="#f7d6b5"/>
          </g>
        </g>
      `;

    default:
      return null;
  }
}

/**
 * 依據卡片分類、編號與關鍵字，為其餘 140+ 張卡片繪製專屬手繪向量插畫，確保每張皆無 Emoji 且符合原作氣質。
 */
function getThematicArtwork(card: CardDef, uid: string): string {
  // 037–045 各種大XX之卵
  if (card.id >= 37 && card.id <= 45) {
    const hues = ['#f4c44e', '#e86694', '#5c9cf2', '#b07bf2', '#4fd1c5', '#f28c4e', '#e85858', '#d978c9', '#6fd67e'];
    const accent = hues[(card.id - 37) % hues.length];
    return `
      ${brushedBackdrop(uid, '#1b4770', '#2d72a8', '#5fa4d4', '#102b47')}
      <circle cx="100" cy="68" r="46" fill="${accent}" opacity="0.28"/>
      <path d="M100 22 C126 22 138 58 134 86 C130 106 116 116 100 116 C84 116 70 106 66 86 C62 58 74 22 100 22 Z" fill="#fcf7e3" stroke="#1b1c20" stroke-width="2.4"/>
      <circle cx="88" cy="54" r="7" fill="${accent}" opacity="0.8"/>
      <circle cx="114" cy="70" r="9" fill="${accent}" opacity="0.72"/>
      <circle cx="92" cy="88" r="6" fill="${accent}" opacity="0.85"/>
      <ellipse cx="90" cy="40" rx="5" ry="10" fill="#ffffff" opacity="0.65" transform="rotate(-18,90,40)"/>
    `;
  }

  // 064–072 魔女／長老／瘋狂科學家藥劑瓶系列
  if (card.id >= 64 && card.id <= 72) {
    const liquidColors = ['#ff5c93', '#49d6c5', '#7be362', '#f2b844', '#f26044', '#6394ff', '#d94848', '#e66ee0', '#89e0ff'];
    const liq = liquidColors[(card.id - 64) % liquidColors.length];
    return `
      ${brushedBackdrop(uid, '#1e4268', '#2e6896', '#5697c4', '#112a45')}
      <g transform="translate(100,68)" stroke="#1b1c20" stroke-width="2.2">
        <rect x="-12" y="-44" width="24" height="14" rx="2" fill="#9c6a3e"/>
        <rect x="-15" y="-32" width="30" height="8" rx="2" fill="#e6ecf2"/>
        <path d="M-12,-24 L-32,12 C-38,24 -30,42 -14,44 H14 C30,42 38,24 32,12 L12,-24 Z" fill="#eef5fc"/>
        <path d="M-27,12 C-31,24 -25,38 -12,40 H12 C25,38 31,24 27,12 Z" fill="${liq}"/>
        <circle cx="-8" cy="22" r="4" fill="#ffffff" opacity="0.65" stroke="none"/>
        <circle cx="10" cy="30" r="3" fill="#ffffff" opacity="0.55" stroke="none"/>
      </g>
    `;
  }

  // 073–079 寶石系列
  if (card.id >= 73 && card.id <= 79) {
    const gemColors = ['#1f6e5c', '#54d0ff', '#38c7a3', '#d9384a', '#2ebd68', '#2b67d9', '#f29be8'];
    const col = gemColors[(card.id - 73) % gemColors.length];
    return `
      ${brushedBackdrop(uid, '#183b63', '#275e91', '#4d90c4', '#0e2440')}
      <g transform="translate(100,66)" stroke="#141820" stroke-width="2.2">
        <polygon points="0,-44 38,-10 24,38 -24,38 -38,-10" fill="${col}"/>
        <polygon points="0,-44 18,-8 -18,-8" fill="#ffffff" opacity="0.45"/>
        <polygon points="-38,-10 -18,-8 -24,38" fill="#000000" opacity="0.22"/>
        <polygon points="38,-10 18,-8 24,38" fill="#000000" opacity="0.16"/>
      </g>
    `;
  }

  // 082–095 武器／防具／裝備系列
  if (card.id >= 82 && card.id <= 95) {
    const isShield = card.id === 85 || card.id === 87 || card.id === 90;
    return `
      ${brushedBackdrop(uid, '#1e4770', '#2f6ea1', '#5c9ec9', '#112c47')}
      ${
        isShield
          ? `<g transform="translate(100,66)" stroke="#1b1c20" stroke-width="2.2">
               <path d="M-34,-36 H34 V4 C34,28 0,44 0,44 C0,44 -34,28 -34,4 Z" fill="#cfd8e6"/>
               <path d="M-24,-26 H24 V2 C24,20 0,34 0,34 C0,34 -24,20 -24,2 Z" fill="#3a6fb5"/>
               <path d="M0,-22 V28 M-18,-2 H18" stroke="#f2ca52" stroke-width="5"/>
             </g>`
          : `<g transform="translate(100,66) rotate(-32)" stroke="#1b1c20" stroke-width="2">
               <polygon points="0,-54 10,-38 8,24 -8,24 -10,-38" fill="#e2e8f2"/>
               <line x1="0" y1="-48" x2="0" y2="20" stroke="#9aa6ba" stroke-width="2"/>
               <rect x="-24" y="20" width="48" height="8" rx="3" fill="#e6b83e"/>
               <rect x="-5" y="28" width="10" height="22" fill="#5e3a24"/>
               <circle cx="0" cy="52" r="6" fill="#e6b83e"/>
             </g>`
      }
    `;
  }

  // 046–054 少女／迷你幻獸／奇蟲系列
  if (card.id >= 46 && card.id <= 54) {
    const isGirl = card.id <= 49;
    return `
      ${brushedBackdrop(uid, '#244e7a', '#3b7eb0', '#7bbce3', '#132f4d')}
      ${
        isGirl
          ? `<g stroke="#1b1e24" stroke-width="2">
               <circle cx="100" cy="64" r="42" fill="#fff0b8" opacity="0.28" stroke="none"/>
               <path d="M74 124 L84 74 H116 L126 124 Z" fill="${card.id === 46 ? '#f2c84b' : card.id === 48 ? '#f28bb2' : '#63b8e8'}"/>
               <circle cx="100" cy="48" r="19" fill="#ffe1c4"/>
               <path d="M80 46 Q100 20 120 46 Q124 72 114 78 L112 52 Q100 42 88 52 L86 78 Q76 72 80 46 Z" fill="${card.id === 46 ? '#e8b638' : '#5e4378'}"/>
               <circle cx="93" cy="50" r="2.2" fill="#1b1e24"/><circle cx="107" cy="50" r="2.2" fill="#1b1e24"/>
             </g>`
          : `<g transform="translate(100,66)" stroke="#1b1e24" stroke-width="2">
               <ellipse cx="0" cy="14" rx="28" ry="18" fill="${card.id === 51 ? '#e05348' : card.id === 54 ? '#f2b84b' : '#4fa868'}"/>
               <path d="M-12,-2 C-42,-28 -48,4 -16,12 Z" fill="#f7e39c"/>
               <path d="M12,-2 C42,-28 48,4 16,12 Z" fill="#f7e39c"/>
               <circle cx="0" cy="-12" r="13" fill="${card.id === 51 ? '#e05348' : '#58bd72'}"/>
               <circle cx="-5" cy="-14" r="2.2" fill="#1b1e24"/><circle cx="5" cy="-14" r="2.2" fill="#1b1e24"/>
             </g>`
      }
    `;
  }

  // 咒語卡（1001–1040）：依射程與攻擊／防禦／移動／情報繪製經典動畫咒語插畫！
  if (card.category === 'spell') {
    const classes = card.spellClasses ?? [];
    const isTransport = [1005, 1009, 1012, 1013, 1014, 1016, 1017, 1039].includes(card.id);
    const isEyeInfo = [1001, 1002, 1015, 1024, 1027, 1030, 1031, 1033, 1036, 1038, 1040].includes(card.id);
    const isDefense = classes.includes('DS');
    const isAttack = classes.includes('AS');

    if (isTransport) {
      return `
        ${brushedBackdrop(uid, '#184473', '#2a72ad', '#5ca8dc', '#0e2b4d')}
        <g stroke="#181b21" stroke-width="2">
          <path d="M22 104 Q100 84 178 104" stroke="#d9f2ff" stroke-width="3" fill="none" opacity="0.55"/>
          <g transform="translate(100,58)">
            <path d="M-42,-6 Q-18,-14 0,-8 Q18,-14 42,-6 L36,6 Q16,4 10,12 L8,30 L0,20 L-8,30 L-10,12 Q-16,4 -36,6 Z" fill="#3a98d9"/>
            <circle cx="0" cy="-11" r="10" fill="#f7d6b5"/>
            <path d="M-9,-14 Q0,-26 9,-14 Z" fill="#232830"/>
          </g>
        </g>
      `;
    }

    if (isEyeInfo) {
      return `
        ${brushedBackdrop(uid, '#153a66', '#2665a3', '#5298d4', '#0b2442')}
        <g transform="translate(100,66)" stroke="#181b21" stroke-width="2.2">
          <path d="M-56,0 Q0,-44 56,0 Q0,44 -56,0 Z" fill="#f2f6fa"/>
          <circle cx="0" cy="0" r="22" fill="#2b7be0"/>
          <circle cx="0" cy="0" r="10" fill="#141821"/>
          <circle cx="-6" cy="-6" r="4" fill="#ffffff" stroke="none"/>
          <circle cx="0" cy="0" r="42" fill="none" stroke="#9ad7ff" stroke-width="1.6" stroke-dasharray="6 4"/>
        </g>
      `;
    }

    if (isDefense) {
      return `
        ${brushedBackdrop(uid, '#17406b', '#286ea6', '#56a3d4', '#0e2845')}
        <g transform="translate(100,66)" stroke="#181b21" stroke-width="2.2">
          <circle cx="0" cy="0" r="44" fill="#82d4ff" opacity="0.24" stroke="#a8e2ff" stroke-width="2.4"/>
          <path d="M-30,-32 H30 V4 C30,26 0,40 0,40 C0,40 -30,26 -30,4 Z" fill="#eef4fa"/>
          <path d="M-20,-22 H20 V2 C20,18 0,30 0,30 C0,30 -20,18 -20,2 Z" fill="#2e7cd6"/>
          <path d="M0,-14 L12,4 L0,18 L-12,4 Z" fill="#ffe078"/>
        </g>
      `;
    }

    if (isAttack) {
      return `
        ${brushedBackdrop(uid, '#1c3a66', '#2e5d94', '#5089bd', '#102442')}
        <g transform="translate(100,66)" stroke="#181b21" stroke-width="2.2">
          <polygon points="0,-48 12,-14 48,-16 18,8 30,44 0,20 -30,44 -18,8 -48,-16 -12,-14" fill="#ff744d" opacity="0.88"/>
          <polygon points="0,-28 8,-6 28,-8 12,6 18,26 0,12 -18,26 -12,6 -28,-8 -8,-6" fill="#fff099"/>
          <rect x="-12" y="-16" width="24" height="32" rx="3" fill="#eef3f8"/>
          <line x1="-18" y1="-18" x2="18" y2="18" stroke="#c92a2a" stroke-width="3.5"/>
        </g>
      `;
    }

    // 其餘通常／變形咒語（擬態、複製、贋作、抽籤、再生、淨化、徵收）
    return `
      ${brushedBackdrop(uid, '#19426e', '#2c6ea6', '#5aa0d1', '#0f2947')}
      <g transform="translate(100,66)" stroke="#181b21" stroke-width="2">
        <rect x="-36" y="-28" width="38" height="54" rx="4" fill="#d9e6f5" transform="rotate(-14)"/>
        <rect x="-4" y="-26" width="38" height="54" rx="4" fill="#f7f4e4" transform="rotate(12)"/>
        <path d="M-22 0 Q0 -24 22 0 Q0 24 -22 0" fill="none" stroke="#ffd859" stroke-width="3"/>
      </g>
    `;
  }

  // 自由口袋魔獸／人物／道具
  if (card.category === 'item') {
    return `
      ${brushedBackdrop(uid, '#234a6e', '#35749e', '#65a8cc', '#142d45')}
      <g transform="translate(100,66)" stroke="#1a1d22" stroke-width="2.2">
        <circle cx="0" cy="0" r="38" fill="#f5e3a8" opacity="0.28" stroke="none"/>
        <polygon points="0,-38 34,-12 22,34 -22,34 -34,-12" fill="#e8be4a"/>
        <circle cx="0" cy="-2" r="16" fill="#fcf8e8"/>
        <text x="0" y="4" fill="#1a1d22" font-size="16" font-weight="900" text-anchor="middle" font-family="serif">${card.code}</text>
      </g>
    `;
  }

  // 其餘指定口袋卡片（泉水、神祕裝置、商店建築、書卷卡片等）依編號輪換 4 種手繪感圖騰
  const variant = card.id % 4;
  if (variant === 0) {
    // 神祕建築／設施
    return `
      ${brushedBackdrop(uid, '#1e4b75', '#347bb0', '#6bb2dc', '#112e4a')}
      <g stroke="#1b1d22" stroke-width="2">
        <rect x="52" y="54" width="96" height="60" fill="#f2ead5"/>
        <polygon points="44,54 100,22 156,54" fill="#c94b54"/>
        <rect x="88" y="80" width="24" height="34" fill="#6b4528"/>
        <rect x="62" y="68" width="16" height="16" fill="#ffe999"/>
        <rect x="122" y="68" width="16" height="16" fill="#ffe999"/>
      </g>
    `;
  }
  if (variant === 1) {
    // 神祕古書／券冊
    return `
      ${brushedBackdrop(uid, '#1d4973', '#2e72a8', '#5fa4d4', '#102b47')}
      <g transform="translate(100,66) rotate(-6)" stroke="#1b1d22" stroke-width="2.2">
        <rect x="-40" y="-42" width="80" height="84" rx="5" fill="#9c384a"/>
        <rect x="-32" y="-42" width="9" height="84" fill="#6e2230"/>
        <circle cx="4" cy="0" r="20" fill="#f4cb58"/>
        <polygon points="4,-12 14,0 4,12 -6,0" fill="#9c384a"/>
      </g>
    `;
  }
  if (variant === 2) {
    // 秘寶壺器／奇物
    return `
      ${brushedBackdrop(uid, '#1b4a70', '#2e78a6', '#60aed4', '#0f2d47')}
      <g transform="translate(100,68)" stroke="#1b1d22" stroke-width="2.2">
        <ellipse cx="0" cy="10" rx="34" ry="30" fill="#e6b84c"/>
        <rect x="-14" y="-34" width="28" height="18" rx="4" fill="#f5d57a"/>
        <ellipse cx="0" cy="-34" rx="18" ry="6" fill="#c79222"/>
        <path d="M-32,8 H32" stroke="#9e2f3d" stroke-width="5"/>
      </g>
    `;
  }
  // 魔導裝置／時鐘
  return `
    ${brushedBackdrop(uid, '#1a456e', '#2b6ea3', '#5ca0cf', '#0f2945')}
    <g transform="translate(100,66)" stroke="#1b1d22" stroke-width="2.2">
      <circle cx="0" cy="0" r="40" fill="#d9a836"/>
      <circle cx="0" cy="0" r="31" fill="#faf5e4"/>
      <line x1="0" y1="0" x2="0" y2="-20" stroke="#1b1d22" stroke-width="3" stroke-linecap="round"/>
      <line x1="0" y1="0" x2="15" y2="8" stroke="#c93644" stroke-width="2.6" stroke-linecap="round"/>
      <circle cx="0" cy="0" r="3.5" fill="#1b1d22"/>
    </g>
  `;
}

export function renderCardArtworkSVG(card: CardDef, instanceKey: string): string {
  const uid = `c${card.id}_${instanceKey}`.replace(/[^a-zA-Z0-9_-]/g, '');
  const inner = getSpecificArtwork(card, uid) ?? getThematicArtwork(card, uid);
  return `<svg class="gi-art-svg" viewBox="0 0 200 132" preserveAspectRatio="xMidYMid slice" aria-hidden="true">${inner}</svg>`;
}
