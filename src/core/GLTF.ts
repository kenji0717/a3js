import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import type { GLTF as THREE_GLTF } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';
import { KTX2Loader } from 'three/addons/loaders/KTX2Loader.js';
import { ActionObject, Action, DummyMotion } from './ActionObject';
import type { Figure, Motion } from './ActionObject';
import { ClipMotion } from '../three/ClipMotion';
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

/**
 * glTF ローダーの設定オプションです。
 */
export interface GLTFOptions {
  /** DRACO・KTX2 の圧縮解除に使用するレンダラー。`Canvas` / `Window` から自動的に設定されます。 */
  renderer?: THREE.WebGLRenderer,
  /** DRACO 圧縮デコーダーの CDN パス。デフォルトは `unpkg.com` 上の three.js 同梱版。 */
  draco: string,
  /** KTX2 テクスチャトランスコーダーの CDN パス。 */
  ktx2: string,
  /** Meshopt 圧縮を有効にするか。デフォルトは `true`。 */
  meshopt: boolean
}

/** `GLTFOptions` のデフォルト値。 */
export const defaultGLTFOptions = {
  draco: 'https://unpkg.com/three@0.182/examples/jsm/libs/draco/',
  ktx2: 'https://unpkg.com/three@0.182.0/examples/jsm/libs/basis/',
  meshopt: true
};

/**
 * glTF ローダーを再生成します。`Canvas` / `Window` の生成時に自動的に呼び出されます。
 * 特殊なオプションを指定したい場合に手動で呼び出すこともできます。
 * @param options ローダーオプション
 */
export function recreateGLTFLoader(options: Partial<GLTFOptions>={}) {
  THREE.Cache.enabled = true;
  const opt = {
    ...defaultGLTFOptions,
    ...options
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

class GLTFAction extends Action {
  constructor(shape: Figure, motion: Motion) {
    super(shape, motion);
  }
}


/**
 * glTF 形式（`.glb` / `.gltf`）の 3D モデルを読み込み、表示・アニメーション再生するクラスです。
 * DRACO / KTX2 / Meshopt 圧縮に対応しています。
 *
 * このクラスは `AsyncInitRequired` を実装しています。
 * `await gltf.ready` でモデルの読み込み完了を待ってからシーンに追加してください。
 *
 * glTF ファイルにアニメーションが含まれている場合、各アニメーション名が自動的にアクション名として登録されます。
 *
 * @example
 * ```ts
 * const gltf = new GLTF('model.glb');
 * await gltf.ready;
 * scene.add(gltf);
 *
 * // アニメーション名でアクションを切り替える
 * gltf.setState('Idle');
 * gltf.setEmote('Wave');
 * ```
 */
export class GLTF extends ActionObject<GLTF> {
  /** 読み込んだ glTF の生データ。Three.js の `GLTF` オブジェクトです。 */
  gltf?: THREE_GLTF;

  constructor(data: any) {
    super(data);
  }

  async asyncInit(data: any) {
    if (isString(data)) {
      let firstActionName: string | null = null;
      this.gltf = await gltfLoader.loadAsync(data);
      const actions: Record<string,Action> = {};
      const shape: Figure = {
        root: this.gltf.scene,
        bones: {},
        skeleton: undefined
      };
      const morphs: Record<string, {array: Array<number>, idx: number}> = {};
      this.gltf.scene.traverse((o: THREE.Object3D)=>{
        o.userData['a3js'] = { objectA3: this };
        if (hasMorphTargets(o)) {
          const { morphTargetDictionary, morphTargetInfluences } = o;
          Object.keys(morphTargetDictionary).forEach((e)=>{
            const morphName = o.name+'.'+e; // 一意の名前になんない可能性少しある
            const idx = morphTargetDictionary[e];
            morphs[morphName] = {array: morphTargetInfluences, idx: idx};
          });
        }
        if (o instanceof THREE.Bone && shape.bones)
          shape.bones[o.name] = o;
        if (o instanceof THREE.SkinnedMesh) {
          shape.skeleton = o.skeleton;
        }
      });
      this.gltf.animations.forEach((anim)=>{
        if (!firstActionName)
          firstActionName = anim.name;
        actions[anim.name] = new GLTFAction(
          shape,
          new ClipMotion(anim));
      });
      if (firstActionName) {
        this.syncInit(firstActionName,actions,morphs);
      } else {
        firstActionName = 'dummy';
        actions['dummy'] = new GLTFAction(
          shape,
          new DummyMotion());
        this.syncInit(firstActionName,actions,morphs);
      }
    } else {
      const geo = new THREE.BoxGeometry();
      const mat = new THREE.MeshStandardMaterial({ color: 0xff0000 });
      const mesh = new THREE.Mesh(geo, mat);

      const firstActionName = 'dummy';
      const actions: Record<string,Action> = {};
      actions['dummy'] = new GLTFAction(
        {root: mesh},
        new DummyMotion());
      this.syncInit(firstActionName,actions);
      
    }
    return this;
  }
}
