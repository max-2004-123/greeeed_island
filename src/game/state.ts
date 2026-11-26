import { getCardDef } from './cards';

export type ZoneId = 'lobby' | 'island';

export interface SaveData {
  jenny: number;
  zone: ZoneId;
  specifiedSlots: Record<number, boolean>; // key: 0..99
  freeSlots: number[]; // max 45 card IDs
  collectedPickups: string[]; // world pickup IDs already collected
  metElena: boolean;
  visitedMasadora: boolean;
  visitedLocations: string[];
  packsOpened: number;
}

const STORAGE_KEY = 'greed_island_3d_save_v1';
export const MAX_FREE_SLOTS = 45;

export function createDefaultState(): SaveData {
  return {
    jenny: 15000,
    zone: 'lobby',
    specifiedSlots: {},
    freeSlots: [],
    collectedPickups: [],
    metElena: false,
    visitedMasadora: false,
    visitedLocations: [],
    packsOpened: 0,
  };
}

export class GameState {
  public data: SaveData;
  private listeners: Array<() => void> = [];

  constructor() {
    this.data = this.load();
  }

  public onChange(cb: () => void): void {
    this.listeners.push(cb);
  }

  private notify(): void {
    this.save();
    for (const cb of this.listeners) cb();
  }

  public load(): SaveData {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return createDefaultState();
      const parsed = JSON.parse(raw) as Partial<SaveData>;
      return {
        ...createDefaultState(),
        ...parsed,
        specifiedSlots: parsed.specifiedSlots ?? {},
        freeSlots: Array.isArray(parsed.freeSlots) ? parsed.freeSlots : [],
        collectedPickups: Array.isArray(parsed.collectedPickups) ? parsed.collectedPickups : [],
        visitedLocations: Array.isArray(parsed.visitedLocations)
          ? parsed.visitedLocations.filter((id): id is string => typeof id === 'string')
          : parsed.visitedMasadora ? ['masadora'] : [],
      };
    } catch {
      return createDefaultState();
    }
  }

  public save(): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.data));
    } catch {
      // ignore storage quota errors
    }
  }

  public reset(): void {
    this.data = createDefaultState();
    localStorage.removeItem(STORAGE_KEY);
    this.notify();
  }

  public addJenny(amount: number): void {
    this.data.jenny = Math.max(0, this.data.jenny + amount);
    this.notify();
  }

  public spendJenny(amount: number): boolean {
    if (this.data.jenny < amount) return false;
    this.data.jenny -= amount;
    this.notify();
    return true;
  }

  /**
   * 將卡片加入集卡書：
   * - 若為指定口袋卡片且該格為空，自動收入指定口袋
   * - 否則放入自由口袋（最多 45 格）
   */
  public addCard(cardId: number): { ok: boolean; pocket: 'specified' | 'free' | 'full' } {
    const def = getCardDef(cardId);
    if (def.category === 'specified' && !this.data.specifiedSlots[cardId]) {
      this.data.specifiedSlots[cardId] = true;
      this.notify();
      return { ok: true, pocket: 'specified' };
    }
    if (this.data.freeSlots.length >= MAX_FREE_SLOTS) {
      return { ok: false, pocket: 'full' };
    }
    this.data.freeSlots.push(cardId);
    this.notify();
    return { ok: true, pocket: 'free' };
  }

  public removeSpecifiedCard(cardId: number): boolean {
    if (!this.data.specifiedSlots[cardId]) return false;
    delete this.data.specifiedSlots[cardId];
    this.notify();
    return true;
  }

  public removeFreeCardAt(index: number): number | null {
    if (index < 0 || index >= this.data.freeSlots.length) return null;
    const [removed] = this.data.freeSlots.splice(index, 1);
    this.notify();
    return removed;
  }

  public getSpecifiedCount(): number {
    return Object.keys(this.data.specifiedSlots).length;
  }

  public setZone(zone: ZoneId): void {
    this.data.zone = zone;
    this.notify();
  }

  public markPickupCollected(id: string): void {
    if (!this.data.collectedPickups.includes(id)) {
      this.data.collectedPickups.push(id);
      this.notify();
    }
  }

  public isPickupCollected(id: string): boolean {
    return this.data.collectedPickups.includes(id);
  }

  public markMetElena(): void {
    if (!this.data.metElena) {
      this.data.metElena = true;
      this.notify();
    }
  }

  public markVisitedMasadora(): void {
    if (!this.data.visitedMasadora) {
      this.data.visitedMasadora = true;
      this.notify();
    }
  }

  public markLocationVisited(id: string): void {
    if (this.data.visitedLocations.includes(id)) return;
    this.data.visitedLocations.push(id);
    this.notify();
  }

  public incrementPacksOpened(): void {
    this.data.packsOpened += 1;
    this.notify();
  }

  public getCurrentQuestText(): string {
    if (this.data.zone === 'lobby') {
      if (!this.data.metElena) {
        return '與前方的引導員「伊妲（Eta）」對話（按 E），領取新手地圖、同行卡與戒尼！';
      }
      return '步入起始大廳中央的「傳送光陣」（按 E），正式降臨貪婪之島！';
    }
    if (!this.data.visitedMasadora) {
      return '沿著石板路往北方前進，探索草原光點並造訪魔法都市「瑪莎多拉」！';
    }
    if (this.data.packsOpened === 0) {
      return '進入瑪莎多拉城內尋找「咒語卡商店」，購買並開啟你的第一包咒語卡包！';
    }
    const spec = this.getSpecifiedCount();
    return `持續探索島嶼收集指定口袋卡片（目前 ${spec}/100），並按 B 開啟「BOOK！」體驗 GAIN 實體化！`;
  }
}
