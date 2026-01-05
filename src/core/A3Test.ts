import * as THREE from 'three';
import { A3Object } from './A3Object';
import type { A3Updatable } from './A3Updatable';

export class A3Test extends A3Object implements A3Updatable {
  readonly isA3Updatable = true;
  mesh: THREE.Mesh;
  constructor() {
    const geo = new THREE.BoxGeometry();
    const mat = new THREE.MeshStandardMaterial({ color: 0x00ff00 });
    const mesh = new THREE.Mesh(geo, mat);
    super(mesh);
    this.mesh = mesh;
  }

  update(dt: number) {
    this.mesh.rotation.x += dt;
    this.mesh.rotation.y += dt;
    this.mesh.rotation.z += dt;
  }
}
