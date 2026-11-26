import { CardDef, SpellClassTag } from '../game/cards';

/**
 * 原作咒語／GM 卡片右下角「圓框漢字印章」對照表（對齊 Hunterpedia 與 2011 動畫實卡）。
 */
export const SPELL_STAMP_KANJI: Record<SpellClassTag, { kanji: string; title: string }> = {
  SR: { kanji: '近', title: '短距離（Short Range）' },
  LR: { kanji: '遠', title: '長距離（Long Range）' },
  RS: { kanji: '通', title: '通常咒語（Regular）' },
  AS: { kanji: '攻', title: '攻擊咒語（Attack）' },
  DS: { kanji: '防', title: '防禦咒語（Defensive）' },
  AA: { kanji: '反', title: '反攻擊（Anti-Attack）' },
  C: { kanji: '継', title: '持續咒語（Continuous）' },
  VS: { kanji: '対', title: '對抗咒語（Versus）' },
  '*S': { kanji: '特', title: '管理者專用特殊咒語（Special）' },
};

/**
 * 取得本機自託管的 Hunterpedia 原作實卡原圖路徑（public/cards/<id>.webp，零外部熱連結）。
 */
export function getCardImageUrl(cardId: number): string {
  return `./cards/${cardId}.webp`;
}

/**
 * 直接渲染 100% 原作官方實卡原圖（對齊 Hunterpedia Greed_Island_Card_Lists）。
 */
export function renderAuthenticCardHTML(
  card: CardDef,
  size: 'mini' | 'pack' | 'full',
  _instanceKey = '0'
): string {
  const imgUrl = getCardImageUrl(card.id);
  const safeAlt = `No.${card.code} ${card.name} (${card.enName})`.replace(/"/g, '&quot;');

  return `
    <span class="gi-real-card gi-card-photo gi-card-${size}" title="${safeAlt}">
      <img
        class="gi-card-scan-img"
        src="${imgUrl}"
        alt="${safeAlt}"
        loading="${size === 'mini' ? 'lazy' : 'eager'}"
        decoding="async"
        draggable="false"
      />
    </span>
  `;
}

export function renderCardBackHTML(): string {
  return `
    <span class="gi-real-card gi-card-full gi-card-back-face">
      <img class="gi-card-back-photo" src="./cards/back.png" alt="貪婪之島卡背" width="408" height="490" decoding="async" draggable="false" />
    </span>
  `;
}

export function renderBookCoverSVG(): string {
  return `
    <svg class="gi-book-cover-svg" viewBox="104 60 921 1273" aria-hidden="true">
      <image href="./cards/book-cover-redrawn.png" width="1127" height="1396" />
    </svg>
  `;
}
