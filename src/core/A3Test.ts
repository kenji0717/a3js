import * as THREE from 'three';
import { A3Object } from './A3Object';

export class A3Test extends A3Object {
  constructor() {
    const geo = new THREE.BoxGeometry();
    const mat = new THREE.MeshStandardMaterial({ color: 0x00ff00 });
    const mesh = new THREE.Mesh(geo, mat);
    super(mesh);
  }
}
