import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import type { GLTF as THREE_GLTF } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';
import { KTX2Loader } from 'three/addons/loaders/KTX2Loader.js';
import { ObjectA3 } from './ObjectA3';
import type { AsyncInitRequired } from './AsyncInitRequired';
import type { PoseMotion } from './Motion';
import { ClipPoseMotion } from '../three/ClipPoseMotion';
import { isString } from '../utils/TypeGuard';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';
//import { MeshoptDecoder } from 'meshoptimizer';

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

export interface GLTFOption {
  renderer?: THREE.WebGLRenderer /*| THREE.WebGPURenderer*/,
  draco: string,
  ktx2: string,
  meshopt: boolean
}

export const defaultGLTFOption = {
  draco: 'https://unpkg.com/three@0.182/examples/jsm/libs/draco/',
  ktx2: 'https://unpkg.com/three@0.182.0/examples/jsm/libs/basis/',
  meshopt: true
};

export function regenerateGLTFLoader(option: Partial<GLTFOption>={}) {
  const opt = {
    ...defaultGLTFOption,
    ...option
  };
  let newGltfLoader = new GLTFLoader();
  const dracoLoader = new DRACOLoader();
  dracoLoader.setDecoderPath(opt.draco);
  newGltfLoader.setDRACOLoader(dracoLoader);
  if (opt.renderer) {
    const ktx2Loader = new KTX2Loader();
    ktx2Loader.setTranscoderPath(opt.ktx2);
    ktx2Loader.detectSupport(opt.renderer);
    newGltfLoader.setKTX2Loader(ktx2Loader);
  }
  if (opt.meshopt) {
    newGltfLoader.setMeshoptDecoder(MeshoptDecoder);
  }
  gltfLoader = newGltfLoader;
}


let gltfLoader = new GLTFLoader();
gltfLoader.setMeshoptDecoder(MeshoptDecoder);

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
      this.skeletons = [];
      this.morphs = {};
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
        if (o instanceof THREE.SkinnedMesh) {
          this.skeletons.push(o.skeleton);
        }
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
