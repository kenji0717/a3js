import * as THREE from 'three';
import { FontLoader, Font } from 'three/examples/jsm/loaders/FontLoader.js';
import { TextGeometry } from 'three/examples/jsm/geometries/TextGeometry.js';
import { A3Object } from './A3Object';
import { isString } from '../utils/TypeGuard';

const fontLoader = new FontLoader();
let font: Font | null = null;
export async function initFont(path: string) {
  font = await fontLoader.loadAsync(path);
}

export class A3Text3D extends A3Object {
  initObject(data: any) {
    let str;
    if (isString(data)) {
      str = data;
    } else {
      str = "ERROR";
    }
    if (font == null) {
      const geo = new THREE.BoxGeometry();
      const mat = new THREE.MeshStandardMaterial({ color: 0xff0000 });
      const mesh = new THREE.Mesh(geo, mat);
      return mesh;
    } else {
      const opt = {font: font,size: 1,depth: 0.5,curveSegments: 12};
      const geo = new TextGeometry(str,opt);
      const mat = new THREE.MeshStandardMaterial({ color: 0x00ff00 });
      const mesh = new THREE.Mesh(geo, mat);
      return mesh;
    }
  }
}
