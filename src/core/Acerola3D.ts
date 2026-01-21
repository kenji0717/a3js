import * as THREE from 'three';
import { ObjectA3 } from './ObjectA3';
import type { AsyncInitRequired } from './AsyncInitRequired';
//import type { PhysicsEntityOption } from './Physics';
//import type { MutableVec3 } from './Vec3';
//import type { MutableQuat } from './Quat';
//import { RapierPhysicsEngine, RapierPhysicsWorld,
//         RapierPhysicsEntity } from '../rapier/RapierPhysics';
//import type { RapierPhysicsEntityOption } from '../rapier/RapierPhysics';
//import { createTriMeshColliderDescs } from '../rapier/RapierPhysics';
//import { createConvexHullColliderDescs } from '../rapier/RapierPhysics';
//import type * as Rapier from '@dimforge/rapier3d-compat';
import { unzipAsync } from '../utils/math';
import { loadVrmlInUnzipped } from '../three/threeUtils';

/**
 * まだ適当。
 */
export class Acerola3D extends ObjectA3 implements AsyncInitRequired<Acerola3D> {
  readonly ready: Promise<Acerola3D>;

  constructor(url: string) {
    super();
    this.ready = this.asyncInit(url);
  }

  initObject() {
    // ルートとなるObject3Dだけ用意して後でその中に
    // ロードしたモデルをaddする。
    return new THREE.Object3D();
  }

  async asyncInit(url: string) {
    const unzipped = await unzipAsync(url);
    const vrml = await loadVrmlInUnzipped(unzipped,'axis.wrl');
    this.object.add(vrml);
    return this;
  }
}
