import * as THREE from 'three';
import { GameWorld } from './world';

export class PlayerController {
  public mesh: THREE.Group;
  public position = new THREE.Vector3(0, 0, 8);
  public velocityY = 0;
  public isGrounded = true;

  public yaw = 0; // 角色面向
  public camYaw = 0; // 鏡頭水平角
  public camPitch = 0.36; // 鏡頭俯仰角
  public camDistance = 10.5;

  private keys = new Set<string>();
  private isDragging = false;
  private lastMouseX = 0;
  private lastMouseY = 0;
  private canvas!: HTMLCanvasElement;
  private latestCamera: THREE.Camera | null = null;
  private latestWorld: GameWorld | null = null;
  private pointerDownX = 0;
  private pointerDownY = 0;
  private pointerDownTime = 0;
  private pointerMaxMoveSq = 0;
  private activeClickPointerId = -1;

  // Click-to-Move 狀態與 3D 地面目標標記
  private moveTarget: THREE.Vector3 | null = null;
  private clickSprint = false;
  private lastClickTime = 0;
  private lastClickPos = new THREE.Vector3();
  private stuckTimer = 0;
  private stuckCheckPos = new THREE.Vector3();
  private targetMarker!: THREE.Group;
  private markerOuterRing!: THREE.Mesh;
  private markerInnerRing!: THREE.Mesh;
  private markerDiamond!: THREE.Mesh;
  private markerPhase = 0;
  private _raycaster = new THREE.Raycaster();
  private _ndc = new THREE.Vector2();
  private _groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
  private _rayHit = new THREE.Vector3();

  private bodyGroup!: THREE.Group;
  private headGroup!: THREE.Group;
  private leftLeg!: THREE.Group;
  private rightLeg!: THREE.Group;
  private leftArm!: THREE.Group;
  private rightArm!: THREE.Group;
  private giRing!: THREE.Mesh;
  private auraRing!: THREE.Mesh;

  private walkPhase = 0;
  private idlePhase = 0;
  private speedBoostTimer = 0;
  private snapCamera = true;
  private currentCamDist = 10.5;
  private _forward = new THREE.Vector3();
  private _right = new THREE.Vector3();
  private _dir = new THREE.Vector3();
  private _camPivot = new THREE.Vector3();
  private _desiredCamPos = new THREE.Vector3();
  private _clippedCamPos = new THREE.Vector3();
  public inputEnabled = true;

  constructor(scene: THREE.Scene, canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.mesh = this.buildCharacter();
    this.mesh.position.copy(this.position);
    scene.add(this.mesh);
    this.targetMarker = this.buildDestinationMarker();
    scene.add(this.targetMarker);
    this.bindControls(canvas);
  }

  private buildCharacter(): THREE.Group {
    const g = new THREE.Group();

    // 材質定義（經典動漫獵人冒險家配色：-Z 為角色正面，+Z 為背面）
    const jacketMat = new THREE.MeshStandardMaterial({ color: 0x1f8250, roughness: 0.62 });
    const collarMat = new THREE.MeshStandardMaterial({ color: 0x14452b, roughness: 0.68 });
    const trimGoldMat = new THREE.MeshStandardMaterial({ color: 0xe8a838, roughness: 0.45, metalness: 0.12 });
    const shirtMat = new THREE.MeshStandardMaterial({ color: 0xf4f6f2, roughness: 0.72 });
    const skinMat = new THREE.MeshStandardMaterial({ color: 0xffdfc2, roughness: 0.58 });
    const neckShadeMat = new THREE.MeshStandardMaterial({ color: 0xf4cca8, roughness: 0.6 });
    const hairMat = new THREE.MeshStandardMaterial({ color: 0x162b22, roughness: 0.68, metalness: 0.08 });
    const hairHighlightMat = new THREE.MeshStandardMaterial({ color: 0x1e3b2f, roughness: 0.62, metalness: 0.1 });
    const beltMat = new THREE.MeshStandardMaterial({ color: 0x5d3a1f, roughness: 0.8 });
    const strapMat = new THREE.MeshStandardMaterial({ color: 0x472a14, roughness: 0.82 });
    const packMat = new THREE.MeshStandardMaterial({ color: 0x7d512e, roughness: 0.84 });
    const packPocketMat = new THREE.MeshStandardMaterial({ color: 0x94633a, roughness: 0.82 });
    const packFlapMat = new THREE.MeshStandardMaterial({ color: 0x623d20, roughness: 0.82 });
    const bedrollMat = new THREE.MeshStandardMaterial({ color: 0xcfb986, roughness: 0.88 });
    const bedrollEndMat = new THREE.MeshStandardMaterial({ color: 0xa48e5e, roughness: 0.9 });
    const brassMat = new THREE.MeshStandardMaterial({ color: 0xe2b346, roughness: 0.28, metalness: 0.72 });
    const bootMat = new THREE.MeshStandardMaterial({ color: 0x223632, roughness: 0.72 });
    const soleMat = new THREE.MeshStandardMaterial({ color: 0x182124, roughness: 0.88 });
    const laceMat = new THREE.MeshStandardMaterial({ color: 0xe7dcc2, roughness: 0.75 });
    const scleraMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.35 });
    const irisMat = new THREE.MeshStandardMaterial({ color: 0x4a2914, roughness: 0.3 });
    const pupilMat = new THREE.MeshStandardMaterial({ color: 0x140a06, roughness: 0.2 });
    const glintMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const mouthMat = new THREE.MeshStandardMaterial({ color: 0xc97b63, roughness: 0.6 });
    const blushMat = new THREE.MeshBasicMaterial({ color: 0xff9f96, transparent: true, opacity: 0.32 });

    // =========================================================================
    // 1. 關節雙腿（髖部樞紐位於 y = 0.78，靴底精準貼地 y = 0.00）
    // =========================================================================
    const buildLeg = (side: -1 | 1): THREE.Group => {
      const leg = new THREE.Group();
      leg.position.set(side * 0.17, 0.78, 0);

      // 綠色短褲大腿段
      const thigh = new THREE.Mesh(new THREE.CylinderGeometry(0.135, 0.118, 0.3, 12), jacketMat);
      thigh.position.y = -0.14;
      thigh.castShadow = true;
      leg.add(thigh);

      // 短褲褲管金橘滾邊
      const shortHem = new THREE.Mesh(new THREE.CylinderGeometry(0.123, 0.126, 0.045, 12), trimGoldMat);
      shortHem.position.y = -0.28;
      leg.add(shortHem);

      // 裸露膝蓋與小腿上段
      const kneeSeg = new THREE.Mesh(new THREE.CylinderGeometry(0.095, 0.09, 0.15, 12), skinMat);
      kneeSeg.position.y = -0.355;
      kneeSeg.castShadow = true;
      leg.add(kneeSeg);

      const kneecap = new THREE.Mesh(new THREE.SphereGeometry(0.088, 10, 8), skinMat);
      kneecap.position.set(0, -0.355, -0.02);
      kneecap.scale.set(0.95, 0.9, 0.75);
      leg.add(kneecap);

      // 深綠石板色冒險長靴（翻領＋金邊＋靴筒＋鞋帶＋圓頭靴鞋＋厚鞋底）
      const bootCuff = new THREE.Mesh(new THREE.CylinderGeometry(0.118, 0.106, 0.085, 12), collarMat);
      bootCuff.position.y = -0.445;
      bootCuff.castShadow = true;
      leg.add(bootCuff);

      const cuffTrim = new THREE.Mesh(new THREE.TorusGeometry(0.114, 0.013, 6, 14), trimGoldMat);
      cuffTrim.rotation.x = Math.PI / 2;
      cuffTrim.position.y = -0.405;
      leg.add(cuffTrim);

      const bootShaft = new THREE.Mesh(new THREE.CylinderGeometry(0.104, 0.095, 0.22, 12), bootMat);
      bootShaft.position.y = -0.585;
      bootShaft.castShadow = true;
      leg.add(bootShaft);

      // 前側（-Z）三道綁帶鞋帶
      for (let i = 0; i < 3; i++) {
        const lace = new THREE.Mesh(new THREE.BoxGeometry(0.072, 0.014, 0.024), laceMat);
        lace.position.set(0, -0.505 - i * 0.052, -0.098);
        leg.add(lace);
      }

      // 靴身與微圓鞋頭（朝 -Z 延伸）
      const foot = new THREE.Mesh(new THREE.BoxGeometry(0.19, 0.105, 0.25), bootMat);
      foot.position.set(0, -0.705, -0.042);
      foot.castShadow = true;
      leg.add(foot);

      const toe = new THREE.Mesh(new THREE.SphereGeometry(0.094, 10, 8), bootMat);
      toe.position.set(0, -0.708, -0.155);
      toe.scale.set(1.0, 0.56, 0.92);
      toe.castShadow = true;
      leg.add(toe);

      // 靴底（-0.7575 - 0.0225 = -0.780，對應髖部 y = 0.78 → 嚴格落地 y = 0）
      const sole = new THREE.Mesh(new THREE.BoxGeometry(0.206, 0.045, 0.315), soleMat);
      sole.position.set(0, -0.7575, -0.062);
      leg.add(sole);

      return leg;
    };

    this.leftLeg = buildLeg(-1);
    this.rightLeg = buildLeg(1);
    g.add(this.leftLeg, this.rightLeg);

    // =========================================================================
    // 2. 上半身主體群組（待機呼吸起伏與奔跑彈跳不影響腳掌貼地）
    // =========================================================================
    this.bodyGroup = new THREE.Group();
    g.add(this.bodyGroup);

    // 骨盆與短褲腰頭（銜接雙腿髖關節無縫隙）
    const pelvis = new THREE.Mesh(new THREE.CylinderGeometry(0.245, 0.275, 0.17, 14), jacketMat);
    pelvis.position.y = 0.81;
    pelvis.scale.set(1.12, 1, 0.76);
    pelvis.castShadow = true;
    this.bodyGroup.add(pelvis);

    // 棕色腰帶與黃銅帶扣（帶扣位於正面 -Z）
    const belt = new THREE.Mesh(new THREE.CylinderGeometry(0.262, 0.268, 0.088, 16), beltMat);
    belt.position.y = 0.885;
    belt.scale.set(1.12, 1, 0.79);
    this.bodyGroup.add(belt);

    const buckleFrame = new THREE.Mesh(new THREE.BoxGeometry(0.135, 0.098, 0.04), brassMat);
    buckleFrame.position.set(0, 0.885, -0.214);
    this.bodyGroup.add(buckleFrame);

    const buckleCore = new THREE.Mesh(new THREE.BoxGeometry(0.076, 0.052, 0.046), strapMat);
    buckleCore.position.set(0, 0.885, -0.215);
    this.bodyGroup.add(buckleCore);

    // 腰側冒險小皮包（左側）
    const hipPouch = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.14, 0.13), packPocketMat);
    hipPouch.position.set(-0.305, 0.85, -0.02);
    hipPouch.rotation.z = 0.12;
    this.bodyGroup.add(hipPouch);
    const hipPouchPin = new THREE.Mesh(new THREE.SphereGeometry(0.016, 8, 8), brassMat);
    hipPouchPin.position.set(-0.352, 0.855, -0.02);
    this.bodyGroup.add(hipPouchPin);

    // 分層收腰綠色獵人夾克軀幹
    const torso = new THREE.Mesh(new THREE.CylinderGeometry(0.278, 0.236, 0.56, 14), jacketMat);
    torso.position.y = 1.19;
    torso.scale.set(1.12, 1, 0.74);
    torso.castShadow = true;
    this.bodyGroup.add(torso);

    // 夾克下擺金橘滾邊
    const hemTrim = new THREE.Mesh(new THREE.CylinderGeometry(0.246, 0.262, 0.058, 14), trimGoldMat);
    hemTrim.position.y = 0.945;
    hemTrim.scale.set(1.13, 1, 0.76);
    this.bodyGroup.add(hemTrim);

    // 夾克肩線過渡
    const shoulderYoke = new THREE.Mesh(new THREE.CylinderGeometry(0.255, 0.288, 0.095, 14), jacketMat);
    shoulderYoke.position.y = 1.44;
    shoulderYoke.scale.set(1.16, 1, 0.74);
    shoulderYoke.castShadow = true;
    this.bodyGroup.add(shoulderYoke);

    // 正面（-Z）白色 V 領內搭衣
    const vNeckShape = new THREE.Shape();
    vNeckShape.moveTo(0, -0.14);
    vNeckShape.lineTo(0.115, 0.085);
    vNeckShape.lineTo(-0.115, 0.085);
    vNeckShape.closePath();
    const vNeckGeo = new THREE.ExtrudeGeometry(vNeckShape, { depth: 0.025, bevelEnabled: false });
    const vNeck = new THREE.Mesh(vNeckGeo, shirtMat);
    vNeck.position.set(0, 1.385, -0.214);
    this.bodyGroup.add(vNeck);

    // 正面夾克門襟金橘細邊（自 V 領底延伸至下擺）
    const frontZipTrim = new THREE.Mesh(new THREE.BoxGeometry(0.036, 0.31, 0.024), trimGoldMat);
    frontZipTrim.position.set(0, 1.11, -0.202);
    this.bodyGroup.add(frontZipTrim);

    // 深森林綠立領與左右翻領（+Z 後領圍繞至兩側，正面 -Z 開 V 領）
    const collarWallMat = new THREE.MeshStandardMaterial({
      color: 0x14452b,
      roughness: 0.68,
      side: THREE.DoubleSide,
    });
    const collarArc = new THREE.Mesh(
      new THREE.CylinderGeometry(0.155, 0.178, 0.115, 16, 1, true, -Math.PI + 0.5, Math.PI * 2 - 1.0),
      collarWallMat
    );
    collarArc.position.y = 1.49;
    this.bodyGroup.add(collarArc);

    const collarRim = new THREE.Mesh(
      new THREE.TorusGeometry(0.162, 0.022, 8, 18, Math.PI * 2 - 0.95),
      collarMat
    );
    collarRim.rotation.x = Math.PI / 2;
    collarRim.rotation.z = -Math.PI / 2 + 0.475;
    collarRim.position.y = 1.535;
    this.bodyGroup.add(collarRim);

    for (const side of [-1, 1] as const) {
      const lapel = new THREE.Mesh(new THREE.BoxGeometry(0.082, 0.25, 0.032), collarMat);
      lapel.position.set(side * 0.095, 1.35, -0.205);
      lapel.rotation.z = side * -0.34;
      lapel.rotation.y = side * -0.2;
      this.bodyGroup.add(lapel);

      const lapelPiping = new THREE.Mesh(new THREE.BoxGeometry(0.018, 0.245, 0.036), trimGoldMat);
      lapelPiping.position.set(side * 0.064, 1.345, -0.209);
      lapelPiping.rotation.z = side * -0.34;
      lapelPiping.rotation.y = side * -0.2;
      this.bodyGroup.add(lapelPiping);
    }

    // =========================================================================
    // 3. 精緻探險家背包（位於背面 +Z，第三人稱視角核心亮點）
    // =========================================================================
    const packGroup = new THREE.Group();
    packGroup.position.set(0, 1.2, 0.265);
    this.bodyGroup.add(packGroup);

    // 背包主體與圓潤側緣
    const packMain = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.46, 0.22), packMat);
    packMain.castShadow = true;
    packGroup.add(packMain);

    for (const side of [-1, 1] as const) {
      const packEdge = new THREE.Mesh(new THREE.CylinderGeometry(0.105, 0.108, 0.46, 10), packMat);
      packEdge.position.set(side * 0.205, 0, 0);
      packEdge.castShadow = true;
      packGroup.add(packEdge);
    }

    // 下方前袋與黃銅鈕扣
    const lowerPocket = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.165, 0.075), packPocketMat);
    lowerPocket.position.set(0, -0.115, 0.13);
    lowerPocket.castShadow = true;
    packGroup.add(lowerPocket);

    const pocketPin = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.022, 0.022, 10), brassMat);
    pocketPin.rotation.x = Math.PI / 2;
    pocketPin.position.set(0, -0.075, 0.172);
    packGroup.add(pocketPin);

    // 背包頂部覆蓋翻蓋
    const topFlap = new THREE.Mesh(new THREE.BoxGeometry(0.47, 0.125, 0.255), packFlapMat);
    topFlap.position.set(0, 0.205, 0.015);
    topFlap.rotation.x = 0.08;
    topFlap.castShadow = true;
    packGroup.add(topFlap);

    // 雙條皮革束帶＋黃銅扣環＋雙肩背帶
    for (const side of [-1, 1] as const) {
      const flapStrap = new THREE.Mesh(new THREE.BoxGeometry(0.048, 0.28, 0.028), strapMat);
      flapStrap.position.set(side * 0.125, 0.11, 0.132);
      packGroup.add(flapStrap);

      const clasp = new THREE.Mesh(new THREE.BoxGeometry(0.062, 0.056, 0.036), brassMat);
      clasp.position.set(side * 0.125, 0.095, 0.138);
      packGroup.add(clasp);

      // 橫跨肩頭的背包肩帶（從正面胸口繞到背面背包，緊貼夾克肩線）
      const shoulderStrap = new THREE.Mesh(new THREE.TorusGeometry(0.195, 0.023, 6, 16, Math.PI * 1.15), strapMat);
      shoulderStrap.rotation.y = Math.PI / 2;
      shoulderStrap.rotation.z = -0.18;
      shoulderStrap.position.set(side * 0.195, 1.285, 0.01);
      shoulderStrap.scale.set(1.08, 0.98, 0.8);
      this.bodyGroup.add(shoulderStrap);
    }

    // 頂部捲起的野營睡袋捲（橫向綁於背包上方，與後腦自然留白不穿模）
    const bedroll = new THREE.Mesh(new THREE.CylinderGeometry(0.084, 0.084, 0.54, 14), bedrollMat);
    bedroll.rotation.z = Math.PI / 2;
    bedroll.position.set(0, 0.305, 0.03);
    bedroll.castShadow = true;
    packGroup.add(bedroll);

    for (const side of [-1, 1] as const) {
      const rollSpiral = new THREE.Mesh(new THREE.CylinderGeometry(0.056, 0.056, 0.015, 12), bedrollEndMat);
      rollSpiral.rotation.z = Math.PI / 2;
      rollSpiral.position.set(side * 0.27, 0.305, 0.03);
      packGroup.add(rollSpiral);

      const rollTie = new THREE.Mesh(new THREE.TorusGeometry(0.088, 0.014, 6, 14), strapMat);
      rollTie.rotation.y = Math.PI / 2;
      rollTie.position.set(side * 0.145, 0.305, 0.03);
      packGroup.add(rollTie);
    }

    // =========================================================================
    // 4. 關節雙臂（肩部樞紐位於 y = 1.40，右手配戴發光黃金「貪婪之島戒指」）
    // =========================================================================
    const buildArm = (side: -1 | 1): THREE.Group => {
      const arm = new THREE.Group();
      arm.position.set(side * 0.355, 1.40, 0);

      // 圓潤肩蓋與短袖
      const shoulder = new THREE.Mesh(new THREE.SphereGeometry(0.112, 10, 10), jacketMat);
      shoulder.position.y = -0.02;
      shoulder.castShadow = true;
      arm.add(shoulder);

      const sleeve = new THREE.Mesh(new THREE.CylinderGeometry(0.104, 0.114, 0.21, 12), jacketMat);
      sleeve.position.y = -0.115;
      sleeve.castShadow = true;
      arm.add(sleeve);

      // 袖口深綠折邊＋金橘飾條
      const sleeveCuff = new THREE.Mesh(new THREE.CylinderGeometry(0.116, 0.12, 0.044, 12), collarMat);
      sleeveCuff.position.y = -0.22;
      arm.add(sleeveCuff);

      const sleeveGold = new THREE.Mesh(new THREE.TorusGeometry(0.117, 0.011, 6, 14), trimGoldMat);
      sleeveGold.rotation.x = Math.PI / 2;
      sleeveGold.position.y = -0.238;
      arm.add(sleeveGold);

      // 裸露前臂
      const forearm = new THREE.Mesh(new THREE.CylinderGeometry(0.072, 0.062, 0.27, 12), skinMat);
      forearm.position.y = -0.355;
      forearm.castShadow = true;
      arm.add(forearm);

      // 圓潤手掌與拇指
      const hand = new THREE.Mesh(new THREE.SphereGeometry(0.072, 10, 10), skinMat);
      hand.position.set(0, -0.515, -0.01);
      hand.scale.set(0.92, 1.12, 0.88);
      hand.castShadow = true;
      arm.add(hand);

      const thumb = new THREE.Mesh(new THREE.SphereGeometry(0.028, 8, 8), skinMat);
      thumb.position.set(-side * 0.052, -0.495, -0.036);
      thumb.scale.set(0.85, 1.2, 0.85);
      arm.add(thumb);

      if (side === -1) {
        // 左手深綠護腕
        const wristband = new THREE.Mesh(new THREE.CylinderGeometry(0.069, 0.068, 0.055, 10), collarMat);
        wristband.position.y = -0.445;
        arm.add(wristband);
      } else {
        // 右手經典發光「貪婪之島戒指」（醒目黃金光暈＋寶石亮點）
        const giRingMat = new THREE.MeshStandardMaterial({
          color: 0xffe58f,
          emissive: 0xffc93c,
          emissiveIntensity: 0.9,
          metalness: 0.72,
          roughness: 0.2,
        });
        this.giRing = new THREE.Mesh(new THREE.TorusGeometry(0.084, 0.023, 10, 20), giRingMat);
        this.giRing.position.set(0, -0.515, -0.01);
        this.giRing.rotation.x = Math.PI / 2;
        arm.add(this.giRing);

        const ringCrest = new THREE.Mesh(
          new THREE.OctahedronGeometry(0.032, 0),
          new THREE.MeshBasicMaterial({ color: 0xfff8cf })
        );
        ringCrest.position.set(0.084, -0.515, 0.02);
        arm.add(ringCrest);
      }

      return arm;
    };

    this.leftArm = buildArm(-1);
    this.rightArm = buildArm(1);
    this.leftArm.rotation.z = -0.07;
    this.rightArm.rotation.z = 0.07;
    this.bodyGroup.add(this.leftArm, this.rightArm);

    // =========================================================================
    // 5. 頸部、橢圓動漫頭雕、神采五官（朝 -Z）與多層次墨綠刺蝟髮型（總高 ~2.32m）
    // =========================================================================
    const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.085, 0.1, 0.145, 12), neckShadeMat);
    neck.position.y = 1.52;
    this.bodyGroup.add(neck);

    this.headGroup = new THREE.Group();
    this.headGroup.position.set(0, 1.77, 0);
    this.bodyGroup.add(this.headGroup);

    // 略呈鵝蛋形的動漫頭部
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.285, 20, 18), skinMat);
    head.scale.set(0.98, 1.05, 0.96);
    head.castShadow = true;
    this.headGroup.add(head);

    // 雙耳
    for (const side of [-1, 1] as const) {
      const ear = new THREE.Mesh(new THREE.SphereGeometry(0.068, 10, 8), skinMat);
      ear.position.set(side * 0.275, -0.02, 0.01);
      ear.scale.set(0.46, 0.95, 0.72);
      this.headGroup.add(ear);

      const innerEar = new THREE.Mesh(new THREE.SphereGeometry(0.04, 8, 8), neckShadeMat);
      innerEar.position.set(side * 0.282, -0.022, -0.005);
      innerEar.scale.set(0.35, 0.72, 0.55);
      this.headGroup.add(innerEar);
    }

    // 動漫眼神（白色眼白＋深棕虹膜＋瞳孔＋亮白高光點＋上睫毛＋英氣眉毛，朝 -Z）
    for (const side of [-1, 1] as const) {
      const eyeGroup = new THREE.Group();
      eyeGroup.position.set(side * 0.102, -0.008, -0.248);
      eyeGroup.rotation.y = side * -0.28;
      this.headGroup.add(eyeGroup);

      const sclera = new THREE.Mesh(new THREE.SphereGeometry(0.056, 12, 10), scleraMat);
      sclera.scale.set(1.06, 1.24, 0.34);
      eyeGroup.add(sclera);

      const iris = new THREE.Mesh(new THREE.SphereGeometry(0.041, 12, 10), irisMat);
      iris.position.set(-side * 0.006, -0.004, -0.01);
      iris.scale.set(0.96, 1.2, 0.34);
      eyeGroup.add(iris);

      const pupil = new THREE.Mesh(new THREE.SphereGeometry(0.022, 10, 8), pupilMat);
      pupil.position.set(-side * 0.006, -0.005, -0.017);
      pupil.scale.set(0.92, 1.15, 0.34);
      eyeGroup.add(pupil);

      const glintMain = new THREE.Mesh(new THREE.SphereGeometry(0.015, 8, 8), glintMat);
      glintMain.position.set(0.014, 0.022, -0.023);
      eyeGroup.add(glintMain);

      const glintSub = new THREE.Mesh(new THREE.SphereGeometry(0.0075, 8, 8), glintMat);
      glintSub.position.set(-0.016, -0.02, -0.022);
      eyeGroup.add(glintSub);

      const lash = new THREE.Mesh(new THREE.BoxGeometry(0.118, 0.018, 0.02), hairMat);
      lash.position.set(0, 0.062, -0.012);
      lash.rotation.z = side * -0.08;
      eyeGroup.add(lash);

      // 眉毛
      const brow = new THREE.Mesh(new THREE.BoxGeometry(0.106, 0.021, 0.018), hairMat);
      brow.position.set(0, 0.105, -0.008);
      brow.rotation.z = side * -0.14;
      eyeGroup.add(brow);

      // 臉頰微紅氣色
      const blush = new THREE.Mesh(new THREE.CircleGeometry(0.036, 10), blushMat);
      blush.position.set(side * 0.042, -0.075, -0.008);
      blush.rotation.y = Math.PI;
      eyeGroup.add(blush);
    }

    // 小巧鼻尖與開朗微笑（朝 -Z）
    const nose = new THREE.Mesh(new THREE.SphereGeometry(0.017, 8, 6), neckShadeMat);
    nose.position.set(0, -0.058, -0.276);
    nose.scale.set(0.85, 0.75, 1.0);
    this.headGroup.add(nose);

    const smile = new THREE.Mesh(
      new THREE.TorusGeometry(0.04, 0.0085, 6, 12, Math.PI * 0.72),
      mouthMat
    );
    smile.position.set(0, -0.105, -0.256);
    smile.rotation.z = Math.PI + Math.PI * 0.14;
    this.headGroup.add(smile);

    // 墨綠光澤雕塑髮帽（涵蓋頭頂與後腦 +Z，精準停在眉骨之上不遮眼神）
    const hairCap = new THREE.Mesh(
      new THREE.SphereGeometry(0.304, 18, 14, 0, Math.PI * 2, 0, Math.PI * 0.38),
      hairMat
    );
    hairCap.position.set(0, 0.032, 0.022);
    hairCap.scale.set(1.01, 1.03, 1.02);
    hairCap.castShadow = true;
    this.headGroup.add(hairCap);

    // 後腦蓬鬆髮量層（+Z 方向立體包覆）
    const backHairVolume = new THREE.Mesh(new THREE.SphereGeometry(0.272, 14, 12), hairMat);
    backHairVolume.position.set(0, -0.015, 0.076);
    backHairVolume.scale.set(1.04, 0.98, 0.95);
    backHairVolume.castShadow = true;
    this.headGroup.add(backHairVolume);

    // 兩鬢碎髮與前額劉海（清晰露出完整眉毛與動漫大眼）
    for (const side of [-1, 1] as const) {
      const sideburn = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.2, 6), hairMat);
      sideburn.position.set(side * 0.262, -0.045, -0.055);
      sideburn.rotation.z = side * -0.14;
      sideburn.rotation.x = Math.PI + 0.12;
      this.headGroup.add(sideburn);
    }

    for (const [bx, by, bz, bh, rz, rx] of [
      [-0.13, 0.228, -0.232, 0.135, 0.44, -0.36],
      [0, 0.244, -0.246, 0.125, 0.0, -0.42],
      [0.13, 0.228, -0.232, 0.135, -0.44, -0.36],
    ]) {
      const bang = new THREE.Mesh(new THREE.ConeGeometry(0.058, bh, 6), hairHighlightMat);
      bang.position.set(bx, by, bz);
      bang.rotation.set(rx, 0, rz);
      this.headGroup.add(bang);
    }

    // 9 束多層次斜上後揚的經典動漫刺蝟髮刺（第三人稱背面視覺層次極佳！）
    const spikeConfigs: Array<{
      pos: [number, number, number];
      r: number;
      h: number;
      rot: [number, number, number];
      scale?: [number, number, number];
      hi?: boolean;
    }> = [
      // 頂層 3 束主髮刺（高度達 ~2.32m）
      { pos: [0, 0.355, 0.065], r: 0.135, h: 0.42, rot: [0.3, 0, 0], scale: [1.0, 1.0, 0.92] },
      { pos: [-0.145, 0.325, 0.045], r: 0.12, h: 0.38, rot: [0.26, 0, 0.34], scale: [0.95, 1.0, 0.9], hi: true },
      { pos: [0.145, 0.325, 0.045], r: 0.12, h: 0.38, rot: [0.26, 0, -0.34], scale: [0.95, 1.0, 0.9], hi: true },
      // 中層 4 束後揚與前冠髮刺
      { pos: [0, 0.33, -0.105], r: 0.115, h: 0.33, rot: [-0.08, 0, 0], hi: true },
      { pos: [0, 0.245, 0.225], r: 0.128, h: 0.37, rot: [0.76, 0, 0] },
      { pos: [-0.205, 0.215, 0.16], r: 0.112, h: 0.34, rot: [0.56, 0, 0.54] },
      { pos: [0.205, 0.215, 0.16], r: 0.112, h: 0.34, rot: [0.56, 0, -0.54] },
      // 下後層 2 束後頸外張髮尾
      { pos: [-0.145, 0.065, 0.245], r: 0.102, h: 0.28, rot: [1.12, 0, 0.38], hi: true },
      { pos: [0.145, 0.065, 0.245], r: 0.102, h: 0.28, rot: [1.12, 0, -0.38], hi: true },
    ];

    for (const s of spikeConfigs) {
      const spike = new THREE.Mesh(
        new THREE.ConeGeometry(s.r, s.h, 7),
        s.hi ? hairHighlightMat : hairMat
      );
      spike.position.set(s.pos[0], s.pos[1], s.pos[2]);
      spike.rotation.set(s.rot[0], s.rot[1], s.rot[2]);
      if (s.scale) spike.scale.set(s.scale[0], s.scale[1], s.scale[2]);
      spike.castShadow = true;
      this.headGroup.add(spike);
    }

    // 腳下念氣光環（加速時發亮）
    this.auraRing = new THREE.Mesh(
      new THREE.RingGeometry(0.55, 0.78, 28),
      new THREE.MeshBasicMaterial({
        color: 0x38e4c5,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.0,
      })
    );
    this.auraRing.rotation.x = -Math.PI / 2;
    this.auraRing.position.y = 0.05;
    g.add(this.auraRing);

    return g;
  }

  private buildDestinationMarker(): THREE.Group {
    const marker = new THREE.Group();
    marker.position.set(0, 0.08, 0);
    marker.visible = false;

    // 外圈發光念氣青色光環
    const outerGeo = new THREE.RingGeometry(0.56, 0.72, 32);
    const outerMat = new THREE.MeshBasicMaterial({
      color: 0x38e4c5,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.82,
      depthWrite: false,
    });
    this.markerOuterRing = new THREE.Mesh(outerGeo, outerMat);
    this.markerOuterRing.rotation.x = -Math.PI / 2;
    marker.add(this.markerOuterRing);

    // 內圈貪婪之島金色符紋環
    const innerGeo = new THREE.RingGeometry(0.28, 0.4, 24);
    const innerMat = new THREE.MeshBasicMaterial({
      color: 0xffd166,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.9,
      depthWrite: false,
    });
    this.markerInnerRing = new THREE.Mesh(innerGeo, innerMat);
    this.markerInnerRing.rotation.x = -Math.PI / 2;
    this.markerInnerRing.position.y = 0.01;
    marker.add(this.markerInnerRing);

    // 懸浮律動的菱形目標水晶
    const diamondGeo = new THREE.OctahedronGeometry(0.16, 0);
    const diamondMat = new THREE.MeshStandardMaterial({
      color: 0xffe58f,
      emissive: 0x38e4c5,
      emissiveIntensity: 0.85,
      roughness: 0.25,
      metalness: 0.45,
    });
    this.markerDiamond = new THREE.Mesh(diamondGeo, diamondMat);
    this.markerDiamond.position.set(0, 0.42, 0);
    this.markerDiamond.scale.set(0.75, 1.35, 0.75);
    marker.add(this.markerDiamond);

    return marker;
  }

  private handleGroundClick(clientX: number, clientY: number): void {
    if (!this.latestCamera || !this.inputEnabled) return;

    const rect = this.canvas.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return;

    this._ndc.x = ((clientX - rect.left) / rect.width) * 2 - 1;
    this._ndc.y = -((clientY - rect.top) / rect.height) * 2 + 1;

    this._groundPlane.constant = -this.position.y;
    this._raycaster.setFromCamera(this._ndc, this.latestCamera);
    const hit = this._raycaster.ray.intersectPlane(this._groundPlane, this._rayHit);
    if (!hit) return;

    const distFromPlayer = Math.hypot(hit.x - this.position.x, hit.z - this.position.z);
    if (!Number.isFinite(distFromPlayer) || distFromPlayer > 140) return;

    const now = performance.now();
    const nearLastClick =
      Math.hypot(hit.x - this.lastClickPos.x, hit.z - this.lastClickPos.z) < 4.0;
    this.clickSprint = now - this.lastClickTime < 350 && nearLastClick;
    this.lastClickTime = now;
    this.lastClickPos.set(hit.x, 0, hit.z);

    if (distFromPlayer <= 0.55) {
      this.clearMoveTarget();
      return;
    }

    this.moveTarget = new THREE.Vector3(hit.x, 0, hit.z);
    this.stuckTimer = 0;
    this.stuckCheckPos.set(this.position.x, 0, this.position.z);

    const clickGroundY = this.latestWorld
      ? this.latestWorld.getGroundHeightAt(hit.x, hit.z, this.position.y).groundY
      : 0;
    this.markerPhase = 0;
    this.targetMarker.position.set(hit.x, clickGroundY + 0.08, hit.z);
    this.targetMarker.visible = true;
  }

  public clearMoveTarget(): void {
    this.moveTarget = null;
    this.clickSprint = false;
    this.stuckTimer = 0;
    if (this.targetMarker) {
      this.targetMarker.visible = false;
    }
  }

  private bindControls(canvas: HTMLCanvasElement): void {
    window.addEventListener('keydown', (e) => {
      this.keys.add(e.code);
      if (e.code === 'Space' && this.inputEnabled && this.isGrounded) {
        this.velocityY = 9.2;
        this.isGrounded = false;
      }
    });

    window.addEventListener('keyup', (e) => {
      this.keys.delete(e.code);
    });

    canvas.addEventListener('pointerdown', (e) => {
      if (!this.inputEnabled) return;
      this.isDragging = true;
      this.lastMouseX = e.clientX;
      this.lastMouseY = e.clientY;
      if (e.button === 0 && e.target === this.canvas) {
        this.pointerDownX = e.clientX;
        this.pointerDownY = e.clientY;
        this.pointerDownTime = performance.now();
        this.pointerMaxMoveSq = 0;
        this.activeClickPointerId = e.pointerId;
      } else {
        this.activeClickPointerId = -1;
      }
    });

    window.addEventListener('pointerup', (e) => {
      const wasDragging = this.isDragging;
      this.isDragging = false;
      if (
        wasDragging &&
        this.inputEnabled &&
        e.button === 0 &&
        e.pointerId === this.activeClickPointerId &&
        e.target === this.canvas
      ) {
        const elapsed = performance.now() - this.pointerDownTime;
        const endDx = e.clientX - this.pointerDownX;
        const endDy = e.clientY - this.pointerDownY;
        const maxMoveSq = Math.max(this.pointerMaxMoveSq, endDx * endDx + endDy * endDy);
        if (elapsed < 350 && maxMoveSq < 36) {
          this.handleGroundClick(e.clientX, e.clientY);
        }
      }
      if (e.pointerId === this.activeClickPointerId) {
        this.activeClickPointerId = -1;
      }
    });

    window.addEventListener('pointercancel', (e) => {
      this.isDragging = false;
      if (e.pointerId === this.activeClickPointerId) {
        this.activeClickPointerId = -1;
      }
    });

    window.addEventListener('blur', () => {
      this.keys.clear();
      this.isDragging = false;
      this.activeClickPointerId = -1;
    });

    window.addEventListener('pointermove', (e) => {
      if (!this.isDragging || !this.inputEnabled) return;
      if (e.pointerId === this.activeClickPointerId) {
        const totalDx = e.clientX - this.pointerDownX;
        const totalDy = e.clientY - this.pointerDownY;
        const distSq = totalDx * totalDx + totalDy * totalDy;
        if (distSq > this.pointerMaxMoveSq) {
          this.pointerMaxMoveSq = distSq;
        }
      }
      const dx = e.clientX - this.lastMouseX;
      const dy = e.clientY - this.lastMouseY;
      this.lastMouseX = e.clientX;
      this.lastMouseY = e.clientY;
      this.camYaw -= dx * 0.006;
      this.camPitch = THREE.MathUtils.clamp(this.camPitch + dy * 0.0045, 0.14, 1.15);
    });

    canvas.addEventListener(
      'wheel',
      (e) => {
        if (!this.inputEnabled) return;
        this.camDistance = THREE.MathUtils.clamp(this.camDistance + e.deltaY * 0.008, 5.5, 18);
      },
      { passive: true }
    );
  }

  public teleportTo(x: number, y: number, z: number, facingYaw = 0): void {
    this.clearMoveTarget();
    const snappedY = this.latestWorld
      ? Math.max(y, this.latestWorld.getGroundHeightAt(x, z, y).groundY + 0.025)
      : y;
    this.position.set(x, snappedY, z);
    this.velocityY = 0;
    this.isGrounded = true;
    this.yaw = facingYaw;
    this.camYaw = facingYaw;
    this.snapCamera = true;
    this.mesh.position.copy(this.position);
    this.mesh.rotation.y = this.yaw;
  }

  public triggerSpeedBoost(seconds = 15): void {
    this.speedBoostTimer = Math.max(this.speedBoostTimer, seconds);
  }

  public update(dt: number, world: GameWorld, camera: THREE.PerspectiveCamera): void {
    this.latestCamera = camera;
    this.latestWorld = world;

    if (!this.inputEnabled && this.moveTarget) {
      this.clearMoveTarget();
    }

    if (this.speedBoostTimer > 0) {
      this.speedBoostTimer = Math.max(0, this.speedBoostTimer - dt);
    }

    const auraMat = this.auraRing.material as THREE.MeshBasicMaterial;
    auraMat.opacity = this.speedBoostTimer > 0 ? 0.65 : 0.0;
    if (this.speedBoostTimer > 0) {
      this.auraRing.rotation.z += dt * 3;
    }

    let moveForward = 0;
    let moveRight = 0;
    if (this.inputEnabled) {
      if (this.keys.has('KeyW') || this.keys.has('ArrowUp')) moveForward += 1;
      if (this.keys.has('KeyS') || this.keys.has('ArrowDown')) moveForward -= 1;
      if (this.keys.has('KeyD') || this.keys.has('ArrowRight')) moveRight += 1;
      if (this.keys.has('KeyA') || this.keys.has('ArrowLeft')) moveRight -= 1;
    }

    const hasKeyboardMove = moveForward !== 0 || moveRight !== 0;
    if (hasKeyboardMove && this.moveTarget) {
      this.clearMoveTarget();
    }

    const isShiftSprinting = this.keys.has('ShiftLeft') || this.keys.has('ShiftRight');
    let isMoving = false;
    let isSprinting = isShiftSprinting;
    let isClickMoving = false;

    const moveWithSubsteps = (dx: number, dz: number) => {
      const total = Math.hypot(dx, dz);
      if (total < 1e-6) return;
      const steps = Math.max(1, Math.ceil(total / 0.35));
      const sx = dx / steps;
      const sz = dz / steps;
      for (let i = 0; i < steps; i++) {
        this.position.x += sx;
        this.position.z += sz;
        world.resolveCollision(this.position, 0.72);
      }
    };

    if (hasKeyboardMove) {
      isMoving = true;
      const baseSpeed = isSprinting ? 22.0 : 10.5;
      const speed = this.speedBoostTimer > 0 ? baseSpeed * 1.45 : baseSpeed;

      this._forward.set(-Math.sin(this.camYaw), 0, -Math.cos(this.camYaw));
      this._right.set(Math.cos(this.camYaw), 0, -Math.sin(this.camYaw));
      this._dir
        .set(0, 0, 0)
        .addScaledVector(this._forward, moveForward)
        .addScaledVector(this._right, moveRight)
        .normalize();

      moveWithSubsteps(this._dir.x * speed * dt, this._dir.z * speed * dt);

      const targetYaw = Math.atan2(-this._dir.x, -this._dir.z);
      let diff = targetYaw - this.yaw;
      while (diff > Math.PI) diff -= Math.PI * 2;
      while (diff < -Math.PI) diff += Math.PI * 2;
      this.yaw += diff * Math.min(1, dt * 12);

      this.walkPhase += dt * (isSprinting ? 14 : 9.5);
    } else if (this.inputEnabled && this.moveTarget) {
      const dx = this.moveTarget.x - this.position.x;
      const dz = this.moveTarget.z - this.position.z;
      const dist = Math.hypot(dx, dz);

      if (dist <= 0.55) {
        this.clearMoveTarget();
        this.walkPhase = 0;
      } else {
        isMoving = true;
        isClickMoving = true;
        isSprinting = isShiftSprinting || this.clickSprint;
        const baseSpeed = isSprinting ? 22.0 : 10.5;
        const speed = this.speedBoostTimer > 0 ? baseSpeed * 1.45 : baseSpeed;

        this._dir.set(dx / dist, 0, dz / dist);
        const step = Math.min(speed * dt, dist);
        moveWithSubsteps(this._dir.x * step, this._dir.z * step);

        const targetYaw = Math.atan2(-this._dir.x, -this._dir.z);
        let diff = targetYaw - this.yaw;
        while (diff > Math.PI) diff -= Math.PI * 2;
        while (diff < -Math.PI) diff += Math.PI * 2;
        this.yaw += diff * Math.min(1, dt * 12);

        this.walkPhase += dt * (isSprinting ? 14 : 9.5);
      }
    } else {
      this.walkPhase = 0;
    }

    // 最終水平碰撞修正（確保靜止或落地時亦絕不穿模）
    world.resolveCollision(this.position, 0.72);

    // 即時地面高度貼合（斜坡、台階、抬升廣場、木棧道、沙灘與水面皆穩穩承托靴底，絕不吃腳）
    const groundInfo = world.getGroundHeightAt(this.position.x, this.position.z, this.position.y);
    const targetGroundY = groundInfo.groundY + 0.025;

    if (this.isGrounded) {
      const drop = this.position.y - targetGroundY;
      if (targetGroundY >= this.position.y) {
        // 上坡／踏階：立即托起不低於地面，確保靴底絕不陷入坡面或台階
        this.position.y = targetGroundY;
        this.velocityY = 0;
      } else if (drop <= 1.25) {
        // 緩坡下坡：平滑貼合地面不懸浮
        this.position.y = THREE.MathUtils.lerp(this.position.y, targetGroundY, Math.min(1, dt * 20));
        if (Math.abs(this.position.y - targetGroundY) < 0.01) {
          this.position.y = targetGroundY;
        }
        this.velocityY = 0;
      } else {
        // 踏出高台邊緣：進入自然重力下落
        this.isGrounded = false;
      }
    }

    if (!this.isGrounded) {
      this.velocityY -= 24 * dt;
      this.position.y += this.velocityY * dt;
      if (this.position.y <= targetGroundY && this.velocityY <= 0) {
        this.position.y = targetGroundY;
        this.velocityY = 0;
        this.isGrounded = true;
      }
    }

    // Click-to-Move 卡牆防護與地面目標標記脈動動畫
    if (isClickMoving && this.moveTarget) {
      this.stuckTimer += dt;
      if (this.stuckTimer >= 0.55) {
        const movedDist = Math.hypot(
          this.position.x - this.stuckCheckPos.x,
          this.position.z - this.stuckCheckPos.z
        );
        if (movedDist < 0.25) {
          this.clearMoveTarget();
        } else {
          this.stuckTimer = 0;
          this.stuckCheckPos.set(this.position.x, 0, this.position.z);
        }
      }
    }

    if (this.moveTarget && this.targetMarker.visible) {
      const pulseSpeed = this.clickSprint ? 6.5 : 4.2;
      this.markerPhase += dt * pulseSpeed;
      const pulse = 1.0 + Math.sin(this.markerPhase) * 0.14;
      this.markerOuterRing.scale.set(pulse, pulse, 1);
      (this.markerOuterRing.material as THREE.MeshBasicMaterial).opacity =
        0.58 + Math.cos(this.markerPhase) * 0.26;
      this.markerInnerRing.rotation.z -= dt * (this.clickSprint ? 3.2 : 1.8);
      this.markerDiamond.position.y = 0.42 + Math.sin(this.markerPhase * 1.15) * 0.12;
      this.markerDiamond.rotation.y += dt * (this.clickSprint ? 4.5 : 2.6);
    }

    // 套用模型位置與平滑步態／待機呼吸動畫（腳掌於待機時嚴格貼地 y = 0）
    this.mesh.position.copy(this.position);
    this.mesh.rotation.y = this.yaw;

    this.idlePhase += dt * 2.4;
    const breathe = Math.sin(this.idlePhase);
    const limbBlend = Math.min(1, dt * 16);
    const bodyBlend = Math.min(1, dt * 12);

    if (!this.isGrounded) {
      // 跳躍滯空姿態
      this.leftLeg.rotation.x = THREE.MathUtils.lerp(this.leftLeg.rotation.x, 0.35, limbBlend);
      this.rightLeg.rotation.x = THREE.MathUtils.lerp(this.rightLeg.rotation.x, -0.28, limbBlend);
      this.leftArm.rotation.x = THREE.MathUtils.lerp(this.leftArm.rotation.x, -0.45, limbBlend);
      this.rightArm.rotation.x = THREE.MathUtils.lerp(this.rightArm.rotation.x, 0.32, limbBlend);
      this.leftArm.rotation.z = THREE.MathUtils.lerp(this.leftArm.rotation.z, -0.26, limbBlend);
      this.rightArm.rotation.z = THREE.MathUtils.lerp(this.rightArm.rotation.z, 0.26, limbBlend);
      this.bodyGroup.position.y = THREE.MathUtils.lerp(this.bodyGroup.position.y, 0.03, bodyBlend);
      this.bodyGroup.rotation.x = THREE.MathUtils.lerp(this.bodyGroup.rotation.x, -0.08, bodyBlend);
      this.bodyGroup.rotation.y = THREE.MathUtils.lerp(this.bodyGroup.rotation.y, 0, bodyBlend);
    } else if (isMoving) {
      const swingAmp = isSprinting ? 0.78 : 0.62;
      const swing = Math.sin(this.walkPhase) * swingAmp;
      this.leftLeg.rotation.x = THREE.MathUtils.lerp(this.leftLeg.rotation.x, swing, limbBlend);
      this.rightLeg.rotation.x = THREE.MathUtils.lerp(this.rightLeg.rotation.x, -swing, limbBlend);
      this.leftArm.rotation.x = THREE.MathUtils.lerp(this.leftArm.rotation.x, -swing * 0.82, limbBlend);
      this.rightArm.rotation.x = THREE.MathUtils.lerp(this.rightArm.rotation.x, swing * 0.82, limbBlend);
      this.leftArm.rotation.z = THREE.MathUtils.lerp(this.leftArm.rotation.z, -0.1, limbBlend);
      this.rightArm.rotation.z = THREE.MathUtils.lerp(this.rightArm.rotation.z, 0.1, limbBlend);

      const bounce = Math.abs(Math.sin(this.walkPhase)) * (isSprinting ? 0.062 : 0.038);
      const targetLean = isSprinting ? -0.1 : -0.045;
      this.bodyGroup.position.y = THREE.MathUtils.lerp(this.bodyGroup.position.y, bounce, Math.min(1, dt * 18));
      this.bodyGroup.rotation.x = THREE.MathUtils.lerp(this.bodyGroup.rotation.x, targetLean, bodyBlend);
      this.bodyGroup.rotation.y = THREE.MathUtils.lerp(this.bodyGroup.rotation.y, -swing * 0.1, bodyBlend);
    } else {
      this.leftLeg.rotation.x = THREE.MathUtils.lerp(this.leftLeg.rotation.x, 0, limbBlend);
      this.rightLeg.rotation.x = THREE.MathUtils.lerp(this.rightLeg.rotation.x, 0, limbBlend);
      this.leftArm.rotation.x = THREE.MathUtils.lerp(this.leftArm.rotation.x, 0, limbBlend);
      this.rightArm.rotation.x = THREE.MathUtils.lerp(this.rightArm.rotation.x, 0, limbBlend);
      this.leftArm.rotation.z = THREE.MathUtils.lerp(this.leftArm.rotation.z, -0.07 - breathe * 0.02, limbBlend);
      this.rightArm.rotation.z = THREE.MathUtils.lerp(this.rightArm.rotation.z, 0.07 + breathe * 0.02, limbBlend);

      this.bodyGroup.position.y = THREE.MathUtils.lerp(this.bodyGroup.position.y, breathe * 0.018, Math.min(1, dt * 8));
      this.bodyGroup.rotation.x = THREE.MathUtils.lerp(this.bodyGroup.rotation.x, 0, bodyBlend);
      this.bodyGroup.rotation.y = THREE.MathUtils.lerp(this.bodyGroup.rotation.y, 0, bodyBlend);
    }

    this.headGroup.rotation.x = THREE.MathUtils.lerp(
      this.headGroup.rotation.x,
      isMoving ? 0.03 : breathe * 0.02,
      bodyBlend
    );
    const ringMat = this.giRing.material as THREE.MeshStandardMaterial;
    ringMat.emissiveIntensity = 0.85 + Math.sin(this.idlePhase * 2.0) * 0.25;

    // 第三人稱鏡頭跟隨 + 防遮擋拉近（遇到建築、石柱、高塔時自動前拉，空曠時平滑回彈）
    this._camPivot.set(this.position.x, this.position.y + 1.65, this.position.z);
    const cosPitch = Math.cos(this.camPitch);
    const sinPitch = Math.sin(this.camPitch);
    const dirX = Math.sin(this.camYaw) * cosPitch;
    const dirY = sinPitch;
    const dirZ = Math.cos(this.camYaw) * cosPitch;

    this._desiredCamPos.set(
      this._camPivot.x + dirX * this.camDistance,
      Math.max(1.2, this._camPivot.y + dirY * this.camDistance + 0.45),
      this._camPivot.z + dirZ * this.camDistance
    );

    const safeDist = world.computeSafeCameraDistance(
      this._camPivot,
      this._desiredCamPos,
      this.camDistance
    );

    const isOccluded = safeDist < this.camDistance - 0.05;
    const isPullingIn = safeDist < this.currentCamDist;

    if (this.snapCamera || isPullingIn) {
      // 遇遮擋需拉近時立即收至安全距離，避免快速甩視角短暫穿牆
      this.currentCamDist = safeDist;
    } else {
      // 離開遮擋後平滑回彈到期望距離
      this.currentCamDist = THREE.MathUtils.lerp(this.currentCamDist, safeDist, Math.min(1, dt * 7));
    }

    const ratio = this.camDistance > 0.001 ? this.currentCamDist / this.camDistance : 1;
    this._clippedCamPos.lerpVectors(this._camPivot, this._desiredCamPos, ratio);
    this._clippedCamPos.y = Math.max(1.2, this._clippedCamPos.y);

    if (this.snapCamera || isPullingIn || isOccluded) {
      // 遮擋收近時直接定位於安全點，避免第二層 Lerp 把鏡頭拖進牆內
      camera.position.copy(this._clippedCamPos);
      this.snapCamera = false;
    } else {
      camera.position.lerp(this._clippedCamPos, Math.min(1, dt * 11));
    }
    camera.lookAt(this._camPivot);
  }
}
