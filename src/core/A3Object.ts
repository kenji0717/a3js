
import * as THREE from 'three';
import type { A3Transform } from './A3Transform';

export abstract class A3Object implements A3Transform {
  object: THREE.Object3D;

  constructor(object: THREE.Object3D) {
    this.object = object;
  }

  setLoc(x: number, y: number, z: number) {
    this.object.position.set(x,y,z);
  }
}
