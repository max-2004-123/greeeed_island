import {
  ALL_CANON_CARDS,
  CardCategory,
  CardDef,
  formatRankLimit,
  getCardDef,
} from '../game/cards';
import { GameState, MAX_FREE_SLOTS } from '../game/state';
import {
  renderAuthenticCardHTML,
  renderBookCoverSVG,
  renderCardBackHTML,
} from './cardRenderer';

export interface BookCallbacks {
  onGainEffect: (card: CardDef) => void;
  getSpellTargets: (card: CardDef) => SpellTargets;
  onCastSpell: (card: CardDef, targetId: string) => void;
  onVisibilityChange: (open: boolean) => void;
}

export interface SpellTargets {
  options: { id: string; label: string }[];
  unavailable?: string;
}

type BookTab = 'cover' | 'specified' | 'free' | 'catalog';
type CatalogFilter = 'all' | CardCategory;

interface Selection {
  pocket: 'specified' | 'free' | 'catalog';
  slotKey: number;
  cardId: number;
}

interface SpreadSpec {
  leftFolio: string;
  rightFolio: string;
  leftType: 'zero_single' | 'specified_grid' | 'free_grid';
  rightType: 'specified_grid' | 'free_grid' | 'spell_reader';
  leftStart?: number;
  rightStart?: number;
}

// 100% 還原原作雙頁跨頁編排：
// 第 1 跨頁：左頁單獨置中 000（統治者的祝福），右頁 3×3（001–009）
// 第 2–6 跨頁：左右各 3×3 共 18 格，完整涵蓋 010–099（共 100 格）
const SPECIFIED_SPREADS: SpreadSpec[] = [
  { leftFolio: 'SPECIFIED · 000', rightFolio: '001 – 009 · 1 / 6', leftType: 'zero_single', rightType: 'specified_grid', rightStart: 1 },
  { leftFolio: '010 – 018', rightFolio: '019 – 027 · 2 / 6', leftType: 'specified_grid', rightType: 'specified_grid', leftStart: 10, rightStart: 19 },
  { leftFolio: '028 – 036', rightFolio: '037 – 045 · 3 / 6', leftType: 'specified_grid', rightType: 'specified_grid', leftStart: 28, rightStart: 37 },
  { leftFolio: '046 – 054', rightFolio: '055 – 063 · 4 / 6', leftType: 'specified_grid', rightType: 'specified_grid', leftStart: 46, rightStart: 55 },
  { leftFolio: '064 – 072', rightFolio: '073 – 081 · 5 / 6', leftType: 'specified_grid', rightType: 'specified_grid', leftStart: 64, rightStart: 73 },
  { leftFolio: '082 – 090', rightFolio: '091 – 099 · 6 / 6', leftType: 'specified_grid', rightType: 'specified_grid', leftStart: 82, rightStart: 91 },
];

// 自由口袋 45 格（5 頁 × 9 格）＋封底內頁「咒語卡插入槽與目標顯示螢幕」
const FREE_SPREADS: SpreadSpec[] = [
  { leftFolio: '自由口袋', rightFolio: '自由口袋 · 1 / 3', leftType: 'free_grid', rightType: 'free_grid', leftStart: 0, rightStart: 9 },
  { leftFolio: '自由口袋', rightFolio: '自由口袋 · 2 / 3', leftType: 'free_grid', rightType: 'free_grid', leftStart: 18, rightStart: 27 },
  { leftFolio: '自由口袋', rightFolio: '咒語插槽 · 3 / 3', leftType: 'free_grid', rightType: 'spell_reader', leftStart: 36 },
];

const CATALOG_PER_SPREAD = 15; // 左頁 3×2 (6張) + 右頁 3×3 (9張)

const BOOK_TAB_ITEMS: { id: BookTab; label: string; title: string; tone: string }[] = [
  { id: 'cover', label: '封面', title: '檢視精裝封面', tone: 'tab-cover' },
  { id: 'specified', label: '指定', title: '指定口袋（000–099）', tone: 'tab-specified' },
  { id: 'free', label: '自由', title: '自由口袋（45 格與封底咒語槽）', tone: 'tab-free' },
  { id: 'catalog', label: '圖鑑', title: '卡片索引（唯讀）', tone: 'tab-catalog' },
];

export class BookUI {
  private modal = document.getElementById('book-modal')!;
  private stageEl = document.getElementById('book-floating-stage')!;
  private viewportEl = document.getElementById('book-spread-viewport')!;
  private detailEl = document.getElementById('book-detail-panel')!;
  private shoutFx = document.getElementById('book-shout-fx')!;
  private gainFx = document.getElementById('gain-shout-fx')!;
  private progressEl = document.getElementById('book-progress')!;
  private closeBtn = document.getElementById('btn-close-book')!;

  private activeTab: BookTab = 'cover';
  private catalogFilter: CatalogFilter = 'all';
  private searchQuery = '';
  private specifiedSpread = 0; // 0..5
  private freeSpread = 0; // 0..2
  private catalogSpread = 0;
  private lastTurnDir: 'next' | 'prev' | null = null;
  private selection: Selection | null = null;
  private isCardFlipped = false;
  private gainArmed = false;
  private insertedSpell: { index: number; cardId: number } | null = null;
  private spellTargetId = '';
  private returnFocus: HTMLElement | null = null;
  public isOpen = false;

  constructor(private state: GameState, private callbacks: BookCallbacks) {
    this.closeBtn.addEventListener('click', () => this.close());
    // 點擊書外空白處即可直接收起 BOOK（無須額外關閉大按鈕）
    this.modal.addEventListener('click', (e) => {
      if (e.target === this.modal || e.target === this.stageEl) {
        this.close();
      }
    });

    // 鍵盤左右鍵翻頁（輸入框聚焦時不攔截）
    window.addEventListener('keydown', (e) => {
      if (!this.isOpen || e.isComposing) return;
      const active = document.activeElement;
      if (e.code === 'Escape') {
        e.preventDefault();
        e.stopImmediatePropagation();
        if (this.selection) {
          this.clearSelection();
          this.render();
        } else this.close();
        return;
      }
      if (e.code === 'Tab') {
        const controls = [...this.modal.querySelectorAll<HTMLElement>('button:not(:disabled), input, select')]
          .filter((el) => el.getClientRects().length > 0);
        const first = controls[0];
        const last = controls[controls.length - 1];
        if (first && last && ((e.shiftKey && (active === first || active === this.modal)) || (!e.shiftKey && active === last))) {
          e.preventDefault();
          (e.shiftKey ? last : first).focus();
        }
        return;
      }
      if (active?.matches('input, textarea, select')) return;
      if (e.code === 'ArrowLeft') {
        e.preventDefault();
        this.turnPage(-1);
      } else if (e.code === 'ArrowRight') {
        e.preventDefault();
        this.turnPage(1);
      }
    });

    this.state.onChange(() => {
      if (this.isOpen) this.render();
    });
  }

  private switchTab(tab: BookTab, keepSelection = false): void {
    this.activeTab = tab;
    this.lastTurnDir = null;
    if (!keepSelection) this.clearSelection();
    this.render();
  }

  private clearSelection(): void {
    this.selection = null;
    this.isCardFlipped = false;
    this.gainArmed = false;
  }

  private getFilteredCatalogCards(): CardDef[] {
    const query = this.searchQuery.trim().toLowerCase();
    return ALL_CANON_CARDS.filter((c) => {
      if (this.catalogFilter !== 'all' && c.category !== this.catalogFilter) return false;
      if (!query) return true;
      return (
        c.code.toLowerCase().includes(query) ||
        String(c.id).includes(query) ||
        c.name.toLowerCase().includes(query) ||
        c.enName.toLowerCase().includes(query) ||
        c.rank.toLowerCase().includes(query)
      );
    });
  }

  private turnPage(delta: -1 | 1): void {
    const direction = delta > 0 ? 'next' : 'prev';
    if (this.activeTab === 'specified') {
      const next = this.specifiedSpread + delta;
      if (next < 0 || next >= SPECIFIED_SPREADS.length) return;
      this.specifiedSpread = next;
    } else if (this.activeTab === 'free') {
      const next = this.freeSpread + delta;
      if (next < 0 || next >= FREE_SPREADS.length) return;
      this.freeSpread = next;
    } else if (this.activeTab === 'catalog') {
      const total = Math.max(1, Math.ceil(this.getFilteredCatalogCards().length / CATALOG_PER_SPREAD));
      const next = this.catalogSpread + delta;
      if (next < 0 || next >= total) return;
      this.catalogSpread = next;
    } else return;
    this.clearSelection();
    this.lastTurnDir = direction;
    this.render();
  }

  public toggle(): void {
    if (this.isOpen) this.close();
    else this.open();
  }

  public open(): void {
    if (this.isOpen) return;
    this.returnFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    this.isOpen = true;
    this.lastTurnDir = null;
    this.triggerShout(this.shoutFx);
    this.modal.classList.remove('hidden');
    document.body.classList.add('book-is-open');
    this.callbacks.onVisibilityChange(true);
    this.render();
    this.modal.focus();
  }

  public close(): void {
    if (!this.isOpen) return;
    this.isOpen = false;
    this.clearSelection();
    this.insertedSpell = null;
    this.spellTargetId = '';
    this.modal.classList.add('hidden');
    document.body.classList.remove('book-is-open');
    this.callbacks.onVisibilityChange(false);
    this.returnFocus?.focus();
    this.returnFocus = null;
  }

  private triggerShout(el: HTMLElement, text?: string): void {
    if (text) el.textContent = text;
    el.classList.add('hidden');
    void el.offsetWidth;
    el.classList.remove('hidden');
    window.setTimeout(() => el.classList.add('hidden'), 750);
  }

  private isCardOwnedAnywhere(cardId: number): boolean {
    if (this.state.data.specifiedSlots[cardId]) return true;
    return this.state.data.freeSlots.some((id) => getCardDef(id).id === cardId);
  }

  public openCatalogCard(cardId: number): void {
    const index = ALL_CANON_CARDS.findIndex((card) => card.id === cardId);
    if (index < 0) return;
    this.clearSelection();
    this.catalogFilter = 'all';
    this.searchQuery = '';
    this.catalogSpread = Math.floor(index / CATALOG_PER_SPREAD);
    this.selection = { pocket: 'catalog', slotKey: cardId, cardId };
    this.switchTab('catalog', true);
  }

  /**
   * 建構附於實體書本右側書口的紙質索引書籤標籤（取代傳統頂部 UI 分頁欄）。
   */
  private createIndexTabsEl(): HTMLElement {
    const rail = document.createElement('nav');
    rail.className = 'binder-index-tabs';
    rail.setAttribute('aria-label', '集卡書索引書籤');
    for (const item of BOOK_TAB_ITEMS) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = `book-tab binder-index-tab ${item.tone}`;
      btn.dataset.tab = item.id;
      btn.title = item.title;
      btn.textContent = item.label;
      btn.setAttribute('aria-pressed', String(this.activeTab === item.id));
      if (this.activeTab === item.id) btn.classList.add('active');
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.switchTab(item.id);
      });
      rail.appendChild(btn);
    }
    return rail;
  }

  /**
   * 建構翻頁折角熱區（嵌入書頁左右外緣，不另設黑底工具列）。
   */
  private createPageTurnCorner(dir: 'prev' | 'next', enabled: boolean): HTMLButtonElement {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.id = dir === 'prev' ? 'btn-page-prev' : 'btn-page-next';
    btn.className = `page-turn-corner turn-${dir}`;
    btn.disabled = !enabled;
    btn.title = dir === 'prev' ? '翻回上一跨頁 (←)' : '翻至下一跨頁 (→)';
    btn.innerHTML = `<span class="turn-glyph">${dir === 'prev' ? '‹' : '›'}</span>`;
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      this.turnPage(dir === 'prev' ? -1 : 1);
    });
    return btn;
  }

  /**
   * 建構原作黑底十字準線壓凹卡槽（未收錄）或插入原作實卡（已收錄）。
   */
  private createSpecifiedSlotEl(id: number): HTMLElement {
    const owned = Boolean(this.state.data.specifiedSlots[id]);
    const def = getCardDef(id);
    const slot = document.createElement('button');
    slot.type = 'button';
    slot.className = 'binder-recess-slot';
    slot.setAttribute('aria-label', `指定口袋 ${def.code}${owned ? `，${def.name}` : '，空位'}`);
    if (id === 0) slot.classList.add('slot-zero-hero');
    if (owned) slot.classList.add('has-card');
    if (this.selection?.pocket === 'specified' && this.selection.slotKey === id) {
      slot.classList.add('is-selected');
    }

    if (owned) {
      slot.innerHTML = renderAuthenticCardHTML(def, 'mini', `sp${id}`);
    } else {
      const code3 = String(id).padStart(3, '0');
      slot.innerHTML = `
        <div class="recess-empty-pocket">
          <span class="cross-line cross-top"></span>
          <span class="cross-line cross-bottom"></span>
          <span class="cross-line cross-left"></span>
          <span class="cross-line cross-right"></span>
          <span class="recess-code">${code3}</span>
        </div>
      `;
    }

    slot.addEventListener('click', (e) => {
      e.stopPropagation();
      if (this.selection?.pocket === 'specified' && this.selection.slotKey === id) {
        this.selection = null;
      } else {
        this.selection = { pocket: 'specified', slotKey: id, cardId: id };
      }
      this.isCardFlipped = false;
      this.gainArmed = false;
      this.lastTurnDir = null;
      this.render();
    });
    return slot;
  }

  private createFreeSlotEl(slotIdx: number): HTMLElement {
    const rawId = this.state.data.freeSlots[slotIdx];
    const slot = document.createElement('button');
    slot.type = 'button';
    slot.className = 'binder-recess-slot';
    if (rawId !== undefined) slot.classList.add('has-card');
    if (this.selection?.pocket === 'free' && this.selection.slotKey === slotIdx) {
      slot.classList.add('is-selected');
    }

    if (rawId !== undefined) {
      const def = getCardDef(rawId);
      slot.setAttribute('aria-label', `自由口袋，${def.code} ${def.name}`);
      slot.innerHTML = renderAuthenticCardHTML(def, 'mini', `fr${slotIdx}`);
      slot.addEventListener('click', (e) => {
        e.stopPropagation();
        if (this.selection?.pocket === 'free' && this.selection.slotKey === slotIdx) {
          this.selection = null;
        } else {
          this.selection = { pocket: 'free', slotKey: slotIdx, cardId: rawId };
        }
        this.isCardFlipped = false;
        this.gainArmed = false;
        this.lastTurnDir = null;
        this.render();
      });
    } else {
      slot.innerHTML = `
        <div class="recess-empty-pocket recess-free">
          <span class="cross-line cross-top"></span>
          <span class="cross-line cross-bottom"></span>
          <span class="cross-line cross-left"></span>
          <span class="cross-line cross-right"></span>
        </div>
      `;
      slot.disabled = true;
      slot.setAttribute('aria-label', '自由口袋空位');
    }
    return slot;
  }

  private createCatalogSlotEl(def: CardDef): HTMLElement {
    const owned = this.isCardOwnedAnywhere(def.id);
    const slot = document.createElement('button');
    slot.type = 'button';
    slot.className = 'binder-recess-slot catalog-binder-slot has-card';
    slot.setAttribute('aria-label', `No.${def.code} ${def.name}${owned ? '，已持有' : ''}`);
    if (owned) slot.classList.add('is-owned');
    if (this.selection?.pocket === 'catalog' && this.selection.cardId === def.id) {
      slot.classList.add('is-selected');
    }
    slot.innerHTML = `
      ${renderAuthenticCardHTML(def, 'mini', `cat${def.id}`)}
      ${owned ? '<span class="owned-dot" title="已持有">✓</span>' : ''}
    `;
    slot.addEventListener('click', (e) => {
      e.stopPropagation();
      if (this.selection?.pocket === 'catalog' && this.selection.cardId === def.id) {
        this.selection = null;
      } else {
        this.selection = { pocket: 'catalog', slotKey: def.id, cardId: def.id };
      }
      this.isCardFlipped = false;
      this.gainArmed = false;
      this.lastTurnDir = null;
      this.render();
    });
    return slot;
  }

  private createSpineEl(): HTMLElement {
    const spine = document.createElement('div');
    spine.className = 'binder-spine';
    spine.innerHTML = `
      <div class="spine-hinge"><span class="hinge-pin"></span></div>
      <div class="spine-hinge"><span class="hinge-pin"></span></div>
      <div class="spine-hinge"><span class="hinge-pin"></span></div>
      <div class="spine-bottom-clasp"></div>
    `;
    return spine;
  }

  private createFolioEl(text: string, align: 'left' | 'right', extra?: string): HTMLElement {
    const folio = document.createElement('div');
    folio.className = `binder-page-folio folio-${align}`;
    folio.innerHTML = extra
      ? `<span class="folio-main">${text}</span><span class="folio-stat">${extra}</span>`
      : `<span class="folio-main">${text}</span>`;
    return folio;
  }

  private insertSpell(index: number, cardId: number): void {
    this.insertedSpell = { index, cardId };
    this.spellTargetId = '';
    this.freeSpread = FREE_SPREADS.length - 1;
    this.switchTab('free');
    this.viewportEl.querySelector<HTMLSelectElement>('#book-spell-card')?.focus();
  }

  private renderSpellReader(page: HTMLElement): void {
    page.classList.add('page-back-reader');
    const spells = this.state.data.freeSlots
      .map((id, index) => ({ id, index, def: getCardDef(id) }))
      .filter(({ def }) => def.category === 'spell');
    const active = spells.find(({ id, index }) =>
      this.insertedSpell?.index === index && this.insertedSpell.cardId === id
    );
    if (!active) {
      this.insertedSpell = null;
      this.spellTargetId = '';
    }
    const targets: SpellTargets = active ? this.callbacks.getSpellTargets(active.def) : { options: [] };
    if (!targets.options.some(({ id }) => id === this.spellTargetId)) this.spellTargetId = '';

    page.innerHTML = `
      <div class="spell-reader-console">
        <div class="spell-crt-screen">
          <div class="crt-header">咒語卡 · 目標清單</div>
          <div class="book-spell-controls">
            <label for="book-spell-card">插入咒語卡</label>
            <select id="book-spell-card" ${spells.length ? '' : 'disabled'}></select>
            <label for="book-spell-target">指定目標</label>
            <select id="book-spell-target" ${targets.options.length ? '' : 'disabled'}></select>
            <p class="book-spell-status" aria-live="polite"></p>
          </div>
        </div>
        <div class="spell-reader-slot-area">
          <div class="spell-insert-slot">
            ${active
              ? renderAuthenticCardHTML(active.def, 'mini', 'back_spell')
              : '<div class="recess-empty-pocket recess-free"><span class="recess-code">空</span></div>'}
          </div>
          <button type="button" class="crt-enter-btn" ${this.spellTargetId ? '' : 'disabled'}>ENTER · 發動</button>
        </div>
      </div>
    `;
    const cardSelect = page.querySelector<HTMLSelectElement>('#book-spell-card')!;
    const targetSelect = page.querySelector<HTMLSelectElement>('#book-spell-target')!;
    const enter = page.querySelector<HTMLButtonElement>('.crt-enter-btn')!;
    const status = page.querySelector<HTMLElement>('.book-spell-status')!;
    cardSelect.add(new Option(spells.length ? '選擇自由口袋中的咒語' : '目前沒有咒語卡', ''));
    for (const { index, def } of spells) {
      cardSelect.add(new Option(`No.${def.code} ${def.name}`, String(index)));
    }
    if (active) cardSelect.value = String(active.index);
    targetSelect.add(new Option(targets.options.length ? '選擇目標' : '無可用目標', ''));
    for (const target of targets.options) targetSelect.add(new Option(target.label, target.id));
    targetSelect.value = this.spellTargetId;
    status.textContent = targets.unavailable ?? (active ? '確認發動後消耗一張卡。' : '先插入一張咒語卡。');

    cardSelect.addEventListener('change', () => {
      const selected = spells.find(({ index }) => String(index) === cardSelect.value);
      if (selected) this.insertSpell(selected.index, selected.id);
      else {
        this.insertedSpell = null;
        this.spellTargetId = '';
        this.render();
        this.viewportEl.querySelector<HTMLSelectElement>('#book-spell-card')?.focus();
      }
    });
    targetSelect.addEventListener('change', () => {
      this.spellTargetId = targetSelect.value;
      enter.disabled = !this.spellTargetId;
    });
    enter.addEventListener('click', () => {
      const targetId = this.spellTargetId;
      if (!active || this.state.data.freeSlots[active.index] !== active.id ||
        !this.callbacks.getSpellTargets(active.def).options.some(({ id }) => id === targetId)) return;
      this.insertedSpell = null;
      this.spellTargetId = '';
      this.clearSelection();
      if (this.state.removeFreeCardAt(active.index) === null) return;
      this.triggerShout(this.gainFx, 'ON！');
      this.callbacks.onCastSpell(active.def, targetId);
    });
  }

  /**
   * 渲染實體雙頁活頁書（霧面亞麻精裝硬殼＋厚棉紙疊層＋古銅黃銅三連活頁扣＋書頁印刷頁碼）。
   */
  private renderPhysicalSpread(spec: SpreadSpec, canPrev: boolean, canNext: boolean): void {
    const binder = document.createElement('div');
    binder.className = 'physical-binder';
    if (this.lastTurnDir === 'next') binder.classList.add('turn-anim-next');
    if (this.lastTurnDir === 'prev') binder.classList.add('turn-anim-prev');

    // 左頁
    const leftPage = document.createElement('div');
    leftPage.className = 'binder-page binder-page-left';
    if (spec.leftType === 'zero_single') {
      leftPage.classList.add('page-inside-cover');
      const wrap = document.createElement('div');
      wrap.className = 'zero-slot-stage';
      wrap.appendChild(this.createSpecifiedSlotEl(0));
      leftPage.appendChild(wrap);
    } else if (spec.leftType === 'specified_grid') {
      const grid = document.createElement('div');
      grid.className = 'binder-3x3-grid';
      const s = spec.leftStart ?? 10;
      for (let i = 0; i < 9; i++) grid.appendChild(this.createSpecifiedSlotEl(s + i));
      leftPage.appendChild(grid);
    } else {
      const grid = document.createElement('div');
      grid.className = 'binder-3x3-grid';
      const s = spec.leftStart ?? 0;
      for (let i = 0; i < 9; i++) grid.appendChild(this.createFreeSlotEl(s + i));
      leftPage.appendChild(grid);
    }
    leftPage.appendChild(this.createFolioEl(spec.leftFolio, 'left'));
    leftPage.appendChild(this.createPageTurnCorner('prev', canPrev));

    // 中央三組霧面古銅黃銅活頁環書脊
    const spine = this.createSpineEl();

    // 右頁
    const rightPage = document.createElement('div');
    rightPage.className = 'binder-page binder-page-right';
    if (spec.rightType === 'specified_grid') {
      const grid = document.createElement('div');
      grid.className = 'binder-3x3-grid';
      const s = spec.rightStart ?? 1;
      for (let i = 0; i < 9; i++) grid.appendChild(this.createSpecifiedSlotEl(s + i));
      rightPage.appendChild(grid);
    } else if (spec.rightType === 'free_grid') {
      const grid = document.createElement('div');
      grid.className = 'binder-3x3-grid';
      const s = spec.rightStart ?? 9;
      for (let i = 0; i < 9; i++) grid.appendChild(this.createFreeSlotEl(s + i));
      rightPage.appendChild(grid);
    } else this.renderSpellReader(rightPage);

    rightPage.appendChild(this.createFolioEl(spec.rightFolio, 'right'));
    rightPage.appendChild(this.createPageTurnCorner('next', canNext));

    binder.append(leftPage, spine, rightPage, this.createIndexTabsEl());
    this.viewportEl.appendChild(binder);
  }

  /**
   * 渲染書頁內「原作全圖鑑（164 張）」：直接排在實體雙頁棉紙書頁上，維持零外框統一感！
   */
  private renderCatalogSpread(): void {
    const filtered = this.getFilteredCatalogCards();
    const totalSpreads = Math.max(1, Math.ceil(filtered.length / CATALOG_PER_SPREAD));
    if (this.catalogSpread >= totalSpreads) this.catalogSpread = 0;

    const startIdx = this.catalogSpread * CATALOG_PER_SPREAD;
    const leftCards = filtered.slice(startIdx, startIdx + 6);
    const rightCards = filtered.slice(startIdx + 6, startIdx + 15);

    const binder = document.createElement('div');
    binder.className = 'physical-binder';
    if (this.lastTurnDir === 'next') binder.classList.add('turn-anim-next');
    if (this.lastTurnDir === 'prev') binder.classList.add('turn-anim-prev');

    // 左頁：頂部 1/3 紙本墨印索引篩選＋搜尋列，下方 2/3 為 3×2 卡片格（與右頁 3×3 水平對齊）
    const leftPage = document.createElement('div');
    leftPage.className = 'binder-page binder-page-left page-catalog-left';

    const header = document.createElement('div');
    header.className = 'catalog-paper-header';
    header.innerHTML = `
      <div class="catalog-paper-title">
        <span>G·I CARD ARCHIVE</span>
        <span class="catalog-paper-count" id="catalog-count-label">${filtered.length} / ${ALL_CANON_CARDS.length}</span>
      </div>
      <div class="catalog-paper-filters">
        <button type="button" class="paper-filter-chip ${this.catalogFilter === 'all' ? 'active' : ''}" data-filter="all">全</button>
        <button type="button" class="paper-filter-chip chip-red ${this.catalogFilter === 'specified' ? 'active' : ''}" data-filter="specified">指定</button>
        <button type="button" class="paper-filter-chip chip-blue ${this.catalogFilter === 'spell' ? 'active' : ''}" data-filter="spell">咒語</button>
        <button type="button" class="paper-filter-chip chip-yellow ${this.catalogFilter === 'item' ? 'active' : ''}" data-filter="item">自由</button>
        <button type="button" class="paper-filter-chip chip-black ${this.catalogFilter === 'gm' ? 'active' : ''}" data-filter="gm">GM</button>
      </div>
      <input
        id="book-catalog-search"
        class="catalog-paper-search"
        type="text"
        aria-label="搜尋卡片編號或卡名"
        placeholder="搜尋編號（025、1039）或卡名…"
      />
    `;

    header.querySelectorAll<HTMLButtonElement>('.paper-filter-chip').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.catalogFilter = btn.dataset.filter as CatalogFilter;
        this.catalogSpread = 0;
        this.lastTurnDir = null;
        this.render();
      });
    });

    const searchInput = header.querySelector('#book-catalog-search') as HTMLInputElement;
    searchInput.value = this.searchQuery;
    searchInput.addEventListener('click', (e) => e.stopPropagation());
    searchInput.addEventListener('keydown', (e) => {
      if (e.key !== 'Escape' && e.key !== 'Tab') e.stopPropagation();
    });
    searchInput.addEventListener('input', () => {
      this.searchQuery = searchInput.value;
      this.catalogSpread = 0;
      this.updateCatalogGridInPlace(binder);
    });

    const leftGrid = document.createElement('div');
    leftGrid.className = 'binder-3x2-grid';
    leftGrid.id = 'catalog-left-grid';
    this.fillCatalogGrid(leftGrid, leftCards, 6, filtered.length === 0);

    leftPage.append(
      header,
      leftGrid,
      this.createFolioEl('ARCHIVAL CATALOG', 'left', `全 ${ALL_CANON_CARDS.length} 張原作實卡`),
      this.createPageTurnCorner('prev', this.catalogSpread > 0)
    );

    const spine = this.createSpineEl();

    const rightPage = document.createElement('div');
    rightPage.className = 'binder-page binder-page-right';
    const rightGrid = document.createElement('div');
    rightGrid.className = 'binder-3x3-grid';
    rightGrid.id = 'catalog-right-grid';
    this.fillCatalogGrid(rightGrid, rightCards, 9, false);

    const rightFolio = this.createFolioEl(
      `CATALOG · ${this.catalogSpread + 1} / ${totalSpreads}`,
      'right'
    );
    rightFolio.id = 'catalog-right-folio';
    rightPage.append(
      rightGrid,
      rightFolio,
      this.createPageTurnCorner('next', this.catalogSpread < totalSpreads - 1)
    );

    binder.append(leftPage, spine, rightPage, this.createIndexTabsEl());
    this.viewportEl.appendChild(binder);
  }

  private fillCatalogGrid(grid: HTMLElement, cards: CardDef[], capacity: number, showEmptyMsg: boolean): void {
    grid.innerHTML = '';
    if (showEmptyMsg) {
      const message = document.createElement('div');
      message.className = 'catalog-paper-empty';
      message.textContent = `查無符合「${this.searchQuery}」的卡片`;
      grid.appendChild(message);
      return;
    }
    for (let i = 0; i < capacity; i++) {
      const def = cards[i];
      if (def) {
        grid.appendChild(this.createCatalogSlotEl(def));
      } else {
        const placeholder = document.createElement('div');
        placeholder.className = 'catalog-slot-placeholder';
        grid.appendChild(placeholder);
      }
    }
  }

  /**
   * 搜尋欄打字時原地更新左右書頁格網，避免重建 input 中斷中文注音／輸入法組字。
   */
  private updateCatalogGridInPlace(binder: HTMLElement): void {
    const filtered = this.getFilteredCatalogCards();
    const totalSpreads = Math.max(1, Math.ceil(filtered.length / CATALOG_PER_SPREAD));
    const leftGrid = binder.querySelector('#catalog-left-grid') as HTMLElement | null;
    const rightGrid = binder.querySelector('#catalog-right-grid') as HTMLElement | null;
    const countLabel = binder.querySelector('#catalog-count-label');
    const rightFolio = binder.querySelector('#catalog-right-folio .folio-main');
    const prevBtn = binder.querySelector('#btn-page-prev') as HTMLButtonElement | null;
    const nextBtn = binder.querySelector('#btn-page-next') as HTMLButtonElement | null;

    if (leftGrid) this.fillCatalogGrid(leftGrid, filtered.slice(0, 6), 6, filtered.length === 0);
    if (rightGrid) this.fillCatalogGrid(rightGrid, filtered.slice(6, 15), 9, false);
    if (countLabel) countLabel.textContent = `${filtered.length} / ${ALL_CANON_CARDS.length}`;
    if (rightFolio) rightFolio.textContent = `CATALOG · 1 / ${totalSpreads}`;
    if (prevBtn) prevBtn.disabled = true;
    if (nextBtn) nextBtn.disabled = totalSpreads <= 1;
  }

  public render(): void {
    this.progressEl.textContent = `指定 ${this.state.getSpecifiedCount()} / 100 · 自由 ${this.state.data.freeSlots.length} / ${MAX_FREE_SLOTS}`;
    this.viewportEl.innerHTML = '';

    if (this.activeTab === 'cover') {
      const coverWrap = document.createElement('div');
      coverWrap.className = 'book-cover-object';

      const coverBtn = document.createElement('button');
      coverBtn.type = 'button';
      coverBtn.className = 'book-cover-card';
      coverBtn.id = 'btn-cover-open-book';
      coverBtn.title = '點擊翻開集卡書（000 ｜ 001–009）';
      coverBtn.setAttribute('aria-label', '翻開集卡書');
      coverBtn.innerHTML = renderBookCoverSVG();
      coverBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.switchTab('specified');
      });

      coverWrap.append(coverBtn, this.createIndexTabsEl());
      this.viewportEl.appendChild(coverWrap);
    } else if (this.activeTab === 'specified') {
      const spec = SPECIFIED_SPREADS[this.specifiedSpread];
      this.renderPhysicalSpread(
        spec,
        this.specifiedSpread > 0,
        this.specifiedSpread < SPECIFIED_SPREADS.length - 1
      );
    } else if (this.activeTab === 'free') {
      const spec = FREE_SPREADS[this.freeSpread];
      this.renderPhysicalSpread(
        spec,
        this.freeSpread > 0,
        this.freeSpread < FREE_SPREADS.length - 1
      );
    } else {
      this.renderCatalogSpread();
    }

    this.renderDetail();
  }

  /**
   * 無框浮出實卡檢視：未選取時完全隱藏，點選卡槽後僅浮出實體 63:88 卡片與極簡操作鈕。
   */
  private renderDetail(): void {
    if (!this.selection) {
      this.detailEl.classList.add('hidden');
      this.detailEl.innerHTML = '';
      this.stageEl.classList.remove('has-floating-card');
      return;
    }

    this.detailEl.classList.remove('hidden');
    this.stageEl.classList.add('has-floating-card');

    const { pocket, slotKey, cardId } = this.selection;
    const def = getCardDef(cardId);
    const isCatalog = pocket === 'catalog';
    const owned =
      pocket === 'specified'
        ? Boolean(this.state.data.specifiedSlots[cardId])
        : pocket === 'free'
        ? this.state.data.freeSlots[slotKey] === cardId
        : this.isCardOwnedAnywhere(def.id);

    const revealContent = owned || isCatalog;

    if (!revealContent) {
      const code3 = String(def.id).padStart(3, '0');
      this.detailEl.innerHTML = `
        <div class="floating-card-wrap">
          <button type="button" class="floating-card-dismiss" id="btn-dismiss-floating-card" title="放回卡片">✕</button>
          <div class="recess-empty-pocket recess-large">
            <span class="cross-line cross-top"></span>
            <span class="cross-line cross-bottom"></span>
            <span class="cross-line cross-left"></span>
            <span class="cross-line cross-right"></span>
            <span class="recess-code">${code3}</span>
          </div>
          <div class="floating-card-actions">
            <button type="button" id="btn-peek-in-catalog" class="floating-pill-btn">🔍 在圖鑑預覽 No.${code3}</button>
          </div>
        </div>
      `;
      this.detailEl.querySelector('#btn-dismiss-floating-card')!.addEventListener('click', (e) => {
        e.stopPropagation();
        this.clearSelection();
        this.render();
      });
      this.detailEl.querySelector('#btn-peek-in-catalog')!.addEventListener('click', (e) => {
        e.stopPropagation();
        this.openCatalogCard(def.id);
      });
      return;
    }

    this.detailEl.innerHTML = `
      <div class="floating-card-wrap">
        <button type="button" class="floating-card-dismiss" id="btn-dismiss-floating-card" title="收起預覽">✕</button>
        <div class="card-flip-scene">
          <button type="button" class="card-flip-inner ${this.isCardFlipped ? 'flipped' : ''}" id="inspector-flip-card" aria-label="翻轉卡片" aria-pressed="${this.isCardFlipped}">
            <span class="card-flip-front" aria-hidden="${this.isCardFlipped}">
              ${renderAuthenticCardHTML(def, 'full', `det${def.id}`)}
            </span>
            <span class="card-flip-back" aria-hidden="${!this.isCardFlipped}">
              ${renderCardBackHTML()}
            </span>
          </button>
        </div>
        <div class="floating-card-caption">
          <div class="floating-caption-title">No.${def.code} ${def.name}</div>
          <div class="floating-caption-meta">${formatRankLimit(def)}${def.spellClasses?.length ? ` · ${def.spellClasses.join(' / ')}` : ''}${isCatalog ? (owned ? ' · 已持有' : ' · 圖鑑預覽') : ''}</div>
          <div class="floating-caption-desc"></div>
        </div>
        <div class="floating-card-actions" id="detail-actions-box">
          <button type="button" id="btn-flip-card" class="floating-pill-btn">🔄 ${
            this.isCardFlipped ? '翻回正面' : '翻轉卡背'
          }</button>
        </div>
      </div>
    `;
    this.detailEl.querySelector<HTMLElement>('.floating-caption-desc')!.textContent = def.description;

    this.detailEl.querySelector('#btn-dismiss-floating-card')!.addEventListener('click', (e) => {
      e.stopPropagation();
      this.clearSelection();
      this.render();
    });
    const flipBtn = this.detailEl.querySelector<HTMLButtonElement>('#btn-flip-card')!;
    const card = this.detailEl.querySelector<HTMLButtonElement>('#inspector-flip-card')!;
    const flip = () => {
      this.isCardFlipped = !this.isCardFlipped;
      card.classList.toggle('flipped', this.isCardFlipped);
      card.setAttribute('aria-pressed', String(this.isCardFlipped));
      card.querySelector('.card-flip-front')!.setAttribute('aria-hidden', String(this.isCardFlipped));
      card.querySelector('.card-flip-back')!.setAttribute('aria-hidden', String(!this.isCardFlipped));
      flipBtn.textContent = this.isCardFlipped ? '翻回正面' : '查看卡背';
    };
    flipBtn.addEventListener('click', flip);
    card.addEventListener('click', flip);

    const actionsBox = this.detailEl.querySelector('#detail-actions-box')!;
    if (isCatalog || !owned || def.category === 'gm') return;

    const btnGain = document.createElement('button');
    btnGain.type = 'button';
    btnGain.className = 'floating-pill-btn pill-gain';
    btnGain.textContent = def.category === 'spell' ? '插入封底咒語槽' : 'GAIN · 實體化';
    btnGain.addEventListener('click', () => {
      if (def.category === 'spell') {
        if (pocket === 'free' && this.state.data.freeSlots[slotKey] === cardId) this.insertSpell(slotKey, cardId);
        return;
      }
      if (!this.gainArmed) {
        this.gainArmed = true;
        btnGain.textContent = '確認 GAIN（移出卡片）';
        return;
      }
      this.clearSelection();
      const removed = pocket === 'specified'
        ? this.state.removeSpecifiedCard(cardId)
        : this.state.data.freeSlots[slotKey] === cardId && this.state.removeFreeCardAt(slotKey) !== null;
      if (!removed) {
        this.render();
        return;
      }
      this.triggerShout(this.gainFx, 'GAIN！');
      this.callbacks.onGainEffect(def);
    });
    actionsBox.appendChild(btnGain);
  }
}
