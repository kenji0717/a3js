import * as THREE from 'three';
import { A3Object } from './A3Object';

export class A3Test extends A3Object {
  initObject() {
    const geo = new THREE.BoxGeometry();
    const mat = new THREE.MeshStandardMaterial({ color: 0x00ff00 });
    const mesh = new THREE.Mesh(geo, mat);
    return mesh;
  }
  initNeedsUpdate() { return true; }

  update(dt: number) {
    this.object.rotation.x += dt;
    this.object.rotation.y += dt;
    this.object.rotation.z += dt;
  }
}
