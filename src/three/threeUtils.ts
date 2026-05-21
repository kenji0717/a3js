import * as THREE from 'three';
import { readBlobFromUnzippedA3,
         readStringFromUnzippedA3 } from '../utils/math';
import type { UnzippedA3 } from '../utils/math';
//import { VRMLLoader } from 'three/addons/loaders/VRMLLoader.js';
import { VRMLLoader2 } from './VRMLLoader2.js';
//import { BVHLoader } from 'three/addons/loaders/BVHLoader.js';
import { BVHLoader2 } from '../three/BVHLoader2.js';
//import type { BVH } from 'three/addons/loaders/BVHLoader.js';
import type { BVH } from '../three/BVHLoader2.js';

export let vrmlBackgroundTexture: THREE.Texture | undefined;
export let vrmlFog: THREE.Fog | THREE.FogExp2 | undefined;

export interface VrmlAndEnv {
  object3D: THREE.Object3D;
  bgTexture: THREE.Texture | undefined;
  fog: THREE.Fog | THREE.FogExp2 | undefined;
}

export async function loadVrmlInUnzippedA3(unzippedA3: UnzippedA3, vrmlFile: string): Promise<VrmlAndEnv> {
  const manager = new THREE.LoadingManager();
  // URLModifierでVRML内のテクスチャ参照をBlob URLに置換する
  // 処理が必要。
  manager.setURLModifier((url) => {
    if (url.startsWith('./'))
      url = url.substring(2);
    return URL.createObjectURL(readBlobFromUnzippedA3(unzippedA3,url));
  });
  const vrmlLoader = new VRMLLoader2(manager);

  const object3D = await vrmlLoader.loadAsync(vrmlFile);
  const bgTexture = vrmlLoader.backgroundTexture;
  const fog = vrmlLoader.fog;

  return {object3D, bgTexture, fog};
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