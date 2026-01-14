import * as THREE from 'three';
import { A3Object } from './A3Object';

interface A3TestOpt {
  physics: boolean
}

export class A3Test extends A3Object {
  constructor(opt?: A3TestOpt) {
    super();
    this.needsUpdate = true;
    if (opt)
      this.needsPhysics = opt.physics;
  }

  initObject() {
    const geo = new THREE.BoxGeometry();
    const mat = new THREE.MeshStandardMaterial({ color: 0x00ff00 });
    const mesh = new THREE.Mesh(geo, mat);
    return mesh;
  }

  update(dt: number) {
    if (this.physics) {
      super.update(dt);
    } else {
      this.object.rotation.x += dt;
      this.object.rotation.y += dt;
      this.object.rotation.z += dt;
    }
  }
}
