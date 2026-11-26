import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

export interface PlaceModelOptions {
  x: number;
  y?: number;
  z: number;
  targetHeight?: number;
  scale?: number;
  rotY?: number;
  castShadow?: boolean;
  receiveShadow?: boolean;
}

export class ModelLibrary {
  private loader = new GLTFLoader();
  private cache = new Map<string, Promise<THREE.Group | null>>();

  public load(fileName: string): Promise<THREE.Group | null> {
    if (!this.cache.has(fileName)) {
      const url = `./models/${fileName}`;
      const promise = new Promise<THREE.Group | null>((resolve) => {
        this.loader.load(
          url,
          (gltf) => {
            const root = gltf.scene;
            // 計算原始包圍盒並將底部對齊 y = 0、水平置中
            const box = new THREE.Box3().setFromObject(root);
            const size = new THREE.Vector3();
            const center = new THREE.Vector3();
            box.getSize(size);
            box.getCenter(center);

            const wrapper = new THREE.Group();
            root.position.set(-center.x, -box.min.y, -center.z);
            wrapper.add(root);
            wrapper.userData.baseHeight = Math.max(0.01, size.y);
            wrapper.userData.baseSize = size.clone();
            resolve(wrapper);
          },
          undefined,
          (err) => {
            console.warn(`[ModelLibrary] Failed to load ${url}:`, err);
            resolve(null);
          }
        );
      });
      this.cache.set(fileName, promise);
    }
    return this.cache.get(fileName)!;
  }

  /**
   * 載入並放置模型至指定父群組，自動依 targetHeight 等比縮放並貼地。
   */
  public place(
    parent: THREE.Object3D,
    fileName: string,
    opts: PlaceModelOptions
  ): Promise<THREE.Group | null> {
    return this.load(fileName).then((template) => {
      if (!template) return null;
      const instance = template.clone(true);
      const baseH = (template.userData.baseHeight as number) || 1;
      const finalScale =
        opts.targetHeight !== undefined ? opts.targetHeight / baseH : opts.scale ?? 1;

      instance.scale.setScalar(finalScale);
      instance.position.set(opts.x, opts.y ?? 0, opts.z);
      if (opts.rotY !== undefined) instance.rotation.y = opts.rotY;

      const cast = opts.castShadow ?? true;
      const receive = opts.receiveShadow ?? true;
      instance.traverse((obj) => {
        if ((obj as THREE.Mesh).isMesh) {
          obj.castShadow = cast;
          obj.receiveShadow = receive;
        }
      });

      parent.add(instance);
      return instance;
    });
  }
}
