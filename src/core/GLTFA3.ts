import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import type { GLTF } from 'three/addons/loaders/GLTFLoader.js';
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
  gltf: GLTF;
  mixer: THREE.AnimationMixer;
  actions: Record<string, THREE.AnimationAction>;
  morphs: Record<string, {array: Array<number>, idx: number}>;
}

/**
 * glTFモデルを読み込み表示するためのクラス。
 */
export class GLTFA3 extends ObjectA3 implements AsyncInitRequired<GLTFA3> {
  readonly ready: Promise<GLTFA3>;
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
      if (this.motion instanceof GLTFMotion)
        this.motion.setModel(this.model);
    } else {
      const geo = new THREE.BoxGeometry();
      const mat = new THREE.MeshStandardMaterial({ color: 0xff0000 });
      const mesh = new THREE.Mesh(geo, mat);
      this.object.add(mesh);
    }
    return this;
  }

  morph(morphName: string, value: number) {
    if (this.model) {
      if (morphName in this.model.morphs) {
        const { array, idx }  = this.model.morphs[morphName]
        array[idx] = value;
      }
    }
  }
}

class GLTFMotion extends Motion {
  model?: Model;
  isPaused: boolean;

  constructor(objectA3: ObjectA3) {
    super(objectA3);
    this.isPaused = false;
  }

  setModel(model: Model) {
    this.model = model;
  }

  setObject(objectA3: ObjectA3) {
    if (objectA3 instanceof GLTFA3) {
      super.setObject(objectA3);
      this.model = objectA3.model;
    } else {
      console.warn('GLTFMotion can set only GLTFA3 object.');
    }
  }

  update(dt: number) {
    super.update(dt);
    if (!this.isPaused && this.model)
      this.model.mixer.update(dt);
  }

  changeMotion(actionName: string) {
    this.model?.mixer.stopAllAction();
    const action = this.model?.actions[actionName];
    if (action) {
      action.play();
    }
  }

  setPause(p: boolean) {
    this.isPaused = p;
  }

  setTime(time: number) {
    this.model?.mixer.setTime(time);
  }
}