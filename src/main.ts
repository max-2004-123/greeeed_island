import './style.css';
import * as THREE from 'three';
import { AmbientAudioEngine } from './game/audio';
import { ALL_CANON_CARDS, CardDef, drawRandomFreeItemCard, getCardDef } from './game/cards';
import { GI_LOCATIONS } from './game/locations';
import { PlayerController } from './game/player';
import { GameState, ZoneId } from './game/state';
import { GameWorld, GI_MAP_BOUNDS, Interactable } from './game/world';
import { BookUI, SpellTargets } from './ui/book';
import { HudUI } from './ui/hud';

class GreedIslandApp {
  private canvas = document.getElementById('game-canvas') as HTMLCanvasElement;
  private renderer: THREE.WebGLRenderer;
  private camera: THREE.PerspectiveCamera;
  private clock = new THREE.Clock();

  private state = new GameState();
  private audio = new AmbientAudioEngine();
  private world: GameWorld;
  private player: PlayerController;
  private hud: HudUI;
  private book: BookUI;

  private started = false;
  private isMapOpen = false;
  private nearestInteractable: Interactable | null = null;
  private interiorReturnPos: [number, number, number] | null = null;
  private interiorReturnYaw = 0;
  private transitionFlash = document.getElementById('transition-flash')!;
  private transitionFlashTimer: number | null = null;
  private mapModal = document.getElementById('map-modal')!;
  private mapCityGrid = document.getElementById('map-city-grid')!;
  private mapPinsLayer = document.getElementById('map-pins-layer')!;

  constructor() {
    this.renderer = new THREE.WebGLRenderer({ canvas: this.canvas, antialias: true });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.06;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;

    this.camera = new THREE.PerspectiveCamera(58, window.innerWidth / window.innerHeight, 0.1, 1450);

    this.world = new GameWorld();
    this.player = new PlayerController(this.world.scene, this.canvas);
    this.player.inputEnabled = false;

    this.hud = new HudUI(this.state, (open) => {
      this.syncInputLock();
      if (!open) this.hud.refreshStats();
    });

    this.book = new BookUI(this.state, {
      onGainEffect: (card) => this.applyGainEffect(card),
      getSpellTargets: (card) => this.getBookSpellTargets(card),
      onCastSpell: (card, targetId) => this.castBookSpell(card, targetId),
      onVisibilityChange: () => this.syncInputLock(),
    });

    this.world.syncCollectedPickups(this.state.data.collectedPickups);
    this.applySavedZone(false);

    this.bindGlobalEvents();
    this.animate();
  }

  private syncInputLock(): void {
    this.player.inputEnabled = this.started && !this.hud.isModalOpen && !this.book.isOpen && !this.isMapOpen;
  }

  private openIslandMap(): void {
    const confLabel: Record<string, string> = {
      high: '原作高還原',
      medium: '原作視覺還原',
      inferred: '地圖推估',
    };

    this.mapCityGrid.innerHTML = '';
    this.mapPinsLayer.innerHTML = '';

    const spanX = GI_MAP_BOUNDS.maxX - GI_MAP_BOUNDS.minX;
    const spanZ = GI_MAP_BOUNDS.maxZ - GI_MAP_BOUNDS.minZ;
    const toPctX = (x: number) => `${THREE.MathUtils.clamp(((x - GI_MAP_BOUNDS.minX) / spanX) * 100, 3, 97).toFixed(2)}%`;
    const toPctY = (z: number) => `${THREE.MathUtils.clamp(((z - GI_MAP_BOUNDS.minZ) / spanZ) * 100, 3, 97).toFixed(2)}%`;

    for (const loc of GI_LOCATIONS) {
      const teleportHere = () => {
        this.closeIslandMap();
        this.travelToZone('island', loc.spawnPos, loc.spawnYaw);
        this.hud.showToast(`✈️「同行」抵達【${loc.name}】！`);
      };

      const shortName = loc.name.includes('・') ? loc.name.split('・')[1] : loc.name;
      const pin = document.createElement('button');
      pin.type = 'button';
      pin.className = 'map-pin';
      pin.style.left = toPctX(loc.coords.x);
      pin.style.top = toPctY(loc.coords.z);
      pin.style.setProperty('--pin-color', loc.visualTheme.mapDotHex);
      pin.title = `同行前往：${loc.name}`;
      pin.innerHTML = `<span class="map-pin-dot"></span><span class="map-pin-label">${shortName}</span>`;
      pin.addEventListener('click', teleportHere);
      this.mapPinsLayer.appendChild(pin);

      const card = document.createElement('div');
      card.className = 'map-city-card';
      card.innerHTML = `
        <div>
          <div class="map-city-dir">📍 ${loc.directionLabel} · ${confLabel[loc.canonConfidence]}</div>
          <h3>${loc.name}</h3>
          <p>${loc.visualTheme.description}</p>
        </div>
      `;
      card.addEventListener('mouseenter', () => pin.classList.add('is-active'));
      card.addEventListener('mouseleave', () => pin.classList.remove('is-active'));

      const btn = document.createElement('button');
      btn.className = 'gi-btn gi-btn-primary';
      btn.style.padding = '8px 12px';
      btn.style.fontSize = '13px';
      btn.textContent = '✈️ 同行前往';
      btn.addEventListener('click', teleportHere);
      card.appendChild(btn);
      this.mapCityGrid.appendChild(card);
    }

    if (this.world.currentZone === 'island') {
      const playerPin = document.createElement('div');
      playerPin.className = 'map-pin-player';
      playerPin.style.left = toPctX(this.player.position.x);
      playerPin.style.top = toPctY(this.player.position.z);
      playerPin.title = '你的目前位置';
      playerPin.innerHTML = `<span class="map-player-pulse"></span><span class="map-player-tag">你</span>`;
      this.mapPinsLayer.appendChild(playerPin);
    }

    this.isMapOpen = true;
    this.mapModal.classList.remove('hidden');
    this.syncInputLock();
  }

  private closeIslandMap(): void {
    this.isMapOpen = false;
    this.mapModal.classList.add('hidden');
    this.syncInputLock();
  }

  private bindGlobalEvents(): void {
    window.addEventListener('resize', () => {
      this.camera.aspect = window.innerWidth / window.innerHeight;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(window.innerWidth, window.innerHeight);
    });

    window.addEventListener('beforeunload', () => {
      this.renderer.dispose();
    });

    // 標題畫面按鈕
    document.getElementById('btn-start-game')!.addEventListener('click', () => {
      document.getElementById('title-overlay')!.classList.add('hidden');
      this.started = true;
      this.audio.unlock();
      this.hud.showHud();
      this.syncInputLock();
      this.hud.showToast('歡迎來到 GREED ISLAND！按 B 召喚集卡書、按 M 開啟 No.101 島的地圖！');
    });

    document.getElementById('btn-reset-save')!.addEventListener('click', () => {
      this.state.reset();
      this.world.syncCollectedPickups([]);
      this.applySavedZone(false);
      this.hud.showToast('已清除存檔，準備展開全新冒險！');
    });

    // HUD 快捷鈕
    document.getElementById('btn-open-book')!.addEventListener('click', () => {
      if (!this.started || this.hud.isModalOpen || this.isMapOpen) return;
      this.book.toggle();
    });

    document.getElementById('btn-open-map')!.addEventListener('click', () => {
      if (!this.started || this.hud.isModalOpen || this.book.isOpen) return;
      if (this.isMapOpen) this.closeIslandMap();
      else this.openIslandMap();
    });

    document.getElementById('btn-close-map')!.addEventListener('click', () => {
      this.closeIslandMap();
    });

    const audioBtn = document.getElementById('btn-toggle-audio')!;
    audioBtn.addEventListener('click', () => {
      this.audio.unlock();
      const muted = this.audio.toggleMute();
      audioBtn.textContent = muted ? '🔇 環境音：關' : '🔊 環境音：開';
    });

    document.getElementById('btn-return-lobby')!.addEventListener('click', () => {
      if (!this.started || this.hud.isModalOpen || this.book.isOpen) return;
      this.travelToZone('lobby');
    });

    document.getElementById('btn-help-toggle')!.addEventListener('click', () => {
      if (!this.started || this.book.isOpen) return;
      this.hud.openDialog(
        '貪婪之島操作指南',
        '【移動】W A S D 或方向鍵\n【視角】按住滑鼠左鍵拖曳旋轉、滾輪縮放\n【衝刺 / 跳躍】Shift 衝刺、Space 跳躍\n【互動 / 卡片化】靠近 NPC、傳送陣、光點或商店時按 E\n【集卡書】按 B 喊出「BOOK！」查看指定/自由口袋與 GAIN 實體化',
        [{ label: '知道了！', primary: true, onClick: () => {} }]
      );
    });

    // 鍵盤快捷鍵
    window.addEventListener('keydown', (e) => {
      if (!this.started) return;
      if (e.isComposing || (e.target instanceof HTMLElement && e.target.matches('input, textarea, select, [contenteditable="true"]'))) return;

      if (e.code === 'Escape') {
        if (this.book.isOpen) this.book.close();
        else if (this.isMapOpen) this.closeIslandMap();
        else if (this.hud.isModalOpen) {
          this.hud.closeDialog();
          this.hud.closeShop();
        }
        return;
      }

      if (e.code === 'KeyB' && !this.hud.isModalOpen && !this.isMapOpen) {
        this.book.toggle();
        return;
      }

      if (e.code === 'KeyM' && !this.hud.isModalOpen && !this.book.isOpen) {
        if (this.isMapOpen) this.closeIslandMap();
        else this.openIslandMap();
        return;
      }

      if (e.code === 'KeyH' && !this.hud.isModalOpen && !this.book.isOpen) {
        if (this.state.data.zone === 'island') {
          this.travelToZone('lobby');
        }
        return;
      }

      if (e.code === 'KeyE' && this.player.inputEnabled && this.nearestInteractable) {
        this.triggerInteraction(this.nearestInteractable);
      }
    });
  }

  private applySavedZone(flash: boolean): void {
    const zone = this.state.data.zone;
    this.world.setZone(zone);
    if (zone === 'lobby') {
      this.player.teleportTo(0, 0, 5.2, 0);
    } else {
      const start = GI_LOCATIONS[0];
      this.player.teleportTo(start.spawnPos[0], start.spawnPos[1], start.spawnPos[2], start.spawnYaw);
      this.world.updateStreaming(this.player.position, true);
    }
    if (flash) this.playTransitionFlash();
    this.hud.refreshStats();
  }

  private travelToZone(target: ZoneId, customPos?: [number, number, number], facingYaw = 0): void {
    this.playTransitionFlash();
    this.state.setZone(target);
    this.world.setZone(target);
    if (customPos) {
      this.player.teleportTo(customPos[0], customPos[1], customPos[2], facingYaw);
      if (target === 'island') this.world.updateStreaming(this.player.position, true);
    } else if (target === 'lobby') {
      this.player.teleportTo(0, 0, 5.2, 0);
      this.hud.showToast('已返回「起始之塔・接待大廳（伊妲）」');
    } else {
      const start = GI_LOCATIONS[0];
      this.player.teleportTo(start.spawnPos[0], start.spawnPos[1], start.spawnPos[2], start.spawnYaw);
      this.world.updateStreaming(this.player.position, true);
      this.hud.showToast('降臨貪婪之島「Shiso Tree」！按 M 開啟 No.101 島的地圖可巡禮全島 12 大原作地點！');
    }
    this.hud.refreshStats();
  }

  private playTransitionFlash(): void {
    if (this.transitionFlashTimer !== null) {
      window.clearTimeout(this.transitionFlashTimer);
    }
    this.transitionFlash.classList.add('hidden');
    void this.transitionFlash.offsetWidth;
    this.transitionFlash.classList.remove('hidden');
    this.transitionFlashTimer = window.setTimeout(() => {
      this.transitionFlash.classList.add('hidden');
      this.transitionFlashTimer = null;
    }, 860);
  }

  private triggerInteraction(item: Interactable): void {
    if (item.kind === 'interior_enter' && item.interiorId) {
      this.interiorReturnPos = [this.player.position.x, 0, this.player.position.z];
      this.interiorReturnYaw = this.player.yaw;
      this.playTransitionFlash();
      const info = this.world.enterInterior(item.interiorId);
      if (info) {
        this.player.teleportTo(info.spawnPos[0], info.spawnPos[1], info.spawnPos[2], info.spawnYaw);
        this.hud.showToast(`🚪 進入【${info.title}】！`);
      }
      return;
    }

    if (item.kind === 'interior_exit') {
      this.playTransitionFlash();
      this.world.exitInterior();
      const ret = this.interiorReturnPos ?? [316.6, 0, -175.0];
      this.player.teleportTo(ret[0], ret[1], ret[2], this.interiorReturnYaw + Math.PI);
      this.world.updateStreaming(this.player.position, true);
      this.hud.showToast('🌊 已返回「海濱都市・壽富拉比」海港！');
      return;
    }

    if (item.kind === 'portal') {
      this.travelToZone('island');
      return;
    }

    if (item.kind === 'shop') {
      this.hud.openShop();
      return;
    }

    if (item.kind === 'pickup' && item.cardId !== undefined && !item.collected) {
      const def = getCardDef(item.cardId);
      const res = this.state.addCard(def.id);
      if (!res.ok) {
        this.hud.showToast('自由口袋已滿（45/45）！請按 B 整理集卡書。');
        return;
      }
      this.state.markPickupCollected(item.id);
      this.world.syncCollectedPickups(this.state.data.collectedPickups);
      const pocketName = res.pocket === 'specified' ? '指定口袋' : '自由口袋';
      this.hud.showToast(`✨ 卡片化成功！獲得 No.${def.code}「${def.name}」→ 收入${pocketName}`);
      return;
    }

    if (item.id === 'npc_elena') {
      if (!this.state.data.metElena) {
        this.hud.openDialog(
          '起點引導員・伊妲（Eta）',
          '歡迎來到《GREED ISLAND》的起始之塔接待大廳！\n你手上的戒指能讓你隨時喊出「BOOK！」（按 B 鍵）召喚集卡書。\n你的目標是收集 000～099 共 100 張「紅框指定口袋卡片」，並可搭配瑪莎多拉販售的 40 張「藍框咒語卡」！\n\n這是給新手獵人的啟程禮：No.101「島的地圖（詳細）」、No.1039「同行（Accompany）」與 10,000 戒尼！準備好就步入中央光陣降臨貪婪之島吧！',
          [
            {
              label: '收下啟程禮，開始冒險！',
              primary: true,
              onClick: () => {
                this.state.markMetElena();
                this.state.addCard(101);
                this.state.addCard(1039);
                this.state.addJenny(10000);
                this.hud.showToast('獲得 No.101「島的地圖（詳細）」、No.1039「同行」與 10,000 戒尼！');
              },
            },
          ]
        );
      } else {
        this.hud.openDialog(
          '起點引導員・伊妲（Eta）',
          '中央的傳送光陣會帶你降臨貪婪之島南端的「Shiso Tree」。\n按 B 可開啟集卡書查看 164 張完整原作卡片圖鑑，按 M 可直接「同行」巡禮全島 12 大原作地點喔！',
          [
            {
              label: '立刻傳送前往貪婪之島',
              primary: true,
              onClick: () => this.travelToZone('island'),
            },
            { label: '再逛一下大廳', onClick: () => {} },
          ]
        );
      }
      return;
    }

    if (item.id === 'npc_hunter_guide') {
      this.hud.openDialog(
        '資深玩家・莉絲',
        '嗨，新手！這裡是魔法都市「瑪莎多拉」，島上唯一販售咒語卡包的城鎮。\n小提示：草原東西兩側的古代遺跡裡藏著稀有的指定口袋卡片（像是「風險骰子」與「奇運亞歷山大石」），別忘了去探索！\n\n如果你抽到「同行」或「磁力」，在集卡書按 GAIN 就能立刻飛回瑪莎多拉城門前喔！',
        [{ label: '謝謝你的情報！', primary: true, onClick: () => {} }]
      );
      return;
    }

    if (item.id === 'sign_welcome') {
      this.hud.openDialog(
        '貪婪之島全島導覽石碑',
        '【正北】懸賞都市・安多奇拔 → 城主之城・利梅洛\n【西北內陸】荒地峽谷 → 魔法都市・瑪莎多拉\n【西部突岬】賭博都市・多里亞斯\n【東方海岸】海濱都市・壽富拉比（海盜船與燈塔）\n【東南海岸】戀愛都市・愛愛（海濱櫻花大道）\n\n提示：隨時按 M 開啟「No.101 島的地圖」快速同行巡禮！',
        [{ label: '出發探索！', primary: true, onClick: () => {} }]
      );
      return;
    }

    if (item.id === 'npc_dorias_dealer') {
      this.hud.openDialog(
        '多里亞斯・賭場荷官',
        '歡迎光臨西部「賭博都市・多里亞斯」！\n想用「風險骰子」在賭桌上一夜致富、贏走稀有的指定口袋卡片嗎？\n場邊好像正好掉落了一顆「風險骰子」，先撿起來試試手氣吧！',
        [{ label: '改天來大贏一場！', primary: true, onClick: () => {} }]
      );
      return;
    }

    if (item.id === 'npc_antokiba_host') {
      this.hud.openDialog(
        '安多奇拔・懸賞大賽主持人',
        '歡迎來到「懸賞都市・安多奇拔」！這裡是離起始之塔最近的城市。\n每個月我們都會舉辦不同主題的懸賞比賽，冠軍可以贏得稀有的指定口袋卡片！\n\n（小提示：城內角落好像藏著一顆「風險骰子」，別忘了仔細找找！）',
        [{ label: '我一定會來挑戰！', primary: true, onClick: () => {} }]
      );
      return;
    }

    if (item.id === 'npc_razor') {
      this.hud.openDialog(
        '海濱都市管理者・磊札',
        '哼，想拿 No.002「一坪的海岸線」嗎？\n這座壽富拉比港與那座燈塔都是我的地盤。等你變強了，就帶上夥伴來這座球場跟我打一場全力躲避球賽吧！\n\n（磊札躲避球小遊戲將於 Phase 3 正式開放！）',
        [{ label: '等著我來挑戰！', primary: true, onClick: () => {} }]
      );
      return;
    }

    if (item.id === 'npc_harbormaster') {
      this.hud.openDialog(
        '貪婪之島港・港長',
        '這裡是島上唯一的離境港口「Greed Island Port」。\n想要拿到「離境通行票」前往旁邊艾蓮娜（Elena）的塔回到現實世界？\n要嘛完成我給你的無盡任務，要嘛……拿出誠意來談談吧！',
        [{ label: '我還想繼續留在島上冒險！', primary: true, onClick: () => {} }]
      );
      return;
    }

    if (item.id === 'npc_bandit_chief') {
      this.hud.openDialog(
        '山賊之村・村長',
        '咳咳……你也是為了卡片來到這片西北密林的「玩家」嗎？\n我們全村都染上了這座島特有的流行病（No.163 生病的村民），唯有能賜予強運的奇石或解毒卡片才能救大家。\n\n（原作彩蛋：傳說山賊首領會在村落事件後交出 No.075「奇運亞歷山大石」的線索！）',
        [{ label: '我會記住這條線索的', primary: true, onClick: () => {} }]
      );
      return;
    }

    if (item.id === 'sign_limeiro') {
      this.hud.openDialog(
        '城主之城・利梅洛',
        '這裡是遊戲管理者「杜恩（Dwun）」與「李斯特（List）」所居住的利梅洛主城。\n只有集滿 001～099 號指定口袋卡片並通過最終問答測驗的玩家，才能受邀入城領取 No.000「統治者的祝福」！',
        [{ label: '總有一天我會破關！', primary: true, onClick: () => {} }]
      );
    }
  }

  private getBookSpellTargets(card: CardDef): SpellTargets {
    switch (card.id) {
      case 1009:
      case 1039: {
        const options = GI_LOCATIONS
          .filter((location) => this.state.data.visitedLocations.includes(location.id))
          .map((location) => ({ id: location.id, label: location.name }));
        return { options, unavailable: options.length ? undefined : '還沒有造訪過可以前往的地點。' };
      }
      case 1013:
      case 1014:
      case 1032:
        return { options: [{ id: 'self', label: '自己' }] };
      case 1016:
        return { options: [{ id: 'random', label: '隨機未造訪地點' }] };
      case 1031:
        return {
          options: ALL_CANON_CARDS
            .filter((entry) => entry.id !== 0 && entry.category !== 'gm')
            .map((entry) => ({ id: String(entry.id), label: `No.${entry.code} ${entry.name}` })),
        };
      default:
        return { options: [], unavailable: '此咒語的目標或效果尚未在單人版實作。' };
    }
  }

  private castBookSpell(card: CardDef, targetId: string): void {
    if (card.id === 1009 || card.id === 1039) {
      const location = GI_LOCATIONS.find((entry) => entry.id === targetId);
      if (!location) return;
      this.book.close();
      this.travelToZone('island', location.spawnPos, location.spawnYaw);
      this.hud.showToast(`${card.name} ON！抵達「${location.name}」。`);
    } else if (card.id === 1016) {
      const unvisited = GI_LOCATIONS.filter((entry) => !this.state.data.visitedLocations.includes(entry.id));
      const location = unvisited[Math.floor(Math.random() * unvisited.length)];
      if (!location) {
        this.hud.showToast('已造訪所有地點。漂流卡已消耗，玩家留在原地。');
        return;
      }
      this.book.close();
      this.travelToZone('island', location.spawnPos, location.spawnYaw);
      this.hud.showToast(`漂流 ON！抵達「${location.name}」。`);
    } else if (card.id === 1031) {
      this.book.openCatalogCard(Number(targetId));
    } else {
      this.applyGainEffect(card);
    }
  }

  private applyGainEffect(card: CardDef): void {
    const eff = card.gainEffect;
    if (!eff) {
      this.hud.showToast(`GAIN！「No.${card.code} ${card.name}」實體化光芒閃耀！`);
      return;
    }

    if (eff.type === 'jenny' && eff.amount) {
      this.state.addJenny(eff.amount);
      this.hud.showToast(eff.message);
    } else if (eff.type === 'speed_boost') {
      this.player.triggerSpeedBoost(15);
      this.hud.showToast(eff.message);
    } else if (eff.type === 'teleport_masadora') {
      this.book.close();
      this.travelToZone('island', [-42, 0, -54], 0);
      this.hud.showToast(eff.message);
    } else if (eff.type === 'teleport_shiso') {
      this.book.close();
      const start = GI_LOCATIONS[0];
      this.travelToZone('island', start.spawnPos, start.spawnYaw);
      this.hud.showToast(eff.message);
    } else if (eff.type === 'teleport_random_town') {
      this.book.close();
      const target = GI_LOCATIONS[Math.floor(Math.random() * GI_LOCATIONS.length)];
      this.travelToZone('island', target.spawnPos, target.spawnYaw);
      this.hud.showToast(`${eff.message}（目的地：${target.name}）`);
    } else if (eff.type === 'open_map') {
      this.book.close();
      this.openIslandMap();
      this.hud.showToast(eff.message);
    } else if (eff.type === 'lottery') {
      const prize = drawRandomFreeItemCard();
      const res = this.state.addCard(prize.id);
      this.hud.showToast(
        res.ok
          ? `🎰 抽籤成功！卡片化為 No.${prize.code}「${prize.name}」(${prize.rank}-${prize.limit})！`
          : '自由口袋已滿，抽籤卡片消散了！'
      );
    } else if (eff.type === 'analysis') {
      const remaining = this.world.islandInteractables.filter(
        (i) => i.kind === 'pickup' && !i.collected
      ).length;
      this.hud.showToast(
        `${eff.message}（指定口袋 ${this.state.getSpecifiedCount()}/100，島上尚有 ${remaining} 處可拾取卡片）`
      );
    } else if (eff.type === 'teleport_lobby') {
      this.book.close();
      this.travelToZone('lobby');
      this.hud.showToast(eff.message);
    } else {
      this.hud.showToast(eff.message);
    }
  }

  private findNearestInteractable(): Interactable | null {
    const list = this.world.getInteractables();
    let best: Interactable | null = null;
    let bestDist = Infinity;

    for (const item of list) {
      if (item.kind === 'pickup' && item.collected) continue;
      const d = Math.hypot(
        this.player.position.x - item.position.x,
        this.player.position.z - item.position.z
      );
      if (d <= item.radius && d < bestDist) {
        best = item;
        bestDist = d;
      }
    }
    return best;
  }

  private animate = (): void => {
    requestAnimationFrame(this.animate);
    const dt = Math.min(0.05, this.clock.getDelta());
    const elapsed = this.clock.elapsedTime;

    this.world.update(elapsed, dt);
    this.player.update(dt, this.world, this.camera);
    this.world.updateStreaming(this.player.position, false);

    const activeLoc = this.world.getLocationAt(this.player.position.x, this.player.position.z);
    this.world.updateAtmosphere(activeLoc, this.player.position, dt);

    if (this.started) {
      if (this.state.data.zone === 'island' && activeLoc) this.state.markLocationVisited(activeLoc.id);
      // 更新當前所在貪婪之島地區名稱與區域環境音（單次查詢、零重複計算）
      const regionLabel = this.world.currentInteriorId
        ? this.world.getRegionNameAt(0, 0)
        : this.state.data.zone === 'lobby'
        ? '起始之塔・接待大廳（伊妲 Eta）'
        : activeLoc
        ? `${activeLoc.name}（${activeLoc.enName.split(',')[0]}）`
        : '貪婪之島・野外草原';
      this.hud.setZoneLabel(regionLabel);
      this.audio.setProfile(
        this.state.data.zone === 'lobby' ? 'lobby' : activeLoc ? activeLoc.ambientAudio : 'meadow'
      );

      // 偵測首次抵達西北「魔法都市・瑪莎多拉」
      if (activeLoc?.id === 'masadora' && !this.state.data.visitedMasadora) {
        this.state.markVisitedMasadora();
        this.hud.showToast('✨ 抵達魔法都市「瑪莎多拉」！眼前就是白圓頂熊貓頭咒語卡商店！');
      }

      // 更新互動提示
      this.nearestInteractable = this.player.inputEnabled ? this.findNearestInteractable() : null;
      this.hud.setInteractPrompt(this.nearestInteractable ? this.nearestInteractable.label : null);

      // 更新雷達小地圖
      this.hud.renderMinimap(this.player.position, this.player.yaw, this.world);
    }

    this.renderer.render(this.world.scene, this.camera);
  };
}

new GreedIslandApp();
