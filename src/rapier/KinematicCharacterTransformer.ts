import type * as Rapier from '@dimforge/rapier3d-compat';
import { RAPIER, RapierPhysicsWorld, collisionMap } from './RapierPhysics';
import * as THREE from 'three';
import { Vec3, Quat, Transform } from '../core/LinearMath';
import { ObjectA3 } from '../core/ObjectA3';
import type { Transformer } from '../core/ObjectA3';

/**
 * `"KinematicCharacter"` モードで使用されるオプションです。
 */
export interface KinematicCharacterTransformerOptions {
  /** コライダーと地面・壁との間に保持する最小隙間（メートル）。デフォルトは `0.01`。 */
  offset: number,
  /** `true` のとき、オブジェクトのメッシュ形状からカプセルの高さと半径を自動計算します。デフォルトは `true`。 */
  auto: boolean,
  /** カプセルコライダーの高さ（メートル）。`auto: false` のときに使用されます。デフォルトは `1.5`。 */
  height: number,
  /** カプセルコライダーの半径（メートル）。`auto: false` のときに使用されます。デフォルトは `0.3`。 */
  radius: number
}

export const defaultKinematicCharacterTransformerOptions = {
  offset: 0.01,
  auto: true,
  height: 1.5,
  radius: 0.3
};

/**
 * `"KinematicCharacter"` モードで使用される Transformer の Rapier3D 実装です。
 * `setTransformMode("KinematicCharacter", options)` を呼び出すと、内部的にこのクラスが使用されます。
 *
 * カプセル形状のコライダーを使い、壁・地面への衝突を考慮しながらオブジェクトを移動させます。
 * 速度・力・トルク系のメソッドは無効です。位置を直接制御することでキャラクターを動かします。
 *
 * @remarks
 * 直接インスタンスを生成するのではなく、`setTransformMode("KinematicCharacter", options)` を通じて使用してください。
 */
export class KinematicCharacterTransformer implements Transformer {
  transform: Transform;
  objectA3?: ObjectA3;
  completeOptions: KinematicCharacterTransformerOptions;
  controller?: Rapier.KinematicCharacterController;
  colliderDesc?: Rapier.ColliderDesc; // Capsule
  collider?: Rapier.Collider; // Capsule
  capsuleCenter: Vec3;
  nextLocation: Vec3;
  tmpV1: Vec3;
  tmpV2: Vec3;
  tmpQ1: Quat;

  constructor(options: Partial<KinematicCharacterTransformerOptions> = {}) {
    this.completeOptions = {
      ...defaultKinematicCharacterTransformerOptions,
      ...options
    };
    this.transform = new Transform();
    this.capsuleCenter = new Vec3();
    this.nextLocation = new Vec3();
    this.tmpV1 = new Vec3();
    this.tmpV2 = new Vec3();
    this.tmpQ1 = new Quat();
  }

  init(trans: Transform, objectA3: ObjectA3) {
    this.transform.set(trans);
    if (this.completeOptions.auto) {
      const tmpV = new THREE.Vector3();
      const tmpQ = new THREE.Quaternion();
      const o = new THREE.Object3D();
      o.add(objectA3.object3D);
      { // transformerから持ってこないと
        objectA3.getPosition(this.tmpV1); this.tmpV1.write(tmpV);
        o.position.set(tmpV.x,tmpV.y,tmpV.z);
        objectA3.getQuat(this.tmpQ1); this.tmpQ1.write(tmpQ);
        o.quaternion.set(tmpQ.x,tmpQ.y,tmpQ.z,tmpQ.w);
        objectA3.getScale(this.tmpV2); this.tmpV2.write(tmpV);
        o.scale.set(tmpV.x,tmpV.y,tmpV.z);
      }
      const box = new THREE.Box3().setFromObject(o);
      o.remove(objectA3.object3D);
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
      this.collider = undefined;
    }
  }

  setPosition(v: Vec3): void {
    this.tmpV1.set(v);
    this.tmpV1.add(this.capsuleCenter);
    this.nextLocation.set(this.tmpV1);
  }
  setPositionNow(v: Vec3): void {
    this.tmpV1.set(v);
    this.tmpV1.add(this.capsuleCenter);
    if (this.collider)
      this.collider.setTranslation(this.tmpV1);
    this.transform.loc.set(v);
    this.nextLocation.set(this.tmpV1);
  }

  setQuat(q: Quat): void {
    // Capluleだし、制限なしとする
    if (this.collider)
      this.collider.setRotation(q);
    this.transform.quat.set(q);
  }
  setQuatNow(q: Quat): void {
    if (this.collider)
      this.collider.setRotation(q);
    this.transform.quat.set(q);
  }

  setScale(_: Vec3): void {
    // これはできない物とする
  }
  setScaleNow(_: Vec3): void {
    // 簡単ではないのでとりあえず保留
  }

  setLinearVelocity(_vel: Vec3): void {}
  getLinearVelocity(v: Vec3 | undefined) { // 適当
    if (!v) v = new Vec3();
    v.set(0,0,0);
    return v;
  }
  setAngularVelocity(_angvel: Vec3): void {}
  getAngularVelocity(v: Vec3 | undefined) { // 適当
    if (!v) v = new Vec3();
    v.set(0,0,0);
    return v;
  }
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

    this.transform.quat.set(this.collider.rotation());

    this.tmpV1.set(this.collider.translation());
    this.tmpV2.set(this.nextLocation);
    this.tmpV2.sub(this.tmpV1);
    this.controller.computeColliderMovement(this.collider,this.tmpV2);
    const corrected = this.controller.computedMovement();

    this.tmpV1.add(corrected);
    this.collider.setTranslation(this.tmpV1);

    this.tmpV1.sub(this.capsuleCenter);
    this.transform.loc.set(this.tmpV1);
    this.nextLocation.set(this.tmpV1);
  }
}
