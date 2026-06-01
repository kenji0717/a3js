
import type * as Rapier from '@dimforge/rapier3d-compat';
import type { PhysicsWorld } from "../core/Physics";
import { RAPIER, RapierPhysicsWorld, collisionMap } from './RapierPhysics';
import { Vec3, Quat, Transform } from '../core/LinearMath';
import { ObjectA3 } from '../core/ObjectA3';
import type { Transformer } from '../core/ObjectA3';
import type { Motion, Pose } from '../core/ActionObject';

/*
 * タイヤの順番なんだけど、混乱しないように書いておくと、
 * FL(0),FR(1),RL(2),RR(3)という順番で統一する。
 */

/**
 * `CarControl` の生成オプションです。
 * 車体・タイヤのサイズやサスペンション特性など、車の物理パラメータを設定します。
 *
 * タイヤの順番は FL(0)・FR(1)・RL(2)・RR(3) で統一されています。
 */
export interface CarControlOptions {
  /** 車体の質量（kg）。デフォルトは `10.0`。 */
  mass: number;
  /** 初期位置。デフォルトは `{ x: 0, y: 1, z: 0 }`。 */
  defaultLocation: {x: number, y: number, z: number };
  /** 初期回転（クォータニオン）。デフォルトは無回転。 */
  defaultQuat: {x: number, y: number, z: number, w: number };
  /** シャーシの幅（メートル）。デフォルトは `2.0`。 */
  chassisWidth: number;
  /** シャーシの高さ（メートル）。デフォルトは `1.0`。 */
  chassisHeight: number;
  /** シャーシの長さ（メートル）。デフォルトは `4.0`。 */
  chassisLength: number;
  /** 3D モデルとコライダーの位置ずれを補正するオフセット。デフォルトは `{ x: 0, y: -0.5, z: 0 }`。 */
  chassisOffset: {x: number, y: number, z: number };
  /** シャーシの摩擦係数。デフォルトは `0.1`。 */
  chassisFriction: number;
  /** 前輪の Y 方向位置（メートル）。デフォルトは `0.0`。 */
  wheelFrontYPosition: number;
  /** 前輪の Z 方向位置（メートル）。デフォルトは `1.5`。 */
  wheelFrontZPosition: number;
  /** 前輪の車軸長（メートル）。デフォルトは `2.0`。 */
  wheelFrontAxleLength: number;
  /** 後輪の Y 方向位置（メートル）。デフォルトは `0.0`。 */
  wheelRearYPosition: number;
  /** 後輪の Z 方向位置（メートル）。デフォルトは `-1.5`。 */
  wheelRearZPosition: number;
  /** 後輪の車軸長（メートル）。デフォルトは `2.0`。 */
  wheelRearAxleLength: number;
  /** 前輪の半径（メートル）。デフォルトは `0.3`。 */
  wheelFrontRadius: number;
  /** 後輪の半径（メートル）。デフォルトは `0.3`。 */
  wheelRearRadius: number;
  /** 前輪の幅（メートル）。デフォルトは `0.4`。 */
  wheelFrontWidth: number;
  /** 後輪の幅（メートル）。デフォルトは `0.4`。 */
  wheelRearWidth: number;
  /** 前輪のサスペンション自然長（メートル）。デフォルトは `0.8`。 */
  wheelFrontSuspensionRestLength: number;
  /** 後輪のサスペンション自然長（メートル）。デフォルトは `0.8`。 */
  wheelRearSuspensionRestLength: number;
  /** 前輪のサスペンション方向ベクトル。デフォルトは下向き `{ x: 0, y: -1, z: 0 }`。 */
  wheelFrontDirection: {x: number, y: number, z: number };
  /** 後輪のサスペンション方向ベクトル。デフォルトは下向き `{ x: 0, y: -1, z: 0 }`。 */
  wheelRearDirection: {x: number, y: number, z: number };
  /** 前輪の車軸方向ベクトル。デフォルトは `{ x: -1, y: 0, z: 0 }`。 */
  wheelFrontAxle: {x: number, y: number, z: number };
  /** 後輪の車軸方向ベクトル。デフォルトは `{ x: -1, y: 0, z: 0 }`。 */
  wheelRearAxle: {x: number, y: number, z: number };
  /** 前輪のサスペンション剛性。デフォルトは `24.0`。 */
  wheelFrontSuspensionStiffness: number;
  /** 後輪のサスペンション剛性。デフォルトは `24.0`。 */
  wheelRearSuspensionStiffness: number;
  /** 前輪のサスペンション圧縮ダンパー係数。デフォルトは `4.0`。 */
  wheelFrontSuspensionCompression: number;
  /** 後輪のサスペンション圧縮ダンパー係数。デフォルトは `4.0`。 */
  wheelRearSuspensionCompression: number;
  /** 前輪のサスペンション伸長ダンパー係数。デフォルトは `3.0`。 */
  wheelFrontSuspensionRelaxation: number;
  /** 後輪のサスペンション伸長ダンパー係数。デフォルトは `3.0`。 */
  wheelRearSuspensionRelaxation: number;
  /** 前輪の摩擦スリップ係数（大きいほどグリップ力が高い）。デフォルトは `100.0`。 */
  wheelFrontWheelFrictionSlip: number;
  /** 後輪の摩擦スリップ係数。デフォルトは `100.0`。 */
  wheelRearWheelFrictionSlip: number;
  /** 前輪のサスペンション最大ストローク（メートル）。デフォルトは `0.25`。 */
  wheelFrontMaxSuspensionTravel: number;
  /** 後輪のサスペンション最大ストローク（メートル）。デフォルトは `0.25`。 */
  wheelRearMaxSuspensionTravel: number;
  /** 空気抵抗係数。`0` で無効。デフォルトは `0`。 */
  aerodynamicDrag: number;
}

/**
 * CarControlを生成する時に、パラメータが提供されなかった
 * 場合に使用されるデフォルトのパラメータ。
 */
export const defaultCarControlOptions = {
  mass: 10.0, // ブレーキが弱いのでこうするしかない
  defaultLocation: {x: 0.0, y: 1.0, z: 0.0},
  defaultQuat: {x: 0.0, y: 0.0, z: 0.0, w: 1.0},
  chassisWidth: 2.0,
  chassisHeight: 1.0,
  chassisLength: 4.0,
  chassisOffset: {x: 0.0, y: -0.5, z: 0.0 }, // 表示のずれを補正するやつ
  chassisFriction: 0.1, // すぐひっかかるので、つるつるに
  wheelFrontYPosition: 0.0,
  wheelFrontZPosition: 1.5,
  wheelFrontAxleLength: 2.0,
  wheelRearYPosition: 0.0,
  wheelRearZPosition: -1.5,
  wheelRearAxleLength: 2.0,
  wheelFrontRadius: 0.3,
  wheelRearRadius: 0.3,
  wheelFrontWidth: 0.4,
  wheelRearWidth: 0.4,
  wheelFrontSuspensionRestLength: 0.8,
  wheelRearSuspensionRestLength: 0.8,
  wheelFrontDirection: {x: 0.0, y: -1.0, z: 0.0 },
  wheelRearDirection: {x: 0.0, y: -1.0, z: 0.0 },
  wheelFrontAxle: {x: -1.0, y: 0.0, z: 0.0 },
  wheelRearAxle: {x: -1.0, y: 0.0, z: 0.0 },
  wheelFrontSuspensionStiffness: 24.0,
  wheelRearSuspensionStiffness: 24.0,
  wheelFrontSuspensionCompression: 4.0,
  wheelRearSuspensionCompression: 4.0,
  wheelFrontSuspensionRelaxation: 3.0,
  wheelRearSuspensionRelaxation: 3.0,
  wheelFrontWheelFrictionSlip: 100.0,
  wheelRearWheelFrictionSlip: 100.0,
  wheelFrontMaxSuspensionTravel: 0.25,
  wheelRearMaxSuspensionTravel: 0.25,
  aerodynamicDrag: 0
};

/**
 * 4輪車の物理演算を管理するオブジェクトです。
 *
 * 左右対称の4輪車を前提としており、Rapier3D の `DynamicRayCastVehicleController` を使って
 * 車体・タイヤの動きをシミュレーションします。
 *
 * このオブジェクトは内部に `trans`（`CarTransformer`）と `motion`（`CarMotion`）を持ちます。
 * `ActionObject` に対して `trans` を Transformer、`motion` を Motion として設定して使用します。
 *
 * @example
 * ```ts
 * const car = new CarControl({ mass: 20 });
 * const carObj = new GLTF('car.glb');
 * await carObj.ready;
 * carObj.setTransformer(car.trans);
 * carObj.setMotion('default', car.motion);
 * scene.add(carObj);
 *
 * // ゲームループ内で操作
 * car.steer(0.3);      // ハンドル操作（ラジアン）
 * car.accelerate(500); // アクセル
 * car.brake(0);        // ブレーキ
 * ```
 */
export class CarControl {
  opt: CarControlOptions;
  trans: CarTransformer;
  motion: CarMotion;

  constructor(options: Partial<CarControlOptions>) {
    this.opt = {
      ...defaultCarControlOptions,
      ...options
    };
    this.trans = new CarTransformer(this);
    this.motion = new CarMotion(this);
  }

  /**
   * ハンドルを操作します。
   * @param angle ステアリング角度（ラジアン）。正の値で右方向に曲がります。
   */
  steer(angle: number) {
    if (this.trans.controller) {
      this.trans.controller.setWheelSteering(0,angle);
      this.trans.controller.setWheelSteering(1,angle);
    }
  }

  /**
   * アクセルを操作します。全4輪にエンジン力を加えます。
   * @param value エンジン力（ニュートン）。正の値で前進、負の値で後退します。
   */
  accelerate(value: number) {
    if (this.trans.controller) {
      this.trans.controller.setWheelEngineForce(0,value);
      this.trans.controller.setWheelEngineForce(1,value);
      this.trans.controller.setWheelEngineForce(2,value);
      this.trans.controller.setWheelEngineForce(3,value);
    }
  }

  /**
   * ブレーキを操作します。全4輪にブレーキ力を加えます。
   * @param b ブレーキ力（大きいほど強くブレーキがかかります）。`0` でブレーキ解除。
   */
  brake(b: number) {
    if (this.trans.controller) {
      this.trans.controller.setWheelBrake(0, b);
      this.trans.controller.setWheelBrake(1, b);
      this.trans.controller.setWheelBrake(2, b);
      this.trans.controller.setWheelBrake(3, b);
    }
  }

  /**
   * 車をリセットします。指定した位置・回転に車体を瞬間移動させ、速度をゼロにします。
   * 省略時は `defaultLocation` / `defaultQuat` に戻します。
   * @param loc リセット先の位置。省略時は初期位置。
   * @param quat リセット先の回転。省略時は初期回転。
   */
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

/**
 * `CarControl` が内部で使用するシャーシの Transformer です。
 * `ActionObject` の Transformer として設定して使用します。
 * 直接インスタンスを生成するのではなく、`CarControl` の `trans` プロパティを通じて使用してください。
 */
export class CarTransformer implements Transformer {
  cc: CarControl;
  transform: Transform;
  objectA3?: ObjectA3;
  controller?: Rapier.DynamicRayCastVehicleController;
  //
  chassisBodyDesc?: Rapier.RigidBodyDesc;
  chassisBody?: Rapier.RigidBody;
  chassisColliderDesc?: Rapier.ColliderDesc;
  chassisCollider?: Rapier.Collider;

  constructor(cm: CarControl) {
    this.cc = cm;
    this.transform = new Transform();
  }

  init(trans: Transform, objectA3: ObjectA3) {
    this.transform.set(trans);
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
      const p = {x:0,y:0,z:0};
      p.x = -this.cc.opt.wheelFrontAxleLength/2.0;
      p.y = this.cc.opt.wheelFrontYPosition;
      p.z = this.cc.opt.wheelFrontZPosition;
      this.controller.addWheel(
        p,
        this.cc.opt.wheelFrontDirection,
        this.cc.opt.wheelFrontAxle,
        this.cc.opt.wheelFrontSuspensionRestLength,
        this.cc.opt.wheelFrontRadius
      );
      this.controller.setWheelSuspensionStiffness(0,this.cc.opt.wheelFrontSuspensionStiffness);
      this.controller.setWheelSuspensionCompression(0,this.cc.opt.wheelFrontSuspensionCompression);
      this.controller.setWheelSuspensionRelaxation(0,this.cc.opt.wheelFrontSuspensionRelaxation);
      this.controller.setWheelFrictionSlip(0,this.cc.opt.wheelFrontWheelFrictionSlip);
      this.controller.setWheelMaxSuspensionTravel(0,this.cc.opt.wheelFrontMaxSuspensionTravel);
      // 右の前輪
      p.x = this.cc.opt.wheelFrontAxleLength/2.0;
      p.y = this.cc.opt.wheelFrontYPosition;
      p.z = this.cc.opt.wheelFrontZPosition;
      this.controller.addWheel(
        p,
        this.cc.opt.wheelFrontDirection,
        this.cc.opt.wheelFrontAxle,
        this.cc.opt.wheelFrontSuspensionRestLength,
        this.cc.opt.wheelFrontRadius
      );
      this.controller.setWheelSuspensionStiffness(1,this.cc.opt.wheelFrontSuspensionStiffness);
      this.controller.setWheelSuspensionCompression(1,this.cc.opt.wheelFrontSuspensionCompression);
      this.controller.setWheelSuspensionRelaxation(1,this.cc.opt.wheelFrontSuspensionRelaxation);
      this.controller.setWheelFrictionSlip(1,this.cc.opt.wheelFrontWheelFrictionSlip);
      this.controller.setWheelMaxSuspensionTravel(1,this.cc.opt.wheelFrontMaxSuspensionTravel);
      // 左の後輪
      p.x = -this.cc.opt.wheelRearAxleLength/2.0;
      p.y = this.cc.opt.wheelRearYPosition;
      p.z = this.cc.opt.wheelRearZPosition;
      this.controller.addWheel(
        p,
        this.cc.opt.wheelRearDirection,
        this.cc.opt.wheelRearAxle,
        this.cc.opt.wheelRearSuspensionRestLength,
        this.cc.opt.wheelRearRadius
      );
      this.controller.setWheelSuspensionStiffness(2,this.cc.opt.wheelRearSuspensionStiffness);
      this.controller.setWheelSuspensionCompression(2,this.cc.opt.wheelRearSuspensionCompression);
      this.controller.setWheelSuspensionRelaxation(2,this.cc.opt.wheelRearSuspensionRelaxation);
      this.controller.setWheelFrictionSlip(2,this.cc.opt.wheelRearWheelFrictionSlip);
      this.controller.setWheelMaxSuspensionTravel(2,this.cc.opt.wheelRearMaxSuspensionTravel);
      // 右の後輪
      p.x = this.cc.opt.wheelRearAxleLength/2.0;
      p.y = this.cc.opt.wheelRearYPosition;
      p.z = this.cc.opt.wheelRearZPosition;
      this.controller.addWheel(
        p,
        this.cc.opt.wheelRearDirection,
        this.cc.opt.wheelRearAxle,
        this.cc.opt.wheelRearSuspensionRestLength,
        this.cc.opt.wheelRearRadius
      );
      this.controller.setWheelSuspensionStiffness(3,this.cc.opt.wheelRearSuspensionStiffness);
      this.controller.setWheelSuspensionCompression(3,this.cc.opt.wheelRearSuspensionCompression);
      this.controller.setWheelSuspensionRelaxation(3,this.cc.opt.wheelRearSuspensionRelaxation);
      this.controller.setWheelFrictionSlip(3,this.cc.opt.wheelRearWheelFrictionSlip);
      this.controller.setWheelMaxSuspensionTravel(3,this.cc.opt.wheelRearMaxSuspensionTravel);
    }
  }
  removeOneselfFromPhysics(world: RapierPhysicsWorld): void {
    if (this.chassisCollider) {
      world.world.removeCollider(this.chassisCollider,true); // trueで子も削除
      collisionMap.delete(this.chassisCollider.handle);
      this.chassisCollider = undefined;
    }
    if (this.chassisBody)
      world.world.removeRigidBody(this.chassisBody);
      this.chassisBody = undefined;
  }

  setPosition(_v: Vec3): void {}
  setPositionNow(_v: Vec3): void {}
  setQuat(_q: Quat): void {}
  setQuatNow(_q: Quat): void {}
  setScale(_s: Vec3): void {}
  setScaleNow(_s: Vec3): void {}

  setLinearVelocity(_vel: Vec3): void {}
  getLinearVelocity(v: Vec3 | undefined) {
    if (!v) v = new Vec3();
    if (this.chassisBody)
      v.set(this.chassisBody.linvel());
    else if (this.chassisBodyDesc)
      v.set(this.chassisBodyDesc.linvel)
    return v;
  }
  setAngularVelocity(_angvel: Vec3): void {}
  getAngularVelocity(v: Vec3 | undefined) {
    if (!v) v = new Vec3();
    if (this.chassisBody)
      v.set(this.chassisBody.angvel());
    else if (this.chassisBodyDesc)
      v.set(this.chassisBodyDesc.angvel)
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
    if (!this.controller) return true; // ということで
    let g = false;
    g ||= this.controller.wheelIsInContact(0);
    g ||= this.controller.wheelIsInContact(1);
    g ||= this.controller.wheelIsInContact(2);
    g ||= this.controller.wheelIsInContact(3);
    return g;
  }

  // Rapierが返すシャーシーのRigidBodyの速度が変な
  // 時があるので、その速度の平均を保存しておくための
  // 変数として以下のvvを使う。
  vv = new Vec3();

  update(dt: number): void {
    // 空気抵抗を加える、などの調整をする。
    // this.chassisBody.linvel()で得られる速度が時々変なことに
    // なるっぽいので、色々工夫する必要があった。突然Y方向に
    // とんでもない速度が出るので、そんな時にクリップするのと、
    // 少し平均をとるような処理を入れることにした。
    if (this.cc.opt.aerodynamicDrag > 0.0 && this.chassisBody) {
      const v = new Vec3(this.chassisBody.linvel());
      if (Math.abs(v.y) > 3.0) {
//console.log(`GAHA: CarControl.update(). 跳ねすぎ？ v=`,v);
        v.set(v.x,3*v.y/Math.abs(v.y),v.z);
      }
      this.vv.lerp(this.vv,v,0.9); // 0.9でいいのか？
      const s = this.vv.length();
      if (s !== 0) {
        v.set(this.vv);
        v.normalize();
        v.scale(-s*s*this.cc.opt.aerodynamicDrag);
        this.chassisBody.resetForces(true);
        this.chassisBody.addForce({x:v.x,y:v.y,z:v.z},true);
      }
    }

    this.controller?.updateVehicle(dt);
    if (this.chassisBody)
      this.transform.loc.set(this.chassisBody.translation());
    if (this.chassisBody)
      this.transform.quat.set(this.chassisBody.rotation());
  }
}

/**
 * `CarControl` が内部で使用するタイヤ・シャーシアニメーションの Motion です。
 * `ActionObject` の Motion として設定して使用します。
 * シャーシとタイヤそれぞれのボーン名（`"chassis"`, `"frontLeft"`, `"frontRight"`, `"rearLeft"`, `"rearRight"`）に
 * 対応する位置・回転を毎フレーム返します。
 * 直接インスタンスを生成するのではなく、`CarControl` の `motion` プロパティを通じて使用してください。
 */
export class CarMotion implements Motion {
  cm: CarControl;
  name: string;
  playCount: number;
  time: number;
  finishListener?: ()=>void;

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
  setFinishListener(listener: ()=>void | undefined) {
    this.finishListener = listener;
  }
  update(_dt: number): Pose {
    if (!this.cm.trans.chassisBody) return {};
    if (!this.cm.trans.controller) return {};
    // CarTransformerでrootを動かしてしまっているので、
    // 座標や回転は補正しないといけない。
    const rootLoc = new Vec3(this.cm.trans.chassisBody.translation());
    const rootQuat = new Quat(this.cm.trans.chassisBody.rotation());
    const rootQuatInv = new Quat(-rootQuat.x, -rootQuat.y, -rootQuat.z, rootQuat.w);
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

      const axle = this.cm.opt.wheelFrontAxle;
      const suspension = this.cm.trans.controller.wheelSuspensionLength(0) || 0;
      const steering = this.cm.trans.controller.wheelSteering(0) || 0;
      const rotationRad = this.cm.trans.controller.wheelRotation(0) || 0;
      flLoc.set(-this.cm.opt.wheelFrontAxleLength/2.0, this.cm.opt.wheelFrontYPosition, this.cm.opt.wheelFrontZPosition);
      flLoc.sub(0,suspension,0);
      flQuat.set(0,Math.sin(steering/2),0,Math.cos(steering/2));
      tmpQ.set(axle.x*Math.sin(rotationRad/2),
               axle.y*Math.sin(rotationRad/2),
               axle.z*Math.sin(rotationRad/2),
               Math.cos(rotationRad/2));
      flQuat.mul(tmpQ);
    }
    // 右の前輪
    const frLoc = new Vec3();
    const frQuat = new Quat();
    {
      const axle = this.cm.opt.wheelFrontAxle;
      const suspension = this.cm.trans.controller.wheelSuspensionLength(1) || 0;
      const steering = this.cm.trans.controller.wheelSteering(1) || 0;
      const rotationRad = this.cm.trans.controller.wheelRotation(1) || 0;
      frLoc.set(this.cm.opt.wheelFrontAxleLength/2.0, this.cm.opt.wheelFrontYPosition, this.cm.opt.wheelFrontZPosition);
      frLoc.sub(0,suspension,0);
      frQuat.set(0,Math.sin(steering/2),0,Math.cos(steering/2));
      tmpQ.set(axle.x*Math.sin(rotationRad/2),
               axle.y*Math.sin(rotationRad/2),
               axle.z*Math.sin(rotationRad/2),
               Math.cos(rotationRad/2));
      frQuat.mul(tmpQ);
    }
    // 左の後輪
    const rlLoc = new Vec3();
    const rlQuat = new Quat();
    {
      const axle = this.cm.opt.wheelRearAxle;
      const suspension = this.cm.trans.controller.wheelSuspensionLength(2) || 0;
      const steering = this.cm.trans.controller.wheelSteering(2) || 0;
      const rotationRad = this.cm.trans.controller.wheelRotation(2) || 0;
      rlLoc.set(-this.cm.opt.wheelRearAxleLength/2.0, this.cm.opt.wheelRearYPosition, this.cm.opt.wheelRearZPosition);
      rlLoc.sub(0,suspension,0);
      rlQuat.set(0,Math.sin(steering/2),0,Math.cos(steering/2));
      tmpQ.set(axle.x*Math.sin(rotationRad/2),
               axle.y*Math.sin(rotationRad/2),
               axle.z*Math.sin(rotationRad/2),
               Math.cos(rotationRad/2));
      rlQuat.mul(tmpQ);
    }
    // 右の後輪
    const rrLoc = new Vec3();
    const rrQuat = new Quat();
    {
      const axle = this.cm.opt.wheelRearAxle;
      const suspension = this.cm.trans.controller.wheelSuspensionLength(3) || 0;
      const steering = this.cm.trans.controller.wheelSteering(3) || 0;
      const rotationRad = this.cm.trans.controller.wheelRotation(3) || 0;
      rrLoc.set(this.cm.opt.wheelRearAxleLength/2.0, this.cm.opt.wheelRearYPosition, this.cm.opt.wheelRearZPosition);
      rrLoc.sub(0,suspension,0);
      rrQuat.set(0,Math.sin(steering/2),0,Math.cos(steering/2));
      tmpQ.set(axle.x*Math.sin(rotationRad/2),
               axle.y*Math.sin(rotationRad/2),
               axle.z*Math.sin(rotationRad/2),
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
