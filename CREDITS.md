# 3D Asset & Audio Credits

Greed Island 3D uses exclusively local, self-hosted **CC0 1.0 Public Domain** 3D models (`public/models/*.glb`) combined with procedural Three.js geometry, `InstancedMesh` foliage/rock batches, `LOD` mountain ranges, and procedural Web Audio ambient soundscapes (zero hotlinked assets, zero copyrighted rips).

## 3D Models (CC0 1.0 Public Domain)
- **Quaternius — Medieval Village Pack** (`House_1~4.glb`, `Inn.glb`, `Blacksmith.glb`, `Bell_Tower.glb`, `MarketStand_1~2.glb`, `Gazebo.glb`, `Well.glb`, `Mill.glb`, `Bench_1.glb`, `Cart.glb`, `Barrel.glb`)
  - Source mirror: [trebeljahr/quaternius-showcase](https://github.com/trebeljahr/quaternius-showcase)
  - License: **CC0 1.0 Universal (Public Domain)**
- **Quaternius — Real Time Strategy Pack** (`Limeiro_Castle.glb`, `Soufrabi_Port.glb`, `Soufrabi_Dock.glb`, `TownGate.glb`, `TownWall.glb`, `TownCornerTower.glb`, `WatchTower.glb`, `Mountain_Group.glb`, `Canyon_Peak.glb`, `Canyon_Rocks.glb`, `Ruins_Temple.glb`, `Ruins_Wonder.glb`, `SpellShop_Hall.glb`)
  - Source mirror: [trebeljahr/quaternius-showcase](https://github.com/trebeljahr/quaternius-showcase)
  - License: **CC0 1.0 Universal (Public Domain)**
- **Quaternius — Ultimate Nature Pack** (`Tree_1.glb`, `Tree_2.glb`, `BirchTree_1.glb`, `BlossomTree_1.glb`, `Bush_1.glb`)
  - Source mirror: [trebeljahr/quaternius-showcase](https://github.com/trebeljahr/quaternius-showcase)
  - License: **CC0 1.0 Universal (Public Domain)**
- **Quaternius — Ships Pack** (`Pirate_Ship.glb`, `Sailboat.glb`)
  - Source mirror: [trebeljahr/quaternius-showcase](https://github.com/trebeljahr/quaternius-showcase)
  - License: **CC0 1.0 Universal (Public Domain)**

## Procedural Assets & Audio
- **Character, NPCs & Card Pickups** (`src/game/player.ts`, `src/game/models/proceduralModels.ts`): Stylized anime Hunter adventurer (tapered tunic, collar, backpack & bedroll, glowing Greed Island ring, sculpted hair/eyes, articulated limbs), stylized NPCs with facial features and quest markers, beveled `ExtrudeGeometry` G·I Card pickups with CanvasTexture emblems, Starting Lobby radial marble mandala floor & open 3D BOOK binder, and 2-tier `InstancedMesh` conifer forests.
- **Modular Zone Landmarks & Signage** (`src/game/zones/*.ts`): Procedural Three.js geometry & HTML5 Canvas textures across all 12 zones — Shiso Tree purple brick spire, Antokiba walled prize city & clock tower, Bunzen stone courtyard & ruins, Badlands stratified mesas, Masadora bear/panda dome Spell Card Shop & polka-dot candy towers, Soufrabi cliffside lighthouse fortress & Pirates' Base & Razor's Dodgeball Court, Limeiro tiered hillside & white castle wings, Dorias golden sandstone casino castle & Risky Dice, Aiai pastel fairytale palace & floating glowing heart, Greed Island Port harbormaster office & stone breakwater & Elena's exit tower, Rubicuta cobbled isthmus crossroads, and Bandit Village palisade clearing & campfire cauldron.
## Ambient Audio
- **Ambient Audio**: Real-time Web Audio API synthesis (`src/game/audio.ts`, zero external audio files).

## Official Greed Island Card Scans (Personal / Non-Commercial Fan Project Use Only)
- **BOOK Cover** (`public/cards/book-cover.png`): User-supplied image of the Greed Island binder, displayed with its spine and original graphics.
- **Redrawn BOOK Cover** (`public/cards/book-cover-redrawn.png`): Transparent redraw of the user-supplied artwork made with ImageGen. The original input is retained separately.
- **Card Back** (`public/cards/back.png`): User-supplied photograph of the Bandai card. The source image and its printed credit line are retained.
- **All 164 Greed Island Card Images** (`public/cards/*.webp`, covering Specified `000–099`, 40 Spell Cards `1001–1040`, 20 Free Slot Cards `100–25008`, and 4 Game Master Cards `-000`–`-003`):
  - Source: [Hunterpedia — Greed Island Card Lists](https://hunterxhunter.fandom.com/wiki/Greed_Island_Card_Lists) (saved locally in `public/cards/` with zero runtime hotlinking).
  - Copyright Notice: **NOT CC0**. All official Greed Island card illustrations and designs are copyrighted works of **© POT (Yoshihiro Togashi) / Shueisha / Madhouse / VAP / Nippon TV / Bandai**, included locally solely for personal, non-commercial fan-project display at the user's explicit request.
