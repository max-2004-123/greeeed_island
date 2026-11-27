import * as THREE from 'three';
import { CardDef, drawSpellPack, getCardDef } from '../game/cards';
import { GI_LOCATIONS } from '../game/locations';
import { GameState, MAX_FREE_SLOTS } from '../game/state';
import { GameWorld, GI_LAKES, GI_LAND_LOBES, GI_MAP_BOUNDS, GI_ROADS } from '../game/world';
import { renderAuthenticCardHTML } from './cardRenderer';

export interface DialogChoice {
  label: string;
  primary?: boolean;
  onClick: () => void;
}

export class HudUI {
  private hudEl = document.getElementById('hud')!;
  private zoneNameEl = document.getElementById('hud-zone-name')!;
  private jennyEl = document.getElementById('hud-jenny')!;
  private specEl = document.getElementById('hud-specified-count')!;
  private freeEl = document.getElementById('hud-free-count')!;
  private questEl = document.getElementById('hud-quest-text')!;
  private promptEl = document.getElementById('interact-prompt')!;
  private promptTextEl = document.getElementById('interact-prompt-text')!;
  private btnReturnLobby = document.getElementById('btn-return-lobby')!;
  private toastContainer = document.getElementById('toast-container')!;

  private dialogModal = document.getElementById('dialog-modal')!;
  private dialogSpeaker = document.getElementById('dialog-speaker')!;
  private dialogText = document.getElementById('dialog-text')!;
  private dialogActions = document.getElementById('dialog-actions')!;

  private shopModal = document.getElementById('shop-modal')!;
  private shopJenny = document.getElementById('shop-jenny')!;
  private packRevealArea = document.getElementById('pack-reveal-area')!;
  private packRevealCards = document.getElementById('pack-reveal-cards')!;

  private minimapCanvas = document.getElementById('minimap-canvas') as HTMLCanvasElement;
  private minimapCtx = this.minimapCanvas.getContext('2d')!;
  private staticIslandMap: HTMLCanvasElement | null = null;
  private staticLobbyMap: HTMLCanvasElement | null = null;
  private officialMapImg: HTMLImageElement | null = null;
  private officialMapReady = false;
  private lastZoneLabel = '';
  private lastPromptLabel: string | null = '__init__';

  public isModalOpen = false;
  private onModalToggle: (open: boolean) => void;

  constructor(private state: GameState, onModalToggle: (open: boolean) => void) {
    this.onModalToggle = onModalToggle;
    this.bindShopEvents();
    this.state.onChange(() => this.refreshStats());
  }

  public showHud(): void {
    this.hudEl.classList.remove('hidden');
    this.refreshStats();
  }

  public setZoneLabel(label: string): void {
    if (this.lastZoneLabel === label) return;
    this.lastZoneLabel = label;
    this.zoneNameEl.textContent = label;
  }

  public refreshStats(): void {
    if (this.state.data.zone === 'lobby') {
      this.zoneNameEl.textContent = '起始之塔・接待大廳';
    }

    this.jennyEl.textContent = `${this.state.data.jenny.toLocaleString()} J`;
    this.specEl.textContent = `${this.state.getSpecifiedCount()} / 100`;
    this.freeEl.textContent = `${this.state.data.freeSlots.length} / ${MAX_FREE_SLOTS}`;
    this.questEl.textContent = this.state.getCurrentQuestText();
    this.shopJenny.textContent = `${this.state.data.jenny.toLocaleString()} J`;

    if (this.state.data.zone === 'island') {
      this.btnReturnLobby.classList.remove('hidden');
    } else {
      this.btnReturnLobby.classList.add('hidden');
    }
  }

  public setInteractPrompt(label: string | null): void {
    if (this.lastPromptLabel === label) return;
    this.lastPromptLabel = label;
    if (!label) {
      this.promptEl.classList.add('hidden');
    } else {
      this.promptTextEl.textContent = label;
      this.promptEl.classList.remove('hidden');
    }
  }

  public showToast(message: string): void {
    const el = document.createElement('div');
    el.className = 'toast-item';
    el.textContent = message;
    this.toastContainer.appendChild(el);
    window.setTimeout(() => {
      el.style.opacity = '0';
      el.style.transition = 'opacity 0.25s ease';
      window.setTimeout(() => el.remove(), 260);
    }, 2900);
  }

  public openDialog(speaker: string, text: string, choices: DialogChoice[]): void {
    this.dialogSpeaker.textContent = speaker;
    this.dialogText.textContent = text;
    this.dialogActions.innerHTML = '';
    for (const c of choices) {
      const btn = document.createElement('button');
      btn.className = c.primary ? 'gi-btn gi-btn-primary' : 'gi-btn gi-btn-ghost';
      btn.textContent = c.label;
      btn.addEventListener('click', () => {
        this.closeDialog();
        c.onClick();
      });
      this.dialogActions.appendChild(btn);
    }
    this.dialogModal.classList.remove('hidden');
    this.isModalOpen = true;
    this.onModalToggle(true);
  }

  public closeDialog(): void {
    this.dialogModal.classList.add('hidden');
    this.isModalOpen = false;
    this.onModalToggle(false);
  }

  public openShop(): void {
    this.refreshStats();
    this.packRevealArea.classList.add('hidden');
    this.shopModal.classList.remove('hidden');
    this.isModalOpen = true;
    this.onModalToggle(true);
  }

  public closeShop(): void {
    this.shopModal.classList.add('hidden');
    this.isModalOpen = false;
    this.onModalToggle(false);
  }

  private bindShopEvents(): void {
    document.getElementById('btn-close-shop')!.addEventListener('click', () => this.closeShop());
    document
      .getElementById('btn-buy-standard')!
      .addEventListener('click', () => this.handleBuyPack(10000, false));
    document
      .getElementById('btn-buy-rare')!
      .addEventListener('click', () => this.handleBuyPack(25000, true));
  }

  private handleBuyPack(cost: number, highRank: boolean): void {
    if (this.state.data.freeSlots.length + 3 > MAX_FREE_SLOTS) {
      this.showToast('自由口袋空位不足 3 格！請先按 B 開啟 BOOK 使用或出售卡片。');
      return;
    }
    if (!this.state.spendJenny(cost)) {
      this.showToast(`戒尼不足！需要 ${cost.toLocaleString()} J，可以去島上撿錢袋或出售多餘卡片。`);
      return;
    }

    const drawn = drawSpellPack(highRank);
    for (const card of drawn) {
      this.state.addCard(card.id);
    }
    this.state.incrementPacksOpened();
    this.renderPackReveal(drawn);
    this.showToast(`成功開啟卡包！獲得 ${drawn.map((c) => `「${c.name}」`).join('、')}`);
  }

  private renderPackReveal(cards: CardDef[]): void {
    this.packRevealArea.classList.remove('hidden');
    this.packRevealCards.innerHTML = '';
    for (let i = 0; i < cards.length; i++) {
      const el = document.createElement('div');
      el.className = 'reveal-card-wrap';
      el.innerHTML = renderAuthenticCardHTML(cards[i], 'pack', `pk${i}`);
      this.packRevealCards.appendChild(el);
    }
  }

  private ensureStaticMaps(w: number, h: number): void {
    if (!this.staticLobbyMap) {
      const c = document.createElement('canvas');
      c.width = w;
      c.height = h;
      const g = c.getContext('2d')!;
      g.fillStyle = '#0f1829';
      g.fillRect(0, 0, w, h);
      g.beginPath();
      g.arc(w / 2, h / 2, 66, 0, Math.PI * 2);
      g.fillStyle = '#25324a';
      g.fill();
      g.strokeStyle = '#f0c659';
      g.lineWidth = 2;
      g.stroke();

      const scale = 3.6;
      g.beginPath();
      g.arc(w / 2, h / 2 - 4.5 * scale, 10, 0, Math.PI * 2);
      g.fillStyle = '#38e4c5';
      g.fill();

      g.beginPath();
      g.arc(w / 2 + 5.1 * scale, h / 2 + 1.5 * scale, 5, 0, Math.PI * 2);
      g.fillStyle = '#ffe58f';
      g.fill();
      this.staticLobbyMap = c;
    }

    if (!this.officialMapImg) {
      const img = new Image();
      img.onload = () => {
        this.officialMapReady = true;
        this.staticIslandMap = null; // 載入完成後立刻用官方彩圖重繪小地圖底圖
      };
      img.src = './map/greed-island-map.png';
      this.officialMapImg = img;
    }

    if (!this.staticIslandMap) {
      const c = document.createElement('canvas');
      c.width = w;
      c.height = h;
      const g = c.getContext('2d')!;

      // 深海漸層背景
      const oceanGrad = g.createRadialGradient(w * 0.5, h * 0.5, 12, w * 0.5, h * 0.5, Math.max(w, h) * 0.72);
      oceanGrad.addColorStop(0, '#1d73a3');
      oceanGrad.addColorStop(1, '#0e3c5c');
      g.fillStyle = oceanGrad;
      g.fillRect(0, 0, w, h);

      const spanX = GI_MAP_BOUNDS.maxX - GI_MAP_BOUNDS.minX;
      const spanZ = GI_MAP_BOUNDS.maxZ - GI_MAP_BOUNDS.minZ;
      const toX = (v: number) => ((v - GI_MAP_BOUNDS.minX) / spanX) * w;
      const toY = (v: number) => ((v - GI_MAP_BOUNDS.minZ) / spanZ) * h;

      if (this.officialMapReady && this.officialMapImg) {
        g.drawImage(this.officialMapImg, 0, 0, w, h);
      } else {
        const toRX = (r: number) => (r / spanX) * w;
        const toRY = (r: number) => (r / spanZ) * h;
        g.fillStyle = '#d9c68f';
        for (const l of GI_LAND_LOBES) {
          g.beginPath();
          g.ellipse(toX(l.x), toY(l.z), toRX(l.rx + 5), toRY(l.rz + 5), -(l.rot ?? 0), 0, Math.PI * 2);
          g.fill();
        }
        g.fillStyle = '#3f7d3d';
        for (const l of GI_LAND_LOBES) {
          g.beginPath();
          g.ellipse(toX(l.x), toY(l.z), toRX(l.rx), toRY(l.rz), -(l.rot ?? 0), 0, Math.PI * 2);
          g.fill();
        }
        g.fillStyle = '#2ca3d4';
        for (const lk of GI_LAKES) {
          g.beginPath();
          g.ellipse(toX(lk.x), toY(lk.z), toRX(lk.rx), toRY(lk.rz), 0, 0, Math.PI * 2);
          g.fill();
        }
      }

      // 疊繪單一資料源主道路網，確保小地圖與實際可行走路線 100% 同步
      g.strokeStyle = 'rgba(245, 232, 192, 0.72)';
      g.lineWidth = 1.4;
      g.lineCap = 'round';
      for (const seg of GI_ROADS) {
        g.beginPath();
        g.moveTo(toX(seg.x1), toY(seg.z1));
        g.lineTo(toX(seg.x2), toY(seg.z2));
        g.stroke();
      }

      // 標示 12 大原作城鎮光點與高對比描邊標籤
      g.font = 'bold 7.5px sans-serif';
      g.textAlign = 'center';
      for (const loc of GI_LOCATIONS) {
        const cx = toX(loc.coords.x);
        const cz = toY(loc.coords.z);
        g.fillStyle = 'rgba(10, 18, 30, 0.8)';
        g.beginPath();
        g.arc(cx, cz, 4.4, 0, Math.PI * 2);
        g.fill();
        g.fillStyle = loc.visualTheme.mapDotHex;
        g.beginPath();
        g.arc(cx, cz, 3.2, 0, Math.PI * 2);
        g.fill();
        const shortName = loc.name.includes('・') ? loc.name.split('・')[1].slice(0, 4) : loc.name.slice(0, 4);
        g.strokeStyle = 'rgba(8, 14, 24, 0.88)';
        g.lineWidth = 2.4;
        g.strokeText(shortName, cx, cz - 5);
        g.fillStyle = '#ffffff';
        g.fillText(shortName, cx, cz - 5);
      }
      this.staticIslandMap = c;
    }
  }

  public renderMinimap(playerPos: THREE.Vector3, playerYaw: number, world: GameWorld): void {
    const ctx = this.minimapCtx;
    const w = this.minimapCanvas.width;
    const h = this.minimapCanvas.height;
    this.ensureStaticMaps(w, h);

    if (world.currentZone === 'lobby') {
      ctx.drawImage(this.staticLobbyMap!, 0, 0);
      const scale = 3.6;
      this.drawPlayerArrow(ctx, w / 2 + playerPos.x * scale, h / 2 + playerPos.z * scale, playerYaw);
      return;
    }

    ctx.drawImage(this.staticIslandMap!, 0, 0);
    const spanX = GI_MAP_BOUNDS.maxX - GI_MAP_BOUNDS.minX;
    const spanZ = GI_MAP_BOUNDS.maxZ - GI_MAP_BOUNDS.minZ;
    const toX = (v: number) => ((v - GI_MAP_BOUNDS.minX) / spanX) * w;
    const toY = (v: number) => ((v - GI_MAP_BOUNDS.minZ) / spanZ) * h;

    for (const item of world.islandInteractables) {
      if (item.kind === 'pickup' && !item.collected) {
        const def = item.cardId !== undefined ? getCardDef(item.cardId) : null;
        ctx.beginPath();
        ctx.arc(toX(item.position.x), toY(item.position.z), 2.5, 0, Math.PI * 2);
        ctx.fillStyle =
          def?.border === 'red' ? '#ff5b69' : def?.border === 'blue' ? '#4ea8ff' : '#ffd65a';
        ctx.fill();
      }
    }

    this.drawPlayerArrow(ctx, toX(playerPos.x), toY(playerPos.z), playerYaw);
  }

  private drawPlayerArrow(ctx: CanvasRenderingContext2D, x: number, y: number, yaw: number): void {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(-yaw);
    ctx.beginPath();
    ctx.moveTo(0, -6);
    ctx.lineTo(4.5, 5);
    ctx.lineTo(0, 2.5);
    ctx.lineTo(-4.5, 5);
    ctx.closePath();
    ctx.fillStyle = '#ffffff';
    ctx.fill();
    ctx.strokeStyle = '#0e1420';
    ctx.lineWidth = 1.2;
    ctx.stroke();
    ctx.restore();
  }
}
