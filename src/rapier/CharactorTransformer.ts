import type * as Rapier from '@dimforge/rapier3d-compat';
import { RAPIER, RapierPhysicsWorld, collisionMap } from './RapierPhysics';
import * as THREE from 'three';
import { Vec3, Quat, Transform } from '../core/LinearMath';
import { ObjectA3 } from '../core/ObjectA3';
import type { Transforer } from '../core/ObjectA3';

export interface CharactorTransOptions {
  offset: number,
  auto: boolean, // object3Dから自動でCapsuleの高さと半径を計算させるか
  height: number,
  radius: number
}

export const defaultCharactorTransOptions = {
  offset: 0.01,
  auto: true,
  height: 1.5,
  radius: 0.3
};

export class CharactorTransformer implements Transforer {
  trans: Transform;
  objectA3?: ObjectA3;
  completeOptions: CharactorTransOptions;
  controller?: Rapier.KinematicCharacterController;
  colliderDesc?: Rapier.ColliderDesc; // Capsule
  collider?: Rapier.Collider; // Capsule
  capsuleCenter: Vec3;
  nextLocation: Vec3;
  tmpV1: Vec3;
  tmpV2: Vec3;

  constructor(options: Partial<CharactorTransOptions> = {}) {
    this.completeOptions = {
      ...defaultCharactorTransOptions,
      ...options
    };
    this.trans = new Transform();
    this.capsuleCenter = new Vec3();
    this.nextLocation = new Vec3();
    this.tmpV1 = new Vec3();
    this.tmpV2 = new Vec3();
  }

  init(trans: Transform, objectA3: ObjectA3) {
    this.trans.set(trans);
    if (this.completeOptions.auto) {
      const box = new THREE.Box3().setFromObject(objectA3.object);
      const tmpV = new THREE.Vector3();
      box.getSize(tmpV);
      this.completeOptions.radius = Math.max(tmpV.x, tmpV.z) / 2;
      this.completeOptions.height = tmpV.y - this.completeOptions.radius * 2;
      box.getCenter(tmpV);
      this.capsuleCenter.set(tmpV);
    }
    this.colliderDesc = RAPIER.ColliderDesc.capsule(
        this.completeOptions.height,
        this.completeOptions.radius);
    this.colliderDesc.setTranslation(
      trans.loc.x,
      trans.loc.y,
      trans.loc.z
    );
    this.trans.set(objectA3);
    this.colliderDesc.setRotation({
      x: trans.quat.x,
      y: trans.quat.y,
      z: trans.quat.z,
      w: trans.quat.w
    });
  }

  addOneselfToPhysics(world: RapierPhysicsWorld): void {
    this.controller = world.world.createCharacterController(this.completeOptions.offset);
    if (this.colliderDesc)
      this.collider = world.world.createCollider(this.colliderDesc);
    if (this.collider && this.objectA3)
      collisionMap.set(this.collider.handle,this.objectA3);
  }
  removeOneselfFromPhysics(world: RapierPhysicsWorld): void {
    if (this.collider) {
      world.world.removeCollider(this.collider,false); // falseでOK
      collisionMap.delete(this.collider.handle);
    }
  }

  setLocation(v: Vec3): void {
    this.tmpV1.set(v);
    this.tmpV1.add(this.capsuleCenter);
    this.nextLocation.set(this.tmpV1);
  }
  setLocationNow(v: Vec3): void {
    this.tmpV1.set(v);
    this.tmpV1.add(this.capsuleCenter);
    v = this.tmpV1;
    if (this.collider)
      this.collider.setTranslation(v);
    this.trans.loc.set(v);
    this.nextLocation.set(v);
  }

  setQuat(q: Quat): void {
    // Capluleだし、制限なしとする
    if (this.collider)
      this.collider.setRotation(q);
    this.trans.quat.set(q);
  }
  setQuatNow(q: Quat): void {
    if (this.collider)
      this.collider.setRotation(q);
    this.trans.quat.set(q);
  }

  setScale(_: Vec3): void {
    // これはできない物とする
  }
  setScaleNow(_: Vec3): void {
    // 簡単ではないのでとりあえず保留
  }

  setLinvel(_vel: Vec3): void {}
  setAngvel(_angvel: Vec3): void {}
  resetForce(): void {}
  addForce(_f: Vec3): void {}
  addForceAtPoint(_v: Vec3, _p: Vec3): void {}
  resetTorque(): void {}
  addTorque(_t: Vec3): void {}
  applyImpulse(_i: Vec3): void {}
  applyImpulseAtPoint(_i: Vec3, _p: Vec3): void {}
  applyTorqueImpulse(_ti: Vec3): void {}

  isGrounded(): boolean {
    if (this.controller)
      return this.controller.computedGrounded();
    return false; // こういうことで
  }

  update(_dt: number): void {
    if (!this.controller || !this.collider)
      return;

    this.trans.quat.set(this.collider.rotation());

    this.tmpV1.set(this.collider.translation());
    this.tmpV2.set(this.nextLocation);
    this.tmpV2.sub(this.tmpV1);
    this.controller.computeColliderMovement(this.collider,this.tmpV2);
    const corrected = this.controller.computedMovement();

    this.tmpV1.add(corrected);
    this.collider.setTranslation(this.tmpV1);

    this.tmpV1.sub(this.capsuleCenter);
    this.trans.loc.set(this.tmpV1);
    this.nextLocation.set(this.tmpV1);
  }
}
