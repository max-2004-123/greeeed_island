import * as THREE from 'three';
import { ModelLibrary } from './assets';
import { getCardDef } from './cards';
import {
  AnimeSkyController,
  createAnimeSkySystem,
  createIslandBreezeParticles,
  createIslandSurfaceMaterials,
  createWindSwayingMeadowFlora,
  IslandSurfaceMaterials,
  WindMeadowSystem,
} from './environment/worldVisuals';
import { createOfficialIslandTerrain } from './environment/officialIslandTerrain';
import { isV2Map } from './mapVersion';
import {
  V2_FOREST_ZONES,
  V2_LAKES,
  V2_MAP_BOUNDS,
  V2_ROADS,
  V2_TOWN_PLACEMENTS,
} from './v2/mapDataV2';
import { createSculptedTerrainV2, SculptedTerrainV2Result } from './v2/sculptedTerrainV2';
import { buildRazorGymInterior } from './interiors/razorGym';
import {
  ARCH_SCALE,
  findLocationAt,
  GI_LOCATIONS,
  LocationDef,
  RAW_LOCATION_ANCHORS,
  WORLD_SCALE,
} from './locations';
import {
  createDetailedNpcMesh,
  createGreedIslandCardPickupMesh,
  createLobbyMarbleTexture,
  createOpenBookMesh,
} from './models/proceduralModels';
import { ZoneId } from './state';
import { buildAiaiZone } from './zones/aiai';
import { buildAntokibaZone } from './zones/antokiba';
import { buildBadlandsZone } from './zones/badlands';
import { buildBanditVillageZone } from './zones/banditVillage';
import { buildBunzenZone } from './zones/bunzen';
import { buildDoriasZone } from './zones/dorias';
import { buildGiPortZone } from './zones/giPort';
import { buildLimeiroZone } from './zones/limeiro';
import { buildMasadoraZone } from './zones/masadora';
import { buildRubicutaZone } from './zones/rubicuta';
import { buildShisoTreeZone } from './zones/shisoTree';
import { buildSoufrabiZone } from './zones/soufrabi';
import { buildExpandedCityDistricts, CITY_EXPANSION_CONFIGS } from './zones/cityExpansion';

export interface Interactable {
  id: string;
  label: string;
  position: THREE.Vector3;
  radius: number;
  kind: 'npc' | 'portal' | 'shop' | 'pickup' | 'sign' | 'interior_enter' | 'interior_exit';
  cardId?: number;
  interiorId?: string;
  mesh?: THREE.Object3D;
  collected?: boolean;
}

export interface CircleCollider {
  x: number;
  z: number;
  r: number;
}

export interface BoxCollider {
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
}

export interface RoadSegment {
  x1: number;
  z1: number;
  x2: number;
  z2: number;
  width: number;
}

interface PlacedFootprint {
  x: number;
  z: number;
  halfW: number;
  halfD: number;
}

interface ZoneStreamEntry {
  id: string;
  name: string;
  origCx: number;
  origCz: number;
  cx: number;
  cz: number;
  loadRadius: number;
  visibleRadius: number;
  built: boolean;
  active: boolean;
  group: THREE.Group | null;
  animated: Array<(t: number, dt: number) => void>;
  circleColliders: CircleCollider[];
  boxColliders: BoxCollider[];
  cameraOccluders: THREE.Object3D[];
  interactables: Interactable[];
  placedFootprints: PlacedFootprint[];
  builder: (entry: ZoneStreamEntry) => THREE.Group;
}

interface SpatialChunk {
  cx: number;
  cz: number;
  cullRadius: number;
  group: THREE.Object3D;
  colliders: CircleCollider[];
}

export interface StreamingStats {
  builtZones: number;
  activeZones: number;
  totalZones: number;
  activeChunks: number;
  totalChunks: number;
}

interface InteriorCell {
  id: string;
  title: string;
  group: THREE.Group;
  spawnPos: [number, number, number];
  spawnYaw: number;
  bounds: { minX: number; maxX: number; minZ: number; maxZ: number };
  animated: Array<(t: number, dt: number) => void>;
  circleColliders: CircleCollider[];
  boxColliders: BoxCollider[];
  cameraOccluders: THREE.Object3D[];
  interactables: Interactable[];
}

const LEGACY_MAP_BOUNDS = {
  minX: -125 * WORLD_SCALE,
  maxX: 145 * WORLD_SCALE,
  minZ: -150 * WORLD_SCALE,
  maxZ: 220 * WORLD_SCALE,
} as const;

export const GI_MAP_BOUNDS = isV2Map() ? V2_MAP_BOUNDS : LEGACY_MAP_BOUNDS;

// 與官方垂直地圖對應的 5 倍大尺度陸塊定義
const RAW_LAND_LOBES: Array<{ x: number; z: number; rx: number; rz: number; rot?: number }> = [
  { x: -16, z: -78, rx: 56, rz: 44, rot: 0.1 },
  { x: -72, z: -122, rx: 28, rz: 28, rot: -0.25 },
  { x: -34, z: -116, rx: 20, rz: 22, rot: 0.2 },
  { x: 24, z: -96, rx: 28, rz: 14, rot: -0.25 },
  { x: 8, z: -24, rx: 58, rz: 42, rot: -0.05 },
  { x: 64, z: -34, rx: 32, rz: 28, rot: 0.15 },
  { x: -58, z: -30, rx: 26, rz: 20, rot: -0.2 },
  { x: 4, z: 36, rx: 26, rz: 36, rot: 0.05 },
  { x: -74, z: 22, rx: 14, rz: 34, rot: 0.18 },
  { x: -66, z: 60, rx: 15, rz: 20, rot: -0.35 },
  { x: -34, z: 78, rx: 26, rz: 14, rot: -0.15 },
  { x: 6, z: 98, rx: 68, rz: 38, rot: 0.04 },
  { x: 8, z: 162, rx: 46, rz: 48, rot: 0.02 },
  { x: 52, z: 142, rx: 32, rz: 26, rot: -0.05 },
  { x: 96, z: 136, rx: 38, rz: 34, rot: -0.12 },
  { x: 76, z: -106, rx: 28, rz: 24, rot: 0.4 },
  { x: 66, z: 36, rx: 18, rz: 38, rot: 0.25 },
  { x: 86, z: 86, rx: 14, rz: 12, rot: -0.2 },
  { x: -92, z: -76, rx: 10, rz: 22, rot: 0.35 },
  { x: -84, z: -50, rx: 9, rz: 14, rot: -0.2 },
];

export const GI_LAND_LOBES = RAW_LAND_LOBES.map((l) => ({
  x: l.x * WORLD_SCALE,
  z: l.z * WORLD_SCALE,
  rx: l.rx * WORLD_SCALE,
  rz: l.rz * WORLD_SCALE,
  rot: l.rot,
}));

const RAW_ROADS: RoadSegment[] = [
  { x1: 6, z1: 186, x2: 6, z2: 174, width: 5.2 },
  { x1: 6, z1: 174, x2: -1, z2: 148, width: 5.4 },
  { x1: -1, z1: 148, x2: 8, z2: 125, width: 5.4 },
  { x1: 8, z1: 125, x2: 23, z2: 106, width: 5.6 },
  { x1: 23, z1: 106, x2: 26, z2: 92, width: 5.8 },
  { x1: 26, z1: 92, x2: 26, z2: 70, width: 6.0 },
  { x1: 1, z1: 146, x2: 26, z2: 144, width: 4.8 },
  { x1: 26, z1: 144, x2: 48, z2: 158, width: 4.8 },
  { x1: 48, z1: 158, x2: 64, z2: 164, width: 5.0 },
  { x1: 64, z1: 164, x2: 80, z2: 166, width: 5.6 },
  { x1: 26, z1: 70, x2: 26, z2: 48, width: 5.6 },
  { x1: 26, z1: 48, x2: 4, z2: 36, width: 5.6 },
  { x1: 26, z1: 70, x2: -6, z2: 108, width: 4.8 },
  { x1: -6, z1: 108, x2: -52, z2: 136, width: 4.8 },
  { x1: 4, z1: 36, x2: -16, z2: -46, width: 5.4 },
  { x1: -16, z1: -46, x2: -42, z2: -76, width: 5.4 },
  { x1: -16, z1: -46, x2: 14, z2: -104, width: 5.4 },
  { x1: -16, z1: -46, x2: -52, z2: -26, width: 4.8 },
  { x1: 4, z1: 36, x2: 64, z2: -30, width: 5.0 },
  { x1: -52, z1: -26, x2: -96, z2: 22, width: 4.6 },
];

const LEGACY_ROADS: RoadSegment[] = RAW_ROADS.map((s) => ({
  x1: s.x1 * WORLD_SCALE,
  z1: s.z1 * WORLD_SCALE,
  x2: s.x2 * WORLD_SCALE,
  z2: s.z2 * WORLD_SCALE,
  width: s.width * 1.9,
}));

export const GI_ROADS: RoadSegment[] = isV2Map() ? V2_ROADS : LEGACY_ROADS;

function distPointToSegment2D(px: number, pz: number, s: RoadSegment): number {
  const dx = s.x2 - s.x1;
  const dz = s.z2 - s.z1;
  const lenSq = dx * dx + dz * dz;
  if (lenSq < 0.0001) return Math.hypot(px - s.x1, pz - s.z1);
  const t = THREE.MathUtils.clamp(((px - s.x1) * dx + (pz - s.z1) * dz) / lenSq, 0, 1);
  return Math.hypot(px - (s.x1 + t * dx), pz - (s.z1 + t * dz));
}

const LEGACY_LAKES: Array<{ x: number; z: number; rx: number; rz: number }> = [
  { x: -24, z: -64, rx: 11, rz: 8 },
  { x: 36, z: -60, rx: 14, rz: 9 },
  { x: -10, z: -16, rx: 9, rz: 7 },
  { x: 14, z: -12, rx: 8, rz: 6 },
  { x: -16, z: 102, rx: 14, rz: 7 },
].map((lk) => ({
  x: lk.x * WORLD_SCALE,
  z: lk.z * WORLD_SCALE,
  rx: lk.rx * WORLD_SCALE,
  rz: lk.rz * WORLD_SCALE,
}));

export const GI_LAKES: Array<{ x: number; z: number; rx: number; rz: number }> = isV2Map()
  ? V2_LAKES
  : LEGACY_LAKES;

export class GameWorld {
  public scene: THREE.Scene;
  public lobbyGroup = new THREE.Group();
  public islandGroup = new THREE.Group();
  public currentZone: ZoneId = 'lobby';
  public currentInteriorId: string | null = null;
  private interiorCells = new Map<string, InteriorCell>();

  public lobbyInteractables: Interactable[] = [];
  public islandInteractables: Interactable[] = [];

  public lobbyColliders: CircleCollider[] = [];
  public islandCircleColliders: CircleCollider[] = [];
  public islandBoxColliders: BoxCollider[] = [];

  private lobbyCameraOccluders: THREE.Object3D[] = [];
  private islandCameraOccluders: THREE.Object3D[] = [];
  private walkableTerrainMeshes: THREE.Object3D[] = [];
  private _camRaycaster = new THREE.Raycaster();
  private _camRayDir = new THREE.Vector3();
  private _groundRaycaster = new THREE.Raycaster();
  private _groundRayOrigin = new THREE.Vector3();
  private _groundRayDown = new THREE.Vector3(0, -1, 0);
  private _groundNormalMatrix = new THREE.Matrix3();
  private _groundWorldNormal = new THREE.Vector3();

  private models = new ModelLibrary();
  private animatedObjects: Array<(t: number, dt: number) => void> = [];
  private sunLight!: THREE.DirectionalLight;
  private fillLight!: THREE.DirectionalLight;
  private hemiLight!: THREE.HemisphereLight;
  private ambientParticles?: THREE.Points;
  private animeSky?: AnimeSkyController;
  private windMeadowChunks: Array<{ cx: number; cz: number; cullRadius: number; system: WindMeadowSystem }> = [];
  private spatialChunks: SpatialChunk[] = [];
  private zoneStreams: ZoneStreamEntry[] = [];
  private breezeParticles?: { points: THREE.Points; update: (t: number, playerPos: THREE.Vector3) => void };
  private surfaceMats!: IslandSurfaceMaterials;
  private v2Terrain: SculptedTerrainV2Result | null = null;
  private lastPlayerPos = new THREE.Vector3(6, 0, 174);
  private lastStreamCheckPos = new THREE.Vector3(9999, 0, 9999);

  private targetSkyColor = new THREE.Color(0x3a88dd);
  private targetFogColor = new THREE.Color(0xcdeafc);
  private targetFogDensity = 0.0024;
  private targetSunIntensity = 1.72;

  constructor() {
    this.scene = new THREE.Scene();
    this.setupLighting();
    this.buildLobby();
    this.buildIsland();

    this.scene.add(this.lobbyGroup);
    this.scene.add(this.islandGroup);
    this.setZone('lobby');
  }

  private setupLighting(): void {
    // 動畫戶外三點光：天空草地半球反射光 + 暖金主日光 + 對向冷藍補光（讓陰影面泛柔和天藍而非死黑灰）
    this.hemiLight = new THREE.HemisphereLight(0xaadfff, 0x6e8f56, 1.18);
    this.scene.add(this.hemiLight);

    this.sunLight = new THREE.DirectionalLight(0xfff1cc, 1.72);
    this.sunLight.position.set(75, 130, 70);
    this.sunLight.castShadow = true;
    this.sunLight.shadow.mapSize.set(2048, 2048);
    this.sunLight.shadow.camera.near = 10;
    this.sunLight.shadow.camera.far = 360;
    const d = 96;
    this.sunLight.shadow.camera.left = -d;
    this.sunLight.shadow.camera.right = d;
    this.sunLight.shadow.camera.top = d;
    this.sunLight.shadow.camera.bottom = -d;
    this.sunLight.shadow.bias = -0.00045;
    this.sunLight.shadow.normalBias = 0.025;
    this.scene.add(this.sunLight);
    this.scene.add(this.sunLight.target);

    this.fillLight = new THREE.DirectionalLight(0x94d2ff, 0.62);
    this.fillLight.position.set(-85, 82, -78);
    this.scene.add(this.fillLight);
  }

  public setZone(zone: ZoneId): void {
    this.currentZone = zone;
    this.currentInteriorId = null;
    for (const cell of this.interiorCells.values()) cell.group.visible = false;
    this.lobbyGroup.visible = zone === 'lobby';
    this.islandGroup.visible = zone === 'island';

    if (zone === 'lobby') {
      this.scene.background = new THREE.Color(0x111b30);
      this.scene.fog = new THREE.FogExp2(0x111b30, 0.015);
      this.hemiLight.intensity = 1.05;
      this.sunLight.intensity = 1.25;
      this.fillLight.intensity = 0.25;
    } else {
      this.scene.background = new THREE.Color(0x6ec1f5);
      this.scene.fog = new THREE.FogExp2(0xcdeafc, 0.00095);
      this.hemiLight.intensity = 1.18;
      this.sunLight.intensity = 1.72;
      this.fillLight.intensity = 0.62;
      this.animeSky?.setThemeColors(0x2b76cf, 0xdcf2fa);
    }
  }

  /**
   * 進入獨立室內空間（Interior Cell）：首次進入時才延遲建構，並自動隱藏外部全島以維持 60 FPS。
   */
  public enterInterior(
    id: string
  ): { spawnPos: [number, number, number]; spawnYaw: number; title: string } | null {
    let cell = this.interiorCells.get(id);
    if (!cell) {
      if (id === 'razor_gym') {
        const animated: Array<(t: number, dt: number) => void> = [];
        const circleColliders: CircleCollider[] = [];
        const boxColliders: BoxCollider[] = [];
        const cameraOccluders: THREE.Object3D[] = [];
        const interactables: Interactable[] = [];
        const group = buildRazorGymInterior({
          createNpcMesh: (cloth, skin, hair) =>
            createDetailedNpcMesh(cloth, skin, hair, (fn) => animated.push(fn)),
          addAnimated: (fn) => animated.push(fn),
          addCircleCollider: (c) => circleColliders.push(c),
          addBoxCollider: (b) => boxColliders.push(b),
          addCameraOccluder: (obj) => cameraOccluders.push(obj),
          addInteractable: (item) => interactables.push(item),
        });
        this.scene.add(group);
        cell = {
          id,
          title: '壽富拉比・磊札室內體育館（Indoor Arena）',
          group,
          spawnPos: [-17.5, 0, 0],
          spawnYaw: Math.PI / 2,
          bounds: { minX: -20.0, maxX: 20.0, minZ: -13.0, maxZ: 13.0 },
          animated,
          circleColliders,
          boxColliders,
          cameraOccluders,
          interactables,
        };
        this.interiorCells.set(id, cell);
      } else {
        return null;
      }
    }

    this.lobbyGroup.visible = false;
    this.islandGroup.visible = false;
    for (const c of this.interiorCells.values()) c.group.visible = c.id === id;
    this.currentInteriorId = id;

    this.scene.background = new THREE.Color(0x182130);
    this.scene.fog = new THREE.FogExp2(0x182130, 0.008);
    this.hemiLight.intensity = 1.15;
    this.sunLight.intensity = 0.85;
    this.fillLight.intensity = 0.35;

    return { spawnPos: cell.spawnPos, spawnYaw: cell.spawnYaw, title: cell.title };
  }

  public exitInterior(): void {
    if (!this.currentInteriorId) return;
    this.setZone('island');
  }

  public getInteractables(): Interactable[] {
    if (this.currentInteriorId) {
      return this.interiorCells.get(this.currentInteriorId)?.interactables ?? [];
    }
    if (this.currentZone === 'lobby') return this.lobbyInteractables;
    const activeList: Interactable[] = [...this.islandInteractables];
    for (const z of this.zoneStreams) {
      if (z.active && z.interactables.length > 0) {
        activeList.push(...z.interactables);
      }
    }
    return activeList;
  }

  public getStreamingStats(): StreamingStats {
    let builtZones = 0;
    let activeZones = 0;
    for (const z of this.zoneStreams) {
      if (z.built) builtZones++;
      if (z.active) activeZones++;
    }
    let activeChunks = 0;
    for (const c of this.spatialChunks) {
      if (c.group.visible) activeChunks++;
    }
    for (const m of this.windMeadowChunks) {
      if (m.system.group.visible) activeChunks++;
    }
    return {
      builtZones,
      activeZones,
      totalZones: this.zoneStreams.length,
      activeChunks,
      totalChunks: this.spatialChunks.length + this.windMeadowChunks.length,
    };
  }

  /**
   * 依玩家目前座標進行分區延遲載入（Lazy Streaming）與距離休眠剔除（Distance Culling）：
   * - 一般步行移動時每幀最多建構 1 個新區域，避免畫面頓挫；
   * - 進入島嶼或使用「同行」傳送時（forceImmediate = true）立刻建構目的地視野內所有區域；
   * - 超出視距的城鎮、森林區塊、草花區塊與遠處卡片光點自動隱藏並暫停動畫／碰撞計算。
   */
  public updateStreaming(playerPos: THREE.Vector3, forceImmediate = false): void {
    if (this.currentZone !== 'island' || this.currentInteriorId !== null) return;
    if (!forceImmediate && this.lastStreamCheckPos.distanceToSquared(playerPos) < 9.0) {
      return; // 每移動 3m 以上才重算串流可見度，節省 CPU
    }
    this.lastStreamCheckPos.copy(playerPos);

    let builtThisFrame = 0;
    for (const entry of this.zoneStreams) {
      const dist = Math.hypot(playerPos.x - entry.cx, playerPos.z - entry.cz);
      if (!entry.built) {
        if (dist <= entry.loadRadius && (forceImmediate || builtThisFrame < 1)) {
          entry.group = entry.builder(entry);
          this.islandGroup.add(entry.group);
          entry.built = true;
          entry.active = true;
          builtThisFrame++;
        }
      } else if (entry.group) {
        // 遲滯區間（loadRadius 與 visibleRadius 差 12m）避免邊界來回走動時閃爍
        const shouldBeActive = entry.active ? dist <= entry.visibleRadius : dist <= entry.loadRadius;
        if (entry.active !== shouldBeActive) {
          entry.active = shouldBeActive;
          entry.group.visible = shouldBeActive;
        }
      }
    }

    // 空間森林區塊距離剔除
    for (const chunk of this.spatialChunks) {
      const d = Math.hypot(playerPos.x - chunk.cx, playerPos.z - chunk.cz);
      chunk.group.visible = d <= chunk.cullRadius;
    }

    // 空間搖曳草花區塊距離剔除
    for (const meadow of this.windMeadowChunks) {
      const d = Math.hypot(playerPos.x - meadow.cx, playerPos.z - meadow.cz);
      meadow.system.group.visible = d <= meadow.cullRadius;
    }

    // 遠處未拾取卡片光點距離剔除（隱藏後自動跳過旋轉動畫）
    for (const item of this.islandInteractables) {
      if (item.kind === 'pickup' && item.mesh) {
        if (item.collected) {
          item.mesh.visible = false;
        } else {
          const d = Math.hypot(playerPos.x - item.position.x, playerPos.z - item.position.z);
          item.mesh.visible = d <= 360;
        }
      }
    }
  }

  public syncCollectedPickups(collectedIds: string[]): void {
    const set = new Set(collectedIds);
    for (const item of this.islandInteractables) {
      if (item.kind === 'pickup') {
        const done = set.has(item.id);
        item.collected = done;
        if (item.mesh) item.mesh.visible = !done;
      }
    }
  }

  public getLocationAt(x: number, z: number): LocationDef | null {
    if (this.currentZone === 'lobby' || this.currentInteriorId !== null) return null;
    return findLocationAt(x, z);
  }

  public getRegionNameAt(x: number, z: number): string {
    if (this.currentInteriorId) {
      return this.interiorCells.get(this.currentInteriorId)?.title ?? '室內空間';
    }
    if (this.currentZone === 'lobby') return '起始之塔・接待大廳（伊妲 Eta）';
    const loc = findLocationAt(x, z);
    if (loc) return `${loc.name}（${loc.enName.split(',')[0]}）`;
    return '貪婪之島・野外草原';
  }

  /**
   * 依資料驅動的 LocationDef 視覺主題柔和過渡天空、霧氣與日光強度，並讓陰影視錐跟隨玩家位置。
   */
  public updateAtmosphere(activeLoc: LocationDef | null, playerPos: THREE.Vector3, dt: number): void {
    this.lastPlayerPos.copy(playerPos);
    if (this.currentInteriorId !== null) {
      this.sunLight.position.set(12, 22, 10);
      this.sunLight.target.position.set(0, 0, 0);
      this.sunLight.target.updateMatrixWorld();
      return;
    }
    if (this.currentZone === 'island') {
      if (activeLoc) {
        this.targetSkyColor.setHex(activeLoc.visualTheme.skyHex).multiplyScalar(0.76);
        this.targetFogColor.setHex(activeLoc.visualTheme.fogHex);
        this.targetFogDensity = Math.min(0.0032, activeLoc.visualTheme.fogDensity * 0.85);
        this.targetSunIntensity = activeLoc.visualTheme.sunIntensity * 1.16;
      } else {
        this.targetSkyColor.setHex(0x2b76cf);
        this.targetFogColor.setHex(0xd4effc);
        this.targetFogDensity = 0.00095;
        this.targetSunIntensity = 1.72;
      }

      const blend = Math.min(1, dt * 1.8);
      if (this.scene.background instanceof THREE.Color) {
        this.scene.background.lerp(this.targetFogColor, blend);
      }
      if (this.scene.fog instanceof THREE.FogExp2) {
        this.scene.fog.color.lerp(this.targetFogColor, blend);
        this.scene.fog.density = THREE.MathUtils.lerp(this.scene.fog.density, this.targetFogDensity, blend);
      }
      this.animeSky?.lerpThemeColors(this.targetSkyColor, this.targetFogColor, blend);
      this.sunLight.intensity = THREE.MathUtils.lerp(this.sunLight.intensity, this.targetSunIntensity, blend);

      // 讓陰影攝影機對齊 2m 格點跟隨玩家，畫質提升 2.5 倍且避免陰影抖動
      const snapX = Math.round(playerPos.x * 0.5) * 2;
      const snapZ = Math.round(playerPos.z * 0.5) * 2;
      this.sunLight.position.set(snapX + 55, 95, snapZ + 50);
      this.sunLight.target.position.set(snapX, 0, snapZ);
      this.sunLight.target.updateMatrixWorld();
    } else {
      this.sunLight.position.set(25, 45, 25);
      this.sunLight.target.position.set(0, 0, 0);
      this.sunLight.target.updateMatrixWorld();
    }
  }

  public resolveCollision(pos: THREE.Vector3, playerRadius = 0.65): void {
    if (this.currentInteriorId) {
      const cell = this.interiorCells.get(this.currentInteriorId);
      if (!cell) return;
      pos.x = THREE.MathUtils.clamp(pos.x, cell.bounds.minX + playerRadius, cell.bounds.maxX - playerRadius);
      pos.z = THREE.MathUtils.clamp(pos.z, cell.bounds.minZ + playerRadius, cell.bounds.maxZ - playerRadius);
      for (const c of cell.circleColliders) {
        const dx = pos.x - c.x;
        const dz = pos.z - c.z;
        const d = Math.hypot(dx, dz);
        const minD = c.r + playerRadius;
        if (d < minD) {
          if (d > 0.0001) {
            pos.x = c.x + (dx / d) * minD;
            pos.z = c.z + (dz / d) * minD;
          } else {
            pos.z = c.z + minD;
          }
        }
      }
      for (const b of cell.boxColliders) {
        const closestX = THREE.MathUtils.clamp(pos.x, b.minX, b.maxX);
        const closestZ = THREE.MathUtils.clamp(pos.z, b.minZ, b.maxZ);
        const dx = pos.x - closestX;
        const dz = pos.z - closestZ;
        const dSq = dx * dx + dz * dz;
        if (dSq < playerRadius * playerRadius) {
          const d = Math.sqrt(dSq);
          if (d > 0.0001) {
            pos.x = closestX + (dx / d) * playerRadius;
            pos.z = closestZ + (dz / d) * playerRadius;
          } else {
            pos.z = b.maxZ + playerRadius;
          }
        }
      }
      return;
    }

    if (this.currentZone === 'lobby') {
      const maxR = 16.0;
      const dist = Math.hypot(pos.x, pos.z);
      if (dist > maxR) {
        pos.x = (pos.x / dist) * maxR;
        pos.z = (pos.z / dist) * maxR;
      }
      for (const c of this.lobbyColliders) {
        const dx = pos.x - c.x;
        const dz = pos.z - c.z;
        const d = Math.hypot(dx, dz);
        const minD = c.r + playerRadius;
        if (d < minD) {
          if (d > 0.0001) {
            pos.x = c.x + (dx / d) * minD;
            pos.z = c.z + (dz / d) * minD;
          } else {
            pos.z = c.z + minD;
          }
        }
      }
      return;
    }

    pos.x = THREE.MathUtils.clamp(pos.x, GI_MAP_BOUNDS.minX + 15, GI_MAP_BOUNDS.maxX - 15);
    pos.z = THREE.MathUtils.clamp(pos.z, GI_MAP_BOUNDS.minZ + 15, GI_MAP_BOUNDS.maxZ - 15);

    const checkCircle = (c: CircleCollider) => {
      const dx = pos.x - c.x;
      const dz = pos.z - c.z;
      const d = Math.hypot(dx, dz);
      const minD = c.r + playerRadius;
      if (d < minD) {
        if (d > 0.0001) {
          pos.x = c.x + (dx / d) * minD;
          pos.z = c.z + (dz / d) * minD;
        } else {
          pos.z = c.z + minD;
        }
      }
    };

    const checkBox = (b: BoxCollider) => {
      const closestX = THREE.MathUtils.clamp(pos.x, b.minX, b.maxX);
      const closestZ = THREE.MathUtils.clamp(pos.z, b.minZ, b.maxZ);
      const dx = pos.x - closestX;
      const dz = pos.z - closestZ;
      const dSq = dx * dx + dz * dz;
      if (dSq < playerRadius * playerRadius) {
        const d = Math.sqrt(dSq);
        if (d > 0.0001) {
          pos.x = closestX + (dx / d) * playerRadius;
          pos.z = closestZ + (dz / d) * playerRadius;
        } else {
          // 若中心完全落入方盒內，依最近邊推出（絕不往單一方向亂推導致穿牆）
          const dLeft = Math.abs(pos.x - b.minX);
          const dRight = Math.abs(b.maxX - pos.x);
          const dTop = Math.abs(pos.z - b.minZ);
          const dBot = Math.abs(b.maxZ - pos.z);
          const m = Math.min(dLeft, dRight, dTop, dBot);
          if (m === dLeft) pos.x = b.minX - playerRadius;
          else if (m === dRight) pos.x = b.maxX + playerRadius;
          else if (m === dTop) pos.z = b.minZ - playerRadius;
          else pos.z = b.maxZ + playerRadius;
        }
      }
    };

    // 3 輪疊代碰撞推離（徹底解決牆角、兩棟建築交界與樹幹／巨石穿模問題）
    for (let iter = 0; iter < 3; iter++) {
      for (const c of this.islandCircleColliders) checkCircle(c);
      for (const b of this.islandBoxColliders) checkBox(b);

      for (const z of this.zoneStreams) {
        if (!z.active) continue;
        for (const c of z.circleColliders) checkCircle(c);
        for (const b of z.boxColliders) checkBox(b);
      }

      for (const chunk of this.spatialChunks) {
        if (!chunk.group.visible) continue;
        for (const c of chunk.colliders) checkCircle(c);
      }

      // 內陸清澈藍湖岸線推離（讓角色沿卵石湖岸行走，腳不陷入湖水中）
      for (const lk of GI_LAKES) {
        const erx = lk.rx + playerRadius * 0.55;
        const erz = lk.rz + playerRadius * 0.55;
        const nx = (pos.x - lk.x) / erx;
        const nz = (pos.z - lk.z) / erz;
        const nd = Math.hypot(nx, nz);
        if (nd < 1.0) {
          if (nd > 0.0001) {
            pos.x = lk.x + (nx / nd) * erx;
            pos.z = lk.z + (nz / nd) * erz;
          } else {
            pos.z = lk.z + erz;
          }
        }
      }
    }
  }

  /**
   * 查詢角色在 (x, z) 處實際可站立的地面高度（涵蓋道路、抬升廣場、木棧道、王城階梯、山坡與海岸沙灘／水面），
   * 確保角色雙腳永遠穩穩踏在地形表面，不再被小坡、台階或水面吃掉。
   */
  public getGroundHeightAt(
    x: number,
    z: number,
    currentY = 0
  ): { groundY: number; isWater: boolean } {
    if (this.currentInteriorId !== null) {
      return { groundY: 0, isWater: false };
    }
    if (this.currentZone === 'lobby') {
      // 接待大廳中央傳送光陣雙層圓階 (0, -4.5)
      const d = Math.hypot(x, z + 4.5);
      if (d < 3.4) return { groundY: 0.52, isWater: false };
      if (d < 4.3) return { groundY: 0.25, isWater: false };
      return { groundY: 0, isWater: false };
    }

    const targets: THREE.Object3D[] = [...this.walkableTerrainMeshes];
    for (const zEntry of this.zoneStreams) {
      if (zEntry.active && zEntry.group) {
        const dist = Math.hypot(x - zEntry.cx, z - zEntry.cz);
        if (dist <= zEntry.visibleRadius) {
          targets.push(zEntry.group);
        }
      }
    }

    const approxBaseY = this.v2Terrain ? this.v2Terrain.sampleHeight(x, z) : 0;
    const rayStartY = Math.max(currentY, approxBaseY, 0) + 3.0;
    this._groundRayOrigin.set(x, rayStartY, z);
    this._groundRaycaster.set(this._groundRayOrigin, this._groundRayDown);
    this._groundRaycaster.near = 0.05;
    this._groundRaycaster.far = 16.0;

    const hits = this._groundRaycaster.intersectObjects(targets, true);
    const maxStepUp = currentY + 1.45;

    const isHiddenOrNonWalkable = (obj: THREE.Object3D): boolean => {
      let cur: THREE.Object3D | null = obj;
      while (cur) {
        if (!cur.visible || cur.userData?.nonWalkable) return true;
        cur = cur.parent;
      }
      return false;
    };

    for (const hit of hits) {
      const obj = hit.object;
      if (!(obj as THREE.Mesh).isMesh) continue;
      if (isHiddenOrNonWalkable(obj)) continue;
      if (hit.point.y > maxStepUp) continue;

      let slopeLift = 0;
      if (hit.face) {
        this._groundNormalMatrix.getNormalMatrix(obj.matrixWorld);
        this._groundWorldNormal.copy(hit.face.normal).applyMatrix3(this._groundNormalMatrix).normalize();
        if (this._groundWorldNormal.y < 0.48) continue;
        // 斜坡補償：微幅托高避免上坡側鞋尖陷入坡面
        if (this._groundWorldNormal.y < 0.98) {
          slopeLift = Math.min(0.14, (1 - this._groundWorldNormal.y) * 0.45);
        }
      }

      const isWater = Boolean(obj.userData?.isWater);
      return { groundY: hit.point.y + slopeLift, isWater };
    }

    return { groundY: approxBaseY, isWater: false };
  }

  /**
   * 計算第三人稱防遮擋安全鏡頭距離：
   * 結合解析圓柱／AABB 碰撞體射線裁切 + 精選建築遮擋物 Raycast，
   * 確保旋轉視角時近處建築、石柱或高塔不會蓋住角色與畫面。
   */
  public computeSafeCameraDistance(
    pivot: THREE.Vector3,
    desiredCamPos: THREE.Vector3,
    maxDist: number
  ): number {
    this._camRayDir.subVectors(desiredCamPos, pivot);
    const actualDist = this._camRayDir.length();
    if (actualDist < 0.001) return maxDist;
    this._camRayDir.divideScalar(actualDist);

    const minDist = 2.4;
    const buffer = 0.65;
    let bestDist = Math.min(maxDist, actualDist);

    // 室內場景鏡頭防穿牆裁切（對室內四面牆壁做 Raycast）
    if (this.currentInteriorId) {
      const cell = this.interiorCells.get(this.currentInteriorId);
      if (cell && cell.cameraOccluders.length > 0) {
        this._camRaycaster.set(pivot, this._camRayDir);
        this._camRaycaster.near = 0.45;
        this._camRaycaster.far = bestDist;
        const hits = this._camRaycaster.intersectObjects(cell.cameraOccluders, true);
        if (hits.length > 0 && hits[0].distance < bestDist) {
          return THREE.MathUtils.clamp(hits[0].distance - buffer, minDist, maxDist);
        }
      }
      return maxDist;
    }

    // 1. 解析式射線裁切（僅針對目前啟用區域的圓柱與方盒碰撞體，大幅降低遠距無效計算）
    const rx = this._camRayDir.x;
    const rz = this._camRayDir.z;
    const horizLenSq = rx * rx + rz * rz;
    const testCircle = (c: CircleCollider) => {
      // 忽略矮小物件（長椅、酒桶、花圃、營火、路燈、NPC 等 c.r < 2.2），避免高空俯視鏡頭被矮物猛然拉近彈跳
      if (c.r < 2.2) return;
      const ocX = pivot.x - c.x;
      const ocZ = pivot.z - c.z;
      const b = ocX * rx + ocZ * rz;
      const radius = c.r + 0.35;
      const cc = ocX * ocX + ocZ * ocZ - radius * radius;
      const disc = b * b - horizLenSq * cc;
      if (disc >= 0) {
        const t = (-b - Math.sqrt(disc)) / horizLenSq;
        if (t > 0.45 && t < bestDist) bestDist = t;
      }
    };

    if (horizLenSq > 0.0001) {
      const baseCircles = this.currentZone === 'lobby' ? this.lobbyColliders : this.islandCircleColliders;
      for (const c of baseCircles) testCircle(c);
      if (this.currentZone === 'island') {
        for (const z of this.zoneStreams) {
          if (!z.active) continue;
          for (const c of z.circleColliders) testCircle(c);
        }
      }
    }

    if (this.currentZone === 'island') {
      const testBox = (box: BoxCollider) => {
        // 只對寬大型建築障礙（長寬皆 >= 3.2m）做 2D AABB 鏡頭縮距，其餘細部遮擋交由 3D Raycast 精準處理
        if (box.maxX - box.minX < 3.2 || box.maxZ - box.minZ < 3.2) return;
        const t = this.intersectRayBoxXZ(pivot.x, pivot.z, rx, rz, box, 0.35);
        if (t !== null && t > 0.45 && t < bestDist) bestDist = t;
      };
      for (const box of this.islandBoxColliders) testBox(box);
      for (const z of this.zoneStreams) {
        if (!z.active) continue;
        for (const box of z.boxColliders) testBox(box);
      }
    }

    // 2. Three.js Raycaster 針對啟用區域的建築遮擋物精確裁切
    if (this.currentZone === 'lobby') {
      if (this.lobbyCameraOccluders.length > 0) {
        this._camRaycaster.set(pivot, this._camRayDir);
        this._camRaycaster.near = 0.45;
        this._camRaycaster.far = bestDist;
        const hits = this._camRaycaster.intersectObjects(this.lobbyCameraOccluders, true);
        if (hits.length > 0 && hits[0].distance < bestDist) bestDist = hits[0].distance;
      }
    } else {
      this._camRaycaster.set(pivot, this._camRayDir);
      this._camRaycaster.near = 0.45;
      this._camRaycaster.far = bestDist;
      if (this.islandCameraOccluders.length > 0) {
        const hits = this._camRaycaster.intersectObjects(this.islandCameraOccluders, true);
        if (hits.length > 0 && hits[0].distance < bestDist) bestDist = hits[0].distance;
      }
      for (const z of this.zoneStreams) {
        if (!z.active || z.cameraOccluders.length === 0) continue;
        this._camRaycaster.far = bestDist;
        const hits = this._camRaycaster.intersectObjects(z.cameraOccluders, true);
        if (hits.length > 0 && hits[0].distance < bestDist) bestDist = hits[0].distance;
      }
    }

    if (bestDist < actualDist) {
      return THREE.MathUtils.clamp(bestDist - buffer, minDist, maxDist);
    }
    return maxDist;
  }

  private intersectRayBoxXZ(
    ox: number,
    oz: number,
    dx: number,
    dz: number,
    box: BoxCollider,
    pad: number
  ): number | null {
    const minX = box.minX - pad;
    const maxX = box.maxX + pad;
    const minZ = box.minZ - pad;
    const maxZ = box.maxZ + pad;

    let tmin = -Infinity;
    let tmax = Infinity;

    if (Math.abs(dx) > 1e-6) {
      let tx1 = (minX - ox) / dx;
      let tx2 = (maxX - ox) / dx;
      if (tx1 > tx2) {
        const tmp = tx1;
        tx1 = tx2;
        tx2 = tmp;
      }
      tmin = Math.max(tmin, tx1);
      tmax = Math.min(tmax, tx2);
    } else if (ox < minX || ox > maxX) {
      return null;
    }

    if (Math.abs(dz) > 1e-6) {
      let tz1 = (minZ - oz) / dz;
      let tz2 = (maxZ - oz) / dz;
      if (tz1 > tz2) {
        const tmp = tz1;
        tz1 = tz2;
        tz2 = tmp;
      }
      tmin = Math.max(tmin, tz1);
      tmax = Math.min(tmax, tz2);
    } else if (oz < minZ || oz > maxZ) {
      return null;
    }

    if (tmax < Math.max(tmin, 0)) return null;
    return tmin > 0 ? tmin : tmax;
  }

  public update(elapsed: number, dt: number): void {
    if (this.currentInteriorId) {
      const cell = this.interiorCells.get(this.currentInteriorId);
      if (cell) {
        for (const fn of cell.animated) fn(elapsed, dt);
      }
      return;
    }
    for (const fn of this.animatedObjects) {
      fn(elapsed, dt);
    }
    if (this.ambientParticles) {
      this.ambientParticles.rotation.y = elapsed * 0.04;
    }
    if (this.currentZone === 'island') {
      this.animeSky?.update(elapsed, this.lastPlayerPos);
      this.breezeParticles?.update(elapsed, this.lastPlayerPos);
      // 僅更新視野內可見的草花區塊與啟用城鎮動畫（遠處休眠區域零 CPU 消耗）
      for (const m of this.windMeadowChunks) {
        if (m.system.group.visible) m.system.update(elapsed);
      }
      for (const z of this.zoneStreams) {
        if (!z.active) continue;
        for (const fn of z.animated) fn(elapsed, dt);
      }
    }
  }

  // =========================================================================
  // 1. 起始之塔・接待大廳（伊妲 Eta）
  // =========================================================================
  private buildLobby(): void {
    const outerFloor = new THREE.Mesh(
      new THREE.CylinderGeometry(19.5, 20.8, 1.8, 48),
      new THREE.MeshStandardMaterial({ color: 0xc8c0b0, roughness: 0.75 })
    );
    outerFloor.position.y = -0.9;
    outerFloor.receiveShadow = true;
    this.lobbyGroup.add(outerFloor);

    const lobbyFloorSideMat = new THREE.MeshStandardMaterial({ color: 0xc8c0b0, roughness: 0.72 });
    const lobbyFloorTopMat = new THREE.MeshStandardMaterial({
      map: createLobbyMarbleTexture(),
      color: 0xffffff,
      roughness: 0.54,
      metalness: 0.08,
    });
    const innerFloor = new THREE.Mesh(new THREE.CylinderGeometry(17.4, 17.8, 0.16, 48), [
      lobbyFloorSideMat,
      lobbyFloorTopMat,
      lobbyFloorSideMat,
    ]);
    innerFloor.position.y = -0.06;
    innerFloor.receiveShadow = true;
    this.lobbyGroup.add(innerFloor);

    const ringMat = new THREE.MeshStandardMaterial({
      color: 0xe8c35c,
      roughness: 0.32,
      metalness: 0.62,
      side: THREE.DoubleSide,
    });
    for (const r of [4.25, 16.5]) {
      const ring = new THREE.Mesh(new THREE.RingGeometry(r - 0.12, r + 0.12, 64), ringMat);
      ring.rotation.x = -Math.PI / 2;
      ring.position.y = 0.03;
      this.lobbyGroup.add(ring);
    }

    const pillarMat = new THREE.MeshStandardMaterial({ color: 0xebe5d8, roughness: 0.62 });
    const trimMat = new THREE.MeshStandardMaterial({ color: 0xd4af37, roughness: 0.35, metalness: 0.5 });
    const brazierBronzeMat = new THREE.MeshStandardMaterial({ color: 0x3b3d4a, roughness: 0.48, metalness: 0.62 });
    const emberMat = new THREE.MeshStandardMaterial({
      color: 0x6b2210,
      emissive: 0xe64d14,
      emissiveIntensity: 0.85,
      roughness: 0.75,
    });
    const outerFireMat = new THREE.MeshBasicMaterial({ color: 0xff8c2b, transparent: true, opacity: 0.92 });
    const innerFireMat = new THREE.MeshBasicMaterial({ color: 0xfff0a6 });

    for (let i = 0; i < 12; i++) {
      const ang = ((i + 0.5) / 12) * Math.PI * 2;
      const px = Math.cos(ang) * 16.8;
      const pz = Math.sin(ang) * 16.8;

      const base = new THREE.Mesh(new THREE.BoxGeometry(2.1, 0.8, 2.1), pillarMat);
      base.position.set(px, 0.4, pz);
      this.lobbyGroup.add(base);

      const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.66, 0.78, 9.2, 16), pillarMat);
      shaft.position.set(px, 5.2, pz);
      shaft.castShadow = true;
      this.lobbyGroup.add(shaft);
      this.lobbyCameraOccluders.push(shaft);

      const goldBand = new THREE.Mesh(new THREE.TorusGeometry(0.75, 0.08, 8, 20), trimMat);
      goldBand.rotation.x = Math.PI / 2;
      goldBand.position.set(px, 9.4, pz);
      this.lobbyGroup.add(goldBand);

      const cap = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.7, 2.2), pillarMat);
      cap.position.set(px, 10.1, pz);
      this.lobbyGroup.add(cap);

      if (i % 2 === 0) {
        const bx = Math.cos(ang) * 14.3;
        const bz = Math.sin(ang) * 14.3;
        const brazierGroup = new THREE.Group();
        brazierGroup.position.set(bx, 0, bz);

        const pedestal = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.42, 0.84, 10), brazierBronzeMat);
        pedestal.position.y = 0.42;
        pedestal.castShadow = true;
        brazierGroup.add(pedestal);

        const basin = new THREE.Mesh(new THREE.CylinderGeometry(0.58, 0.28, 0.42, 12), brazierBronzeMat);
        basin.position.y = 1.02;
        basin.castShadow = true;
        brazierGroup.add(basin);

        const basinRim = new THREE.Mesh(new THREE.TorusGeometry(0.56, 0.055, 8, 18), trimMat);
        basinRim.rotation.x = Math.PI / 2;
        basinRim.position.y = 1.23;
        brazierGroup.add(basinRim);

        const embers = new THREE.Mesh(new THREE.SphereGeometry(0.38, 10, 6), emberMat);
        embers.scale.set(1, 0.42, 1);
        embers.position.y = 1.24;
        brazierGroup.add(embers);

        const outerFlame = new THREE.Mesh(new THREE.ConeGeometry(0.28, 0.72, 7), outerFireMat);
        outerFlame.position.y = 1.62;
        brazierGroup.add(outerFlame);

        const innerFlame = new THREE.Mesh(new THREE.ConeGeometry(0.15, 0.46, 6), innerFireMat);
        innerFlame.position.y = 1.54;
        brazierGroup.add(innerFlame);

        this.lobbyGroup.add(brazierGroup);
        this.animatedObjects.push((t) => {
          outerFlame.rotation.y = t * 2.4 + i;
          outerFlame.scale.set(
            0.94 + Math.sin(t * 7.5 + i) * 0.1,
            0.88 + Math.sin(t * 9.2 + i * 1.7) * 0.2,
            0.94 + Math.cos(t * 6.8 + i) * 0.1
          );
          innerFlame.rotation.y = -t * 3.1 + i;
          innerFlame.scale.setScalar(0.9 + Math.cos(t * 10.5 + i) * 0.14);
        });
      }
    }

    const crownRing = new THREE.Mesh(new THREE.TorusGeometry(16.8, 0.55, 12, 64), pillarMat);
    crownRing.rotation.x = Math.PI / 2;
    crownRing.position.y = 10.6;
    this.lobbyGroup.add(crownRing);

    const portalGroup = new THREE.Group();
    portalGroup.position.set(0, 0, -4.5);

    const step1 = new THREE.Mesh(
      new THREE.CylinderGeometry(3.9, 4.3, 0.25, 32),
      new THREE.MeshStandardMaterial({ color: 0x263554, roughness: 0.45, metalness: 0.3 })
    );
    step1.position.y = 0.125;
    portalGroup.add(step1);

    const step2 = new THREE.Mesh(
      new THREE.CylinderGeometry(3.1, 3.4, 0.28, 32),
      new THREE.MeshStandardMaterial({ color: 0x1e2c47, roughness: 0.35, metalness: 0.45 })
    );
    step2.position.y = 0.38;
    portalGroup.add(step2);

    const beam = new THREE.Mesh(
      new THREE.CylinderGeometry(2.35, 2.35, 13, 24, 1, true),
      new THREE.MeshBasicMaterial({
        color: 0x38e4c5,
        transparent: true,
        opacity: 0.24,
        side: THREE.DoubleSide,
      })
    );
    beam.position.y = 6.8;
    portalGroup.add(beam);

    const torus1 = new THREE.Mesh(
      new THREE.TorusGeometry(2.45, 0.09, 12, 48),
      new THREE.MeshBasicMaterial({ color: 0xffe58f })
    );
    torus1.rotation.x = Math.PI / 2;
    torus1.position.y = 0.75;
    portalGroup.add(torus1);

    const torus2 = new THREE.Mesh(
      new THREE.TorusGeometry(1.8, 0.06, 12, 48),
      new THREE.MeshBasicMaterial({ color: 0x62f5dc })
    );
    torus2.rotation.x = Math.PI / 2;
    torus2.position.y = 2.4;
    portalGroup.add(torus2);

    this.animatedObjects.push((t) => {
      torus1.position.y = 0.75 + Math.sin(t * 2.2) * 0.25;
      torus2.position.y = 2.4 + Math.cos(t * 2.8) * 0.35;
      torus2.rotation.z = t * 1.1;
      beam.rotation.y = t * 0.5;
    });

    this.lobbyGroup.add(portalGroup);
    this.lobbyInteractables.push({
      id: 'lobby_portal',
      label: '踏入傳送光陣 → 降臨貪婪之島（Shiso Tree）',
      position: new THREE.Vector3(0, 0, -4.5),
      radius: 3.6,
      kind: 'portal',
    });

    // 伊妲精雕胡桃木接待桌＋3D 翻開版「BOOK」集卡冊＋翡翠銀行燈
    const deskGroup = new THREE.Group();
    deskGroup.position.set(4.5, 0, 2.5);
    deskGroup.rotation.y = -0.5;

    const walnutMat = new THREE.MeshStandardMaterial({ color: 0x6b472d, roughness: 0.62 });
    const darkWalnutMat = new THREE.MeshStandardMaterial({ color: 0x4b311e, roughness: 0.7 });

    const deskPlinth = new THREE.Mesh(new THREE.BoxGeometry(3.48, 0.14, 1.2), darkWalnutMat);
    deskPlinth.position.y = 0.07;
    deskPlinth.receiveShadow = true;
    deskGroup.add(deskPlinth);

    const deskBody = new THREE.Mesh(new THREE.BoxGeometry(3.32, 0.86, 1.06), walnutMat);
    deskBody.position.y = 0.56;
    deskBody.castShadow = true;
    deskBody.receiveShadow = true;
    deskGroup.add(deskBody);

    const deskTop = new THREE.Mesh(new THREE.BoxGeometry(3.58, 0.1, 1.28), darkWalnutMat);
    deskTop.position.y = 1.04;
    deskTop.castShadow = true;
    deskTop.receiveShadow = true;
    deskGroup.add(deskTop);

    // 桌前立體木雕嵌板與黃銅金線飾條
    for (const px of [-1.05, 0, 1.05]) {
      const panel = new THREE.Mesh(new THREE.BoxGeometry(0.86, 0.56, 0.05), darkWalnutMat);
      panel.position.set(px, 0.56, 0.54);
      deskGroup.add(panel);

      const frameBarTop = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.035, 0.06), trimMat);
      frameBarTop.position.set(px, 0.85, 0.545);
      deskGroup.add(frameBarTop);
    }

    const openBook = createOpenBookMesh();
    openBook.scale.setScalar(1.38);
    openBook.position.set(-0.35, 1.09, 0.04);
    openBook.rotation.y = 0.1;
    deskGroup.add(openBook);

    // 接待桌角落翡翠綠銀行燈
    const lampBase = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.18, 0.05, 12), trimMat);
    lampBase.position.set(1.18, 1.115, -0.18);
    deskGroup.add(lampBase);
    const lampStem = new THREE.Mesh(new THREE.CylinderGeometry(0.028, 0.035, 0.36, 8), trimMat);
    lampStem.position.set(1.18, 1.32, -0.18);
    deskGroup.add(lampStem);
    const lampShade = new THREE.Mesh(
      new THREE.CylinderGeometry(0.08, 0.15, 0.26, 12, 1, false, 0, Math.PI),
      new THREE.MeshStandardMaterial({
        color: 0x1da88a,
        emissive: 0x167d67,
        emissiveIntensity: 0.72,
        roughness: 0.28,
      })
    );
    lampShade.rotation.z = Math.PI / 2;
    lampShade.position.set(1.18, 1.5, -0.12);
    deskGroup.add(lampShade);

    this.lobbyGroup.add(deskGroup);
    this.lobbyColliders.push({ x: 4.5, z: 2.5, r: 1.65 });

    const eta = this.createNpcMesh(0x27b99b, 0xffe0bd, 0x3b2f4a);
    eta.position.set(5.1, 0, 1.5);
    eta.rotation.y = -0.72;
    this.lobbyGroup.add(eta);
    this.lobbyInteractables.push({
      id: 'npc_elena',
      label: '與起點引導員「伊妲（Eta）」對話',
      position: new THREE.Vector3(5.1, 0, 1.5),
      radius: 3.4,
      kind: 'npc',
    });

    const pCount = 180;
    const positions = new Float32Array(pCount * 3);
    for (let i = 0; i < pCount; i++) {
      const r = 3 + Math.random() * 15;
      const a = Math.random() * Math.PI * 2;
      positions[i * 3] = Math.cos(a) * r;
      positions[i * 3 + 1] = 0.6 + Math.random() * 9;
      positions[i * 3 + 2] = Math.sin(a) * r;
    }
    const pGeo = new THREE.BufferGeometry();
    pGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    this.ambientParticles = new THREE.Points(
      pGeo,
      new THREE.PointsMaterial({ color: 0xffe58f, size: 0.16, transparent: true, opacity: 0.75 })
    );
    this.lobbyGroup.add(this.ambientParticles);
  }

  // =========================================================================
  // 2. 貪婪之島本島（大尺度地貌 + 五大優先區深度強化 + InstancedMesh/LOD）
  // =========================================================================
  private buildIsland(): void {
    // 1. 動畫漸層天空球＋26 朵飄動立體積雲＋島嶼陽光浮塵微風粒子
    this.animeSky = createAnimeSkySystem();
    this.islandGroup.add(this.animeSky.group);

    this.breezeParticles = createIslandBreezeParticles();
    this.islandGroup.add(this.breezeParticles.points);

    // 2. 高解析手繪地表、岩崖、沙灘、石板鄉道與波光海面材質系統
    this.surfaceMats = createIslandSurfaceMaterials();

    // 廣闊波光海洋（對應 5× 全島尺度）
    const sea = new THREE.Mesh(new THREE.PlaneGeometry(4600, 4600), this.surfaceMats.seaMat);
    sea.rotation.x = -Math.PI / 2;
    sea.position.y = -2.8;
    sea.receiveShadow = true;
    sea.userData.isWater = true;
    this.islandGroup.add(sea);
    this.walkableTerrainMeshes.push(sea);

    // 陸塊本體：側面為手繪層狀岩崖＋青苔垂緣，頂面為世界空間無縫手繪草原（含大尺度日光草色變化）
    const landMaterials = [
      this.surfaceMats.cliffWallMat,
      this.surfaceMats.meadowTopMat,
      this.surfaceMats.cliffWallMat,
    ];
    const foamMat = new THREE.MeshBasicMaterial({ color: 0xe6f8ff, transparent: true, opacity: 0.42 });
    const unitGrassGeo = new THREE.CylinderGeometry(1, 1.05, 5.6, 36);
    const unitSandGeo = new THREE.CylinderGeometry(1, 1.09, 2.2, 36);
    const unitFoamGeo = new THREE.RingGeometry(0.975, 1.045, 40);

    if (isV2Map()) {
      // === 新版地圖 v2：可步行 3D 雕塑地形（北崎嶇半島、中央平原與湖泊、西大片內灣、南狹長地峽、東南小島＋跨水橋梁＋貼地手繪道路帶） ===
      this.v2Terrain = createSculptedTerrainV2(this.surfaceMats.roadMat);
      this.islandGroup.add(this.v2Terrain.group);
      this.walkableTerrainMeshes.push(this.v2Terrain.landMesh, ...this.v2Terrain.bridgeDeckMeshes);
      this.islandCircleColliders.push(...this.v2Terrain.bridgeColliders);
      this.islandCameraOccluders.push(...this.v2Terrain.cameraOccluders);

      this.animatedObjects.push((t) => {
        this.v2Terrain?.update(t);
        this.surfaceMats.seaTex.offset.set(t * 0.012, t * 0.008);
        this.surfaceMats.lakeTex.offset.set(-t * 0.016, t * 0.012);
      });

      // V2 內陸清澈藍湖（自然嵌入下凹湖盆）
      const unitLakeGeo = new THREE.CylinderGeometry(1, 1, 0.14, 28);
      for (const lk of V2_LAKES) {
        const lakeMesh = new THREE.Mesh(unitLakeGeo, this.surfaceMats.lakeMat);
        lakeMesh.scale.set(lk.rx, 1, lk.rz);
        lakeMesh.position.set(lk.x, lk.waterY, lk.z);
        lakeMesh.receiveShadow = true;
        lakeMesh.userData.isWater = true;
        this.islandGroup.add(lakeMesh);
        this.walkableTerrainMeshes.push(lakeMesh);
      }

      this.registerZoneStreams();
      this.buildInstancedForestAndRocks();
    } else {
      // === 舊版地圖（Legacy）：保留作為前後對照基準 ===
      const fallbackLobesGroup = new THREE.Group();
      const fallbackLobeMeshes: THREE.Object3D[] = [];
      for (const lobe of GI_LAND_LOBES) {
        const gMesh = new THREE.Mesh(unitGrassGeo, landMaterials);
        gMesh.scale.set(lobe.rx, 1, lobe.rz);
        gMesh.position.set(lobe.x, -2.8, lobe.z);
        if (lobe.rot) gMesh.rotation.y = lobe.rot;
        gMesh.receiveShadow = true;
        fallbackLobesGroup.add(gMesh);
        this.walkableTerrainMeshes.push(gMesh);
        fallbackLobeMeshes.push(gMesh);

        const sMesh = new THREE.Mesh(unitSandGeo, this.surfaceMats.sandMat);
        sMesh.scale.set(lobe.rx + 18, 1, lobe.rz + 18);
        sMesh.position.set(lobe.x, -2.95, lobe.z);
        if (lobe.rot) sMesh.rotation.y = lobe.rot;
        sMesh.receiveShadow = true;
        fallbackLobesGroup.add(sMesh);
        this.walkableTerrainMeshes.push(sMesh);
        fallbackLobeMeshes.push(sMesh);

        const foam = new THREE.Mesh(unitFoamGeo, foamMat);
        foam.rotation.x = -Math.PI / 2;
        foam.scale.set(lobe.rx + 30, lobe.rz + 30, 1);
        foam.position.set(lobe.x, -2.72, lobe.z);
        if (lobe.rot) foam.rotation.z = -(lobe.rot ?? 0);
        fallbackLobesGroup.add(foam);
      }
      this.islandGroup.add(fallbackLobesGroup);

      const officialTerrain = createOfficialIslandTerrain(GI_MAP_BOUNDS, (landMesh) => {
        fallbackLobesGroup.visible = false;
        const removeSet = new Set(fallbackLobeMeshes);
        this.walkableTerrainMeshes = this.walkableTerrainMeshes.filter((m) => !removeSet.has(m));
        this.walkableTerrainMeshes.unshift(landMesh);
      });
      this.islandGroup.add(officialTerrain.group);

      this.animatedObjects.push((t) => {
        foamMat.opacity = 0.3 + Math.sin(t * 1.55) * 0.14;
        officialTerrain.update(t);
        this.surfaceMats.seaTex.offset.set(t * 0.012, t * 0.008);
        this.surfaceMats.lakeTex.offset.set(-t * 0.016, t * 0.012);
      });

      // 5 座官方內陸清澈藍湖（波光水面＋岸邊卵石淺灘緣）
      const unitLakeGeo = new THREE.CylinderGeometry(1, 1, 0.14, 28);
      const lakeRimMat = new THREE.MeshStandardMaterial({
        map: this.surfaceMats.rockTex,
        color: 0xd6c7a4,
        roughness: 0.94,
      });
      const unitLakeRimGeo = new THREE.CylinderGeometry(1.06, 1.12, 0.09, 28);
      for (const lk of GI_LAKES) {
        const rimMesh = new THREE.Mesh(unitLakeRimGeo, lakeRimMat);
        rimMesh.scale.set(lk.rx, 1, lk.rz);
        rimMesh.position.set(lk.x, 0.01, lk.z);
        rimMesh.receiveShadow = true;
        this.islandGroup.add(rimMesh);
        this.walkableTerrainMeshes.push(rimMesh);

        const lakeMesh = new THREE.Mesh(unitLakeGeo, this.surfaceMats.lakeMat);
        lakeMesh.scale.set(lk.rx, 1, lk.rz);
        lakeMesh.position.set(lk.x, 0.035, lk.z);
        lakeMesh.receiveShadow = true;
        lakeMesh.userData.isWater = true;
        this.islandGroup.add(lakeMesh);
        this.walkableTerrainMeshes.push(lakeMesh);
      }

      // 城鎮間手繪夯土石板鄉道網（依長度動態重複貼圖＋兩側自然路肩石緣）
      const unitJointGeo = new THREE.CylinderGeometry(1, 1, 0.068, 16);
      const seenJoints = new Set<string>();
      const addJoint = (jx: number, jz: number, r: number) => {
        const key = `${jx},${jz}`;
        if (seenJoints.has(key)) return;
        seenJoints.add(key);
        const disc = new THREE.Mesh(unitJointGeo, this.surfaceMats.roadMat);
        disc.scale.set(r, 1, r);
        disc.position.set(jx, 0.034, jz);
        disc.receiveShadow = true;
        this.islandGroup.add(disc);
        this.walkableTerrainMeshes.push(disc);
      };
      for (const seg of GI_ROADS) {
        const dx = seg.x2 - seg.x1;
        const dz = seg.z2 - seg.z1;
        const len = Math.hypot(dx, dz);
        const yaw = Math.atan2(dx, dz);
        const mx = (seg.x1 + seg.x2) / 2;
        const mz = (seg.z1 + seg.z2) / 2;

        const roadGeo = new THREE.BoxGeometry(seg.width, 0.07, len);
        const uv = roadGeo.attributes.uv;
        const repeatV = Math.max(1, len / 6.5);
        for (let i = 0; i < uv.count; i++) {
          uv.setY(i, uv.getY(i) * repeatV);
        }
        const r = new THREE.Mesh(roadGeo, this.surfaceMats.roadMat);
        r.position.set(mx, 0.035, mz);
        r.rotation.y = yaw;
        r.receiveShadow = true;
        this.islandGroup.add(r);
        this.walkableTerrainMeshes.push(r);

        const curbGeo = new THREE.BoxGeometry(seg.width + 0.55, 0.036, len);
        const curb = new THREE.Mesh(curbGeo, this.surfaceMats.roadCurbMat);
        curb.position.set(mx, 0.018, mz);
        curb.rotation.y = yaw;
        curb.receiveShadow = true;
        this.islandGroup.add(curb);
        this.walkableTerrainMeshes.push(curb);

        addJoint(seg.x1, seg.z1, seg.width * 0.5);
        addJoint(seg.x2, seg.z2, seg.width * 0.5);
      }

      this.registerZoneStreams();
      this.buildLODMountainRanges();
      this.buildInstancedForestAndRocks();
    }

    // 12 處原作卡片光點（對應 5× 全島座標與 2× 城鎮地標偏移，保留既有 ID 確保舊存檔相容）
    const rawPickups: Array<{ id: string; zoneId: string; x: number; z: number; cardId: number; label: string }> = [
      { id: 'pickup_rock', zoneId: 'shiso_tree', x: -4, z: 166, cardId: 21449, label: '拾取草原發光石頭 → No.21449「石頭」（卡片化）' },
      { id: 'pickup_pouch_1', zoneId: 'antokiba', x: 15, z: 108, cardId: 607, label: '拾取旅人戒尼 → No.607「J10,000」（卡片化）' },
      { id: 'pickup_herb', zoneId: 'bunzen', x: 88, z: 141, cardId: 673, label: '捕獲布恩森林邊 → No.673「超高速毛球」（卡片化）' },
      { id: 'pickup_ruin_key', zoneId: 'badlands', x: -13.5, z: -45.5, cardId: 11, label: '拾取荒地峽谷 → No.011「黃金天秤」（指定卡片）' },
      { id: 'pickup_risky_dice', zoneId: 'dorias', x: -46, z: -22, cardId: 25, label: '拾取多里亞斯賭城 → No.025「風險骰子」（指定卡片）' },
      { id: 'pickup_phantom_ore', zoneId: 'rubicuta', x: 4, z: 46, cardId: 84, label: '拾取魯比克塔地峽 → No.084「聖騎士的首飾」（指定卡片）' },
      { id: 'pickup_alexandrite', zoneId: 'bandit_village', x: -70, z: -116, cardId: 75, label: '拾取山賊之村 → No.075「奇運亞歷山大石」（指定卡片）' },
      { id: 'pickup_silver_dog', zoneId: 'soufrabi', x: 54, z: -20, cardId: 98, label: '捕獲壽富拉比港邊 → No.098「銀犬」（指定卡片）' },
      { id: 'pickup_gold_box', zoneId: 'limeiro', x: 14, z: -72, cardId: 80, label: '拾取利梅洛山腳 → No.080「浮游石」（指定卡片）' },
      { id: 'pickup_pouch_2', zoneId: 'masadora', x: -32, z: -66, cardId: 1039, label: '拾取瑪莎多拉城外 → No.1039「同行」（咒語卡）' },
      { id: 'pickup_aiai_guidebook', zoneId: 'aiai', x: -36, z: 94, cardId: 10, label: '拾取戀愛都市愛愛 → No.010「黃金指南」（指定卡片）' },
      { id: 'pickup_giport_ticket', zoneId: 'gi_port', x: -60, z: 56, cardId: 266, label: '拾取貪婪之島港 → No.266「離境通行票」（自由卡片）' },
    ];

    for (const p of rawPickups) {
      let wx: number;
      let wz: number;
      let baseY = 0;
      if (isV2Map() && V2_TOWN_PLACEMENTS[p.zoneId]) {
        const v2 = V2_TOWN_PLACEMENTS[p.zoneId];
        wx = v2.x + (p.x - v2.buildOrigin.x) * ARCH_SCALE;
        wz = v2.z + (p.z - v2.buildOrigin.z) * ARCH_SCALE;
        baseY = this.v2Terrain ? this.v2Terrain.sampleHeight(wx, wz) : v2.padY;
      } else {
        const anchor = RAW_LOCATION_ANCHORS[p.zoneId] ?? { x: p.x, z: p.z };
        wx = anchor.x * WORLD_SCALE + (p.x - anchor.x) * ARCH_SCALE;
        wz = anchor.z * WORLD_SCALE + (p.z - anchor.z) * ARCH_SCALE;
      }
      const mesh = this.createPickupMesh(p.cardId);
      mesh.position.set(wx, baseY + 1.1, wz);
      this.islandGroup.add(mesh);
      this.islandInteractables.push({
        id: p.id,
        label: p.label,
        position: new THREE.Vector3(wx, baseY, wz),
        radius: 3.2,
        kind: 'pickup',
        cardId: p.cardId,
        mesh,
      });
    }
  }

  // -------------------------------------------------------------------------
  // 全島 12 區延遲串流註冊表（5× 世界座標＋2× 建築縮放＋自動防重疊＋GLB 實測 AABB 碰撞）
  // -------------------------------------------------------------------------
  private createZoneNpcMesh(
    entry: ZoneStreamEntry,
    clothColor: number,
    skinColor: number,
    hairColor: number
  ): THREE.Group {
    const npc = createDetailedNpcMesh(clothColor, skinColor, hairColor, (fn) => entry.animated.push(fn));
    // 建築群組放大 ARCH_SCALE (2×) 時，NPC 反向縮放維持真實 1.8m 人身比例！
    npc.scale.multiplyScalar(1 / ARCH_SCALE);
    npc.userData.nonWalkable = true;
    return npc;
  }

  /**
   * 區域專用 GLB 代理器：
   * 1. 載入完成後依實測幾何尺寸記錄真實佔地（placedFootprints）；當 pinned = false（外環擴建）時，若與既有建築重疊即自動外推拉開走道；
   *    當 pinned = true（核心區）時絕不移動建築位置，避免推離原本手寫的碰撞體與互動點；
   * 2. 自動計算 2× 縮放後的精準世界空間 AABB 寫入該區碰撞表（排除可通行拱門 TownGate.glb 與碼頭 Soufrabi_Dock.glb），徹底消除穿模！
   */
  private createZoneModelProxy(entry: ZoneStreamEntry, pinned = false): ModelLibrary {
    const baseLib = this.models;
    const isWalkthroughOrFar = (f: string) =>
      f === 'TownGate.glb' ||
      f === 'Mountain_Group.glb' ||
      f === 'Pirate_Ship.glb' ||
      f === 'Sailboat.glb' ||
      f === 'Soufrabi_Dock.glb';
    const isTreeOrBush = (f: string) =>
      f.includes('Tree') || f.includes('Bush');
    const isWallJoin = (f: string) =>
      f === 'TownWall.glb' || f === 'TownCornerTower.glb' || f === 'TownGate.glb';

    return {
      load: (fileName: string) => baseLib.load(fileName),
      place: (parent, fileName, opts) =>
        baseLib.place(parent, fileName, opts).then((instance) => {
          if (!instance) return null;

          // 1. 記錄真實佔地；僅在 pinned = false（外環建築）時自動推離重疊，核心區建築維持原位不偏移
          const baseSize = instance.userData.baseSize as THREE.Vector3 | undefined;
          if (baseSize && !isWalkthroughOrFar(fileName) && !isTreeOrBush(fileName) && !isWallJoin(fileName)) {
            const rot = opts.rotY ?? 0;
            const c = Math.abs(Math.cos(rot));
            const s = Math.abs(Math.sin(rot));
            const sx = baseSize.x * instance.scale.x;
            const sz = baseSize.z * instance.scale.z;
            const halfW = (sx * c + sz * s) * 0.48;
            const halfD = (sx * s + sz * c) * 0.48;

            if (halfW > 0.6 || halfD > 0.6) {
              let px = instance.position.x;
              let pz = instance.position.z;
              if (!pinned) {
                for (let pass = 0; pass < 6; pass++) {
                  let moved = false;
                  for (const other of entry.placedFootprints) {
                    const ox = px - other.x;
                    const oz = pz - other.z;
                    const overlapX = halfW + other.halfW + 0.55 - Math.abs(ox);
                    const overlapZ = halfD + other.halfD + 0.55 - Math.abs(oz);
                    if (overlapX > 0.25 && overlapZ > 0.25) {
                      if (overlapX < overlapZ) {
                        px += (ox >= 0 ? 1 : -1) * (overlapX + 0.2);
                      } else {
                        pz += (oz >= 0 ? 1 : -1) * (overlapZ + 0.2);
                      }
                      moved = true;
                    }
                  }
                  if (!moved) break;
                }
                instance.position.x = px;
                instance.position.z = pz;
              }
              entry.placedFootprints.push({ x: px, z: pz, halfW, halfD });
            }
          }

          // 2. 計算實測世界空間包圍盒並自動註冊精準防穿模碰撞體與攝影機遮擋物
          if (entry.group) {
            entry.group.updateMatrixWorld(true);
            const worldBox = new THREE.Box3().setFromObject(instance);
            if (!worldBox.isEmpty()) {
              if (isTreeOrBush(fileName)) {
                instance.userData.nonWalkable = true;
                const center = new THREE.Vector3();
                worldBox.getCenter(center);
                entry.circleColliders.push({ x: center.x, z: center.z, r: 0.85 });
              } else if (!isWalkthroughOrFar(fileName)) {
                // 實體 GLB 建築與城牆皆加入攝影機防穿牆遮擋物
                entry.cameraOccluders.push(instance);

                if (fileName === 'TownWall.glb') {
                  // 核心區城牆已手寫精準碰撞，避免旋轉城牆在 Proxy 產生過大的軸對齊包圍盒
                } else if (fileName === 'TownCornerTower.glb') {
                  const insetX = (worldBox.max.x - worldBox.min.x) * 0.22;
                  const insetZ = (worldBox.max.z - worldBox.min.z) * 0.22;
                  entry.boxColliders.push({
                    minX: worldBox.min.x + insetX,
                    maxX: worldBox.max.x - insetX,
                    minZ: worldBox.min.z + insetZ,
                    maxZ: worldBox.max.z - insetZ,
                  });
                } else {
                  const insetX = Math.min(0.65, (worldBox.max.x - worldBox.min.x) * 0.12);
                  const insetZ = Math.min(0.65, (worldBox.max.z - worldBox.min.z) * 0.12);
                  entry.boxColliders.push({
                    minX: worldBox.min.x + insetX,
                    maxX: worldBox.max.x - insetX,
                    minZ: worldBox.min.z + insetZ,
                    maxZ: worldBox.max.z - insetZ,
                  });
                }
              }
            }
          }

          return instance;
        }),
    } as ModelLibrary;
  }

  private registerZoneStreams(): void {
    const addZone = (
      id: string,
      name: string,
      loadRadius: number,
      rawBuilder: (
        entry: ZoneStreamEntry,
        helpers: {
          models: ModelLibrary;
          addCircleCollider: (c: CircleCollider) => void;
          addBoxCollider: (b: BoxCollider) => void;
          addInteractable: (item: Interactable) => void;
          createNpcMesh: (cloth: number, skin: number, hair: number) => THREE.Group;
        }
      ) => THREE.Group
    ) => {
      const v2Placement = isV2Map() ? V2_TOWN_PLACEMENTS[id] : undefined;
      const anchor = RAW_LOCATION_ANCHORS[id];
      const ZONE_BUILD_ORIGINS: Record<string, { x: number; z: number }> = {
        aiai: { x: -36, z: 88 },
        gi_port: { x: -66, z: 54 },
        bunzen: { x: 98, z: 136 },
      };
      const buildOrigin = v2Placement ? v2Placement.buildOrigin : (ZONE_BUILD_ORIGINS[id] ?? anchor);
      const origCx = buildOrigin.x;
      const origCz = buildOrigin.z;
      const wx = v2Placement ? v2Placement.x : anchor.x * WORLD_SCALE;
      const wz = v2Placement ? v2Placement.z : anchor.z * WORLD_SCALE;
      const padY = v2Placement ? v2Placement.padY : 0;
      const effectiveLoadRadius = v2Placement
        ? Math.max(300, loadRadius * 0.78)
        : CITY_EXPANSION_CONFIGS[id]
          ? loadRadius + 45
          : loadRadius;

      this.zoneStreams.push({
        id,
        name,
        origCx,
        origCz,
        cx: wx,
        cz: wz,
        loadRadius: effectiveLoadRadius,
        visibleRadius: effectiveLoadRadius + 36,
        built: false,
        active: false,
        group: null,
        animated: [],
        circleColliders: [],
        boxColliders: [],
        cameraOccluders: [],
        interactables: [],
        placedFootprints: [],
        builder: (entry) => {
          const toWorldX = (x: number) => wx + (x - origCx) * ARCH_SCALE;
          const toWorldZ = (z: number) => wz + (z - origCz) * ARCH_SCALE;

          const wrapper = new THREE.Group();
          wrapper.name = `scaled_${id}`;
          wrapper.position.set(wx, padY, wz);
          wrapper.scale.setScalar(ARCH_SCALE);
          entry.group = wrapper;

          const coreZoneModels = this.createZoneModelProxy(entry, true);
          const expandZoneModels = this.createZoneModelProxy(entry, false);
          const addCircleCollider = (c: CircleCollider) =>
            entry.circleColliders.push({
              x: toWorldX(c.x),
              z: toWorldZ(c.z),
              r: c.r * ARCH_SCALE,
            });
          const addBoxCollider = (b: BoxCollider) =>
            entry.boxColliders.push({
              minX: toWorldX(b.minX),
              maxX: toWorldX(b.maxX),
              minZ: toWorldZ(b.minZ),
              maxZ: toWorldZ(b.maxZ),
            });
          const createNpcMesh = (cloth: number, skin: number, hair: number) =>
            this.createZoneNpcMesh(entry, cloth, skin, hair);

          const localGroup = rawBuilder(entry, {
            models: coreZoneModels,
            addCircleCollider,
            addBoxCollider,
            addInteractable: (item) =>
              entry.interactables.push({
                ...item,
                position: new THREE.Vector3(
                  toWorldX(item.position.x),
                  padY + item.position.y,
                  toWorldZ(item.position.z)
                ),
                radius: item.radius * 1.45,
              }),
            createNpcMesh,
          });

          // 舊版模式附加外環擴建；v2 新版雕塑地形將既有完整城鎮精準落於整平地基，不讓外環溢出坡面
          if (!v2Placement) {
            const locDef = GI_LOCATIONS.find((l) => l.id === id);
            const expandedDistrict = buildExpandedCityDistricts({
              id,
              origCx,
              origCz,
              worldCx: wx,
              worldCz: wz,
              worldSpawnPos: locDef ? locDef.spawnPos : [wx, 0, wz],
              roads: GI_ROADS,
              lakes: GI_LAKES,
              landLobes: GI_LAND_LOBES,
              models: expandZoneModels,
              addCircleCollider,
              addBoxCollider,
              addCameraOccluder: (obj) => entry.cameraOccluders.push(obj),
              addAnimated: (fn) => entry.animated.push(fn),
              createNpcMesh,
            });
            if (expandedDistrict) {
              localGroup.add(expandedDistrict);
            }
          }

          localGroup.position.set(-origCx, 0, -origCz);
          wrapper.add(localGroup);
          wrapper.updateMatrixWorld(true);
          return wrapper;
        },
      });
    };

    addZone('shiso_tree', 'Shiso Tree', 420, (entry, h) =>
      buildShisoTreeZone({
        addAnimated: (fn) => entry.animated.push(fn),
        addCircleCollider: h.addCircleCollider,
        addCameraOccluder: (obj) => entry.cameraOccluders.push(obj),
        addInteractable: h.addInteractable,
      })
    );

    addZone('antokiba', 'Antokiba', 440, (entry, h) =>
      buildAntokibaZone({
        models: h.models,
        createNeonSignMesh: (title, subtitle) => this.createNeonSignMesh(title, subtitle),
        createNpcMesh: h.createNpcMesh,
        addAnimated: (fn) => entry.animated.push(fn),
        addCircleCollider: h.addCircleCollider,
        addBoxCollider: h.addBoxCollider,
        addCameraOccluder: (obj) => entry.cameraOccluders.push(obj),
        addInteractable: h.addInteractable,
      })
    );

    addZone('bunzen', 'Bunzen', 390, (entry, h) =>
      buildBunzenZone({
        models: h.models,
        createNeonSignMesh: (title, subtitle) => this.createNeonSignMesh(title, subtitle),
        addCircleCollider: h.addCircleCollider,
        addBoxCollider: h.addBoxCollider,
        addCameraOccluder: (obj) => entry.cameraOccluders.push(obj),
      })
    );

    addZone('aiai', 'Aiai', 380, (entry, h) =>
      buildAiaiZone({
        models: h.models,
        addAnimated: (fn) => entry.animated.push(fn),
        addCircleCollider: h.addCircleCollider,
        addCameraOccluder: (obj) => entry.cameraOccluders.push(obj),
      })
    );

    addZone('gi_port', 'Greed Island Port', 380, (entry, h) =>
      buildGiPortZone({
        models: h.models,
        createNpcMesh: h.createNpcMesh,
        addAnimated: (fn) => entry.animated.push(fn),
        addCircleCollider: h.addCircleCollider,
        addCameraOccluder: (obj) => entry.cameraOccluders.push(obj),
        addInteractable: h.addInteractable,
      })
    );

    addZone('rubicuta', 'Rubicuta', 380, (entry, h) =>
      buildRubicutaZone({
        models: h.models,
        addCircleCollider: h.addCircleCollider,
        addCameraOccluder: (obj) => entry.cameraOccluders.push(obj),
      })
    );

    addZone('dorias', 'Dorias', 390, (entry, h) =>
      buildDoriasZone({
        models: h.models,
        createNpcMesh: h.createNpcMesh,
        addAnimated: (fn) => entry.animated.push(fn),
        addCircleCollider: h.addCircleCollider,
        addCameraOccluder: (obj) => entry.cameraOccluders.push(obj),
        addInteractable: h.addInteractable,
      })
    );

    addZone('badlands', 'Badlands', 410, (entry, h) =>
      buildBadlandsZone({
        models: h.models,
        addAnimated: (fn) => entry.animated.push(fn),
        addCircleCollider: h.addCircleCollider,
        addCameraOccluder: (obj) => entry.cameraOccluders.push(obj),
      })
    );

    addZone('soufrabi', 'Soufrabi', 410, (entry, h) =>
      buildSoufrabiZone({
        models: h.models,
        createNpcMesh: h.createNpcMesh,
        addAnimated: (fn) => entry.animated.push(fn),
        addCircleCollider: h.addCircleCollider,
        addBoxCollider: h.addBoxCollider,
        addInteractable: h.addInteractable,
      })
    );

    addZone('masadora', 'Masadora', 420, (entry, h) =>
      buildMasadoraZone({
        models: h.models,
        createNeonSignMesh: (title, subtitle) => this.createNeonSignMesh(title, subtitle),
        createNpcMesh: h.createNpcMesh,
        addAnimated: (fn) => entry.animated.push(fn),
        addCircleCollider: h.addCircleCollider,
        addBoxCollider: h.addBoxCollider,
        addInteractable: h.addInteractable,
      })
    );

    addZone('limeiro', 'Limeiro', 440, (entry, h) =>
      buildLimeiroZone({
        models: h.models,
        createNpcMesh: h.createNpcMesh,
        addCircleCollider: h.addCircleCollider,
        addInteractable: h.addInteractable,
      })
    );

    addZone('bandit_village', 'Bandit Village', 390, (entry, h) =>
      buildBanditVillageZone({
        models: h.models,
        createNpcMesh: h.createNpcMesh,
        addAnimated: (fn) => entry.animated.push(fn),
        addCircleCollider: h.addCircleCollider,
        addCameraOccluder: (obj) => entry.cameraOccluders.push(obj),
        addInteractable: h.addInteractable,
      })
    );
  }

  // -------------------------------------------------------------------------
  // 效能優化：遠景山脈 THREE.LOD（載入完成前以低模兜底、5% 遲滯防閃爍、避開所有出生點）
  // -------------------------------------------------------------------------
  private buildLODMountainRanges(): void {
    const mountains: Array<[number, number, number, number]> = [
      [-94, -84, 20, 0.3],  // 避開山賊之村出生點 [-62, -90] 與木柵入口
      [76, -110, 26, -0.4],
      [34, -80, 18, 0.1],
      [-12, -4, 15, -0.2],  // 避開多里亞斯賭城 [-52, -26] 與出生點 [-38, -26]
      [76, -42, 20, 0.5],
      [2, 8, 22, 0.0],
      [66, 36, 26, 0.25],
      [-8, 122, 14, 0.8],   // 避開愛愛廣場 [-36, 88] 東側緣
    ];

    const unitConeGeo = new THREE.ConeGeometry(0.92, 1, 8);
    const lowPolyMat = new THREE.MeshStandardMaterial({
      map: this.surfaceMats.rockTex,
      color: 0x8ea08c,
      roughness: 0.96,
      flatShading: true,
    });

    for (const [mx, mz, mh, mr] of mountains) {
      const lod = new THREE.LOD();
      const scaledH = mh * 2.4;
      lod.position.set(mx * WORLD_SCALE, -0.8, mz * WORLD_SCALE);
      lod.rotation.y = mr;

      const lowMesh = new THREE.Mesh(unitConeGeo, lowPolyMat);
      lowMesh.scale.set(scaledH, scaledH, scaledH);
      lowMesh.position.y = scaledH / 2;
      lod.addLevel(lowMesh, 0);

      const highGroup = new THREE.Group();
      this.models
        .place(highGroup, 'Mountain_Group.glb', {
          x: 0,
          y: 0,
          z: 0,
          targetHeight: scaledH,
          castShadow: false,
          receiveShadow: false,
        })
        .then((inst) => {
          if (!inst) return;
          lod.levels.length = 0;
          lod.addLevel(highGroup, 0);
          lod.addLevel(lowMesh, 320, 0.05);
        });

      this.islandGroup.add(lod);
    }
  }

  // -------------------------------------------------------------------------
  // 效能優化：InstancedMesh 批次生成西北密林、除念之森、西南半島林與海岸巨石（僅 3 個 Draw Calls！）
  // -------------------------------------------------------------------------
  private buildInstancedForestAndRocks(): void {
    // 1. 決定性（Deterministic）種子佈點：西北密林 + 東北島林 + 布恩森除念之森 + 西南 C 型臂 + 中央林帶
    const useV2 = isV2Map();
    const treeZones = useV2
      ? V2_FOREST_ZONES
      : [
          { cx: -74, cz: -124, rx: 26, rz: 24, count: 55, minH: 7.5, maxH: 12.5 }, // 西北密林（山賊之村周圍）
          { cx: -36, cz: -114, rx: 16, rz: 16, count: 28, minH: 6.5, maxH: 10.5 }, // 西北半島右叉密林
          { cx: 76, cz: -104, rx: 18, rz: 16, count: 24, minH: 6.5, maxH: 10.0 },  // 東北獨立山島林
          { cx: 118, cz: 136, rx: 14, rz: 26, count: 34, minH: 7.5, maxH: 11.5 },  // 布恩森東側除念之森
          { cx: 40, cz: 125, rx: 18, rz: 9, count: 16, minH: 6.5, maxH: 9.8 },     // 布恩森東南林道北側林帶
          { cx: 42, cz: 158, rx: 20, rz: 10, count: 18, minH: 6.5, maxH: 9.8 },    // 布恩森東南林道南側林帶
          { cx: -74, cz: 26, rx: 10, rz: 24, count: 22, minH: 6.0, maxH: 9.0 },    // 西南 C 型半島林
          { cx: -20, cz: 120, rx: 16, rz: 16, count: 18, minH: 6.5, maxH: 9.6 },   // 南陸西湖畔森林
          { cx: 36, cz: -22, rx: 16, rz: 18, count: 25, minH: 6.5, maxH: 9.5 },    // 中部林帶
        ];

    let seed = 1337;
    const rand = () => {
      seed = (seed * 16807) % 2147483647;
      return (seed - 1) / 2147483646;
    };

    const nearAnyRoad = (px: number, pz: number, clearance: number): boolean => {
      for (const seg of GI_ROADS) {
        if (distPointToSegment2D(px, pz, seg) < clearance) return true;
      }
      return false;
    };

    // 動畫風立體多團樹冠（依 9 個森林分區拆成獨立空間區塊，超出視距整塊隱藏零 GPU 繪製）
    const trunkGeo = new THREE.CylinderGeometry(0.22, 0.46, 1, 8);
    const trunkMat = new THREE.MeshStandardMaterial({
      map: this.surfaceMats.barkTex,
      roughness: 0.94,
    });
    const puffGeo = new THREE.IcosahedronGeometry(1, 1);
    const canopyMatBase = new THREE.MeshStandardMaterial({
      map: this.surfaceMats.foliageTex,
      color: 0xffffff,
      roughness: 0.88,
      metalness: 0.0,
    });

    const dummy = new THREE.Object3D();
    const shadeCol = new THREE.Color();
    const midCol = new THREE.Color();
    const sunCol = new THREE.Color();

    for (const z of treeZones) {
      const zoneTrees: Array<{ x: number; y: number; z: number; h: number }> = [];
      const wCx = useV2 ? z.cx : z.cx * WORLD_SCALE;
      const wCz = useV2 ? z.cz : z.cz * WORLD_SCALE;
      const wRx = useV2 ? z.rx : z.rx * WORLD_SCALE;
      const wRz = useV2 ? z.rz : z.rz * WORLD_SCALE;
      for (let i = 0; i < z.count; i++) {
        const a = rand() * Math.PI * 2;
        const r = Math.sqrt(rand());
        const tx = wCx + Math.cos(a) * wRx * r;
        const tz = wCz + Math.sin(a) * wRz * r;
        if (useV2 && this.v2Terrain && !this.v2Terrain.isOnLand(tx, tz)) continue;
        let tooCloseToTown = false;
        if (useV2) {
          for (const t of Object.values(V2_TOWN_PLACEMENTS)) {
            if (Math.hypot(tx - t.x, tz - t.z) < t.padRadius + 10) {
              tooCloseToTown = true;
              break;
            }
          }
        } else {
          for (const [locId, anchor] of Object.entries(RAW_LOCATION_ANCHORS)) {
            const expCfg = CITY_EXPANSION_CONFIGS[locId];
            const clearR = expCfg ? expCfg.cityRadiusLocal * ARCH_SCALE + 14 : 76;
            if (Math.hypot(tx - anchor.x * WORLD_SCALE, tz - anchor.z * WORLD_SCALE) < clearR) {
              tooCloseToTown = true;
              break;
            }
          }
        }
        if (tooCloseToTown) continue;
        if (nearAnyRoad(tx, tz, useV2 ? 12.0 : 18.0)) continue;
        const ty = useV2 && this.v2Terrain ? this.v2Terrain.sampleHeight(tx, tz) : 0;
        if (useV2 && ty < 0.2) continue;
        const th = (z.minH + rand() * (z.maxH - z.minH)) * (useV2 ? 1.45 : 1.85);
        zoneTrees.push({ x: tx, y: ty, z: tz, h: th });
      }
      const count = zoneTrees.length;
      if (count === 0) continue;

      const chunkGroup = new THREE.Group();
      const trunkColliders: CircleCollider[] = [];
      const trunkInst = new THREE.InstancedMesh(trunkGeo, trunkMat, count);
      const lowerCanopyInst = new THREE.InstancedMesh(puffGeo, canopyMatBase, count);
      const midCanopyInst = new THREE.InstancedMesh(puffGeo, canopyMatBase, count);
      const crownCanopyInst = new THREE.InstancedMesh(puffGeo, canopyMatBase, count);
      trunkInst.castShadow = true;
      lowerCanopyInst.castShadow = true;
      lowerCanopyInst.receiveShadow = true;
      midCanopyInst.castShadow = true;
      midCanopyInst.receiveShadow = true;
      crownCanopyInst.castShadow = true;
      crownCanopyInst.receiveShadow = true;

      for (let i = 0; i < count; i++) {
        const { x, y: baseY, z: pz, h } = zoneTrees[i];
        trunkColliders.push({ x, z: pz, r: 0.72 });
        const yaw = rand() * Math.PI * 2;
        const leanX = (rand() - 0.5) * 0.08;
        const leanZ = (rand() - 0.5) * 0.08;
        const trunkH = h * 0.42;
        dummy.position.set(x, baseY + trunkH * 0.45, pz);
        dummy.scale.set(1.25 + rand() * 0.35, trunkH, 1.25 + rand() * 0.35);
        dummy.rotation.set(leanX, yaw, leanZ);
        dummy.updateMatrix();
        trunkInst.setMatrixAt(i, dummy.matrix);

        const r1 = h * 0.28;
        dummy.position.set(x - Math.cos(yaw) * r1 * 0.25, baseY + trunkH + r1 * 0.45, pz - Math.sin(yaw) * r1 * 0.25);
        dummy.scale.set(r1 * 1.22, r1 * 0.86, r1 * 1.15);
        dummy.rotation.set(rand() * 0.4, yaw, rand() * 0.4);
        dummy.updateMatrix();
        lowerCanopyInst.setMatrixAt(i, dummy.matrix);

        const r2 = h * 0.25;
        dummy.position.set(x + Math.cos(yaw + 2.1) * r2 * 0.32, baseY + trunkH + r1 * 0.95, pz + Math.sin(yaw + 2.1) * r2 * 0.32);
        dummy.scale.set(r2 * 1.16, r2 * 0.92, r2 * 1.12);
        dummy.rotation.set(rand() * 0.4, yaw + 1.2, rand() * 0.4);
        dummy.updateMatrix();
        midCanopyInst.setMatrixAt(i, dummy.matrix);

        const r3 = h * 0.21;
        dummy.position.set(x + Math.cos(yaw + 4.2) * r3 * 0.16, baseY + trunkH + r1 * 1.48, pz + Math.sin(yaw + 4.2) * r3 * 0.16);
        dummy.scale.set(r3 * 1.12, r3 * 0.88, r3 * 1.06);
        dummy.rotation.set(rand() * 0.4, yaw + 2.4, rand() * 0.4);
        dummy.updateMatrix();
        crownCanopyInst.setMatrixAt(i, dummy.matrix);

        const hue = 0.31 + (rand() - 0.5) * 0.055;
        const sat = 0.42 + rand() * 0.12;
        const baseL = 0.32 + rand() * 0.08;
        shadeCol.setHSL(hue + 0.03, sat, baseL * 0.82);
        midCol.setHSL(hue, sat + 0.04, baseL * 1.05);
        sunCol.setHSL(hue - 0.035, sat + 0.08, Math.min(0.58, baseL * 1.28));
        lowerCanopyInst.setColorAt(i, shadeCol);
        midCanopyInst.setColorAt(i, midCol);
        crownCanopyInst.setColorAt(i, sunCol);
      }

      trunkInst.instanceMatrix.needsUpdate = true;
      lowerCanopyInst.instanceMatrix.needsUpdate = true;
      midCanopyInst.instanceMatrix.needsUpdate = true;
      crownCanopyInst.instanceMatrix.needsUpdate = true;
      if (lowerCanopyInst.instanceColor) lowerCanopyInst.instanceColor.needsUpdate = true;
      if (midCanopyInst.instanceColor) midCanopyInst.instanceColor.needsUpdate = true;
      if (crownCanopyInst.instanceColor) crownCanopyInst.instanceColor.needsUpdate = true;
      trunkInst.computeBoundingSphere();
      lowerCanopyInst.computeBoundingSphere();
      midCanopyInst.computeBoundingSphere();
      crownCanopyInst.computeBoundingSphere();
      chunkGroup.add(trunkInst, lowerCanopyInst, midCanopyInst, crownCanopyInst);
      chunkGroup.visible = false;
      this.islandGroup.add(chunkGroup);
      this.spatialChunks.push({
        cx: wCx,
        cz: wCz,
        cullRadius: Math.max(wRx, wRz) + 340,
        group: chunkGroup,
        colliders: trunkColliders,
      });
    }

    if (useV2 && this.v2Terrain) {
      // V2 貼地迎風搖曳草原與野花群（每株依雕塑地形高度 sampleHeight 精準落地）
      const v2Meadows: Array<{ cx: number; cz: number; rx: number; rz: number; count: number; flowerRate: number }> = [
        { cx: 34, cz: 432, rx: 86, rz: 72, count: 480, flowerRate: 0.24 }, // 起始塔 → 安多奇拔陽光緩坡草原
        { cx: 140, cz: 468, rx: 72, rz: 52, count: 280, flowerRate: 0.2 }, // 布恩森獨立林道草坡
        { cx: 18, cz: 210, rx: 68, rz: 74, count: 260, flowerRate: 0.18 }, // 地峽往魯比克塔草原
        { cx: -140, cz: 428, rx: 74, rz: 58, count: 260, flowerRate: 0.3 }, // 西南愛愛花海半島
        { cx: 18, cz: -40, rx: 95, rz: 75, count: 280, flowerRate: 0.2 }, // 中央開闊平原
      ];
      for (const mz of v2Meadows) {
        const chunkSpots: Array<{ x: number; y: number; z: number; scale: number; isFlower: boolean }> = [];
        for (let i = 0; i < mz.count; i++) {
          const a = rand() * Math.PI * 2;
          const r = Math.sqrt(rand());
          const fx = mz.cx + Math.cos(a) * mz.rx * r;
          const fz = mz.cz + Math.sin(a) * mz.rz * r;
          if (!this.v2Terrain.isOnLand(fx, fz)) continue;
          if (nearAnyRoad(fx, fz, 7.5)) continue;
          let inTown = false;
          for (const t of Object.values(V2_TOWN_PLACEMENTS)) {
            if (Math.hypot(fx - t.x, fz - t.z) < t.padRadius + 3) {
              inTown = true;
              break;
            }
          }
          if (inTown) continue;
          let inLake = false;
          for (const lk of GI_LAKES) {
            if (Math.hypot((fx - lk.x) / (lk.rx + 6), (fz - lk.z) / (lk.rz + 6)) < 1) {
              inLake = true;
              break;
            }
          }
          if (inLake) continue;
          const fy = this.v2Terrain.sampleHeight(fx, fz);
          if (fy < 0.85 || fy > 7.2) continue;
          chunkSpots.push({
            x: fx,
            y: fy - 0.04,
            z: fz,
            scale: 0.85 + rand() * 0.75,
            isFlower: rand() < mz.flowerRate,
          });
        }
        if (chunkSpots.length === 0) continue;
        const sys = createWindSwayingMeadowFlora(chunkSpots);
        sys.group.visible = false;
        this.islandGroup.add(sys.group);
        this.windMeadowChunks.push({
          cx: mz.cx,
          cz: mz.cz,
          cullRadius: Math.max(mz.rx, mz.rz) + 220,
          system: sys,
        });
      }
      return;
    }

    // 2. 海岸與荒地苔岩巨石 InstancedMesh（含實體巨石碰撞體，絕不穿模）
    const rockCount = 72;
    const rockInst = new THREE.InstancedMesh(
      new THREE.IcosahedronGeometry(1, 1),
      new THREE.MeshStandardMaterial({
        map: this.surfaceMats.rockTex,
        color: 0xd0d4d8,
        roughness: 0.93,
        flatShading: true,
      }),
      rockCount
    );
    const rockColliders: CircleCollider[] = [];
    let rockPlaced = 0;
    for (let i = 0; i < rockCount * 4 && rockPlaced < rockCount; i++) {
      const lobe = GI_LAND_LOBES[i % GI_LAND_LOBES.length];
      const ang = rand() * Math.PI * 2;
      const rx = lobe.x + Math.cos(ang) * (lobe.rx + 8.0);
      const rz = lobe.z + Math.sin(ang) * (lobe.rz + 8.0);
      if (nearAnyRoad(rx, rz, 24.0)) continue;
      let nearTown = false;
      for (const [locId, anchor] of Object.entries(RAW_LOCATION_ANCHORS)) {
        const expCfg = CITY_EXPANSION_CONFIGS[locId];
        const clearR = expCfg ? expCfg.cityRadiusLocal * ARCH_SCALE + 22 : 90;
        if (Math.hypot(rx - anchor.x * WORLD_SCALE, rz - anchor.z * WORLD_SCALE) < clearR) {
          nearTown = true;
          break;
        }
      }
      if (nearTown) continue;
      const sc = (1.1 + rand() * 2.2) * 1.9;
      dummy.position.set(rx, sc * 0.22 - 1.2, rz);
      dummy.scale.set(sc * 1.25, sc * 0.72, sc * 1.05);
      dummy.rotation.set(rand(), rand() * 3, rand());
      dummy.updateMatrix();
      rockInst.setMatrixAt(rockPlaced++, dummy.matrix);
      rockColliders.push({ x: rx, z: rz, r: sc * 0.85 });
    }
    rockInst.count = rockPlaced;
    rockInst.instanceMatrix.needsUpdate = true;
    rockInst.computeBoundingSphere();
    this.islandGroup.add(rockInst);
    this.islandCircleColliders.push(...rockColliders);

    // 3. 全島迎風搖曳手繪交叉草葉與五瓣野花群（依 5× 牧場區塊分區串流剔除）
    const meadowZones: Array<{ cx: number; cz: number; rx: number; rz: number; count: number; flowerRate: number }> = [
      { cx: 6, cz: 158, rx: 38, rz: 42, count: 680, flowerRate: 0.22 },
      { cx: 48, cz: 140, rx: 28, rz: 22, count: 280, flowerRate: 0.18 },
      { cx: 92, cz: 136, rx: 30, rz: 26, count: 220, flowerRate: 0.16 },
      { cx: 4, cz: 36, rx: 24, rz: 32, count: 260, flowerRate: 0.18 },
      { cx: -30, cz: 86, rx: 28, rz: 20, count: 240, flowerRate: 0.28 },
      { cx: 14, cz: -94, rx: 34, rz: 22, count: 240, flowerRate: 0.2 },
      { cx: -38, cz: -78, rx: 32, rz: 24, count: 200, flowerRate: 0.15 },
    ];

    const isMeadowFree = (mx: number, mz: number): boolean => {
      if (nearAnyRoad(mx, mz, 12.0)) return false;
      for (const [locId, anchor] of Object.entries(RAW_LOCATION_ANCHORS)) {
        const expCfg = CITY_EXPANSION_CONFIGS[locId];
        const clearR = expCfg ? expCfg.cityRadiusLocal * ARCH_SCALE + 8 : 58;
        if (Math.hypot(mx - anchor.x * WORLD_SCALE, mz - anchor.z * WORLD_SCALE) < clearR) return false;
      }
      for (const lk of GI_LAKES) {
        const dx = (mx - lk.x) / (lk.rx + 6.0);
        const dz = (mz - lk.z) / (lk.rz + 6.0);
        if (dx * dx + dz * dz < 1) return false;
      }
      return true;
    };

    for (const mz of meadowZones) {
      const wCx = mz.cx * WORLD_SCALE;
      const wCz = mz.cz * WORLD_SCALE;
      const wRx = mz.rx * WORLD_SCALE;
      const wRz = mz.rz * WORLD_SCALE;
      const chunkSpots: Array<{ x: number; z: number; scale: number; isFlower: boolean }> = [];
      for (let i = 0; i < mz.count; i++) {
        const a = rand() * Math.PI * 2;
        const r = Math.sqrt(rand());
        const fx = wCx + Math.cos(a) * wRx * r;
        const fz = wCz + Math.sin(a) * wRz * r;
        if (!isMeadowFree(fx, fz)) continue;
        chunkSpots.push({
          x: fx,
          z: fz,
          scale: 0.9 + rand() * 0.9,
          isFlower: rand() < mz.flowerRate,
        });
      }
      if (chunkSpots.length === 0) continue;
      const sys = createWindSwayingMeadowFlora(chunkSpots);
      sys.group.visible = false;
      this.islandGroup.add(sys.group);
      this.windMeadowChunks.push({
        cx: wCx,
        cz: wCz,
        cullRadius: Math.max(wRx, wRz) + 280,
        system: sys,
      });
    }
  }

  private createNeonSignMesh(title: string, subtitle: string): THREE.Mesh {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 160;
    const ctx = canvas.getContext('2d')!;

    ctx.fillStyle = '#1b1136';
    ctx.fillRect(0, 0, 512, 160);
    ctx.strokeStyle = '#f0c659';
    ctx.lineWidth = 10;
    ctx.strokeRect(8, 8, 496, 144);
    ctx.strokeStyle = '#38e4c5';
    ctx.lineWidth = 3;
    ctx.strokeRect(18, 18, 476, 124);

    ctx.textAlign = 'center';
    ctx.fillStyle = '#ffe58f';
    ctx.shadowColor = '#f0c659';
    ctx.shadowBlur = 14;
    ctx.font = 'bold 40px sans-serif';
    ctx.fillText(title, 256, 74);

    ctx.fillStyle = '#62f5dc';
    ctx.shadowColor = '#38e4c5';
    ctx.shadowBlur = 10;
    ctx.font = 'bold 26px sans-serif';
    ctx.fillText(subtitle, 256, 122);

    const tex = new THREE.CanvasTexture(canvas);
    const mat = new THREE.MeshBasicMaterial({ map: tex });
    return new THREE.Mesh(new THREE.BoxGeometry(7.2, 2.25, 0.28), mat);
  }

  private createNpcMesh(clothColor: number, skinColor: number, hairColor: number): THREE.Group {
    const npc = createDetailedNpcMesh(clothColor, skinColor, hairColor, (fn) => this.animatedObjects.push(fn));
    npc.userData.nonWalkable = true;
    return npc;
  }

  private createPickupMesh(cardId: number): THREE.Group {
    const def = getCardDef(cardId);
    const pickup = createGreedIslandCardPickupMesh(def, (fn) => this.animatedObjects.push(fn));
    pickup.userData.nonWalkable = true;
    return pickup;
  }
}
