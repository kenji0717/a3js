
import type * as Rapier from '@dimforge/rapier3d-compat';
import type { PhysicsWorld } from "../core/Physics";
import { RAPIER, RapierPhysicsWorld, collisionMap } from './RapierPhysics';
import { Vec3, Quat, Transform } from '../core/LinearMath';
import { ObjectA3 } from '../core/ObjectA3';
import type { TransformMotion } from '../core/ObjectA3';
import type { PoseMotion, Pose } from '../core/ActionObject';

/*
 * タイヤの順番なんだけど、混乱しないように書いておくと、
 * FL(0),FR(1),RL(2),RR(3)という順番で統一する。
 */

export interface CarMotionOption {
  mass: number;
  defaultLocation: {x: number, y: number, z: number };
  defaultQuat: {x: number, y: number, z: number, w: number };
  chassisWidth: number;
  chassisHeight: number;
  chassisLength: number;
  wheelFLPosition: {x: number, y: number, z: number };
  wheelFRPosition: {x: number, y: number, z: number };
  wheelRLPosition: {x: number, y: number, z: number };
  wheelRRPosition: {x: number, y: number, z: number };
  wheelFLRadius: number;
  wheelFRRadius: number;
  wheelRLRadius: number;
  wheelRRRadius: number;
  wheelFLWidth: number;
  wheelFRWidth: number;
  wheelRLWidth: number;
  wheelRRWidth: number;
  wheelFLSuspensionRestLength: number;
  wheelFRSuspensionRestLength: number;
  wheelRLSuspensionRestLength: number;
  wheelRRSuspensionRestLength: number;
  wheelFLDirection: {x: number, y: number, z: number };
  wheelFRDirection: {x: number, y: number, z: number };
  wheelRLDirection: {x: number, y: number, z: number };
  wheelRRDirection: {x: number, y: number, z: number };
  wheelFLAxle: {x: number, y: number, z: number };
  wheelFRAxle: {x: number, y: number, z: number };
  wheelRLAxle: {x: number, y: number, z: number };
  wheelRRAxle: {x: number, y: number, z: number };
  wheelFLSuspensionStiffness: number;
  wheelFRSuspensionStiffness: number;
  wheelRLSuspensionStiffness: number;
  wheelRRSuspensionStiffness: number;
  wheelFLWheelFrictionSlip: number;
  wheelFRWheelFrictionSlip: number;
  wheelRLWheelFrictionSlip: number;
  wheelRRWheelFrictionSlip: number;
}

export const defaultCarMotionOption = {
  mass: 1000.0,
  defaultLocation: {x: 0.0, y: 1.0, z: 0.0},
  defaultQuat: {x: 0.0, y: 0.0, z: 0.0, w: 1.0},
  chassisWidth: 2.0,
  chassisHeight: 1.0,
  chassisLength: 4.0,
  wheelFLPosition: {x:  1.0, y: 0.0, z:  1.5 },
  wheelFRPosition: {x: -1.0, y: 0.0, z:  1.5 },
  wheelRLPosition: {x:  1.0, y: 0.0, z: -1.5 },
  wheelRRPosition: {x: -1.0, y: 0.0, z: -1.5 },
  wheelFLRadius: 0.3,
  wheelFRRadius: 0.3,
  wheelRLRadius: 0.3,
  wheelRRRadius: 0.3,
  wheelFLWidth: 0.4,
  wheelFRWidth: 0.4,
  wheelRLWidth: 0.4,
  wheelRRWidth: 0.4,
  wheelFLSuspensionRestLength: 0.8,
  wheelFRSuspensionRestLength: 0.8,
  wheelRLSuspensionRestLength: 0.8,
  wheelRRSuspensionRestLength: 0.8,
  wheelFLDirection: {x: 0.0, y: -1.0, z: 0.0 },
  wheelFRDirection: {x: 0.0, y: -1.0, z: 0.0 },
  wheelRLDirection: {x: 0.0, y: -1.0, z: 0.0 },
  wheelRRDirection: {x: 0.0, y: -1.0, z: 0.0 },
  wheelFLAxle: {x: -1.0, y: 0.0, z: 0.0 },
  wheelFRAxle: {x: -1.0, y: 0.0, z: 0.0 },
  wheelRLAxle: {x: -1.0, y: 0.0, z: 0.0 },
  wheelRRAxle: {x: -1.0, y: 0.0, z: 0.0 },
  wheelFLSuspensionStiffness: 24.0,
  wheelFRSuspensionStiffness: 24.0,
  wheelRLSuspensionStiffness: 24.0,
  wheelRRSuspensionStiffness: 24.0,
  wheelFLWheelFrictionSlip: 1000.0,
  wheelFRWheelFrictionSlip: 1000.0,
  wheelRLWheelFrictionSlip: 1000.0,
  wheelRRWheelFrictionSlip: 1000.0
};

export class CarMotion {
  opt: CarMotionOption;
  trans: CarTransformMotion;
  pose: CarPoseMotion;

  constructor(option: Partial<CarMotionOption>) {
    this.opt = {
      ...defaultCarMotionOption,
      ...option
    };
    this.trans = new CarTransformMotion(this);
    this.pose = new CarPoseMotion(this);
  }

  handle(h: number) {
    if (this.trans.controller) {
      this.trans.controller.setWheelSteering(0,h);
      this.trans.controller.setWheelSteering(1,h);
    }
  }

  accelerator(a: number) {
    if (this.trans.controller) {
      this.trans.controller.setWheelEngineForce(0,a);
      this.trans.controller.setWheelEngineForce(1,a);
      this.trans.controller.setWheelEngineForce(2,a);
      this.trans.controller.setWheelEngineForce(3,a);
    }
  }

  brake(b: number) {
    if (this.trans.controller) {
      this.trans.controller.setWheelBrake(0, b);
      this.trans.controller.setWheelBrake(1, b);
      this.trans.controller.setWheelBrake(2, b);
      this.trans.controller.setWheelBrake(3, b);
    }
  }

  reset() {
    if (this.trans.chassisBody) {
      this.trans.chassisBody.setTranslation(this.opt.defaultLocation,true);
      this.trans.chassisBody.setRotation(this.opt.defaultQuat,true);
      this.trans.chassisBody.setLinvel({x:0,y:0,z:0},true);
      this.trans.chassisBody.setAngvel({x:0,y:0,z:0},true);
    }
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
    this.chassisColliderDesc = RAPIER.ColliderDesc.cuboid(
      this.cm.opt.chassisWidth/2,
      this.cm.opt.chassisHeight/2,
      this.cm.opt.chassisLength/2);
    this.chassisColliderDesc.setMass(this.cm.opt.mass);
  }

  addOneselfToPhysics(world: RapierPhysicsWorld): void {
    if (this.chassisBodyDesc) {
      this.chassisBody = world.world.createRigidBody(this.chassisBodyDesc);
      this.chassisBody.setTranslation(this.cm.opt.defaultLocation,true);
      this.chassisBody.setRotation(this.cm.opt.defaultQuat,true);
    }
    if (this.chassisColliderDesc)
      this.chassisCollider = world.world.createCollider(this.chassisColliderDesc,this.chassisBody);
    if (this.chassisCollider && this.objectA3)
      collisionMap.set(this.chassisCollider.handle,this.objectA3);
    if (this.chassisBody)
      this.controller = world.world.createVehicleController(this.chassisBody);

    if (this.controller) {
      // 左の前輪
      this.controller.addWheel(
        this.cm.opt.wheelFLPosition,
        this.cm.opt.wheelFLDirection,
        this.cm.opt.wheelFLAxle,
        this.cm.opt.wheelFLSuspensionRestLength,
        this.cm.opt.wheelFLRadius
      );
      this.controller.setWheelSuspensionStiffness(0,this.cm.opt.wheelFLSuspensionStiffness);
      this.controller.setWheelFrictionSlip(0,this.cm.opt.wheelFLWheelFrictionSlip);
      // 右の前輪
      this.controller.addWheel(
        this.cm.opt.wheelFRPosition,
        this.cm.opt.wheelFRDirection,
        this.cm.opt.wheelFRAxle,
        this.cm.opt.wheelFRSuspensionRestLength,
        this.cm.opt.wheelFRRadius
      );
      this.controller.setWheelSuspensionStiffness(1,this.cm.opt.wheelFRSuspensionStiffness);
      this.controller.setWheelFrictionSlip(1,this.cm.opt.wheelFRWheelFrictionSlip);
      // 左の後輪
      this.controller.addWheel(
        this.cm.opt.wheelRLPosition,
        this.cm.opt.wheelRLDirection,
        this.cm.opt.wheelRLAxle,
        this.cm.opt.wheelRLSuspensionRestLength,
        this.cm.opt.wheelRLRadius
      );
      this.controller.setWheelSuspensionStiffness(2,this.cm.opt.wheelRLSuspensionStiffness);
      this.controller.setWheelFrictionSlip(2,this.cm.opt.wheelRLWheelFrictionSlip);
      // 右の後輪
      this.controller.addWheel(
        this.cm.opt.wheelRRPosition,
        this.cm.opt.wheelRRDirection,
        this.cm.opt.wheelRRAxle,
        this.cm.opt.wheelRRSuspensionRestLength,
        this.cm.opt.wheelRRRadius
      );
      this.controller.setWheelSuspensionStiffness(3,this.cm.opt.wheelRRSuspensionStiffness);
      this.controller.setWheelFrictionSlip(3,this.cm.opt.wheelRRWheelFrictionSlip);
    }
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

  update(dt: number): void {
    this.controller?.updateVehicle(dt);
    if (this.chassisBody)
      this.trans.loc.set(this.chassisBody.translation());
    if (this.chassisBody)
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

  addOneselfToPhysics(_world: PhysicsWorld) {}
  removeOneselfFromPhysics(_world: PhysicsWorld) {}
  setPause(_p: boolean) {}
  setTime(_time: number) {}
  update(_dt: number): Pose {
    if (!this.cm.trans.chassisBody) return {};
    if (!this.cm.trans.controller) return {};
    // CarTransformMotionでrootを動かしてしまっているので、
    // 座標や回転は補正しないといけない。
    const rootLoc = new Vec3(this.cm.trans.chassisBody.translation());
    const rootQuat = new Quat(this.cm.trans.chassisBody.rotation());
    const rootQuatInv = rootQuat.clone().conjugate();
    // シャーシ
    const chassisLoc = new Vec3(this.cm.trans.chassisBody.translation());
    chassisLoc.sub(rootLoc);
    const chassisQuat = new Quat(this.cm.trans.chassisBody.rotation());
    chassisQuat.mul(rootQuatInv);
    // 左の前輪
    const tmpQ = new Quat();
    const flLoc = new Vec3();
    const flQuat = new Quat();
    {
      const wheelAxleCs = new Vec3(this.cm.opt.wheelFLAxle);
      const connection = new Vec3(this.cm.opt.wheelFLPosition);
      const suspension = this.cm.trans.controller.wheelSuspensionLength(0) || 0;
      const steering = this.cm.trans.controller.wheelSteering(0) || 0;
      const rotationRad = this.cm.trans.controller.wheelRotation(0) || 0;
      flLoc.set(connection);
      flLoc.sub(0,suspension,0);
      flQuat.set(0,Math.sin(steering/2),0,Math.cos(steering/2));
      tmpQ.set(wheelAxleCs.x*Math.sin(rotationRad/2),
               wheelAxleCs.y*Math.sin(rotationRad/2),
               wheelAxleCs.z*Math.sin(rotationRad/2),
               Math.cos(rotationRad/2));
      flQuat.mul(tmpQ);
    }
    // 右の前輪
    const frLoc = new Vec3();
    const frQuat = new Quat();
    {
      const wheelAxleCs = new Vec3(this.cm.opt.wheelFRAxle);
      const connection = new Vec3(this.cm.opt.wheelFRPosition);
      const suspension = this.cm.trans.controller.wheelSuspensionLength(1) || 0;
      const steering = this.cm.trans.controller.wheelSteering(1) || 0;
      const rotationRad = this.cm.trans.controller.wheelRotation(1) || 0;
      frLoc.set(connection);
      frLoc.sub(0,suspension,0);
      frQuat.set(0,Math.sin(steering/2),0,Math.cos(steering/2));
      tmpQ.set(wheelAxleCs.x*Math.sin(rotationRad/2),
               wheelAxleCs.y*Math.sin(rotationRad/2),
               wheelAxleCs.z*Math.sin(rotationRad/2),
               Math.cos(rotationRad/2));
      frQuat.mul(tmpQ);
    }
    // 左の後輪
    const rlLoc = new Vec3();
    const rlQuat = new Quat();
    {
      const wheelAxleCs = new Vec3(this.cm.opt.wheelRLAxle);
      const connection = new Vec3(this.cm.opt.wheelRLPosition);
      const suspension = this.cm.trans.controller.wheelSuspensionLength(2) || 0;
      const steering = this.cm.trans.controller.wheelSteering(2) || 0;
      const rotationRad = this.cm.trans.controller.wheelRotation(2) || 0;
      rlLoc.set(connection);
      rlLoc.sub(0,suspension,0);
      rlQuat.set(0,Math.sin(steering/2),0,Math.cos(steering/2));
      tmpQ.set(wheelAxleCs.x*Math.sin(rotationRad/2),
               wheelAxleCs.y*Math.sin(rotationRad/2),
               wheelAxleCs.z*Math.sin(rotationRad/2),
               Math.cos(rotationRad/2));
      rlQuat.mul(tmpQ);
    }
    // 右の後輪
    const rrLoc = new Vec3();
    const rrQuat = new Quat();
    {
      const wheelAxleCs = new Vec3(this.cm.opt.wheelRRAxle);
      const connection = new Vec3(this.cm.opt.wheelRRPosition);
      const suspension = this.cm.trans.controller.wheelSuspensionLength(3) || 0;
      const steering = this.cm.trans.controller.wheelSteering(3) || 0;
      const rotationRad = this.cm.trans.controller.wheelRotation(3) || 0;
      rrLoc.set(connection);
      rrLoc.sub(0,suspension,0);
      rrQuat.set(0,Math.sin(steering/2),0,Math.cos(steering/2));
      tmpQ.set(wheelAxleCs.x*Math.sin(rotationRad/2),
               wheelAxleCs.y*Math.sin(rotationRad/2),
               wheelAxleCs.z*Math.sin(rotationRad/2),
               Math.cos(rotationRad/2));
      rrQuat.mul(tmpQ);
    }
    return {
      'chassis': { loc: chassisLoc, quat: chassisQuat },
      'frontRight': { loc: frLoc, quat: frQuat },
      'frontLeft': { loc: flLoc, quat: flQuat },
      'rearRight': { loc: rrLoc, quat: rrQuat },
      'rearLeft': { loc: rlLoc, quat: rlQuat }
    };
  }
}
