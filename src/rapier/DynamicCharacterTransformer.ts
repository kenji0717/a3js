import type * as Rapier from '@dimforge/rapier3d-compat';
import { RAPIER, RapierPhysicsWorld, collisionMap } from './RapierPhysics';
import * as THREE from 'three';
import { Vec3, Quat, Transform } from '../core/LinearMath';
import { ObjectA3 } from '../core/ObjectA3';
import type { Transformer } from '../core/ObjectA3';

export interface DynamicCharacterTransformerOptions {
  auto: boolean, // object3Dから自動でCapsuleの高さと半径を計算させるか
  height: number,
  radius: number
}

export const defaultDynamicCharacterTransformerOptions = {
  auto: true,
  height: 1.5,
  radius: 0.3
};

export class DynamicCharacterTransformer implements Transformer {
  transform: Transform;
  objectA3?: ObjectA3;
  completeOptions: DynamicCharacterTransformerOptions;
  colliderDesc?: Rapier.ColliderDesc; // Capsule
  collider?: Rapier.Collider; // Capsule
  bodyDesc?: Rapier.RigidBodyDesc;
  body?: Rapier.RigidBody;
  capsuleCenter: Vec3;
  nextLocation: Vec3;
  tmpV1: Vec3;
  tmpV2: Vec3;
  tmpQ1: Quat;
  physicsWorld?: RapierPhysicsWorld;

  constructor(options: Partial<DynamicCharacterTransformerOptions> = {}) {
    this.completeOptions = {
      ...defaultDynamicCharacterTransformerOptions,
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
      box.getSize(tmpV);
      this.completeOptions.radius = Math.max(tmpV.x, tmpV.z) / 2;
      this.completeOptions.height = tmpV.y - this.completeOptions.radius * 2;
      box.getCenter(tmpV);
      this.capsuleCenter.set(tmpV);
    }
    this.bodyDesc = RAPIER.RigidBodyDesc.dynamic();
    this.bodyDesc.setTranslation(
      trans.loc.x,
      trans.loc.y,
      trans.loc.z
    );
    this.bodyDesc.setRotation({
      x: trans.quat.x,
      y: trans.quat.y,
      z: trans.quat.z,
      w: trans.quat.w
    });
    this.colliderDesc = RAPIER.ColliderDesc.capsule(
        this.completeOptions.height,
        this.completeOptions.radius);
  }

  addOneselfToPhysics(world: RapierPhysicsWorld): void {
    this.physicsWorld = world;
    if (this.bodyDesc) {
      this.body = world.world.createRigidBody(this.bodyDesc);
      this.body.setEnabledRotations(false,false,false,true); // これで回転しない
    }
    if (this.colliderDesc)
      this.collider = world.world.createCollider(this.colliderDesc,this.body);
    if (this.collider && this.objectA3)
      collisionMap.set(this.collider.handle,this.objectA3);
  }
  removeOneselfFromPhysics(world: RapierPhysicsWorld): void {
    if (this.body)
      world.world.removeRigidBody(this.body); // falseでOK
    if (this.collider) {
      world.world.removeCollider(this.collider,false); // falseでOK
      collisionMap.delete(this.collider.handle);
    }
    this.physicsWorld = undefined;
  }

  setPosition(v: Vec3): void {
    this.tmpV1.set(v);
    this.tmpV1.add(this.capsuleCenter);
    this.nextLocation.set(this.tmpV1);
  }
  setPositionNow(v: Vec3): void {
    this.tmpV1.set(v);
    this.tmpV1.add(this.capsuleCenter);
    v = this.tmpV1;
    if (this.collider)
      this.collider.setTranslation(v);
    this.transform.loc.set(v);
    this.nextLocation.set(v);
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

  setLinearVelocity(vel: Vec3): void {
    if (this.body)
      this.body.setLinvel({x:vel.x, y:vel.y, z:vel.z},true);
    else
      this.bodyDesc?.setLinvel(vel.x, vel.y, vel.z);
  }

  getLinearVelocity(v: Vec3 | undefined) {
    if (!v) v = new Vec3();
    if (this.body)
      v.set(this.body.linvel());
    else if (this.bodyDesc)
      v.set(this.bodyDesc.linvel)
    return v;
  }

  setAngularVelocity(av: Vec3): void {
    if (this.body)
      this.body.setAngvel({x:av.x, y:av.y, z:av.z},true);
    else
      this.bodyDesc?.setAngvel({x:av.x, y:av.y, z:av.z});
  }

  getAngularVelocity(v: Vec3 | undefined) {
    if (!v) v = new Vec3();
    if (this.body)
      v.set(this.body.angvel());
    else if (this.bodyDesc)
      v.set(this.bodyDesc.angvel)
    return v;
  }

  resetForce(): void {
    this.body?.resetForces(true);
  }

  addForce(f: Vec3): void {
    this.body?.addForce({x:f.x, y:f.y, z:f.z},true);
  }

  addForceAtPoint(f: Vec3, p: Vec3) {
    this.body?.addForceAtPoint({x:f.x, y:f.y, z:f.z},{x:p.x, y:p.y, z:p.z},true);
  }

  resetTorque(): void {
    this.body?.resetTorques(true);
  }

  addTorque(t: Vec3): void {
    this.body?.addTorque({x:t.x, y:t.y, z:t.z},true);
  }

  applyImpulse(i: Vec3): void {
    this.body?.applyImpulse({x:i.x, y:i.y, z:i.z},true);
  }

  applyImpulseAtPoint(i: Vec3, p: Vec3): void {
    this.body?.applyImpulseAtPoint({x:i.x, y:i.y, z:i.z},{x:p.x, y:p.y, z:p.z},true);
  }

  applyTorqueImpulse(ti: Vec3): void {
    this.body?.applyTorqueImpulse({x:ti.x, y:ti.y, z:ti.z},true);
  }

  isGrounded(): boolean {
    if (this.body && this.physicsWorld) {
      const pos = this.body.translation();
      const ray = new RAPIER.Ray(pos,{x:0,y:-1,z:0});
      // GAHA 手抜きな所がある。手抜き箇所はmemo.mdの
      // ### DynamicCharacterTransformerの手抜き箇所 にメモ。
      const maxToi = 1.1*(this.completeOptions.height+this.completeOptions.radius);
      const hit = this.physicsWorld.world.castRay(ray,maxToi,true,
        undefined, undefined,this.collider);
      return hit !== null;
    } else {
      return this.transform.loc.y <= 0;
    }
  }

  update(_dt: number): void {
    if (!this.body)
      return;

    const tmpV1 = new Vec3(this.body.translation());
    tmpV1.sub(this.capsuleCenter);
    this.transform.loc.set(tmpV1);
    this.transform.quat.set(this.body.rotation());
  }
}
