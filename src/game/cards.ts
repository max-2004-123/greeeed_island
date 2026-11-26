export type CardRank = 'SS' | 'S' | 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G' | 'H' | 'GM';
export type CardCategory = 'specified' | 'spell' | 'item' | 'gm';
export type CardBorderColor = 'red' | 'blue' | 'yellow' | 'black';
export type SpellClassTag = 'SR' | 'LR' | 'RS' | 'AS' | 'DS' | 'AA' | 'C' | 'VS' | '*S';
export type CardLimit = number | '∞' | '?' | null;

export interface CardGainEffect {
  type:
    | 'jenny'
    | 'teleport_masadora'
    | 'teleport_lobby'
    | 'teleport_shiso'
    | 'teleport_random_town'
    | 'open_map'
    | 'lottery'
    | 'analysis'
    | 'speed_boost'
    | 'flavor';
  amount?: number;
  message: string;
}

export interface CardDef {
  id: number;
  code: string; // e.g. "000".."099", "1001".."1040", "100".."25008", "-000".."-003"
  name: string;
  enName: string;
  category: CardCategory;
  border: CardBorderColor;
  rank: CardRank;
  limit: CardLimit;
  spellClasses?: SpellClassTag[];
  icon: string;
  description: string;
  sellPrice: number;
  gainEffect?: CardGainEffect;
}

export const RANK_ORDER: Record<CardRank, number> = {
  GM: 11,
  SS: 10,
  S: 9,
  A: 8,
  B: 7,
  C: 6,
  D: 5,
  E: 4,
  F: 3,
  G: 2,
  H: 1,
};

export const SPELL_CLASS_LABELS: Record<SpellClassTag, { short: string; label: string }> = {
  SR: { short: 'SR', label: '短距離（Short Range）' },
  LR: { short: 'LR', label: '長距離（Long Range）' },
  RS: { short: 'RS', label: '通常咒語（Regular）' },
  AS: { short: 'AS', label: '攻擊咒語（Attack）' },
  DS: { short: 'DS', label: '防禦咒語（Defensive）' },
  AA: { short: 'AA', label: '反攻擊（Anti-Attack）' },
  C: { short: 'C', label: '持續咒語（Continuous）' },
  VS: { short: 'VS', label: '對抗咒語（Versus）' },
  '*S': { short: '*S', label: '管理者專用特殊咒語（Special）' },
};

export function formatRankLimit(card: CardDef): string {
  if (card.category === 'gm' || card.limit === null) return 'GM-*S';
  return `${card.rank}-${card.limit}`;
}

function defaultSellPrice(rank: CardRank, category: CardCategory): number {
  const base: Record<CardRank, number> = {
    GM: 0,
    SS: 150000,
    S: 72000,
    A: 45000,
    B: 26000,
    C: 14000,
    D: 8500,
    E: 5000,
    F: 3000,
    G: 1600,
    H: 400,
  };
  return category === 'spell' ? Math.round(base[rank] * 0.72) : base[rank];
}

// ---------------------------------------------------------------------------
// 1. 全部 100 張指定口袋卡片（000–099，紅框 Red Border）
//    完整對齊 Hunterpedia: Greed Island Card Lists
// ---------------------------------------------------------------------------
type SpecRow = [
  id: number,
  name: string,
  enName: string,
  rank: CardRank,
  limit: number,
  icon: string,
  description: string,
  gainEffect?: CardGainEffect,
];

const SPECIFIED_ROWS: SpecRow[] = [
  [0, '統治者的祝福', "Ruler's Blessing", 'SS', 1, '👑', '獲贈一座破關獎勵城堡及含有一萬名居民的城鎮，居民皆會依照你制定的法律與命令生活。', { type: 'flavor', message: '金色的王者光輝籠罩全身！你聽見遠方利梅洛城堡的號角聲！' }],
  [1, '一坪的密林', 'Patch of Forest', 'SS', 3, '🌲', '通往名為「山神之庭」的巨大森林入口，棲息著許多溫馴親人的珍稀固有物種。', { type: 'flavor', message: '四周飄起清新的森林芬多精與翠綠微光。' }],
  [2, '一坪的海岸線', 'Plot of Beach', 'SS', 3, '🌊', '通往「海神洞窟」的入口；每次造訪洞窟內部路徑都會變化，使闖入者迷失方向。', { type: 'flavor', message: '耳邊響起壽富拉比的海潮聲，蔚藍念氣在掌心翻湧！' }],
  [3, '湧泉之壺', 'Pitcher of Eternal Water', 'A', 17, '🏺', '每天會不斷湧出 1440 公升純淨清澈泉水的不可思議水壺。', { type: 'speed_boost', message: '清澈甘甜的泉水湧出，體力瞬間恢復，移動速度暫時提升！' }],
  [4, '美肌溫泉', 'Skin Care Hot Springs', 'A', 15, '♨️', '可治癒任何肌膚問題的秘湯，每天浸泡半小時就能擁有如嬰兒般細緻光滑的肌膚。'],
  [5, '神隱洞窟', 'Spirited Away Hollow', 'S', 8, '🕳️', '進入再走出這個洞窟，就會被傳送到國內某個荒涼角落，且不需花錢便會因各種機緣回到原點。', { type: 'teleport_random_town', message: '神隱洞窟的迷霧包圍全身，你被送往了島上的另一處城鎮！' }],
  [6, '酒泉', 'Liquor Spring', 'A', 15, '🍶', '汲取此泉之水靜置一小時後，便會化作隨機一款風味絕佳的極品美酒。'],
  [7, '懷孕之石', 'Pregnancy Stones', 'S', 10, '🪨', '隨身攜帶這顆重約 3 公斤（7 磅）的石頭一個月，無論男女皆會懷孕；可依陰陽石選擇性別。'],
  [8, '不可思議池塘', 'Mystery Pond', 'S', 10, '🐟', '放進一條魚，隔天就會再多出一條同種魚。不論海水魚或淡水魚都能和平共養在池中！'],
  [9, '豐收之樹', 'Tree of Plenty', 'S', 10, '🌳', '結滿各式各樣果實的神樹，無論採收多少隔天都會再度結實纍纍，種類與數量隨機。'],
  [10, '黃金指南', 'Golden Guidebook', 'A', 20, '📒', '詳盡列出你在何時、何地能夠邂逅符合理想型異性的黃金旅遊指南。', { type: 'flavor', message: '黃金指南閃耀粉金光芒，書頁指向戀愛都市・愛愛！' }],
  [11, '黃金天秤', 'Golden Scales', 'B', 30, '⚖️', '面對二選一的抉擇時，能為你秤出對未來更有利的一方。', { type: 'flavor', message: '黃金天秤微微傾斜，指針堅定地朝向充滿寶藏的方向！' }],
  [12, '黃金辭典', 'Golden Dictionary', 'S', 10, '📕', '每天都會有一個詞彙閃耀金光，務必熟記該詞，因為隔天它一定會派上用場。'],
  [13, '幸運存摺', 'Luck Bankbook', 'A', 20, '💳', '將日常生活中未使用的小確幸累積起來，便能轉換為現金提領。', { type: 'jenny', amount: 6000, message: '幸運存摺結算了累積的小好運，兌換出 6,000 戒尼！' }],
  [14, '斷緣剪刀', 'Connection Severing Scissors', 'B', 22, '✂️', '剪開討厭對象的照片就能從此不再相見；注意：照片中除你以外的所有人都會受影響。'],
  [15, '反覆無常的魔人', 'Fickle Genie', 'S', 10, '🧞', '能實現三個願望，但你必須提出 1000 個截然不同的願望候補由他挑選（不可用不同金額敷衍）。'],
  [16, '妖精王的忠告', "Fairy King's Advice", 'S', 6, '🧚', '妖精王會溫和而精準地指出你的不足與改進方向，唯一麻煩的是他只按心情現身。'],
  [17, '大天使的氣息', "Angel's Breath", 'SS', 3, '👼', '大天使顯現並治癒一人的一切重傷與絕症、恢復完美健康，只會現身一次。', { type: 'speed_boost', message: '聖潔的大天使顯現並吹出金色氣息，全身煥發充沛活力！' }],
  [18, '小惡魔的眨眼', "Imp's Wink", 'A', 18, '😈', '被她眨眼時會體驗到無與倫比的極樂快感，可多次現身，但務必小心成癮。'],
  [19, '遊魂枕頭', 'Poltergeist Pillow', 'A', 13, '🛏️', '枕著入睡就能讓靈魂出竅自由漫遊，但若 24 小時內未返回肉體就會變成真正的幽靈。'],
  [20, '心境時鐘', 'Mood Clock', 'B', 30, '🕰️', '可自由設定當下心境的時鐘，調至正午即可維持絕對平靜，隨場合調整情緒。'],
  [21, '透視眼鏡', 'X-Ray Goggles', 'B', 27, '🥽', '可穿透物體視物並以旋鈕微調透視深度；唯一無法看穿的是瑪莎多拉的咒語卡包。'],
  [22, '多拉右衛門', 'Toraemon', 'A', 22, '🐯', '瀕臨絕種的珍獸，習慣將各式物品塞進四次元口袋，永遠不知道牠撿了什麼寶物。'],
  [23, '即興之書', 'Tome of a Thousand Tales', 'B', 30, '📚', '每次翻開都會呈現不同故事的奇書，若想繼續讀同一個故事需夾入專用書籤。'],
  [24, '假設電視', 'Hypothetical T.V.', 'A', 20, '📺', '用遙控器輸入「如果……」的假設情境，便會播放 30 小時的模擬紀錄片，支援錄影。'],
  [25, '風險骰子', 'Risky Dice', 'B', 30, '🎲', '20 面骰子，19 面星號大吉、1 面骷髏大凶。擲出大吉好事連連，但大凶會一口氣抵銷先前所有好運。', { type: 'jenny', amount: 8000, message: '風險骰子擲出了★大吉！意外獲得 8,000 戒尼！' }],
  [26, '七個工作小矮人', 'Night Shift Dwarves', 'A', 20, '⛏️', '只要你在睡覺，他們就會代你完成任何你力所能及的工作，但無法做超出你能力之事。'],
  [27, '通行證冊', 'Book of V.I.P Passes', 'B', 25, '🎫', '憑此臉部辨識萬用通行證可暢行世界任何地方，一整本共 1000 張。'],
  [28, '善變遙控器', 'Capricious Remote', 'B', 27, '📱', '能將某人對他人的 10 種情感依 1～10 級強度自由調整（無法控制別人對你的感情）。'],
  [29, '強制預約券', 'Pre-Order Vouchers', 'A', 20, '🧾', '在券上寫下任何市售商品名稱，不論再稀有都保證買得到（仍須付款），共 1000 張。'],
  [30, '人情坐墊', 'Favor Cushion', 'B', 21, '🛋️', '讓某人坐上這個坐墊，對方就會在其能力範圍內為你辦成一件事。'],
  [31, '寄往死者的往復明信片', 'Double Postcard to the Dead', 'S', 13, '✉️', '寫上已故者的姓名寄出，隔天就會收到來自死者的親筆回信，一整本共 1000 張。'],
  [32, '鶯之糖', 'Parrot Candy', 'B', 30, '🍬', '含著這顆糖就能模仿任何人的聲音，效果持續到下次進食為止；共 10 包、每包 50 顆。'],
  [33, '賀爾蒙餅乾', 'Hormone Cookies', 'S', 13, '🍪', '吃下後性別會暫時轉換 24 小時；一組 10 盒，每盒 20 片。'],
  [34, '萬能問卷', 'Universal Survey', 'B', 30, '📋', '寫下關於自己的問題交給對方，對方會毫無隱瞞地誠實作答，可重複使用。'],
  [35, '變色龍貓', 'Chameleon Cat', 'S', 6, '🐱', '瀕危珍獸，馴服後可變身成任何動物，但質量恆定（例如變成迷你大象或巨型倉鼠）。'],
  [36, '再生室', 'Recycling Room', 'S', 10, '🚪', '將損壞的物品放入室中，24 小時後即會煥然一新修復完成；時間到之前絕不可開門。'],
  [37, '大運動家之卵', 'Fledgling Athlete', 'B', 30, '🥚', '每天手握保溫三小時、持續一至十年，孵化後便能成為頂尖運動員；信念越強越快孵化。'],
  [38, '大藝術家之卵', 'Fledgling Artist', 'B', 30, '🎨', '每天手握保溫三小時、持續一至十年，孵化後便能成為頂尖藝術家；信念越強越快孵化。'],
  [39, '大政治家之卵', 'Fledgling Politician', 'B', 30, '🏛️', '每天手握保溫三小時、持續一至十年，孵化後便能成為頂尖政治家；信念越強越快孵化。'],
  [40, '大音樂家之卵', 'Fledgling Musician', 'B', 30, '🎻', '每天手握保溫三小時、持續一至十年，孵化後便能成為頂尖音樂家；信念越強越快孵化。'],
  [41, '大飛行員之卵', 'Fledgling Pilot', 'B', 30, '🛩️', '每天手握保溫三小時、持續一至十年，孵化後便能成為頂尖飛行員；信念越強越快孵化。'],
  [42, '大作家之卵', 'Fledgling Novelist', 'B', 30, '✒️', '每天手握保溫三小時、持續一至十年，孵化後便能成為頂尖小說家；信念越強越快孵化。'],
  [43, '大賭徒之卵', 'Fledgling Gambler', 'B', 30, '🃏', '每天手握保溫三小時、持續一至十年，孵化後便能成為頂尖賭徒；信念越強越快孵化。'],
  [44, '大演員之卵', 'Fledgling Actor', 'B', 30, '🎭', '每天手握保溫三小時、持續一至十年，孵化後便能成為頂尖演員；信念越強越快孵化。'],
  [45, '大社長之卵', 'Fledgling CEO', 'B', 30, '💼', '每天手握保溫三小時、持續一至十年，孵化後便能成為頂尖企業社長；信念越強越快孵化。'],
  [46, '金粉少女', 'Gold Dust Girl', 'A', 13, '✨', '全身會不斷散落金粉的少女，每天沐浴可收集約 500 克純金；生性害羞鮮少出門。', { type: 'jenny', amount: 12000, message: '收集到閃耀的金粉，折換為 12,000 戒尼！' }],
  [47, '睡眠少女', 'Sleeping Girl', 'A', 11, '😴', '能代替你睡覺的少女，只要她在沉睡，你就能 24 小時不眠不休保持清醒。'],
  [48, '芳香少女', 'Aromatherapy Girl', 'A', 15, '🌸', '能散發令你最感到舒心的香氣，只要待在她身旁就能完全遠離壓力。'],
  [49, '掌上人魚', 'Miniature Mermaid', 'A', 23, '🧜', '嬌小到能放在掌心的人魚；居住環境舒適時心情大好，會唱出天籟般的歌聲。'],
  [50, '掌上恐龍', 'Miniature Dino', 'A', 11, '🦕', '能捧在手心的迷你恐龍，每一代繁衍都會誕生不同品種的袖珍恐龍。'],
  [51, '掌上龍', 'Miniature Dragon', 'S', 10, '🐉', '能停在手掌上的迷你飛龍，會聽從你的指令，若以愛心培育甚至能學會說話。'],
  [52, '珍珠蝗蟲', 'Pearl Locusts', 'B', 30, '🦗', '腹部孕育著珍珠的奇異蝗蟲，大約每十幾年才會大發生一次。'],
  [53, '白王鍬形蟲', 'King White Stag Beetle', 'A', 30, '🪲', '以特殊費洛蒙吸引其他昆蟲築起龐大巢穴，每天僅在傍晚外出散步一次。'],
  [54, '千年鳳蝶', 'Millennium Butterfly', 'A', 25, '🦋', '傳說中的幻之昆蟲，據稱捕獲者的家族將世世代代繁榮昌盛。'],
  [55, '復仇商會', 'Revenge Shop', 'A', 20, '⚖️', '向店長傾訴怨恨，對方會依你受的委屈程度代為報復；加付費用可升級報復手段。'],
  [56, '回憶寫真館', 'Perfect Memory Studio', 'B', 25, '📷', '指定過去的日期與時間即可取得當時自己的照片，也能申請連續組照。'],
  [57, '隱居不動產', 'Hideout Realtor', 'A', 11, '🏠', '仲介會在你指定的地點建造專屬秘密房間，但絕不可向他人提及或帶人進入。'],
  [58, '秘密租片店', 'Secrets Video Rental', 'A', 13, '📼', '可租借記錄他人秘密的錄影帶，但嚴禁給其他人觀看或談論內容。'],
  [59, '即時外語教室', 'Instant Foreign Language School', 'A', 20, '🗣️', '在教室學習語言的時間會累積進專用計時器，啟動倒數期間便能流利使用該外語。'],
  [60, '遺失物宅配便', 'Long Lost Delivery', 'B', 30, '📦', '撥打電話描述遺失超過一個月的物品，隔天就會完整宅配到府。'],
  [61, '投幣健檢機', 'Vending Check-Up', 'A', 20, '🩺', '只需 500 戒尼就能完成全身健康掃描，但結果只會顯示「正常」或「有異狀，建議就醫」。'],
  [62, '國王俱樂部', 'Club "You Rule"', 'B', 20, '🥂', '在俱樂部內所有人都會聽命於你，但館內一小時相當於外界度過一整天。'],
  [63, '虛擬餐廳', 'Virtual Restaurant', 'B', 30, '🍽️', '可點選任何想像得到的美食並獲得飽足感，但全是幻覺，離場時會附贈綜合維他命。'],
  [64, '魔女的媚藥', "Witch's Love Potion", 'B', 30, '💘', '親吻藥丸後讓心儀對象服下，對方就會愛上你；一顆維持一週，每瓶 500 顆。'],
  [65, '魔女的返老還童藥', "Witch's Rejuvenation Potion", 'S', 10, '🧪', '每服一顆肉體年輕一歲且保留知識記憶，切記不可服用超過年齡的顆數；每瓶 100 顆。'],
  [66, '魔女的減肥藥', "Witch's Diet Pills", 'B', 28, '💊', '每服一顆減少一公斤體重，不可服用超過自身體重否則致死；每瓶 200 顆。'],
  [67, '長老的增高藥', "Doyen's Growth Pills", 'B', 30, '📏', '每服一顆長高一公分，每瓶 100 顆，不建議未滿 20 歲者使用。'],
  [68, '長老的精力藥', "Doyen's Virility Pills", 'A', 20, '⚡', '大幅強化身體某部位的持久力與頻率，每瓶含 500 顆。'],
  [69, '長老的生髮水', "Doyen's Hair Restorer", 'B', 30, '🧴', '塗抹之處皆會長出濃密秀髮，務必戴手套以免掌心長毛；每瓶 200 ml（足供十顆頭）。'],
  [70, '瘋狂科學家的肌肉增強劑', "Mad Scientist's Steroids", 'A', 16, '💪', '免運動就能練成夢寐以求的肌肉，但需連續一週每天喝下一公升極度難喝的藥劑；共 7 箱 70 瓶。'],
  [71, '瘋狂科學家的費洛蒙', "Mad Scientist's Pheromones", 'A', 20, '💨', '噴灑於身上可強烈吸引異性，但無法調節濃度，小心招來大量跟蹤狂。'],
  [72, '瘋狂科學家的整形機', "Mad Scientist's Plastic Surgery", 'A', 15, '🪞', '掃描理想容貌的照片即可完全變臉；每次手術有 5% 失敗率與 1% 機器損壞率。'],
  [73, '暗之翡翠', 'Night Jade', 'A', 15, '🟢', '受惡魔「祝福」的寶石，當災厄即將降臨於持有者時，會將其轉嫁至他人身上。'],
  [74, '賢者的海藍寶石', "Sage's Aquamarine", 'A', 11, '💠', '持有者將結交許多聰明睿智的摯友，並能與他們維持一生不變的友誼。'],
  [75, '奇運亞歷山大石', 'Wild Luck Alexandrite', 'A', 20, '💎', '持有者將不斷遭遇一生難得一見的奇蹟與極端體驗，但無法選擇究竟是好運還是厄運……', { type: 'flavor', message: '奇運亞歷山大石在陽光下變換出翠綠與紫紅的神秘光彩！' }],
  [76, '流浪紅寶石', 'Roaming Ruby', 'B', 30, '♦️', '持有者將獲得龐大財富，但代價是永遠無法在同一個地方停留超過一週。'],
  [77, '呼喚美貌的祖母綠', 'Beauty Magnet Emerald', 'S', 10, '💚', '各界美容專家會蜂擁而至為持有者服務，使其綻放出前所未見的絕世美貌。'],
  [78, '孤獨藍寶石', 'Lonely Sapphire', 'B', 30, '🔷', '持有者將坐擁無盡財富，但代價是遭親友與愛人疏遠、孤獨終老。'],
  [79, '彩虹鑽石', 'Rainbow Diamond', 'A', 20, '🌈', '綻放七彩霓虹光芒的絕美鑽石，拿這顆鑽石求婚保證對方答應。'],
  [80, '浮游石', 'Levitation Stone', 'S', 7, '🪨', '約一克拉大小的漂浮奇石，吸收太陽光即可產生能量讓一名成年人懸浮空中。', { type: 'speed_boost', message: '浮游石汲取陽光輕盈浮起，你的步伐瞬間如履平地！' }],
  [81, '藍色行星', 'Blue Planet', 'SS', 5, '🌍', '成分不屬於任何已知礦物的獨一無二藍寶石，蘊含宛如宇宙深藍的絕世光輝。', { type: 'flavor', message: '璀璨深藍的宇宙星光在掌中流轉，美得令人屏息！' }],
  [82, '天罰之杖', 'Staff of Judgment', 'A', 15, '🪄', '高舉權杖並喊出欲懲罰對象之名，你與對方之中作惡較多的一方將遭受天罰。'],
  [83, '真實之劍', 'Sword of Truth', 'B', 22, '⚔️', '能一刀劈開任何謊言與虛偽；若誤斬真實之物劍身會碎裂，收回劍鞘一天即可再生。'],
  [84, '聖騎士的首飾', "Paladin's Necklace", 'D', 60, '📿', '配戴的玩家能彈開對自身施放的詛咒咒語，並解除所接觸卡片的偽裝狀態。', { type: 'flavor', message: '神聖銀光環繞頸間，彷彿任何惡意咒語都無法近身！' }],
  [85, '替身鎧甲', 'Scapegoat/Sacrifice Armor', 'S', 8, '🛡️', '能完全無效化來自卡片實體化武器的攻擊，但會在 100 次攻擊內隨機損壞。'],
  [86, '挫敗之弓', 'Quiver of Frustration', 'A', 11, '🏹', '附帶 10 支箭矢，每射出一支即可發動一次「離開」咒語將目標驅離出島。'],
  [87, '信念之盾', 'Shield of Faith', 'S', 15, '🔰', '裝備者半徑 20 公尺內，「左遷」、「回歸」、「漂流」、「衝突」四種咒語全數無效。'],
  [88, '不滅大槌', 'Eternal Hammer', 'A', 15, '🔨', '被擊中者會隨機承受一種攻擊咒語且無法以防禦咒語抵擋（對「堅牢」或「聖騎士的首飾」無效）。'],
  [89, '稅務長之護手', "Tax Collector's Gauntlet", 'A', 20, '🧤', '賦予施展「徵收」的能力，但每次使用會隨機破壞自己指定口袋的一張卡片（空袋無法發動）。'],
  [90, '記憶頭盔', 'Memory Helmet', 'A', 20, '⛑️', '配戴期間所見所聞皆永不忘記，唯獨體積異常巨大且沉重。'],
  [91, '模型王', 'Plastic King', 'A', 20, '🚗', '1:1 等比例組合模型套件，重新拼裝可打造任何能實際運作的載具（燃料自備）。'],
  [92, '替身券', 'Swap Ticket', 'S', 7, '🎟️', '撕開交給對方即可與其互換人生 24 小時，一整本共 1000 張。'],
  [93, '人生圖鑑', 'Book of Life', 'B', 28, '📖', '詳實收錄自你出生以來曾有交集的所有人物、對話與事件，頁數可能高達數萬頁。'],
  [94, '盜賊之劍', "Bandit's Blade", 'S', 10, '🗡️', '攻擊命中時將對目標發動「強奪」、「扒手」或「竊盜」（對「堅牢」與「聖騎士的首飾」無效）。'],
  [95, '秘密斗篷', 'Secret Cape', 'A', 20, '🧥', '披戴期間持續受到「暗幕」保護，阻擋他人窺視你的集卡書內容。'],
  [96, '千里眼之蛇', 'Clairvoyant Snake', 'A', 12, '🐍', '只要餵牠吃下一張 C 級以上的卡片，便會吐出一張「千里眼」咒語卡。'],
  [97, '3D 相機', '3-D Camera', 'A', 20, '📸', '拍攝後的照片會連同真實質感沖洗為立體 3D 實物，並可自由放大尺寸。'],
  [98, '銀犬', 'Silver Dog', 'S', 8, '🐕', '身披銀毛的瀕危珍獸，每天在飼料中混入 5 克黃金，便會排出一公斤純銀糞便。', { type: 'jenny', amount: 10000, message: '銀犬搖搖尾巴吐出閃亮純銀塊，兌換獲得 10,000 戒尼！' }],
  [99, '女僕熊貓', 'Panda Maid', 'S', 6, '🐼', '瀕危珍獸，愛乾淨又熱愛料理，各有所長（如縫紉、園藝），極擅長照顧人類小孩。', { type: 'flavor', message: '可愛的女僕熊貓向你鞠躬致意，遞上一杯熱騰騰的瑪莎多拉花茶！' }],
];

export const SPECIFIED_CARDS: CardDef[] = SPECIFIED_ROWS.map(
  ([id, name, enName, rank, limit, icon, description, gainEffect]) => ({
    id,
    code: String(id).padStart(3, '0'),
    name,
    enName,
    category: 'specified',
    border: 'red',
    rank,
    limit,
    icon,
    description,
    sellPrice: id === 0 ? 999999 : defaultSellPrice(rank, 'specified'),
    gainEffect: gainEffect ?? {
      type: 'flavor',
      message: `GAIN！「No.${String(id).padStart(3, '0')} ${name}」在念氣光芒中實體化顯現！`,
    },
  })
);

// ---------------------------------------------------------------------------
// 2. 全部 40 張咒語卡（1001–1040，藍框 Blue Border）
//    完整對齊 Hunterpedia: List of the 40 Spell Cards（含射程與分類標籤）
// ---------------------------------------------------------------------------
type SpellRow = [
  id: number,
  name: string,
  enName: string,
  classes: SpellClassTag[],
  rank: CardRank,
  limit: number,
  icon: string,
  description: string,
  gainEffect?: CardGainEffect,
];

const SPELL_ROWS: SpellRow[] = [
  [1001, '偷窺', 'Peek', ['LR', 'RS'], 'G', 200, '👁️', '查看一名曾經遇見過的玩家自由口袋內所有卡片內容。'],
  [1002, '透視', 'Fluoroscopy', ['LR', 'RS'], 'F', 150, '🔭', '查看一名曾經遇見過的玩家指定口袋內所有卡片內容。'],
  [1003, '防壁', 'Defensive Wall', ['SR', 'DS'], 'G', 400, '🧱', '阻擋來自其他玩家的一次攻擊咒語。'],
  [1004, '反射', 'Reflect', ['SR', 'DS'], 'E', 120, '🪞', '將曾經遇見過之玩家施放的攻擊咒語反彈回去。'],
  [1005, '磁力', 'Magnetic Force', ['LR', 'RS'], 'C', 50, '🧲', '讓自己一人瞬間飛往指定目標玩家所在的位置。', { type: 'teleport_masadora', message: '「使用磁力！目的地：瑪莎多拉！」念氣光柱將你瞬間送抵魔法都市！' }],
  [1006, '扒手', 'Pickpocket', ['SR', 'AS'], 'F', 170, '🖐️', '從目標玩家的自由口袋中隨機奪取一張卡片。'],
  [1007, '竊盜', 'Thief', ['SR', 'AS'], 'C', 50, '🧤', '從目標玩家的指定口袋中隨機奪取一張卡片。'],
  [1008, '交換', 'Trade', ['SR', 'AS'], 'E', 100, '🔄', '將自己的一張卡片與目標玩家的一張卡片隨機交換。'],
  [1009, '回歸', 'Return', ['LR', 'RS'], 'G', 380, '↩️', '讓施咒者一人飛往曾經造訪過的指定地點。', { type: 'open_map', message: '「使用回歸！」開啟島的地圖選擇曾經造訪過的城鎮！' }],
  [1010, '擬態', 'Mimic', ['SR', 'RS'], 'A', 20, '🎭', '將卡片變形為施咒者已持有的一張目標卡片複製品（若已達卡片化上限則失敗並消失）。'],
  [1011, '複製', 'Clone', ['SR', 'RS'], 'D', 70, '📑', '變形為目標玩家指定口袋中隨機一張卡片（若對方無指定卡或已達上限則失敗消失）。'],
  [1012, '左遷', 'Relegate', ['SR', 'RS'], 'F', 140, '💨', '將目標玩家強制吹飛至島上某個地點。', { type: 'teleport_random_town', message: '「使用左遷！」強風將你瞬間送往島上另一處地點！' }],
  [1013, '出發', 'Origin', ['SR', 'RS'], 'D', 65, '🗼', '將目標玩家傳送回遊戲起點（Shiso Tree 起始之塔）。', { type: 'teleport_shiso', message: '「使用出發！」光柱將你送回起始之塔 Shiso Tree！' }],
  [1014, '離開', 'Leave', ['SR', 'RS'], 'B', 30, '🚪', '讓目標玩家離開貪婪之島（本作為返回起始大廳）。', { type: 'teleport_lobby', message: '「使用離開！」傳送光束將你帶回起始大廳！' }],
  [1015, '千里眼', 'Clairvoyance', ['LR', 'RS'], 'D', 70, '🔮', '一次看穿目標玩家指定口袋與自由口袋的全部卡片資料。'],
  [1016, '漂流', 'Drift', ['SR', 'RS'], 'F', 200, '🧭', '飛往一座尚未造訪過的隨機城鎮；若所有城鎮皆已造訪則停於原地且卡片消失。', { type: 'teleport_random_town', message: '「使用漂流！」念氣氣流帶你飛向一座隨機城鎮！' }],
  [1017, '衝突', 'Collision', ['SR', 'RS'], 'F', 200, '⚡', '飛往一名尚未遇見過的隨機玩家所在位置；若所有玩家皆已遇見則留在原地。'],
  [1018, '徵收', 'Levy', ['SR', 'RS'], 'B', 25, '💰', '向自身半徑 20 公尺內的所有玩家各隨機徵收一張卡片。'],
  [1019, '城門', 'Drawbridge', ['SR', 'DS', 'AA', 'VS'], 'F', 200, '🏰', '阻擋來自其他玩家的一次短距離通常咒語。'],
  [1020, '贋作', 'Fake', ['SR', 'RS'], 'C', 40, '🃏', '變形為 No.001～099 任一張卡片並可放入指定口袋，但不計入通關與上限且無法實體化。'],
  [1021, '強奪', 'Mug', ['SR', 'AS'], 'B', 30, '💥', '從目標玩家手中任意指定並奪取一張卡片。'],
  [1022, '墮落', 'Corruption', ['SR', 'AS'], 'C', 40, '☠️', '將目標玩家一張 B 級以上卡片變為施咒者指定的 D 級以下卡片（若錯置指定格則破壞）。'],
  [1023, '妥協', 'Compromise', ['SR', 'AS'], 'B', 25, '⚖️', '指定破壞目標玩家一張 A 級以上卡片，但對方可任選獲得一張低 3 階的卡片。'],
  [1024, '看破', 'Dispel', ['SR', 'RS'], 'D', 80, '✨', '讓目標玩家所有因「贋作」、「複製」、「擬態」變形的卡片恢復原形，錯置者即破壞。'],
  [1025, '暗幕', 'Blackout Curtain', ['SR', 'DS', 'C'], 'F', 200, '🕶️', '持續保護自己免於「偷窺」與「透視」的窺視效果。'],
  [1026, '聖水', 'Holy Water', ['SR', 'DS', 'C'], 'A', 20, '💧', '保護玩家免受其他玩家 10 次攻擊咒語，且此卡本身免疫竊盜與破壞咒語。', { type: 'speed_boost', message: '聖水庇護展開，身心清澈輕盈，奔跑速度暫時提升！' }],
  [1027, '追蹤', 'Trace', ['SR', 'AS'], 'E', 90, '📍', '可隨時掌握指定目標玩家的即時所在地（持續至目標離開遊戲）。'],
  [1028, '投石', 'Rock Toss', ['SR', 'AS'], 'E', 100, '🪨', '隨機破壞目標玩家自由口袋中的一張卡片。'],
  [1029, '凶彈', 'Bullet', ['SR', 'AS'], 'B', 25, '🔫', '隨機破壞目標玩家指定口袋中的一張卡片。'],
  [1030, '道標', 'Guidepost', ['LR', 'RS'], 'E', 120, '🗺️', '顯示指定編號卡片的所在位置（No.000 除外）。', { type: 'analysis', message: '「使用道標！」念力標記了島上各處尚未拾取的卡片光點！' }],
  [1031, '解析', 'Analysis', ['LR', 'RS'], 'G', 400, '🔍', '顯示指定編號卡片的詳細說明與取得資料（No.000 除外）。', { type: 'analysis', message: '「使用解析！」已將全島指定卡片與收集進度同步至集卡書！' }],
  [1032, '抽籤', 'Lottery', ['SR', 'RS'], 'G', 350, '🎰', '隨機變形為一張道具卡片。', { type: 'lottery', message: '「使用抽籤！」卡片閃爍金光，隨機化為了一張貪婪之島道具卡！' }],
  [1033, '密著', 'Cling', ['SR', 'AS'], 'C', 50, '🧲', '隨時可瀏覽目標玩家指定口袋的完整資料（持續至目標離開遊戲）。'],
  [1034, '淨化', 'Purify', ['SR', 'RS'], 'D', 55, '🫧', '解除變形咒語並使卡片恢復原狀（若超限則直接實體化無法再卡片化）。'],
  [1035, '堅牢', 'Fortress', ['SR', 'DS', 'C', 'AA'], 'S', 10, '🛡️', '永久保護指定口袋某一頁所有已插入的卡片免於竊盜與破壞咒語（不可選自由頁）。'],
  [1036, '神眼', 'Eye of God', ['LR', 'C'], 'S', 10, '🌟', '永久獲得對 No.000～099 全部卡片發動「一覽」與「解析」的效果（直到出島）。', { type: 'analysis', message: '「使用神眼！」全島 000～099 卡片動態盡收眼底！' }],
  [1037, '再生', 'Recycle', ['SR', 'RS'], 'F', 170, '♻️', '將已實體化的道具再次卡片化（限 C 級以下；若已達卡片化上限則失敗消失）。'],
  [1038, '一覽', 'List', ['LR', 'RS'], 'G', 350, '📊', '顯示目標卡片目前持有玩家人數以及全島總卡片化張數。', { type: 'analysis', message: '「使用一覽！」集卡書顯示了目前島上已收錄的卡片總數！' }],
  [1039, '同行', 'Accompany', ['SR', 'RS'], 'F', 130, '✈️', '讓施咒者與半徑 20 公尺內夥伴一同飛往曾造訪過的城鎮或曾遇見過的玩家身邊！', { type: 'open_map', message: '「使用同行！」開啟 No.101 島的地圖選擇目的地！' }],
  [1040, '交信', 'Contact', ['LR', 'RS'], 'F', 200, '📡', '透過集卡書與曾遇見的玩家通話最長 3 分鐘，期間僅發起者可主動切斷通訊。'],
];

export const SPELL_CARDS: CardDef[] = SPELL_ROWS.map(
  ([id, name, enName, spellClasses, rank, limit, icon, description, gainEffect]) => ({
    id,
    code: String(id),
    name,
    enName,
    category: 'spell',
    border: 'blue',
    rank,
    limit,
    spellClasses,
    icon,
    description,
    sellPrice: defaultSellPrice(rank, 'spell'),
    gainEffect: gainEffect ?? {
      type: 'flavor',
      message: `「使用${name}（${enName}）！」藍色咒語念氣光環在身前展開！`,
    },
  })
);

// ---------------------------------------------------------------------------
// 3. 19 張原作自由口袋卡片（無指定格道具／魔獸／NPC，黃框 Yellow Border）
//    完整對齊 Hunterpedia: List of the Un-Restricted Slot Cards (Free Slots)
// ---------------------------------------------------------------------------
export const FREE_SLOT_CARDS: CardDef[] = [
  {
    id: 100,
    code: '100',
    name: '島的地圖（空白）',
    enName: "Map of the Island 'empty'",
    category: 'item',
    border: 'yellow',
    rank: 'G',
    limit: 400,
    icon: '🗺️',
    description: '貪婪之島的地圖。初始未標示任何城鎮與記號，會隨旅途自動記錄補完。',
    sellPrice: 1200,
    gainEffect: { type: 'open_map', message: '展開 No.100 島的地圖，檢視目前探索區域！' },
  },
  {
    id: 101,
    code: '101',
    name: '島的地圖（詳細）',
    enName: "Map of the Island 'detailed'",
    category: 'item',
    border: 'yellow',
    rank: 'D',
    limit: 70,
    icon: '🧭',
    description: '詳盡標記全島所有城鎮與地標位置的貪婪之島完整地圖。',
    sellPrice: 7500,
    gainEffect: { type: 'open_map', message: '展開 No.101 詳細版島的地圖，可一鍵同行前往全島 12 大地點！' },
  },
  {
    id: 102,
    code: '102',
    name: '引換券',
    enName: 'Voucher',
    category: 'item',
    border: 'yellow',
    rank: 'SS',
    limit: 150,
    icon: '🎟️',
    description: '特殊兌換券，一旦「大天使的氣息」卡片化上限出現空缺就會自動變為該卡。',
    sellPrice: 40000,
    gainEffect: { type: 'flavor', message: '引換券散發神聖的微光，靜靜等待 No.017 大天使的氣息釋出名額。' },
  },
  {
    id: 110,
    code: '110',
    name: '統治者的招待狀',
    enName: "Ruler's Invitation",
    category: 'item',
    border: 'yellow',
    rank: 'SS',
    limit: 1,
    icon: '📜',
    description: '誠摯邀請破關者造訪貪婪之島首都「利梅洛」並進入王城覲見管理者的邀請函。',
    sellPrice: 80000,
    gainEffect: { type: 'flavor', message: '金色封蠟綻放光輝，邀請你前往北方首都利梅洛王城！' },
  },
  {
    id: 163,
    code: '163',
    name: '生病的村民',
    enName: 'Sick Villagers',
    category: 'item',
    border: 'yellow',
    rank: 'F',
    limit: 150,
    icon: '🤒',
    description: '身染貪婪之島特有流行病的山賊之村村民們。',
    sellPrice: 1500,
    gainEffect: { type: 'flavor', message: '虛弱的村民們咳了幾聲，期盼能找到治癒流行病的方法。' },
  },
  {
    id: 263,
    code: '263',
    name: '健康的村民',
    enName: 'Healthy Villagers',
    category: 'item',
    border: 'yellow',
    rank: 'C',
    limit: 50,
    icon: '🧑‍🌾',
    description: '徹底康復、精神抖擻的村民們！',
    sellPrice: 9500,
    gainEffect: { type: 'flavor', message: '恢復元氣的村民們向你歡呼道謝！' },
  },
  {
    id: 266,
    code: '266',
    name: '離境通行票',
    enName: 'Transport Ticket',
    category: 'item',
    border: 'yellow',
    rank: 'B',
    limit: 150,
    icon: '🚢',
    description: '在貪婪之島港向港長取得、憑此可經由艾蓮娜之塔安全離開遊戲返回現實世界的通行票。',
    sellPrice: 22000,
    gainEffect: { type: 'teleport_lobby', message: '出示 No.266 離境通行票！青色傳送門將你送回起始大廳！' },
  },
  {
    id: 572,
    code: '572',
    name: '大獨眼巨人',
    enName: 'Giant Cyclops',
    category: 'item',
    border: 'yellow',
    rank: 'G',
    limit: 333,
    icon: '👹',
    description: '體型最龐大的獨眼巨人，通常成群結隊行動並攻擊闖入領地的一切對象。',
    sellPrice: 2200,
  },
  {
    id: 585,
    code: '585',
    name: '泡泡馬',
    enName: 'Bubble Horse',
    category: 'item',
    border: 'yellow',
    rank: 'C',
    limit: 50,
    icon: '🐴',
    description: '難以捕獲的敏捷魔獸，遇敵會噴出兩種泡泡擾敵：白泡泡遇念氣即破，紅泡泡遇念氣以外物體才破。',
    sellPrice: 12000,
    gainEffect: { type: 'speed_boost', message: '紅白泡泡四散紛飛，你的動作變得如泡泡馬般輕盈迅捷！' },
  },
  {
    id: 598,
    code: '598',
    name: '狼群首領',
    enName: 'Chief of Wolf Pack',
    category: 'item',
    border: 'yellow',
    rank: 'C',
    limit: 45,
    icon: '🐺',
    description: '率領荒野狼群襲擊旅人的兇猛首領。',
    sellPrice: 11000,
  },
  {
    id: 607,
    code: '607',
    name: 'J10,000',
    enName: 'J10,000',
    category: 'item',
    border: 'yellow',
    rank: 'H',
    limit: '∞',
    icon: '💰',
    description: '卡片化狀態的 10,000 戒尼。使用「GAIN」可立刻實體化兌換為 10,000 戒尼！',
    sellPrice: 10000,
    gainEffect: { type: 'jenny', amount: 10000, message: 'GAIN！卡片化為 10,000 戒尼收入錢包！' },
  },
  {
    id: 673,
    code: '673',
    name: '超高速毛球',
    enName: 'Hyper Puffball',
    category: 'item',
    border: 'yellow',
    rank: 'D',
    limit: 80,
    icon: '💨',
    description: '移動速度極快、極難捕捉的草原小生物。GAIN 後可感受疾風般的速度提升！',
    sellPrice: 6800,
    gainEffect: { type: 'speed_boost', message: '超高速毛球疾馳而過！你的奔跑速度大幅提升 15 秒！' },
  },
  {
    id: 697,
    code: '697',
    name: '黑色素蜥蜴',
    enName: 'Melanin Lizard',
    category: 'item',
    border: 'yellow',
    rank: 'E',
    limit: 100,
    icon: '🦎',
    description: '體型龐大到足以整頭吞下一隻牛的巨大蜥蜴。',
    sellPrice: 4800,
  },
  {
    id: 711,
    code: '711',
    name: '遙控鼠',
    enName: 'Radio Rat',
    category: 'item',
    border: 'yellow',
    rank: 'H',
    limit: 800,
    icon: '🐭',
    description: '能用念氣操控鎧甲誘敵、趁本體逃走的狡猾生物。',
    sellPrice: 1200,
  },
  {
    id: 1217,
    code: '1217',
    name: '加爾凱達魚',
    enName: 'Galgaida',
    category: 'item',
    border: 'yellow',
    rank: 'F',
    limit: 185,
    icon: '🐟',
    description: '貪婪之島水域特產魚類，料理過後極為美味。',
    sellPrice: 2400,
  },
  {
    id: 7018,
    code: '7018',
    name: '奇頓魚',
    enName: 'Chidon',
    category: 'item',
    border: 'yellow',
    rank: 'C',
    limit: '?',
    icon: '🐠',
    description: '登場於漫畫第 172 話的稀有魚類卡片。',
    sellPrice: 9000,
  },
  {
    id: 9999,
    code: '?',
    name: '金粉少女的護衛',
    enName: 'Gold Dust Girl Guard',
    category: 'item',
    border: 'yellow',
    rank: 'F',
    limit: '?',
    icon: '💂',
    description: '負責看守並保護「金粉少女」的城鎮 NPC 護衛。',
    sellPrice: 2500,
  },
  {
    id: 14170,
    code: '14170',
    name: '汽油',
    enName: 'Gasoline',
    category: 'item',
    border: 'yellow',
    rank: 'H',
    limit: '∞',
    icon: '⛽',
    description: '裝滿汽油的玻璃瓶，遇火極易猛烈燃燒。',
    sellPrice: 600,
  },
  {
    id: 21449,
    code: '21449',
    name: '石頭',
    enName: 'Rock',
    category: 'item',
    border: 'yellow',
    rank: 'H',
    limit: '∞',
    icon: '🪨',
    description: '隨處可見的普通石頭，質地堅硬、大小不一。小傑入島後第一張卡片化的物品正是它！',
    sellPrice: 300,
    gainEffect: { type: 'flavor', message: '一顆普通的石頭「咚」地掉在地上……重現了小傑入島的名場面！' },
  },
  {
    id: 25008,
    code: '25008',
    name: '大石頭',
    enName: 'Large Rock',
    category: 'item',
    border: 'yellow',
    rank: 'H',
    limit: '∞',
    icon: '🪨',
    description: '體積龐大的巨石。',
    sellPrice: 450,
    gainEffect: { type: 'flavor', message: '轟隆一聲，一塊沉重的大石頭實體化落地！' },
  },
];

// 保留舊匯出名稱 ITEM_CARDS 確保模組相容
export const ITEM_CARDS: CardDef[] = FREE_SLOT_CARDS;

// ---------------------------------------------------------------------------
// 4. 4 張遊戲管理者專用卡（-000 至 -003，黑框 Black Border）
//    完整對齊 Hunterpedia: List of Game Master-only Cards
// ---------------------------------------------------------------------------
export const GM_CARDS: CardDef[] = [
  {
    id: -1000,
    code: '-000',
    name: '除錯（Debug）',
    enName: 'Debug',
    category: 'gm',
    border: 'black',
    rank: 'GM',
    limit: null,
    spellClasses: ['LR', '*S'],
    icon: '🛠️',
    description: '【GM 專用】強制啟動貪婪之島內任一特殊遊戲事件。',
    sellPrice: 0,
  },
  {
    id: -1001,
    code: '-001',
    name: '控制（Under Control）',
    enName: 'Under Control',
    category: 'gm',
    border: 'black',
    rank: 'GM',
    limit: null,
    spellClasses: ['LR', '*S'],
    icon: '⛓️',
    description: '【GM 專用】令指定 NPC 或敵人立刻停止一切行動。',
    sellPrice: 0,
  },
  {
    id: -1002,
    code: '-002',
    name: '重置（Reset）',
    enName: 'Reset',
    category: 'gm',
    border: 'black',
    rank: 'GM',
    limit: null,
    spellClasses: ['LR', '*S'],
    icon: '🔄',
    description: '【GM 專用】強制重置指定目標玩家的全部卡片資料。',
    sellPrice: 0,
  },
  {
    id: -1003,
    code: '-003',
    name: '排除（Eliminate）',
    enName: 'Eliminate',
    category: 'gm',
    border: 'black',
    rank: 'GM',
    limit: null,
    spellClasses: ['LR', '*S'],
    icon: '🌀',
    description: '【GM 專用】磊札曾對幻影旅團使用：將任何非法闖入貪婪之島者強制傳送至艾珍大陸隨機地點。',
    sellPrice: 0,
  },
];

// 全部 164 張官方圖鑑總表（100 指定 + 40 咒語 + 20 自由道具/NPC + 4 GM）
export const ALL_CANON_CARDS: CardDef[] = [
  ...SPECIFIED_CARDS,
  ...SPELL_CARDS,
  ...FREE_SLOT_CARDS,
  ...GM_CARDS,
];

// 建立完整查詢表（含舊版存檔 ID 2001–2004 向下相容別名）
export const CARD_DB: Record<number, CardDef> = {};

for (const c of ALL_CANON_CARDS) {
  CARD_DB[c.id] = c;
}

// 向下相容舊存檔的自由口袋卡片 ID（不影響既有 localStorage）
CARD_DB[2001] = CARD_DB[607];   // 舊戒尼小袋 → No.607 J10,000
CARD_DB[2002] = CARD_DB[607];   // 舊古代金幣箱 → No.607 J10,000
CARD_DB[2003] = CARD_DB[21449]; // 舊石頭 → No.21449 石頭
CARD_DB[2004] = CARD_DB[673];   // 舊疾風草藥 → No.673 超高速毛球

export function getCardDef(id: number): CardDef {
  return CARD_DB[id] ?? CARD_DB[21449];
}

export function drawSpellPack(guaranteedHighRank: boolean): CardDef[] {
  const results: CardDef[] = [];
  const highPool = SPELL_CARDS.filter((c) => RANK_ORDER[c.rank] >= RANK_ORDER['C']);

  for (let i = 0; i < 3; i++) {
    if (guaranteedHighRank && i === 0) {
      results.push(highPool[Math.floor(Math.random() * highPool.length)]);
    } else {
      // 依原作稀有度（S/A/B/C/D/E/F/G）加權抽取全部 40 張咒語卡
      const weighted: CardDef[] = [];
      for (const card of SPELL_CARDS) {
        const weight = Math.max(1, 11 - RANK_ORDER[card.rank]);
        for (let w = 0; w < weight; w++) weighted.push(card);
      }
      results.push(weighted[Math.floor(Math.random() * weighted.length)]);
    }
  }
  return results;
}

export function drawRandomFreeItemCard(): CardDef {
  const pool = FREE_SLOT_CARDS.filter((c) => c.id !== 110 && c.id !== 102);
  return pool[Math.floor(Math.random() * pool.length)];
}
