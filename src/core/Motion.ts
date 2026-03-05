import { Vec3, Quat, getQuatOfLookAt, Transform } from './LinearMath';
import type { PhysicsWorld } from "./Physics";
import { ObjectA3 } from "./ObjectA3";
import type { TransformMotion } from "./ObjectA3";




/**
 * 最も簡単なTransformMotionの実装クラス。座標、回転、拡大率の
 * 指定を即座に反映する。その他の機能は無い。ただ、メソッドは
 * 全て実装されているので、ちょっとしたTransformMotionを作りたい
 * 時は、このクラスを拡張して必要なところだけオーバーライド
 * するのがお勧め。
 */
export class DefaultTransformMotion implements TransformMotion {
  trans: Transform;

  /**
   * コンストラクタ。生成する段階ではObjectA3と独立に
   * 生成できるようにするのが理想。実際に使うにはsetObject()を
   * してから使うことになる。
   */
  constructor() {
    this.trans = new Transform();
  }

  init(trans: Transform, _objectA3: ObjectA3) {
    this.trans.set(trans);
  }

  addOneselfToPhysics(_world: PhysicsWorld): void {}
  removeOneselfFromPhysics(_world: PhysicsWorld): void {}

  setLocation(loc: Vec3) {
    this.trans.loc.set(loc);
  }
  setLocationNow(loc: Vec3) {
    this.trans.loc.set(loc);
  }
  setQuat(quat: Quat) {
    this.trans.quat.set(quat);
  }
  setQuatNow(quat: Quat) {
    this.trans.quat.set(quat);
  }
  setScale(scale: Vec3) {
    this.trans.scale.set(scale);
  }
  setScaleNow(scale: Vec3) {
    this.trans.scale.set(scale);
  }
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
  update(_dt: number) {}
}

/**
 * まったく動かすことができないTransformMotion。物理エンジン
 * でコントロールするTransformMotionでは、DefaultTransformMotion
 * よりも、こちらの方をベースにした方がやりやすい場合があると
 * 思う。
 */
export class FixedTransformMotion implements TransformMotion {
  trans: Transform;

  /**
   * コンストラクタ。生成する段階ではObjectA3と独立に
   * 生成できるようにするのが理想。実際に使うにはsetObject()を
   * してから使うことになる。
   */
  constructor() {
    this.trans = new Transform();
  }

  init(trans: Transform, _objectA3: ObjectA3) {
    this.trans.set(trans);
  }

  addOneselfToPhysics(_world: PhysicsWorld): void {}
  removeOneselfFromPhysics(_world: PhysicsWorld): void {}

  setLocation(_loc: Vec3) {}
  setLocationNow(_loc: Vec3) {}
  setQuat(_quat: Quat) {}
  setQuatNow(_quat: Quat) {}
  setScale(_scale: Vec3) {}
  setScaleNow(_scale: Vec3) {}
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
  update(_dt: number) {}
}

export class InterpolationTransformMotion implements TransformMotion {
  firstTrans: Transform;
  trans: Transform; // 現在のTransform
  lastTrans: Transform;
  nowTime: number;
  duration: number;

  constructor() {
    this.firstTrans = new Transform();
    this.trans = new Transform();
    this.lastTrans = new Transform();
    this.nowTime = 0;
    this.duration = 1;
  }

  init(trans: Transform, _objectA3: ObjectA3) {
    this.firstTrans.set(trans);
    this.trans.set(trans);
    this.lastTrans.set(trans);
  }

  addOneselfToPhysics(_world: PhysicsWorld): void {}
  removeOneselfFromPhysics(_world: PhysicsWorld): void {}

  setLocation(newLoc: Vec3) {
    this.firstTrans.set(this.trans);
    this.lastTrans.loc.set(newLoc);
    this.nowTime = 0;
  }

  setLocationNow(newLoc: Vec3) {
    this.setLocation(newLoc);
    this.nowTime = 1;
  }

  setQuat(newQuat: Quat) {
    this.firstTrans.set(this.trans);
    this.lastTrans.quat.set(newQuat);
    this.nowTime = 0;
  }

  setQuatNow(newQuat: Quat) {
    this.setQuat(newQuat);
    this.nowTime = 1;
  }

  setScale(newScale: Vec3) {
    this.firstTrans.set(this.trans);
    this.lastTrans.scale.set(newScale);
    this.nowTime = 0;
  }

  setScaleNow(newScale: Vec3) {
    this.setScale(newScale);
    this.nowTime = 1;
  }

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

  // cssのanimation-timing-functionみたいに
  // 切り替えられるようにしたいね。
  smoothstep(t: number): number {
    return t * t * (3 - 2 * t);
  }

  update(dt: number): void {
    this.nowTime += dt;
    if (this.nowTime > this.duration) this.nowTime = this.duration;
    const t0 = this.nowTime/this.duration;
    const t = this.smoothstep(t0);

    this.trans.set(this.firstTrans);
    this.trans.blend(this.lastTrans,t);
  }
}

const tmpObjLoc: Vec3 = new Vec3();
const tmpTargetLoc: Vec3 = new Vec3();
/**
 * targetで指定した物の方を正面として向き続けるための
 * TransformMotion。特にtargetをカメラにするような使い方を
 * 想定しているけど、実際には何をtargetにしても良い。
 * 外部からの要求は全て無視して向きをtargetに向けるだけ
 * のTransformMotionとなっている。
  */
export class BillboardTransformMotion extends DefaultTransformMotion {
  up: Vec3;
  target: ObjectA3;

  constructor(target: ObjectA3) {
    super();
    this.up = new Vec3(0,1,0);
    this.target = target;
  }

  setTarget(target: ObjectA3) {
    this.target = target;
  }

  init(trans: Transform, objectA3: ObjectA3) {
    super.init(trans, objectA3);
    if (objectA3.upVector) {
      //this.up.set(objectA3.upVector);
      this.up = objectA3.upVector;
    } else {
      //this.up.set(ObjectA3.defaultUpVector);
      this.up = ObjectA3.defaultUpVector;
    }
  }

  setQuat(_quat: Quat) {}
  setQuatNow(_quat: Quat) {}

  update(_dt: number): void {
    tmpObjLoc.set(this.trans.loc);
    tmpTargetLoc.set(this.target.trans.loc);
    const quat = getQuatOfLookAt(tmpObjLoc,tmpTargetLoc,this.up);
    this.trans.quat.set(quat);
  }
}

export class InterpolationBillboardTransformMotion extends InterpolationTransformMotion {
  up: Vec3;
  target: ObjectA3;

  constructor(target: ObjectA3) {
    super();
    this.up = new Vec3(0,1,0);
    this.target = target;
  }

  init(trans: Transform, objectA3: ObjectA3) {
    super.init(trans, objectA3);
    if (objectA3.upVector) {
      this.up = objectA3.upVector;
    } else {
      this.up = ObjectA3.defaultUpVector;
    }
  }

  setQuat(_newQuat: Quat) { /* do nothing. */ }
  setQuatNow(_newQuat: Quat) { /* do nothing. */ }

  update(dt: number) {
    super.update(dt);
    tmpObjLoc.set(this.trans.loc);
    tmpTargetLoc.set(this.target.trans.loc);
    const quat = getQuatOfLookAt(tmpObjLoc,tmpTargetLoc,this.up);
    this.trans.quat.set(quat);
  }
}

