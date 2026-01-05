
import * as THREE from 'three';

export abstract class A3Object {
  obj: THREE.Object3D;

  constructor(object: THREE.Object3D) {
    this.obj = object;
  }
}
