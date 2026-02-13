import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import type { GLTF as THREE_GLTF } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';
import { ObjectA3 } from './ObjectA3';
import type { AsyncInitRequired } from './AsyncInitRequired';
import { Motion } from './Motion';
import { isString } from '../utils/TypeGuard';

type MorphTargetObject =
  | THREE.Mesh
  | THREE.Line
  | THREE.Points;

type MorphTargetCapable = MorphTargetObject & {
  morphTargetDictionary: Record<string, number>;
  morphTargetInfluences: number[];
};

function hasMorphTargets(
  obj: THREE.Object3D
): obj is MorphTargetCapable {
  return (
    'morphTargetDictionary' in obj &&
    obj.morphTargetDictionary !== undefined &&
    'morphTargetInfluences' in obj &&
    Array.isArray(obj.morphTargetInfluences)
  );
}

const gltfLoader = new GLTFLoader();
const dracoLoader = new DRACOLoader();
dracoLoader.setDecoderPath('/examples/jsm/libs/draco/');
gltfLoader.setDRACOLoader(dracoLoader);

/**
 * glTFモデルを読み込み表示するためのクラス。
 */
export class GLTF extends ObjectA3 implements AsyncInitRequired<GLTF> {
  readonly ready: Promise<GLTF>;
  gltf?: THREE_GLTF;

  constructor(data: any) {
    super();
    this.ready = this.asyncInit(data);
  }

  initObject() {
    // ルートとなるObject3Dだけ用意して後でその中に
    // ロードしたglTFのscene(モデル)をaddする。
    return new THREE.Object3D();
  }

  initMotion() {
    return new GLTFMotion(this);
  }

  async asyncInit(data: any) {
    if (isString(data)) {
console.log(`File: ${data}`);
      this.gltf = await gltfLoader.loadAsync(data);
      this.gltf.scene.traverse((o)=>{
        o.userData['a3js'] = { objectA3: this };
      });
      this.object.add(this.gltf.scene);
    } else {
      const geo = new THREE.BoxGeometry();
      const mat = new THREE.MeshStandardMaterial({ color: 0xff0000 });
      const mesh = new THREE.Mesh(geo, mat);
      this.object.add(mesh);
    }
    this.motion.setObject(this);
    return this;
  }
}


/**
 * GLTF用のMotion。
 * GLTFから取り外しできるが、取り外した時に保持している
 * 情報はTHREE.AnimationClipのみで、他の必要な物は、
 * GLTFにsetMotion()で取り付けた時に、再構築される。
 * 前提として、3Dモデルが同じBone構造をもっていることが
 * 必要で、取り付け先の3Dモデルが最初からClipを持っていて
 * 同じ名前だったら、そのClipは上書きされて消される。
 */
export class GLTFMotion extends Motion {
  isPaused: boolean;
  gltf?: THREE_GLTF;
  mixer?: THREE.AnimationMixer;
  clips: Record<string, THREE.AnimationClip>;
  actions: Record<string, THREE.AnimationAction>;
  morphs: Record<string, {array: Array<number>, idx: number}>;

  constructor(objectA3?: ObjectA3) {
    super(objectA3);
    this.isPaused = false;
    this.clips = {};
    this.actions = {};
    this.morphs = {};
  }

  setObject(objectA3: ObjectA3) {
    if (objectA3 instanceof GLTF) {
      super.setObject(objectA3);
      this.gltf = objectA3.gltf;
      this.myInitialize(objectA3);
    } else {
      console.warn('GLTFMotion can set only GLTF object.');
    }
  }
  myInitialize(_objectA3: ObjectA3) {
    if (this.gltf) {
      this.mixer = new THREE.AnimationMixer(this.gltf.scene);
      this.actions = {};
console.log(`  actions(from model):`);
      const newClips: Record<string, THREE.AnimationClip> = {};
      for (let i=0;i<this.gltf.animations.length;i++) {
        const clip = this.gltf.animations[i];
        newClips[clip.name] = clip;
        this.actions[clip.name] = this.mixer.clipAction(clip);
console.log(`    ${clip.name}`);
      }
console.log(`  actions(from motion):`);
      for (const clip of Object.values(this.clips)) {
        newClips[clip.name] = clip;
        this.actions[clip.name] = this.mixer.clipAction(clip);
console.log(`    ${clip.name}`);
      }
      this.clips = newClips;
console.log(`  morphs:`);
      this.morphs = {};
      this.gltf.scene.traverse((obj)=>{
        if (hasMorphTargets(obj)) {
          const { morphTargetDictionary, morphTargetInfluences } = obj;
          Object.keys(morphTargetDictionary).forEach((e)=>{
            const morphName = obj.name+'.'+e; // 一意の名前になんない可能性少しある
            const idx = morphTargetDictionary[e];
            this.morphs[morphName] = {array: morphTargetInfluences, idx: idx};
console.log(`    ${morphName}`);
          })
        }
      });
    }
  }
  detachObject(_objectA3: ObjectA3) {
    this.mixer?.stopAllAction();
    if (this.gltf)
      this.mixer?.uncacheRoot(this.gltf.scene);
    this.mixer = undefined;
    // this.clipsは消さない！
    this.actions = {};
    this.morphs = {};
    this.gltf = undefined;
    this.isPaused = false;
  }
  update(dt: number) {
    super.update(dt);
    if (!this.isPaused)
      this.mixer?.update(dt);
  }

  /**
   * args[0]: アクション名
   * args[1]: モーフィング名
   * args[2]: モーフィングの数値
   */
  controlMotion(...args: string[]) {
    if (args[0]) {
      this.mixer?.stopAllAction();
      const action = this.actions[args[0]];
      if (action) {
        action.play();
      }
    }
    if (args[1]) {
      const morphName = args[1];
      if (args[2]) {
        const morphValue = Number(args[2]);
        if (morphName in this.morphs) {
          const { array, idx } = this.morphs[args[1]];
          array[idx] = morphValue;
        }
      }
    }
  }

  setPause(p: boolean) {
    this.isPaused = p;
  }

  setTime(time: number) {
    this.mixer?.setTime(time);
  }
}