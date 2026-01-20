import * as THREE from 'three';
import { ObjectA3 } from '../core/ObjectA3';

/**
 * Three.jsで作ったTHREE.MeshなどのObject3Dを
 * a3jsで使うためのA3Object。
 */
export class ThreeJS extends ObjectA3 {
  constructor(data: THREE.Object3D) {
    super(data);
  }

  initObject(data: THREE.Object3D) {
    return data;
  }
}
