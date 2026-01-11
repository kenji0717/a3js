import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import type { GLTF } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';
import { A3Object } from './A3Object';
import type { AsyncInitRequired } from './AsyncInitRequired';
import { isString } from '../utils/TypeGuard';

const gltfLoader = new GLTFLoader();
const dracoLoader = new DRACOLoader();
dracoLoader.setDecoderPath('/examples/jsm/libs/draco/');
gltfLoader.setDRACOLoader(dracoLoader);

interface Model {
  gltf: GLTF;
  mixer: THREE.AnimationMixer;
  actions: Record<string, THREE.AnimationAction>;
}

/**
 * glTFモデルを読み込み表示するためのクラス。
 */
export class A3glTF extends A3Object implements AsyncInitRequired<A3glTF> {
  readonly ready: Promise<A3glTF>;
  private model: Model | null = null;

  constructor(data: any) {
    super();
    this.ready = this.asyncInit(data);
  }

  initObject() {
    // ルートとなるObject3Dだけ用意して後でその中に
    // ロードしたglTFのscene(モデル)をaddする。
    return new THREE.Object3D();
  }
  initNeedsUpdate() { return true; }

  async asyncInit(data: any) {
    if (isString(data)) {
      const gltf = await gltfLoader.loadAsync(data);
      const mixer = new THREE.AnimationMixer(gltf.scene);
      const actions: Record<string,THREE.AnimationAction> = {};
      for (let i=0;i<gltf.animations.length;i++) {
        const clip = gltf.animations[i];
        const action = mixer.clipAction(clip);
        actions[clip.name] = action;
console.log(`${data}: ${clip.name}`);
      }
      this.model = {
        gltf: gltf,
        mixer: mixer,
        actions: actions
      };
      this.object.add(this.model.gltf.scene);
    } else {
      const geo = new THREE.BoxGeometry();
      const mat = new THREE.MeshStandardMaterial({ color: 0xff0000 });
      const mesh = new THREE.Mesh(geo, mat);
      this.object.add(mesh);
    }
    return this;
  }

  change(actionName: string) {
    if (this.model) {
      this.model.mixer.stopAllAction();
      const action = this.model.actions[actionName];
      if (action) {
        action.play();
      }
    }
  }

  update(dt: number) {
    if (this.model) {
      this.model.mixer.update(dt);
    }
  }
}
