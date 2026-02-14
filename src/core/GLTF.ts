import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import type { GLTF as THREE_GLTF } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';
import { ObjectA3 } from './ObjectA3';
import type { AsyncInitRequired } from './AsyncInitRequired';
import type { PoseMotion } from './Motion';
import { ClipPoseMotion } from '../three/ClipPoseMotion';
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

  async asyncInit(data: any) {
    if (isString(data)) {
console.log(`File: ${data}`);
      this.gltf = await gltfLoader.loadAsync(data);
      this.bones = {};
      this.gltf.scene.traverse((o: THREE.Object3D)=>{
        o.userData['a3js'] = { objectA3: this };
        if (hasMorphTargets(o)) {
          const { morphTargetDictionary, morphTargetInfluences } = o;
          Object.keys(morphTargetDictionary).forEach((e)=>{
            const morphName = o.name+'.'+e; // 一意の名前になんない可能性少しある
            const idx = morphTargetDictionary[e];
            this.morphs[morphName] = {array: morphTargetInfluences, idx: idx};
console.log(`morphName="${morphName}"`);
          });
        }
        if (o instanceof THREE.Bone)
          this.bones[o.name] = o;
      });
      const poseMotions: Record<string,PoseMotion> = {};
      this.gltf.animations.forEach((anim)=>{
        poseMotions[anim.name] = new ClipPoseMotion(anim);
console.log(`anim.name="${anim.name}"`);
      });
      this.setPoseMotions(poseMotions);
      this.object.add(this.gltf.scene);
    } else {
      const geo = new THREE.BoxGeometry();
      const mat = new THREE.MeshStandardMaterial({ color: 0xff0000 });
      const mesh = new THREE.Mesh(geo, mat);
      this.object.add(mesh);
    }
    return this;
  }
}
