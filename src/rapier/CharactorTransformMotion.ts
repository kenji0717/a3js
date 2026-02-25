import type * as Rapier from '@dimforge/rapier3d-compat';
import { RAPIER, RapierPhysicsWorld, collisionMap } from './RapierPhysics';
import * as THREE from 'three';
import { Vec3, Quat, Transform } from '../core/LinearMath';
import { ObjectA3 } from '../core/ObjectA3';
import type { TransformMotion } from '../core/Motion';

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

export class CharactorTransformMotion implements TransformMotion {
  trans: Transform;
  objectA3?: ObjectA3;
  completeOption: CharactorMotionOption;
  controller?: Rapier.KinematicCharacterController;
  bodyDesc?: Rapier.RigidBodyDesc;
  body?: Rapier.RigidBody;
  colliderDesc?: Rapier.ColliderDesc; // Capsule
  collider?: Rapier.Collider; // Capsule
  capsuleCenter: Vec3;
  nextLocation: Vec3;
  tmpV1: Vec3;
  tmpV2: Vec3;

  constructor(option: Partial<CharactorMotionOption> = {}) {
    this.completeOption = {
      ...defaultCharactorMotionOption,
      ...option
    };
    this.trans = new Transform();
    this.capsuleCenter = new Vec3();
    this.nextLocation = new Vec3();
    this.tmpV1 = new Vec3();
    this.tmpV2 = new Vec3();
  }

  init(trans: Transform, objectA3: ObjectA3) {
    this.trans.set(trans);
    if (this.completeOption.auto) {
      const box = new THREE.Box3().setFromObject(objectA3.object);
      const tmpV = new THREE.Vector3();
      box.getSize(tmpV);
      this.completeOption.radius = Math.max(tmpV.x, tmpV.z) / 2;
      this.completeOption.height = tmpV.y - this.completeOption.radius * 2;
      box.getCenter(tmpV);
      this.capsuleCenter.set(tmpV);
    }
    this.bodyDesc = RAPIER.RigidBodyDesc.kinematicPositionBased();
    this.colliderDesc = RAPIER.ColliderDesc.capsule(
        this.completeOption.height,
        this.completeOption.radius);
    this.bodyDesc.setTranslation(
      trans.loc.x,
      trans.loc.y,
      trans.loc.z
    );
    this.trans.set(objectA3);
    this.bodyDesc.setRotation({
      x: trans.quat.x,
      y: trans.quat.y,
      z: trans.quat.z,
      w: trans.quat.w
    });

  }

  addOneselfToPhysics(world: RapierPhysicsWorld): void {
    this.controller = world.world.createCharacterController(this.completeOption.offset);
    if (this.bodyDesc)
      this.body = world.world.createRigidBody(this.bodyDesc);
    if (this.colliderDesc)
    this.collider = world.world.createCollider(this.colliderDesc,this.body);
    if (this.collider && this.objectA3)
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
    this.tmpV1.set(v);
    this.tmpV1.add(this.capsuleCenter);
    this.nextLocation.set(this.tmpV1);
  }
  setLocationNow(v: Vec3): void {
    this.tmpV1.set(v);
    this.tmpV1.add(this.capsuleCenter);
    v = this.tmpV1;
    if (this.body)
      this.body.setNextKinematicTranslation(v); // こんなメソッドもあるのね
    else
      this.bodyDesc?.setTranslation(v.x,v.y,v.z);
    this.trans.loc.set(v);
    this.nextLocation.set(v);
  }

  setQuat(q: Quat): void {
    // Capluleだし、制限なしとする
    if (this.body)
      this.body.setRotation(q,false); // Kinematicだからfalse
    else
      this.bodyDesc?.setRotation(q);
    this.trans.loc.set(q);
  }
  setQuatNow(q: Quat): void {
    if (this.body)
      this.body.setRotation(q,false); // Kinematicだからfalse
    else
      this.bodyDesc?.setRotation(q);
    this.trans.quat.set(q);
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

  update(_dt: number): void {
    if (!this.body || !this.controller || !this.collider)
      return;

    this.trans.quat.set(this.body.rotation());

    //this.tmpV1.set(this.trans.loc); // こっちはダメっぽい
    this.tmpV1.set(this.body.translation());
    this.tmpV2.set(this.nextLocation);
    this.tmpV2.sub(this.tmpV1);
    this.controller.computeColliderMovement(this.collider,this.tmpV2);
    const corrected = this.controller.computedMovement();

    this.tmpV1.add(corrected.x,corrected.y,corrected.z);
    //this.body.setTranslation(this.tmpV1,true); // どっちが良い？
    this.body.setNextKinematicTranslation(this.tmpV1); // どっちが良い？

    this.tmpV1.sub(this.capsuleCenter);
    this.trans.loc.set(this.tmpV1);
    this.nextLocation.set(this.tmpV1);
  }
}
