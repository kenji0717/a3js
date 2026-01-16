import * as THREE from 'three';
import type * as Rapier from '@dimforge/rapier3d-compat';
import { A3Object } from './A3Object';
import type { MutableVec3 } from './Vec3';
import type { MutableQuat } from './Quat';
import type { A3Physics, A3PhysicsWorld, A3PhysicsEntity } from './A3Physics';
import { RapierPhysics, RapierPhysicsWorld } from '../rapier/RapierPhysics';
import type { RapierPhysicsEntity } from '../rapier/RapierPhysics';

export interface A3TestOpt {
  physics: boolean
}

export class A3Test extends A3Object {
  constructor(opt?: A3TestOpt) {
    super();
    if (opt && opt.physics)
      this.setMotionControlMode("physics");
    else
      this.setMotionControlMode("user");
  }

  initObject() {
    const geo = new THREE.BoxGeometry();
    const mat = new THREE.MeshStandardMaterial({ color: 0x00ff00 });
    const mesh = new THREE.Mesh(geo, mat);
    return mesh;
  }

  initPhysics(physics?: A3Physics, world?: A3PhysicsWorld) {
    physics; // どうしたもんか
    if (world instanceof RapierPhysicsWorld) {
      const entity = new A3TestPhysicsEntity(this);
      entity.body = world.world.createRigidBody(entity.bodyDesc);
      entity.collider = world.world.createCollider(entity.colliderDesc,entity.body);
      this.physics = entity;
    }
  }

  update(dt: number) {
    if (this.motionControlMode === "physics") {
      super.update(dt);
    } else if (this.motionControlMode === "interpolated") {
      super.update(dt);
    } else {
      this.object.rotation.x += dt;
      this.object.rotation.y += dt;
      this.object.rotation.z += dt;
    }
  }
}



export class A3TestPhysicsEntity implements A3PhysicsEntity, RapierPhysicsEntity {
  object: A3Object;
  bodyDesc: Rapier.RigidBodyDesc;
  body: Rapier.RigidBody | null = null;
  colliderDesc: Rapier.ColliderDesc;
  collider: Rapier.Collider | null = null;

  constructor(obj: A3Object) {
    this.object = obj;
    this.bodyDesc = RapierPhysics.RAPIER.RigidBodyDesc.dynamic();
    this.bodyDesc.setTranslation(obj.loc.x, obj.loc.y, obj.loc.z);
    this.colliderDesc = RapierPhysics.RAPIER.ColliderDesc.cuboid(1,1,1);
    this.colliderDesc.setRestitution(0.3).setFriction(0.6);
  }

  synchronize(obj: A3Test) {
    if (this.body) {
      const t = this.body.translation();
      obj.setLoc(t.x, t.y, t.z);
      const r = this.body.rotation();
      obj.setQuat(r.x, r.y, r.z, r.w);
    }
  }

  setLoc(v: MutableVec3): void {
    if (this.body)
      this.body.setTranslation(v,true); // true? false?
  }

  setQuat(q: MutableQuat): void {
    if (this.body)
      this.body.setRotation(q,true); // true? false?
  }

  setScale(v: MutableVec3): void {
    v;
    // 簡単ではないのでとりあえず保留
  }
}
