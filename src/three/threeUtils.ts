import * as THREE from 'three';
import { readBlobFromUnzippedA3,
         readStringFromUnzippedA3 } from '../utils/math';
import type { UnzippedA3 } from '../utils/math';
//import { VRMLLoader } from 'three/addons/loaders/VRMLLoader.js';
import { VRMLLoader2, vrmlLoaderBackgroundTexture } from './VRMLLoader2.js';
//import { BVHLoader } from 'three/addons/loaders/BVHLoader.js';
import { BVHLoader2 } from '../three/BVHLoader2.js';
//import type { BVH } from 'three/addons/loaders/BVHLoader.js';
import type { BVH } from '../three/BVHLoader2.js';

export let vrmlBackgroundTexture: THREE.Texture | undefined;

let vrmlLoader: VRMLLoader2;
export async function loadVrmlInUnzippedA3(unzippedA3: UnzippedA3, vrmlFile: string): Promise<THREE.Object3D> {
  if (!vrmlLoader)
    vrmlLoader = new VRMLLoader2();
  // URLModifierでVRML内のテクスチャ参照をBlob URLに置換する
  // 処理が必要なのだが、これをするとVRMLLoaderだけでなく、
  // AudioLoaderとかThree.js全体に影響するっぽいので処理が終わ
  // ったらすぐにダミーのURLModifierを設定すること。
  vrmlLoader.manager.setURLModifier((url) => {
    if (url.startsWith('./'))
      url = url.substring(2);
    return URL.createObjectURL(readBlobFromUnzippedA3(unzippedA3,url));
  });

  vrmlBackgroundTexture = undefined;
  const mesh = await vrmlLoader.loadAsync(vrmlFile);
  vrmlBackgroundTexture = vrmlLoaderBackgroundTexture;

  vrmlLoader.manager.setURLModifier((url)=>{return url;})
  return mesh;
}

let bvhLoader: BVHLoader2;
export async function loadBvhInUnzippedA3(unzippedA3: UnzippedA3, bvhFile: string): Promise<BVH> {
  if (!bvhLoader)
    bvhLoader = new BVHLoader2();
  const bvhStr = readStringFromUnzippedA3(unzippedA3,bvhFile);
  const obj = await bvhLoader.parse(bvhStr);
  return obj;
}

/**
 * BVHをクローン。たぶん。
 * @param bvh 
 * @returns 
 */
export function cloneBVH(bvh: BVH): BVH {
  const clip = bvh.clip.clone();
  const rootClone = bvh.skeleton.bones[0].clone(true);
  const bones: THREE.Bone[] = [];
  rootClone.traverse((obj)=>{
    if (obj instanceof THREE.Bone) bones.push(obj);
  });
  const skeleton = new THREE.Skeleton(bones);
  skeleton.calculateInverses();
  return {
    clip,
    skeleton
  };
}