import * as THREE from 'three';
import { A3Object } from '../core/A3Object';

/**
 * Three.jsで作ったTHREE.MeshなどのObject3Dを
 * a3jsで使うためのA3Object。
 */
export class ThreeJS extends A3Object {
  constructor(data: THREE.Object3D) {
    super(data);
  }

  initObject(data: THREE.Object3D) {
    return data;
  }
}
