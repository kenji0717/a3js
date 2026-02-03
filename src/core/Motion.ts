import * as THREE from "three";
import { Vec3 } from './Vec3';
import type { MutableVec3 } from './Vec3';
import { Quat, getQuatOfLookAt } from './Quat';
import type { MutableQuat } from './Quat';
import type { RapierPhysicsWorld } from "../rapier/RapierPhysics";
import { ObjectA3 } from "./ObjectA3";

/**
 * ObjectA3が何らかの方法で自動的に動かなければならない
 * 場合に、その動きをコントロールするプログラムを実装する
 * ベースとなるクラス。3Dオブジェクトの移動や回転、3Dキャラ
 * クターのジェスチャーなどがMotionのコントロール対象に含ま
 * れる。例えばモーションキャプチャデータに従う動き、物理
 * エンジンに従う動き、その他プログラムで動きをコントロール
 * したい場合に使われる。
 *
 * このベースとなるMotionクラスでは全てのMotionに実装しておいて
 * 欲しいInterpolation(指定した位置に急に移動せず1秒ほどのCSS
 * アニメーションのように動く機能)、Billboard(常に指定した物体に
 * 向かって正面を向くように回転する機能)の2つを実装しており、
 * 必要に応じて有効化できる。(デフォルトは無効)この2つは両方
 * とも3DオブジェクトのルートとなるTHREE.Object3Dの位置・回転・
 * 拡大のみを操作するもので、それ以外は操作しない。個別の目的の
 * 実装はMotionを継承したクラスが担当する。
 * 
 * また、モーションキャプチャデータにもとづく動きのようなものを
 * 実装することを想定して、それを扱うためのメソッド(controlMotion()
 * メソッドなど)が最初から用意されているが、このMotionクラスでは
 * 実装は空であり、継承したクラスで必要としないかぎり、実装
 * しなくても良い。
 * 
 * 物理演算の結果にもとづいて動く物体のようなMotionにおいては、
 * InterpolationやBillboardの機能は邪魔である場合もある。
 * このような時にはメソッドをオーバーライドして、Interpolationや
 * Billboardの機能を有効化できないようにすることも許可される。
 * 
 * MotionにはObjectA3の同名のメソッドと対応するsetLocation(),
 * setLocationNow()、setQuat()などのメソッドがあり、実際に
 * ObjectA3のメソッドはMotionの同名メソッドを呼び出すラッパー
 * でしかない。Motionの状態や実装によって様々な、状況が考え
 * られるが、他のプログラマがObjectA3のsetLocation()や
 * setLocationNow()などのメソッドでObjectA3を操作することは
 * 可能なかぎり許可されるべきなので、Motionを継承したプログラム
 * 作成者はこれについて考慮して欲しい。例えば物理演算に従う
 * ObjectA3は、基本的に物理演算の結果に従って動くべきなので
 * setLocation()は無効化しても、setLocationNow()が呼び出された
 * 時には強制的に位置を変更できるようにするのが良い。
 * 
 * また、物理演算に由来する物理対象を物理空間に加えたり
 * 取り除いたりするためのメソッドとしてaddOnselfToPhysicsと
 * removeOnselfFromPhysicsのメソッドもあるが、これも関係の
 * 無い場合は空実装で良い。
 * 
 * ちなみにMotionを実装する時には既存の2つ以上のモーションを
 * 組み合わせて実装すると、楽な場合があるのでメモしておく。
 */
export class Motion {
  objectA3: ObjectA3;
  object3D: THREE.Object3D;
  private interpolation?: Interpolation;
  private billboard?: Billboard;

  constructor(objectA3: ObjectA3) {
    this.objectA3 = objectA3;
    this.object3D = objectA3.object;
  }

  /**
   * Motionが生成された後に動きをコントロールする対象となる
   * a3.ObjectA3(THREE.Object3Dが入ってる)を変更する。
   * @param objectA3 動きをコントロールする対象となるa3.ObjectA3
   */
  setObject(objectA3: ObjectA3) {
    this.objectA3 = objectA3;
    this.object3D = objectA3.object;
  }

  /**
   * 補間モードのON,OFFを切り替えます。
   */
  enableInterpolation(on_off: boolean) {
    if (on_off && !this.interpolation)
      this.interpolation = new Interpolation(this.object3D);
    else if (!on_off && this.interpolation)
      this.interpolation = undefined;
  }

  /**
   * ビルボード機能のON,OFFを切り替えます。
   * ONにするには対象となるObjectA3を指定し、
   * OFFにするには引数無し(undefined)で呼び出して下さい。
   * すでにビルボード機能がONだが、新しい
   * ビルボードの対象を指定しなおす場合にも、
   * 対象を指定して呼び出して下さい。
   */
  enableBillboard(target?: ObjectA3) {
    if (target && this.billboard)
      this.billboard.setTarget(target.object);
    else if (target && !this.billboard)
      this.billboard = new Billboard(this.objectA3,target.object);
    else
      this.billboard = undefined;
  }
  
  /**
   * 
   * @param dt 前のフレームからの経過時間
   */
  update(dt: number) {
    if (this.interpolation)
      this.interpolation.update(dt);
    if (this.billboard) {
      this.billboard.update();
    }
  }

  setLocation(loc: MutableVec3) {
    if (this.interpolation)
      this.interpolation.setLocation(loc);
    else
      this.object3D.position.set(loc.x,loc.y,loc.z);
    if (this.billboard)
      this.billboard.update();
  }
  setLocationNow(loc: MutableVec3) {
    if (this.interpolation)
      this.interpolation.setLocationNow(loc);
    else
      this.object3D.position.set(loc.x,loc.y,loc.z);
    if (this.billboard)
      this.billboard.update();
  }
  setQuat(quat: MutableQuat) {
    if (this.billboard)
      return;
    if (this.interpolation)
      this.interpolation.setQuat(quat);
    else
      this.object3D.quaternion.set(quat.x,quat.y,quat.z,quat.w);
  }
  setQuatNow(quat: MutableQuat) {
    if (this.billboard)
      return;
    if (this.interpolation)
      this.interpolation.setQuatNow(quat);
    else
      this.object3D.quaternion.set(quat.x,quat.y,quat.z,quat.w);
  }
  setScale(scale: MutableVec3) {
    if (this.interpolation)
      this.interpolation.setScale(scale);
    else
      this.object3D.scale.set(scale.x,scale.y,scale.z);
  }
  setScaleNow(scale: MutableVec3) {
    if (this.interpolation)
      this.interpolation.setScaleNow(scale);
    else
      this.object3D.scale.set(scale.x,scale.y,scale.z);
  }

  controlMotion(..._args: string[]) {}
  setPause(_p: boolean) {}
  setTime(_time: number) {}

  addOnselfToPhysics(_world: RapierPhysicsWorld) {}
  removeOnselfFromPhysics(_world: RapierPhysicsWorld) {}
}

/*
 * 補間のための情報と処理を実装したクラス。
 * 必要な時だけMotionに追加される。
 */
class Interpolation {
  obj: THREE.Object3D
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

  constructor(obj: THREE.Object3D) {
    this.obj = obj;
    this.firstLoc = new Vec3(obj.position);
    this.firstRot = new Quat(obj.quaternion);
    this.firstScale = new Vec3(obj.scale);
    this.nowLoc = new Vec3(obj.position);
    this.nowRot = new Quat(obj.quaternion);
    this.nowScale = new Vec3(obj.scale);
    this.lastLoc = new Vec3(obj.position);
    this.lastRot = new Quat(obj.quaternion);
    this.lastScale = new Vec3(obj.scale);
    this.nowTime = 0;
    this.duration = 1;
  }

  setLocation(newLoc: MutableVec3) {
    this.firstLoc.set(this.obj.position);
    this.firstRot.set(this.obj.quaternion);
    this.firstScale.set(this.obj.scale);
    this.lastLoc.set(newLoc);
    //this.lastRot.set(this.obj.quaternion);
    //this.lastScale.set(this.obj.scale);
    this.nowTime = 0;
  }

  setLocationNow(newLoc: MutableVec3) {
    this.setLocation(newLoc);
    this.nowTime = 1;
  }

  setQuat(newQuat: MutableQuat) {
    this.firstLoc.set(this.obj.position);
    this.firstRot.set(this.obj.quaternion);
    this.firstScale.set(this.obj.scale);
    //this.lastLoc.set(this.obj.position);
    this.lastRot.set(newQuat);
    //this.lastScale.set(this.obj.scale);
    this.nowTime = 0;
  }

  setQuatNow(newQuat: MutableQuat) {
    this.setQuat(newQuat);
    this.nowTime = 1;
  }

  setScale(newScale: MutableVec3) {
    this.firstLoc.set(this.obj.position);
    this.firstRot.set(this.obj.quaternion);
    this.firstScale.set(this.obj.scale);
    //this.lastLoc.set(this.obj.position);
    //this.lastRot.set(this.obj.quaternion);
    this.lastScale.set(newScale);
    this.nowTime = 0;
  }

  setScaleNow(newScale: MutableVec3) {
    this.setScale(newScale);
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

    this.obj.position.set(this.nowLoc.x,this.nowLoc.y,this.nowLoc.z);
    this.obj.quaternion.set(this.nowRot.x,this.nowRot.y,this.nowRot.z,this.nowRot.w);
    this.obj.scale.set(this.nowScale.x,this.nowScale.y,this.nowScale.z);
  }
}

class Billboard {
  up: Vec3;
  obj: THREE.Object3D;
  target: THREE.Object3D;
  tmpObjLoc: Vec3 = new Vec3();
  tmpTargetLoc: Vec3 = new Vec3();

  constructor(objectA3: ObjectA3, target: THREE.Object3D) {
    this.up = new Vec3();
    if (objectA3.upVector)
      this.up.set(objectA3.upVector);
    else
      this.up.set(ObjectA3.defaultUpVector);
    this.obj = objectA3.object;
    this.target = target;
  }

  setTarget(target: THREE.Object3D) {
    this.target = target;
  }

  update() {
    this.tmpObjLoc.set(this.obj.position);
    this.tmpTargetLoc.set(this.target.position);
    const quat = getQuatOfLookAt(this.tmpObjLoc,this.tmpTargetLoc,this.up);
    this.obj.quaternion.set(quat.x,quat.y,quat.z,quat.w);
  }
}
