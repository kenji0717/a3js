import * as THREE from 'three';
import type * as Rapier from '@dimforge/rapier3d-compat';
import { ObjectA3 } from './ObjectA3';
import type { MutableVec3 } from './Vec3';
import type { MutableQuat } from './Quat';
import type { PhysicsEntityOption } from './Physics';
import { RapierPhysicsEngine, RapierPhysicsWorld,
         RapierPhysicsEntity } from '../rapier/RapierPhysics';
import type {  } from '../rapier/RapierPhysics';

export interface TestOption {
  physics: boolean
}

export class Test extends ObjectA3 {
  constructor(opt?: TestOption) {
    super();
    if (opt && opt.physics)
      this.setControlMode("physics");
    else
      this.setControlMode("user");
  }

  initObject() {
    const geo = new THREE.BoxGeometry();
    const mat = new THREE.MeshStandardMaterial({ color: 0x00ff00 });
    const mesh = new THREE.Mesh(geo, mat);
    return mesh;
  }

  initPhysics(opt: PhysicsEntityOption) {
    this.physics = new TestPhysicsEntity(this,opt);
  }

  update(dt: number) {
    if (this.controlMode === "physics") {
      super.update(dt);
    } else if (this.controlMode === "interpolated") {
      super.update(dt);
    } else {
      this.object.rotation.x += dt;
      this.object.rotation.y += dt;
      this.object.rotation.z += dt;
    }
  }
}



export class TestPhysicsEntity extends RapierPhysicsEntity {
  bodyDesc: Rapier.RigidBodyDesc;
  body: Rapier.RigidBody | null = null;
  colliderDesc: Rapier.ColliderDesc;
  collider: Rapier.Collider | null = null;

  constructor(obj: ObjectA3,opt: PhysicsEntityOption) {
    super(obj,opt);
    this.bodyDesc = RapierPhysicsEngine.RAPIER.RigidBodyDesc.dynamic();
    this.bodyDesc.setTranslation(obj.location.x,obj.location.y,obj.location.z);
    this.colliderDesc = RapierPhysicsEngine.RAPIER.ColliderDesc.cuboid(0.5,0.5,0.5);
    this.colliderDesc.setRestitution(0.3).setFriction(0.6);
  }

  synchronize(obj: Test) {
    if (this.body) {
      const t = this.body.translation();
      obj.location.set(t.x, t.y, t.z);
      obj.object.position.set(t.x, t.y, t.z);
      const r = this.body.rotation();
      obj.quat.set(r.x, r.y, r.z, r.w);
      obj.object.quaternion.set(r.x, r.y, r.z, r.w);
    }
  }

  addOneself(world: RapierPhysicsWorld) {
    this.body = world.world.createRigidBody(this.bodyDesc);
    this.collider = world.world.createCollider(this.colliderDesc,this.body);
  }

  removeOneself(world: RapierPhysicsWorld) {
    if (this.body)
      world.world.removeRigidBody(this.body);
    if (this.collider)
      world.world.removeCollider(this.collider,false); // true? false?
  }

  setLocationNow(v: MutableVec3): void {
    if (this.body)
      this.body.setTranslation(v,true); // true? false?
  }

  setQuatNow(q: MutableQuat): void {
    if (this.body)
      this.body.setRotation(q,true); // true? false?
  }

  setScaleNow(v: MutableVec3): void {
    v;
    // 簡単ではないのでとりあえず保留
  }
}
