import type * as Rapier from '@dimforge/rapier3d-compat';
import { RAPIER, RapierPhysicsWorld, collisionMap } from './RapierPhysics';
import * as THREE from 'three';
import { RapierMotion } from './RapierPhysics';
import { Vec3, Quat, Transform } from '../core/LinearMath';
import { ObjectA3 } from '../core/ObjectA3';
import type { RootMotion } from '../core/Motion';

export interface CharactorMotionOption {
  offset: number,
  auto: boolean, // object3Dから自動でCapsuleの高さと半径を計算させるか
  height: number,
  radius: number
}

export const defaultCharactorMotionOption = {
  offset: 0.01,
  auto: true,
  height: 1.5,
  radius: 0.3
};

export class CharactorRootMotion implements RootMotion {
  objectA3: ObjectA3;
  completeOption: CharactorMotionOption;
  controller?: Rapier.KinematicCharacterController;
  bodyDesc: Rapier.RigidBodyDesc;
  body?: Rapier.RigidBody;
  colliderDesc: Rapier.ColliderDesc; // Capsule
  collider?: Rapier.Collider; // Capsule
  preLocation: Vec3;
  nextLocation: Vec3;
  tmpVec3: Vec3;
  constructor(objectA3: ObjectA3, option: Partial<CharactorMotionOption> = {}) {
    this.completeOption = {
      ...defaultCharactorMotionOption,
      ...option
    };
    this.objectA3 = objectA3;
    this.preLocation = new Vec3();
    this.nextLocation = new Vec3();
    this.tmpVec3 = new Vec3();

    if (this.completeOption.auto) {
      const box = new THREE.Box3().setFromObject(objectA3.object);
      const size = new THREE.Vector3();
      box.getSize(size);
      this.completeOption.radius = Math.max(size.x, size.z) / 2;
      this.completeOption.height = size.y - this.completeOption.radius * 2;
    }
    this.bodyDesc = RAPIER.RigidBodyDesc.kinematicPositionBased();
    this.colliderDesc = RAPIER.ColliderDesc.capsule(
        this.completeOption.height,
        this.completeOption.radius);
    this.bodyDesc.setTranslation(
      objectA3.object.position.x,
      objectA3.object.position.y,
      objectA3.object.position.z
    );
    this.preLocation.set(objectA3.object.position);
    this.bodyDesc.setRotation({
      x: objectA3.object.quaternion.x,
      y: objectA3.object.quaternion.y,
      z: objectA3.object.quaternion.z,
      w: objectA3.object.quaternion.w
    });
  }

  init(_objectA3: ObjectA3) {}

  addOneselfToPhysics(world: RapierPhysicsWorld): void {
    this.controller = world.world.createCharacterController(this.completeOption.offset);
    this.body = world.world.createRigidBody(this.bodyDesc);
    this.collider = world.world.createCollider(this.colliderDesc,this.body);
    if (this.collider)
      collisionMap.set(this.collider.handle,this.objectA3);
  }
  removeOneselfFromPhysics(world: RapierPhysicsWorld): void {
    if (this.body)
      world.world.removeRigidBody(this.body);
    if (this.collider) {
      world.world.removeCollider(this.collider,false); // falseでOK
      collisionMap.delete(this.collider.handle);
    }
  }
  
  setLocation(v: Vec3): void {
    this.nextLocation.set(v);
  }
  setLocationNow(v: Vec3): void {
    if (this.body)
      this.body.setNextKinematicTranslation(v); // こんなメソッドもあるのね
  }

  setQuat(q: Quat): void {
    // Capluleだし、制限なしとする
    if (this.body)
      this.body.setRotation(q,false); // Kinematicだからfalse
  }
  setQuatNow(q: Quat): void {
    if (this.body)
      this.body.setRotation(q,false); // Kinematicだからfalse
  }

  setScale(_: Vec3): void {
    // これはできない物とする
  }
  setScaleNow(_: Vec3): void {
    // 簡単ではないのでとりあえず保留
  }

  isGrounded(): boolean {
    if (this.controller)
      return this.controller.computedGrounded();
    return false; // こういうことで
  }

  update(_dt: number, trans: Transform): Transform {
    if (!this.body || !this.controller || !this.collider)
      return trans;
    this.tmpVec3.set(this.nextLocation);
    this.tmpVec3.sub(this.preLocation);
    this.controller.computeColliderMovement(this.collider,this.tmpVec3);
    const corrected = this.controller.computedMovement();
    this.tmpVec3.set(this.body.translation());
    this.tmpVec3.add(corrected.x,corrected.y,corrected.z);
    this.body.setNextKinematicTranslation(this.tmpVec3);
    const t = this.body.translation();
    trans.loc.set(t.x, t.y, t.z);
    const r = this.body.rotation();
    trans.quat.set(r.x, r.y, r.z, r.w);
    return trans;
  }
}





/**
 * CapsuleコライダーとRapierのCharactorControllerを用いて、
 * 凹凸のある地面などの上を自然に移動するキャラクタの動き
 * を計算するためのMotionです。KinematicなRigidBodyも使用して
 * 制御する。
 */
export class CharactorMotion extends RapierMotion {
  // objectA3: ObjectA3;
  // object3D: THREE.Object3D;
  completeOption: CharactorMotionOption;
  controller?: Rapier.KinematicCharacterController;
  bodyDesc?: Rapier.RigidBodyDesc;
  body?: Rapier.RigidBody;
  colliderDesc?: Rapier.ColliderDesc; // Capsule
  collider?: Rapier.Collider; // Capsule
  preLocation: Vec3;
  nextLocation: Vec3;
  tmpVec3: Vec3;

  constructor(objectA3?: ObjectA3,option: Partial<CharactorMotionOption> = {}) {
    super(objectA3);
    this.completeOption = {
      ...defaultCharactorMotionOption,
      ...option
    };
    this.preLocation = new Vec3();
    this.nextLocation = new Vec3();
    this.tmpVec3 = new Vec3();
  }

  setObject(objectA3: ObjectA3): void {
    super.setObject(objectA3);
    if (this.completeOption.auto) {
      const box = new THREE.Box3().setFromObject(objectA3.object);
      const size = new THREE.Vector3();
      box.getSize(size);
      this.completeOption.radius = Math.max(size.x, size.z) / 2;
      this.completeOption.height = size.y - this.completeOption.radius * 2;
    }
    this.bodyDesc = RAPIER.RigidBodyDesc.kinematicPositionBased();
    this.colliderDesc = RAPIER.ColliderDesc.capsule(
        this.completeOption.height,
        this.completeOption.radius);
    this.bodyDesc.setTranslation(
      objectA3.object.position.x,
      objectA3.object.position.y,
      objectA3.object.position.z
    );
    this.preLocation.set(objectA3.object.position);
    this.bodyDesc.setRotation({
      x: objectA3.object.quaternion.x,
      y: objectA3.object.quaternion.y,
      z: objectA3.object.quaternion.z,
      w: objectA3.object.quaternion.w
    });
  }

  detachObject(_objectA3: ObjectA3) {
    this.bodyDesc = undefined;
    this.body = undefined;
    this.colliderDesc = undefined;
    this.collider = undefined;
  }

  addOneselfToPhysics(world: RapierPhysicsWorld): void {
    this.controller = world.world.createCharacterController(this.completeOption.offset);
    if (this.bodyDesc)
      this.body = world.world.createRigidBody(this.bodyDesc);
    if (this.colliderDesc)
      this.collider = world.world.createCollider(this.colliderDesc,this.body);
    if (this.objectA3 && this.collider)
      collisionMap.set(this.collider.handle,this.objectA3);
  }
  removeOneselfFromPhysics(world: RapierPhysicsWorld): void {
    if (this.body)
      world.world.removeRigidBody(this.body);
    if (this.collider)
      world.world.removeCollider(this.collider,false); // falseでOK
  }
  
  setLocation(v: Vec3): void {
    this.nextLocation.set(v);
  }
  setLocationNow(v: Vec3): void {
    if (this.body)
      this.body.setNextKinematicTranslation(v); // こんなメソッドもあるのね
  }

  setQuat(q: Quat): void {
    // Capluleだし、制限なしとする
    if (this.body)
      this.body.setRotation(q,false); // Kinematicだからfalse
  }
  setQuatNow(q: Quat): void {
    if (this.body)
      this.body.setRotation(q,false); // Kinematicだからfalse
  }

  setScale(_: Vec3): void {
    // これはできない物とする
  }
  setScaleNow(_: Vec3): void {
    // 簡単ではないのでとりあえず保留
  }

  isGrounded(): boolean {
    if (this.controller)
      return this.controller.computedGrounded();
    return false; // こういうことで
  }

  update(_: number) {
    if (!this.body || !this.controller || !this.collider)
      return;
    this.tmpVec3.set(this.nextLocation);
    this.tmpVec3.sub(this.preLocation);
//console.log(`GAHA: 1`,this.tmpVec3);
    this.controller.computeColliderMovement(this.collider,this.tmpVec3);
    const corrected = this.controller.computedMovement();
//console.log(`GAHA: 2`,corrected);
    this.tmpVec3.set(this.body.translation());
    this.tmpVec3.add(corrected.x,corrected.y,corrected.z);
    this.body.setNextKinematicTranslation(this.tmpVec3);
    // NextKinematicなので以下1フレーム遅れる感じだけど・・・
    const t = this.body.translation();
    this.object3D?.position.set(t.x, t.y, t.z);
    const r = this.body.rotation();
    this.object3D?.quaternion.set(r.x, r.y, r.z, r.w);
    this.preLocation.set(this.tmpVec3); // このタイミングで良いはず。
  }
}
