import * as THREE from 'three';
import { A3Object } from './A3Object';

export class A3Scene {
  scene: THREE.Scene;

  constructor() {
    this.scene = new THREE.Scene();
  }

  add(obj: A3Object) {
    this.scene.add(obj.obj);
  }
}
