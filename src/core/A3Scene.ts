import * as THREE from 'three';
import { A3Object } from './A3Object';

/**
  * 3D仮想空間を表すクラス。THREE.Sceneを内包していて
  * アップデート処理とかも、ここで行う。
  */
export class A3Scene {
  scene: THREE.Scene;
  objects: A3Object[];

  constructor() {
    this.scene = new THREE.Scene();
    this.objects = [];
  }

  add(object: A3Object) {
    this.scene.add(object.object);
    this.objects.push(object);
  }

  update(dt: number) {
    for (const obj of this.objects) {
      if (obj.needsUpdate) {
        obj.update(dt);
      }
    }
  }
}
