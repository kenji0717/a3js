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
      objectA3.loc.x,
      objectA3.loc.y,
      objectA3.loc.z
    );
    this.preLocation.set(objectA3.loc);
    this.bodyDesc.setRotation({
      x: objectA3.quat.x,
      y: objectA3.quat.y,
      z: objectA3.quat.z,
      w: objectA3.quat.w
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

  getTrans(trans: Transform): void {
    if (this.body) {
      trans.loc.set(this.body.translation());
      trans.quat.set(this.body.rotation());
    } else {
      trans.loc.set(this.bodyDesc.translation);
      trans.quat.set(this.bodyDesc.rotation);
    }
  }
  setLocation(v: Vec3): void {
    this.nextLocation.set(v);
  }
  setLocationNow(v: Vec3): void {
    if (this.body)
      this.body.setNextKinematicTranslation(v); // こんなメソッドもあるのね
    else
      this.bodyDesc.setTranslation(v.x,v.y,v.z);
  }

  setQuat(q: Quat): void {
    // Capluleだし、制限なしとする
    if (this.body)
      this.body.setRotation(q,false); // Kinematicだからfalse
    else
      this.bodyDesc.setRotation(q);
  }
  setQuatNow(q: Quat): void {
    if (this.body)
      this.body.setRotation(q,false); // Kinematicだからfalse
    else
      this.bodyDesc.setRotation(q); // Kinematicだからfalse
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

  update(_dt: number, trans: Transform): void {
    if (!this.body || !this.controller || !this.collider)
      return;

    this.tmpVec3.set(this.nextLocation);
    this.tmpVec3.sub(this.preLocation);
    //this.tmpVec3.sub(this.body.translation()); // こっちは振動する
    this.controller.computeColliderMovement(this.collider,this.tmpVec3);
    const corrected = this.controller.computedMovement();

    this.tmpVec3.set(this.preLocation);
    //this.tmpVec3.set(this.body.translation()); // こっちは振動する
    this.tmpVec3.add(corrected.x,corrected.y,corrected.z);
    this.body.setNextKinematicTranslation(this.tmpVec3);

    trans.loc.set(this.body.translation());
    trans.quat.set(this.body.rotation());
  }
}
