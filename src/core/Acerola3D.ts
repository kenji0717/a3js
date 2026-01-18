import * as THREE from 'three';
import { A3Object } from './A3Object';
import type { AsyncInitRequired } from './AsyncInitRequired';
import type { A3PhysicsEntityOption } from './A3Physics';
import type { MutableVec3 } from './Vec3';
import type { MutableQuat } from './Quat';
import { RapierPhysicsEngine, RapierPhysicsWorld,
         RapierPhysicsEntity } from '../rapier/RapierPhysics';
import type { RapierPhysicsEntityOption } from '../rapier/RapierPhysics';
import { createTriMeshColliderDescs } from '../rapier/RapierPhysics';
//import { createConvexHullColliderDescs } from '../rapier/RapierPhysics';
import type * as Rapier from '@dimforge/rapier3d-compat';
import { unzipAsync } from '../utils/math';
import { loadVrmlInUnzipped } from '../three/getShape';

/**
 * まだ適当。
 */
export class Acerola3D extends A3Object implements AsyncInitRequired<Acerola3D> {
  readonly ready: Promise<Acerola3D>;

  constructor(url: string) {
    super();
    this.ready = this.asyncInit(url);
    this.setControlMode('physics');
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

  initPhysics(option: A3PhysicsEntityOption) {
    this.physics = new TestEntity(this,option);
  }
}

class TestEntity extends RapierPhysicsEntity {
  bodyDesc: Rapier.RigidBodyDesc;
  body: Rapier.RigidBody | null = null;
  colliderDescs: Rapier.ColliderDesc[] = [];
  colliders: Rapier.Collider[] = [];

  constructor(obj: A3Object,opt: RapierPhysicsEntityOption) {
    super(obj,opt);
    this.bodyDesc = RapierPhysicsEngine.RAPIER.RigidBodyDesc.dynamic();
    this.bodyDesc.setTranslation(obj.location.x,obj.location.y,obj.location.z);
    this.colliderDescs = createTriMeshColliderDescs(this.object.object,1);
    //this.colliderDescs = createConvexHullColliderDescs(this.object.object,1);
  }

  synchronize(obj: Acerola3D) {
    if (this.body) {
      const t = this.body.translation();
      obj.location.set(t.x, t.y, t.z);
      obj.object.position.set(t.x, t.y, t.z);
      const r = this.body.rotation();
      obj.rot.set(r.x, r.y, r.z, r.w);
      obj.object.quaternion.set(r.x, r.y, r.z, r.w);
    }
  }

  addOneself(world: RapierPhysicsWorld) {
    this.body = world.world.createRigidBody(this.bodyDesc);
    this.colliders = [];
    this.colliderDescs.forEach((colliderDesc) => {
      if (this.body) {
        this.colliders.push(world.world.createCollider(colliderDesc,this.body));
      }
    });
  }

  removeOneself(world: RapierPhysicsWorld) {
    if (this.body)
      world.world.removeRigidBody(this.body);
    this.colliders.forEach((collider) => {
      world.world.removeCollider(collider,false); // true? false?
    });
  }

  forceSetLoc(v: MutableVec3): void {
    if (this.body)
      this.body.setTranslation(v,true); // true? false?
  }

  forceSetQuat(q: MutableQuat): void {
    if (this.body)
      this.body.setRotation(q,true); // true? false?
  }

  forceSetScale(v: MutableVec3): void {
    v;
    // 簡単ではないのでとりあえず保留
  }
}
