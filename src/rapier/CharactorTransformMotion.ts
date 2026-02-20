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
  nextLocation: Vec3;
  tmpVec3: Vec3;

  constructor(option: Partial<CharactorMotionOption> = {}) {
    this.completeOption = {
      ...defaultCharactorMotionOption,
      ...option
    };
    this.trans = new Transform();
    this.nextLocation = new Vec3();
    this.tmpVec3 = new Vec3();
  }

  init(trans: Transform, objectA3: ObjectA3) {
    this.trans.set(trans);
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
    this.nextLocation.set(v);
  }
  setLocationNow(v: Vec3): void {
    if (this.body)
      this.body.setNextKinematicTranslation(v); // こんなメソッドもあるのね
    else
      this.bodyDesc?.setTranslation(v.x,v.y,v.z);
    this.trans.loc.set(v);
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

    this.tmpVec3.set(this.nextLocation);
    this.tmpVec3.sub(this.trans.loc);
    //this.tmpVec3.sub(this.body.translation()); // こっちは振動する
    this.controller.computeColliderMovement(this.collider,this.tmpVec3);
    const corrected = this.controller.computedMovement();

    this.tmpVec3.set(this.trans.loc);
    //this.tmpVec3.set(this.body.translation()); // こっちは振動する
    this.tmpVec3.add(corrected.x,corrected.y,corrected.z);
    this.body.setNextKinematicTranslation(this.tmpVec3);

    this.trans.loc.set(this.body.translation());
    this.trans.quat.set(this.body.rotation());
  }
}
