import * as THREE from "three";
import { Vec3 } from './Vec3';
import type { MutableVec3 } from './Vec3';
import { Quat } from './Quat';
import type { MutableQuat } from './Quat';
import type { RapierPhysicsWorld } from "../rapier/RapierPhysics";
import type { ObjectA3 } from "./ObjectA3";

/**
 * ObjectA3が何らかの方法で自動的に動かなければならない
 * 場合に、その動きをコントロールするプログラムが満すべき
 * インターフェース。例えば物理エンジンに従う場合、
 * モーションキャプチャデータに従う場合、指定した位置に急に
 * 移動せずCSSのアニメーションのように動くような場合、その他
 * プログラムで動きをコントロールしたい場合に使われる。
 * 
 * 表示する物のrootのTHREE.Object3Dの位置・回転・拡大率だけを
 * コントロールする場合もあるが、モーションキャプチャ
 * データなどの場合はSkinnedMeshの各Boneもコントロール対象に
 * なる。このMotionにより自動的に動く場合であっても、setLocation
 * などの操作により移動させたいことがあるため、それに対応させる
 * ために移動・回転・拡大などのためのメソッドを実装する必要が
 * ある。
 * 
 * なるべく多くのMotionが、補間移動モードをサポートして欲しい
 * のだが、この機能のON,OFFを切り替えるenableInterpolation()
 * メソッドを持つことを必須とする。ただ物理エンジンで動く場合
 * など意味を持たない場合はこのメソッドは空にしておけば良い。
 * 
 * 主に複数のモーションキャプチャデータを切り替えて使う
 * ことを想定して、そのモーションを切り替えることができるように
 * changeMotionメソッドを実装しなければならないが、そのような
 * 必要が無いMotionの場合には空の実装でOK。さらにモーション
 * キャプチャの場合は、動きを一時停止したり特定のフレームのポーズ
 * をさせたりするためにsetPause()、setTime()も実装する必要が
 * あるが、これも必要無い場合は空の実装にしておけば良い。
 * 
 * また、物理演算に由来する物理対象を物理空間に加えたり
 * 取り除いたりするためのメソッドとしてaddOnselfToPhysicsと
 * removeOnselfFromPhysicsのメソッドもあるが、これも関係の
 * 無い場合は空実装するべし。
 * 
 * ちなみにMotionを実装する時には既存の2つ以上のモーションを
 * 組み合わせて実装すると、楽な場合があるのでメモしておく。
 */
export interface Motion {
  objectA3: ObjectA3;
  object3D: THREE.Object3D;
  /**
   * Motionが生成された後に動きをコントロールする対象となる
   * a3.ObjectA3(THREE.Object3Dが入ってる)を設定・変更する。
   * @param objectA3 動きをコントロールする対象となるa3.ObjectA3
   */
  setObject(objectA3: ObjectA3): void;

  /**
   * 
   * @param dt 前のフレームからの経過時間
   */
  update(dt: number): void;

  enableInterpolation(i: boolean): void;
  changeMotion(motionName: string): void;
  setPause(p: boolean): void;
  setTime(time: number): void;

  setLocation(loc: MutableVec3): void;
  setLocationNow(loc: MutableVec3): void;
  setQuat(quat: MutableQuat): void;
  setQuatNow(quat: MutableQuat): void;
  setScale(scale: MutableVec3): void;
  setScaleNow(scale: MutableVec3): void;
  addOnselfToPhysics(world: RapierPhysicsWorld): void;
  removeOnselfFromPhysics(world: RapierPhysicsWorld): void;

}

/**
 * 動きをコントロールするMotionを作る時に、実際には
 * 操作対象のTHREE.Object3Dのrootの位置・回転・拡大
 * だけを操作すれば良い時に使われる。ObjectA3では、
 * これをデフォルトのMotionとして使うことにする。
 */
export class DefaultRootMotion implements Motion {
  objectA3: ObjectA3;
  object3D: THREE.Object3D;

  constructor(objectA3: ObjectA3) {
    this.objectA3 = objectA3;
    this.object3D = objectA3.object;
  }

  setObject(objectA3: ObjectA3) {
    this.objectA3 = objectA3;
    this.object3D = objectA3.object;
  }
  enableInterpolation(_: boolean) {}
  changeMotion(_: string) {}
  update(_: number) {}
  setPause(_: boolean) {}
  setTime(_:number) {}

  setLocation(loc: MutableVec3) {
    this.object3D.position.set(loc.x,loc.y,loc.z);
  }
  setLocationNow(loc: MutableVec3) {
    this.object3D.position.set(loc.x,loc.y,loc.z);
  }
  setQuat(quat: MutableQuat) {
    this.object3D.quaternion.set(quat.x,quat.y,quat.z,quat.w);
  }
  setQuatNow(quat: MutableQuat) {
    this.object3D.quaternion.set(quat.x,quat.y,quat.z,quat.w);
  }
  setScale(scale: MutableVec3) {
    this.object3D.scale.set(scale.x,scale.y,scale.z);
  }
  setScaleNow(scale: MutableVec3) {
    this.object3D.scale.set(scale.x,scale.y,scale.z);
  }

  addOnselfToPhysics(_: RapierPhysicsWorld): void {}
  removeOnselfFromPhysics(_: RapierPhysicsWorld) {}
}

/**
 * 移動などの動きを一瞬ではなく、CSSアニメーションで良く
 * やる感じで1秒ほどの時間でぬるりと補間しながら変化させる
 * ためのモーション。ただ、デフォルトでは、その機能はOFF
 * なのでsetInterpolation(true)で有効にしてはじめて効果が
 * 出る。
 */
export class InterpolationRootMotion implements Motion {
  isInterpolate: boolean;
  objectA3: ObjectA3;
  object3D: THREE.Object3D;
  firstLoc: Vec3;
  firstRot: Quat;
  firstScale: Vec3;
  nowLoc: Vec3;
  nowRot: Quat;
  nowScale: Vec3;
  lastLoc: Vec3;
  lastRot: Quat;
  lastScale: Vec3;
  nowTime: number;
  duration: number;

  constructor(objectA3: ObjectA3) {
    this.isInterpolate = false;
    this.objectA3 = objectA3;
    this.object3D = objectA3.object;
    this.firstLoc = new Vec3(this.object3D.position);
    this.firstRot = new Quat(this.object3D.quaternion);
    this.firstScale = new Vec3(this.object3D.scale);
    this.nowLoc = new Vec3(this.object3D.position);
    this.nowRot = new Quat(this.object3D.quaternion);
    this.nowScale = new Vec3(this.object3D.scale);
    this.lastLoc = new Vec3(this.object3D.position);
    this.lastRot = new Quat(this.object3D.quaternion);
    this.lastScale = new Vec3(this.object3D.scale);
    this.nowTime = 0;
    this.duration = 1;
  }
  setObject(objectA3: ObjectA3): void {
    this.objectA3 = objectA3;
    this.object3D = objectA3.object;
  }
  enableInterpolation(b: boolean) {
    this.isInterpolate = b;
  }
  changeMotion(_: string) {}
  setPause(_: boolean): void {}
  setTime(_: number): void {}

  setLocation(loc: MutableVec3) {
    if (!this.isInterpolate){this.setLocationNow(loc);return;}
    this.firstLoc.set(this.object3D.position);
    this.firstRot.set(this.object3D.quaternion);
    this.firstScale.set(this.object3D.scale);
    this.lastLoc.set(loc);
    //this.lastRot.set(this.object3D.quaternion);
    //this.lastScale.set(this.object3D.scale);
    this.nowTime = 0;
  }

  setLocationNow(loc: MutableVec3) {
    this.firstLoc.set(this.object3D.position);
    this.firstRot.set(this.object3D.quaternion);
    this.firstScale.set(this.object3D.scale);
    this.lastLoc.set(loc);
    //this.lastRot.set(this.object3D.quaternion);
    //this.lastScale.set(this.object3D.scale);
    this.nowTime = 1;
  }

  setQuat(quat: MutableQuat) {
    if (!this.isInterpolate){this.setQuatNow(quat);return;}
    this.firstLoc.set(this.object3D.position);
    this.firstRot.set(this.object3D.quaternion);
    this.firstScale.set(this.object3D.scale);
    //this.lastLoc.set(this.object3D.position);
    this.lastRot.set(quat);
    //this.lastScale.set(this.object3D.scale);
    this.nowTime = 0;
  }

  setQuatNow(quat: MutableQuat) {
    this.firstLoc.set(this.object3D.position);
    this.firstRot.set(this.object3D.quaternion);
    this.firstScale.set(this.object3D.scale);
    //this.lastLoc.set(this.object3D.position);
    this.lastRot.set(quat);
    //this.lastScale.set(this.object3D.scale);
    this.nowTime = 1;
  }

  setScale(scale: MutableVec3) {
    if (!this.isInterpolate){this.setScaleNow(scale);return;}
    this.firstLoc.set(this.object3D.position);
    this.firstRot.set(this.object3D.quaternion);
    this.firstScale.set(this.object3D.scale);
    //this.lastLoc.set(this.object3D.position);
    //this.lastRot.set(this.object3D.quaternion);
    this.lastScale.set(scale);
    this.nowTime = 0;
  }

  setScaleNow(scale: MutableVec3) {
    this.firstLoc.set(this.object3D.position);
    this.firstRot.set(this.object3D.quaternion);
    this.firstScale.set(this.object3D.scale);
    //this.lastLoc.set(this.object3D.position);
    //this.lastRot.set(this.object3D.quaternion);
    this.lastScale.set(scale);
    this.nowTime = 1;
  }

  // cssのanimation-timing-functionみたいに
  // 切り替えられるようにしたいね。
  smoothstep(t: number): number {
    return t * t * (3 - 2 * t);
  }

  update(dt: number) {
    this.nowTime += dt;
    if (this.nowTime > this.duration) this.nowTime = this.duration;
    const t0 = this.nowTime/this.duration;
    const t = this.smoothstep(t0);

    this.nowLoc.lerp(this.firstLoc,this.lastLoc,t);
    // 以下、たぶん球面線形補間。重いけど必要な時ある。
    this.nowRot.slerp(this.firstRot,this.lastRot,t);
    this.nowScale.lerp(this.firstScale,this.lastScale,t);

    this.object3D.position.set(this.nowLoc.x,this.nowLoc.y,this.nowLoc.z);
    this.object3D.quaternion.set(this.nowRot.x,this.nowRot.y,this.nowRot.z,this.nowRot.w);
    this.object3D.scale.set(this.nowScale.x,this.nowScale.y,this.nowScale.z);
  }

  addOnselfToPhysics(_: RapierPhysicsWorld): void {}
  removeOnselfFromPhysics(_: RapierPhysicsWorld) {}
}