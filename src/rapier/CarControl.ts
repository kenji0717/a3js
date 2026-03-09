
import type * as Rapier from '@dimforge/rapier3d-compat';
import type { PhysicsWorld } from "../core/Physics";
import { RAPIER, RapierPhysicsWorld, collisionMap } from './RapierPhysics';
import { Vec3, Quat, Transform } from '../core/LinearMath';
import { ObjectA3 } from '../core/ObjectA3';
import type { Transforer } from '../core/ObjectA3';
import type { Motion, Pose } from '../core/ActionObject';

/*
 * タイヤの順番なんだけど、混乱しないように書いておくと、
 * FL(0),FR(1),RL(2),RR(3)という順番で統一する。
 * あと、CarMotionは、シャーシとして表示する3Dメッシュが、
 * その原点がシャーシの直方体の底の中心が原点となるように
 * 調整してPose情報を生成する。
 */

export interface CarControlOption {
  mass: number;
  defaultLocation: {x: number, y: number, z: number };
  defaultQuat: {x: number, y: number, z: number, w: number };
  chassisWidth: number;
  chassisHeight: number;
  chassisLength: number;
  chassisOffset: {x: number, y: number, z: number }; // 表示のずれを補正するやつ
  chassisFriction: number;
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
  wheelFLSuspensionCompression: number;
  wheelFRSuspensionCompression: number;
  wheelRLSuspensionCompression: number;
  wheelRRSuspensionCompression: number;
  wheelFLSuspensionRelaxation: number;
  wheelFRSuspensionRelaxation: number;
  wheelRLSuspensionRelaxation: number;
  wheelRRSuspensionRelaxation: number;
  wheelFLWheelFrictionSlip: number;
  wheelFRWheelFrictionSlip: number;
  wheelRLWheelFrictionSlip: number;
  wheelRRWheelFrictionSlip: number;
  wheelFLMaxSuspensionTravel: number;
  wheelFRMaxSuspensionTravel: number;
  wheelRLMaxSuspensionTravel: number;
  wheelRRMaxSuspensionTravel: number;
}

export const defaultCarControlOption = {
  mass: 1000.0,
  defaultLocation: {x: 0.0, y: 1.0, z: 0.0},
  defaultQuat: {x: 0.0, y: 0.0, z: 0.0, w: 1.0},
  chassisWidth: 2.0,
  chassisHeight: 1.0,
  chassisLength: 4.0,
  chassisOffset: {x: 0.0, y: -0.5, z: 0.0 }, // 表示のずれを補正するやつ
  chassisFriction: 0.1, // すぐひっかかるので、つるつるに
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
  wheelFLSuspensionCompression: 4.0,
  wheelFRSuspensionCompression: 4.0,
  wheelRLSuspensionCompression: 4.0,
  wheelRRSuspensionCompression: 4.0,
  wheelFLSuspensionRelaxation: 3.0,
  wheelFRSuspensionRelaxation: 3.0,
  wheelRLSuspensionRelaxation: 3.0,
  wheelRRSuspensionRelaxation: 3.0,
  wheelFLWheelFrictionSlip: 100.0,
  wheelFRWheelFrictionSlip: 100.0,
  wheelRLWheelFrictionSlip: 100.0,
  wheelRRWheelFrictionSlip: 100.0,
  wheelFLMaxSuspensionTravel: 0.25,
  wheelFRMaxSuspensionTravel: 0.25,
  wheelRLMaxSuspensionTravel: 0.25,
  wheelRRMaxSuspensionTravel: 0.25
};

export class CarControl {
  opt: CarControlOption;
  trans: CarTransformer;
  motion: CarMotion;

  constructor(option: Partial<CarControlOption>) {
    this.opt = {
      ...defaultCarControlOption,
      ...option
    };
    this.trans = new CarTransformer(this);
    this.motion = new CarMotion(this);
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

  // brakeに設定する値は、減速に使用する最大インパルスって
  // ことみたいだけど、あまり効いてない気がする。Three.jsの
  // サンプルなんかも、車両重量を設定するプログラムが書いて
  // なかったので1kgとかの仮定で動いてるのかもしれない。
  // 試しに10kgぐらいにしたら、調整で上手くいきそうな
  // 感じになった。DynamicRayCastVehicleController。
  brake(b: number) {
    if (this.trans.controller) {
      this.trans.controller.setWheelBrake(0, b);
      this.trans.controller.setWheelBrake(1, b);
      this.trans.controller.setWheelBrake(2, b);
      this.trans.controller.setWheelBrake(3, b);
    }
  }

  reset(loc?: Vec3, quat?: Quat) {
    if (this.trans.chassisBody) {
      if (loc)
        this.trans.chassisBody.setTranslation({x:loc.x, y:loc.y,z:loc.z},true);
      else
        this.trans.chassisBody.setTranslation(this.opt.defaultLocation,true);
      if (quat)
        this.trans.chassisBody.setRotation({x:quat.x,y:quat.y,z:quat.z,w:quat.w},true);
      else
        this.trans.chassisBody.setRotation(this.opt.defaultQuat,true);
      this.trans.chassisBody.setLinvel({x:0,y:0,z:0},true);
      this.trans.chassisBody.setAngvel({x:0,y:0,z:0},true);
    }
  }
}

export class CarTransformer implements Transforer {
  cc: CarControl;
  trans: Transform;
  objectA3?: ObjectA3;
  controller?: Rapier.DynamicRayCastVehicleController;
  //
  chassisBodyDesc?: Rapier.RigidBodyDesc;
  chassisBody?: Rapier.RigidBody;
  chassisColliderDesc?: Rapier.ColliderDesc;
  chassisCollider?: Rapier.Collider;

  constructor(cm: CarControl) {
    this.cc = cm;
    this.trans = new Transform();
  }

  init(trans: Transform, objectA3: ObjectA3) {
    this.trans.set(trans);
    this.objectA3 = objectA3;
    this.chassisBodyDesc = new RAPIER.RigidBodyDesc(RAPIER.RigidBodyType.Dynamic);
    this.chassisColliderDesc = RAPIER.ColliderDesc.cuboid(
      this.cc.opt.chassisWidth/2,
      this.cc.opt.chassisHeight/2,
      this.cc.opt.chassisLength/2);
    this.chassisColliderDesc.setMass(this.cc.opt.mass);
    this.chassisColliderDesc.setFriction(this.cc.opt.chassisFriction);
  }

  addOneselfToPhysics(world: RapierPhysicsWorld): void {
    if (this.chassisBodyDesc) {
      this.chassisBody = world.world.createRigidBody(this.chassisBodyDesc);
      this.chassisBody.setTranslation(this.cc.opt.defaultLocation,true);
      this.chassisBody.setRotation(this.cc.opt.defaultQuat,true);
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
        this.cc.opt.wheelFLPosition,
        this.cc.opt.wheelFLDirection,
        this.cc.opt.wheelFLAxle,
        this.cc.opt.wheelFLSuspensionRestLength,
        this.cc.opt.wheelFLRadius
      );
      this.controller.setWheelSuspensionStiffness(0,this.cc.opt.wheelFLSuspensionStiffness);
      this.controller.setWheelSuspensionCompression(0,this.cc.opt.wheelFLSuspensionCompression);
      this.controller.setWheelSuspensionRelaxation(0,this.cc.opt.wheelFLSuspensionRelaxation);
      this.controller.setWheelFrictionSlip(0,this.cc.opt.wheelFLWheelFrictionSlip);
      this.controller.setWheelMaxSuspensionTravel(0,this.cc.opt.wheelFLMaxSuspensionTravel);
      // 右の前輪
      this.controller.addWheel(
        this.cc.opt.wheelFRPosition,
        this.cc.opt.wheelFRDirection,
        this.cc.opt.wheelFRAxle,
        this.cc.opt.wheelFRSuspensionRestLength,
        this.cc.opt.wheelFRRadius
      );
      this.controller.setWheelSuspensionStiffness(1,this.cc.opt.wheelFRSuspensionStiffness);
      this.controller.setWheelSuspensionCompression(1,this.cc.opt.wheelFRSuspensionCompression);
      this.controller.setWheelSuspensionRelaxation(1,this.cc.opt.wheelFRSuspensionRelaxation);
      this.controller.setWheelFrictionSlip(1,this.cc.opt.wheelFRWheelFrictionSlip);
      this.controller.setWheelMaxSuspensionTravel(1,this.cc.opt.wheelFRMaxSuspensionTravel);
      // 左の後輪
      this.controller.addWheel(
        this.cc.opt.wheelRLPosition,
        this.cc.opt.wheelRLDirection,
        this.cc.opt.wheelRLAxle,
        this.cc.opt.wheelRLSuspensionRestLength,
        this.cc.opt.wheelRLRadius
      );
      this.controller.setWheelSuspensionStiffness(2,this.cc.opt.wheelRLSuspensionStiffness);
      this.controller.setWheelSuspensionCompression(2,this.cc.opt.wheelRLSuspensionCompression);
      this.controller.setWheelSuspensionRelaxation(2,this.cc.opt.wheelRLSuspensionRelaxation);
      this.controller.setWheelFrictionSlip(2,this.cc.opt.wheelRLWheelFrictionSlip);
      this.controller.setWheelMaxSuspensionTravel(2,this.cc.opt.wheelRLMaxSuspensionTravel);
      // 右の後輪
      this.controller.addWheel(
        this.cc.opt.wheelRRPosition,
        this.cc.opt.wheelRRDirection,
        this.cc.opt.wheelRRAxle,
        this.cc.opt.wheelRRSuspensionRestLength,
        this.cc.opt.wheelRRRadius
      );
      this.controller.setWheelSuspensionStiffness(3,this.cc.opt.wheelRRSuspensionStiffness);
      this.controller.setWheelSuspensionCompression(3,this.cc.opt.wheelRRSuspensionCompression);
      this.controller.setWheelSuspensionRelaxation(3,this.cc.opt.wheelRRSuspensionRelaxation);
      this.controller.setWheelFrictionSlip(3,this.cc.opt.wheelRRWheelFrictionSlip);
      this.controller.setWheelMaxSuspensionTravel(3,this.cc.opt.wheelRRMaxSuspensionTravel);
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

export class CarMotion implements Motion {
  cm: CarControl;
  name: string;
  playCount: number;
  time: number;

  constructor(cm: CarControl) {
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
    // CarTransformerでrootを動かしてしまっているので、
    // 座標や回転は補正しないといけない。
    const rootLoc = new Vec3(this.cm.trans.chassisBody.translation());
    const rootQuat = new Quat(this.cm.trans.chassisBody.rotation());
    const rootQuatInv = rootQuat.clone().conjugate();
    // シャーシ
    const chassisLoc = new Vec3(this.cm.trans.chassisBody.translation());
    chassisLoc.add(this.cm.opt.chassisOffset);
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
