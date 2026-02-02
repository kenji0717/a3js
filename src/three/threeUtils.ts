import * as THREE from 'three';
import { readBlobFromUnzipped,
         readStringFromUnzipped } from '../utils/math';
//import { VRMLLoader } from 'three/addons/loaders/VRMLLoader.js';
import { VRMLLoader2 } from './VRMLLoader2.js';
//import { BVHLoader } from 'three/addons/loaders/BVHLoader.js';
import { BVHLoader2 } from '../three/BVHLoader2.js';
//import type { BVH } from 'three/addons/loaders/BVHLoader.js';
import type { BVH } from '../three/BVHLoader2.js';
import type { Unzipped } from 'fflate'; // 'three/addons/libs/fflate.module.js';

let vrmlLoader: VRMLLoader2;
export async function loadVrmlInUnzipped(unzipped: Unzipped, vrmlFile: string): Promise<THREE.Object3D> {
  if (!vrmlLoader)
    vrmlLoader = new VRMLLoader2();
  // URLModifierでVRML内のテクスチャ参照をBlob URLに置換
  vrmlLoader.manager.setURLModifier((url) => {
    if (url.startsWith('./'))
      url = url.substring(2);
    return URL.createObjectURL(readBlobFromUnzipped(unzipped,url));
  });

  const mesh = await vrmlLoader.loadAsync(vrmlFile);
  return mesh;
}

let bvhLoader: BVHLoader2;
export async function loadBvhInUnzipped(unzipped: Unzipped, bvhFile: string): Promise<BVH> {
  if (!bvhLoader)
    bvhLoader = new BVHLoader2();
  const bvhStr = readStringFromUnzipped(unzipped,bvhFile);
  const obj = await bvhLoader.parse(bvhStr);
  return obj;
}
