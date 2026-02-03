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

interface Model {
  gltf: THREE_GLTF;
  mixer: THREE.AnimationMixer;
  actions: Record<string, THREE.AnimationAction>;
  morphs: Record<string, {array: Array<number>, idx: number}>;
}

/**
 * glTFモデルを読み込み表示するためのクラス。
 */
export class GLTF extends ObjectA3 implements AsyncInitRequired<GLTF> {
  readonly ready: Promise<GLTF>;
  model?: Model;

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
      const gltf = await gltfLoader.loadAsync(data);
      const mixer = new THREE.AnimationMixer(gltf.scene);
      const actions: Record<string,THREE.AnimationAction> = {};
console.log(`File: ${data}`);
console.log(`  actions:`);
      for (let i=0;i<gltf.animations.length;i++) {
        const clip = gltf.animations[i];
        const action = mixer.clipAction(clip);
        actions[clip.name] = action;
console.log(`    ${clip.name}`);
      }
console.log(`  morphs:`);
      const morphs: Record<string,{array:Array<number>,idx:number}> = {};
      gltf.scene.traverse((obj)=>{
        if (hasMorphTargets(obj)) {
          const { morphTargetDictionary, morphTargetInfluences } = obj;
          Object.keys(morphTargetDictionary).forEach((e)=>{
            const morphName = obj.name+'.'+e; // 一意の名前になんない可能性少しある
            const idx = morphTargetDictionary[e];
            morphs[morphName] = {array: morphTargetInfluences, idx: idx};
console.log(`    ${morphName}`);
          })
        }
      });
      this.model = {
        gltf: gltf,
        mixer: mixer,
        actions: actions,
        morphs: morphs
      };
      this.model.gltf.scene.traverse((o)=>{
        o.userData['a3js'] = { objectA3: this };
      });
      this.object.add(this.model.gltf.scene);
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

class GLTFMotion extends Motion {
  model?: Model;
  isPaused: boolean;

  constructor(objectA3: ObjectA3) {
    super(objectA3);
    this.isPaused = false;
  }

  setObject(objectA3: ObjectA3) {
    if (objectA3 instanceof GLTF) {
      super.setObject(objectA3);
      this.model = objectA3.model;
    } else {
      console.warn('GLTFMotion can set only GLTF object.');
    }
  }

  update(dt: number) {
    super.update(dt);
    if (!this.isPaused && this.model)
      this.model.mixer.update(dt);
  }

  /**
   * args[0]: アクション名
   * args[1]: モーフィング名
   * args[2]: モーフィングの数値
   */
  controlMotion(...args: string[]) {
    if (args[0]) {
      this.model?.mixer.stopAllAction();
      const action = this.model?.actions[args[0]];
      if (action) {
        action.play();
      }
    }
    if (args[1]) {
      const morphName = args[1];
      if (args[2]) {
        const morphValue = Number(args[2]);
        if (this.model) {
          if (morphName in this.model.morphs) {
            const { array, idx } = this.model.morphs[args[1]];
            array[idx] = morphValue;
          }
        }
      }
    }
  }

  setPause(p: boolean) {
    this.isPaused = p;
  }

  setTime(time: number) {
    this.model?.mixer.setTime(time);
  }
}