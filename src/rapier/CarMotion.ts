
import type * as Rapier from '@dimforge/rapier3d-compat';
import type { PhysicsWorld } from "../core/Physics";
import { RAPIER, RapierPhysicsWorld, collisionMap } from './RapierPhysics';
import { Vec3, Quat, Transform } from '../core/LinearMath';
import { ObjectA3 } from '../core/ObjectA3';
import type { TransformMotion, PoseMotion, Pose } from '../core/Motion';
import { Acerola3D } from '../core/Acerola3D';

export interface CarMotionOption {
}

export const defaultCarMotionOption = {
};

export class CarMotion {
  completeOption: CarMotionOption;
  transformMotion: CarTransformMotion;
  poseMotion: CarPoseMotion;

  constructor(option: Partial<CarMotionOption>) {
    this.completeOption = {
      ...defaultCarMotionOption,
      ...option
    };
    this.transformMotion = new CarTransformMotion(this);
    this.poseMotion = new CarPoseMotion(this);
  }

  setWheelEngineForce(idx: number, f: number) {
    this.transformMotion.controller?.setWheelEngineForce(idx,f);
  }
}

export class CarTransformMotion implements TransformMotion {
  cm: CarMotion;
  trans: Transform;
  objectA3?: ObjectA3;
  controller?: Rapier.DynamicRayCastVehicleController;
  //
  chassisBodyDesc?: Rapier.RigidBodyDesc;
  chassisBody?: Rapier.RigidBody;
  chassisColliderDesc?: Rapier.ColliderDesc;
  chassisCollider?: Rapier.Collider;

  constructor(cm: CarMotion) {
    this.cm = cm;
    this.trans = new Transform();
  }

  init(trans: Transform, objectA3: ObjectA3) {
    this.trans.set(trans);
    this.objectA3 = objectA3;
    this.chassisBodyDesc = new RAPIER.RigidBodyDesc(RAPIER.RigidBodyType.Dynamic);
    this.chassisColliderDesc = RAPIER.ColliderDesc.cuboid(1,0.5,2);
  }

  addOneselfToPhysics(world: RapierPhysicsWorld): void {
    if (this.chassisBodyDesc)
      this.chassisBody = world.world.createRigidBody(this.chassisBodyDesc);
    if (this.chassisColliderDesc)
      this.chassisCollider = world.world.createCollider(this.chassisColliderDesc,this.chassisBody);
    if (this.chassisCollider && this.objectA3)
      collisionMap.set(this.chassisCollider.handle,this.objectA3);
    if (this.chassisBody)
      this.controller = world.world.createVehicleController(this.chassisBody);
    this.controller?.addWheel({x:-1, y:0, z:1},{x:0,y:-1,z:0},{x:1,y:0,z:0},0.3,0.6);
    this.controller?.addWheel({x: 1, y:0, z:1},{x:0,y:-1,z:0},{x:1,y:0,z:0},0.3,0.6);
  }
  removeOneselfFromPhysics(world: RapierPhysicsWorld): void {
    if (this.chassisBody)
      world.world.removeRigidBody(this.chassisBody);
    if (this.chassisCollider) {
      world.world.removeCollider(this.chassisCollider,false); // falseでOK
      collisionMap.delete(this.chassisCollider.handle);
    }
  }

  setLocation(_v: Vec3): void {}
  setLocationNow(_v: Vec3): void {}
  setQuat(_q: Quat): void {}
  setQuatNow(_q: Quat): void {}
  setScale(_s: Vec3): void {}
  setScaleNow(_s: Vec3): void {}

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
    if (!this.controller) return true; // ということで
    let g = false;
    g ||= this.controller.wheelIsInContact(0);
    g ||= this.controller.wheelIsInContact(1);
    g ||= this.controller.wheelIsInContact(2);
    g ||= this.controller.wheelIsInContact(3);
    return g;
  }

  update(_dt: number): void {
    if (!this.chassisBody || !this.controller || !this.chassisCollider)
      return;

    this.trans.loc.set(this.chassisBody.translation());
    this.trans.quat.set(this.chassisBody.rotation());
  }
}

export class CarPoseMotion implements PoseMotion {
  cm: CarMotion;
  name: string;
  playCount: number;
  time: number;

  constructor(cm: CarMotion) {
    this.cm = cm;
    this.name = 'default';
    this.playCount = 0;
    this.time = 0;
  }

  prepare3D(objectA3: ObjectA3) {
    if (objectA3 instanceof Acerola3D)
      objectA3.addActionRoot('default');
  }
  cleanup3D(objectA3: ObjectA3) {
    if (objectA3 instanceof Acerola3D)
      objectA3.removeActionRoot('default');
  }

  addOneselfToPhysics(_world: PhysicsWorld) {}
  removeOneselfFromPhysics(_world: PhysicsWorld) {}
  setPause(_p: boolean) {}
  setTime(_time: number) {}
  update(_dt: number): Pose {
    if (!this.cm.transformMotion.chassisBody) return {};
    const chassisLoc = new Vec3(this.cm.transformMotion.chassisBody.translation());
    const chassisQuat = new Quat(this.cm.transformMotion.chassisBody.rotation());
    const frLoc = new Vec3();
    const frQuat = new Quat();
    const flLoc = new Vec3();
    const flQuat = new Quat();
    const rrLoc = new Vec3();
    const rrQuat = new Quat();
    const rlLoc = new Vec3();
    const rlQuat = new Quat();
    return {
      'chassis': { loc: chassisLoc, quat: chassisQuat },
      'frontRight': { loc: frLoc, quat: frQuat },
      'frontLeft': { loc: flLoc, quat: flQuat },
      'rearRight': { loc: rrLoc, quat: rrQuat },
      'rearLeft': { loc: rlLoc, quat: rlQuat }
    };
  }
}
