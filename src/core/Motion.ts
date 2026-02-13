import * as THREE from "three";
import { Vec3, Quat, getQuatOfLookAt, Transform } from './LinearMath';
import type { PhysicsWorld } from "./Physics";
import { ObjectA3 } from "./ObjectA3";


/**
 * ObjectA3のobjectプロパティに保存されているTHREE.Object3Dの
 * position,quaternion(rotation),scaleのみをコントロールする
 * モーションのインタフェース。
 * 
 * ObjectA3に各種方法で登録されることで、そのObjectA3の
 * 移動などに関する処理に影響を与える。ObjectA3に登録することが
 * できるRootMotionは一つとは限らず複数可能である。その場合は、
 * 登録した順番に従って順番に影響を与えてゆく。なので、この
 * インターフェースを実装してRootMotionを自作する場合には、他の
 * RootMotionが自分の計算結果を上書きする可能性があることを
 * 考慮すること。ただ、全てのRootMotionの組合せが上手く動作する
 * 保証は無いし、保証する必要も無い。
 * 
 * このインタフェースにはsetLocation()やsetQuat()などの外部の
 * プログラムから位置や回転を指定す要求を受け付けるメソッドが
 * あるが、これらは必ずしも要求に応答しなければならないという
 * わけではない。例えばInterpolationRootMotionでは、移動が
 * 目視できるように1秒ほど時間をかけて移動するし、物理系の
 * RootMotionの場合は、基本的に要求を無視して物理法則通りに
 * 移動させるというのが正解の場合もある。ただし、setLocationNow()や
 * setQuatNow()のようにメソッドの最後にNowが付いている物については
 * 可能なかぎり要求に即座に答えなければならない。
 * 
 * このRootMotionを実装することでInterpolateRootMotion、
 * BillboardRootMotion、CharactorRootMotionなどが作られる。
 */
export interface RootMotion {
  /**
   * このRootMotionの動作に必要な初期化処理を実装する
   * メソッド。引数にコントロール対象のa3.ObjectA3(中に
   * THREE.Object3Dも入ってる)を渡されるので、必要に応じて
   * それをスキャンして情報を得ることは許可されるが、変更を
   * 加えてはならない。すでに設定されている状態で呼び出された
   * 場合には、再設定という意味で対応しなければならない。
   * @param objectA3 動きをコントロールする対象となるa3.ObjectA3
   */
  init(objectA3: ObjectA3): void;

  /**
   * 物理演算が必要な場合にRigidBodyやColliderを
   * PhysicsWorldに登録する必要があるので、このメソッドで
   * 対応する。必要無い場合は何もしなくてOK。
   * @param world 登録対象のPhysicsWorld
   */
  addOneselfToPhysics(world: PhysicsWorld): void;

  /**
   * このRootMotionが不必要となって、PhysicsWorldに
   * 登録していたRigidBodyやColliderを、登録解除する
   * 処理を行うメソッド。
   * @param world 解除対象のPhysicsWorld
   */
  removeOneselfFromPhysics(world: PhysicsWorld): void;

  /**
   * 指定の場所に移動せよとの外部からの要求を受け付ける
   * ためのメソッド。実際にそれを反映させる処理はupdate()
   * メソッドに書く。
   * @param loc 指定場所
   */
  setLocation(loc: Vec3): void;

  /**
   * 指定の場所に直ちに移動せよとの外部からの要求を受け付ける
   * ためのメソッド。実際にそれを反映させる処理はupdate()
   * メソッドに書く。
   * @param loc 指定場所
   */
  setLocationNow(loc: Vec3): void;

  /**
   * 指定の角度に回転せよとの外部からの要求を受け付ける
   * ためのメソッド。実際にそれを反映させる処理はupdate()
   * メソッドに書く。
   * @param quat 指定の回転
   */
  setQuat(quat: Quat): void;

  /**
   * 指定の角度に直ちに回転せよとの外部からの要求を受け付ける
   * ためのメソッド。実際にそれを反映させる処理はupdate()
   * メソッドに書く。
   * @param quat 指定の回転
   */
  setQuatNow(quat: Quat): void;

  /**
   * 指定の大きさ(拡大・縮小率)に変形せよとの外部からの要求を
   * 受け付けるためのメソッド。実際にそれを反映させる処理は
   * update()メソッドに書く。
   * @param scale 指定の大きさ
   */
  setScale(scale: Vec3): void;

  /**
   * 指定の大きさ(拡大・縮小率)に直ちに変形せよとの外部からの
   * 要求を受け付けるためのメソッド。実際にそれを反映させる処理は
   * update()メソッドに書く。
   * @param scale 指定の大きさ
   */
  setScaleNow(scale: Vec3): void;

  /**
   * 経過時間に応じて、位置、回転、拡大・縮小率を更新するための
   * メソッド。毎フレーム呼び出されて対応するObjectA3を動かす。
   * 外部からの指示がなくても自動的に移動するために使用される。
   * @param dt 経過時間(秒)
   */
  update(dt: number,trans: Transform): Transform;
}


/**
 * 最も簡単なRootMotionの実装クラス。座標、回転、拡大率の
 * 指定を即座に反映する。その他の機能は無い。ただ、メソッドは
 * 全て実装されているので、ちょっとしたRootMotionを作りたい
 * 時は、このクラスを拡張して必要なところだけオーバーライド
 * するのがお勧め。
 */
export class DefaultRootMotion implements RootMotion {
  nextTrans: Transform;

  /**
   * コンストラクタ。生成する段階ではObjectA3と独立に
   * 生成できるようにするのが理想。実際に使うにはsetObject()を
   * してから使うことになる。
   */
  constructor() {
    this.nextTrans = new Transform();
  }

  init(objectA3: ObjectA3) {
    this.nextTrans.set(objectA3);
  }

  addOneselfToPhysics(_world: PhysicsWorld): void {}
  removeOneselfFromPhysics(_world: PhysicsWorld): void {}

  setLocation(loc: Vec3) {
    this.nextTrans.loc.set(loc);
  }
  setLocationNow(loc: Vec3) {
    this.nextTrans.loc.set(loc);
  }
  setQuat(quat: Quat) {
    this.nextTrans.quat.set(quat);
  }
  setQuatNow(quat: Quat) {
    this.nextTrans.quat.set(quat);
  }
  setScale(scale: Vec3) {
    this.nextTrans.scale.set(scale);
  }
  setScaleNow(scale: Vec3) {
    this.nextTrans.scale.set(scale);
  }
  update(_dt: number, trans: Transform) {
    trans.set(this.nextTrans);
    return trans;
  }
}

export class InterpolationRootMotion implements RootMotion {
  firstTrans: Transform;
  nowTrans: Transform;
  lastTrans: Transform;
  nowTime: number;
  duration: number;

  constructor() {
    this.firstTrans = new Transform();
    this.nowTrans = new Transform();
    this.lastTrans = new Transform();
    this.nowTime = 0;
    this.duration = 1;
  }

  init(objectA3: ObjectA3) {
    this.firstTrans.set(objectA3);
    this.nowTrans.set(objectA3);
    this.lastTrans.set(objectA3);
  }

  addOneselfToPhysics(_world: PhysicsWorld): void {}
  removeOneselfFromPhysics(_world: PhysicsWorld): void {}

  setLocation(newLoc: Vec3) {
    this.firstTrans.set(this.nowTrans);
    this.lastTrans.loc.set(newLoc);
    this.nowTime = 0;
  }

  setLocationNow(newLoc: Vec3) {
    this.setLocation(newLoc);
    this.nowTime = 1;
  }

  setQuat(newQuat: Quat) {
    this.firstTrans.set(this.nowTrans);
    this.lastTrans.quat.set(newQuat);
    this.nowTime = 0;
  }

  setQuatNow(newQuat: Quat) {
    this.setQuat(newQuat);
    this.nowTime = 1;
  }

  setScale(newScale: Vec3) {
    this.firstTrans.set(this.nowTrans);
    this.lastTrans.scale.set(newScale);
    this.nowTime = 0;
  }

  setScaleNow(newScale: Vec3) {
    this.setScale(newScale);
    this.nowTime = 1;
  }

  // cssのanimation-timing-functionみたいに
  // 切り替えられるようにしたいね。
  smoothstep(t: number): number {
    return t * t * (3 - 2 * t);
  }

  update(dt: number, trans: Transform) {
    this.nowTime += dt;
    if (this.nowTime > this.duration) this.nowTime = this.duration;
    const t0 = this.nowTime/this.duration;
    const t = this.smoothstep(t0);

    this.nowTrans.set(this.firstTrans);
    this.nowTrans.blend(this.lastTrans,t);

    trans.set(this.nowTrans);
    return trans;
  }
}

const tmpObjLoc: Vec3 = new Vec3();
const tmpTargetLoc: Vec3 = new Vec3();
/**
 * targetで指定した物の方を正面として向き続けるための
 * RootMotion。特にtargetをカメラにするような使い方を
 * 想定しているけど、実際には何をtargetにしても良い。
 * 外部からの要求は全て無視して向きをtargetに向けるだけ
 * のRootMotionなので複数RootMotionをObjectA3に登録して
 * 使うなら、一番最後に置いておいてもらうと、良いと思う。
 */
export class BillboardRootMotion implements RootMotion {
  up: Vec3;
  target: THREE.Object3D;

  constructor(target: THREE.Object3D) {
    this.up = new Vec3(0,1,0);
    this.target = target;
  }

  setTarget(target: THREE.Object3D) {
    this.target = target;
  }

  init(objectA3: ObjectA3) {
    if (objectA3.upVector) {
      //this.up.set(objectA3.upVector);
      this.up = objectA3.upVector;
    } else {
      //this.up.set(ObjectA3.defaultUpVector);
      this.up = ObjectA3.defaultUpVector;
    }
  }

  addOneselfToPhysics(_world: PhysicsWorld): void {}
  removeOneselfFromPhysics(_world: PhysicsWorld): void {}

  setLocation(_loc: Vec3) {}
  setLocationNow(_loc: Vec3) {}
  setQuat(_quat: Quat) {}
  setQuatNow(_quat: Quat) {}
  setScale(_scale: Vec3) {}
  setScaleNow(_scale: Vec3) {}

  update(_dt: number, trans: Transform) {
    tmpObjLoc.set(trans.loc);
    tmpTargetLoc.set(this.target.position);
    const quat = getQuatOfLookAt(tmpObjLoc,tmpTargetLoc,this.up);
    trans.quat.set(quat);
    return trans;
  }
}

/**
 * キャラクタのポーズを表すインターフェース。主に3Dキャラクタ
 * を想定しているが、車のシャーシーやタイヤの動きも、このPose
 * インターフェースで表現することができ、PoseMotionインターフェース
 * は、このPoseインターフェースを用いることで、モーションキャプチャー
 * データも物理演算結果も、その他の動きも統一して扱えるようになる。
 */
export type Pose = Record<string, Transform>;


/**
 * ObjectA3のobjectプロパティに保存されているTHREE.Object3Dの
 * インスタンスには影響を与えないけど、その中に含まれている
 * 要素をコントロールするモーションインターフェース。
 * キャラクターの様々なジェスチャーを表すようなモーションを
 * コントロールすることなどに使われる。
 * 
 * このインタフェースにはcontrolMotion()や、setPause()、
 * setTime()などのメソッドがある。update()はPose型の情報を
 * 返すことで3Dの要素に動きを与えるメソッド。どのメソッドも、
 * 原則そのメソッドが示す処理を実装することになるが、どのような
 * InnerMotionかによって、その処理内容は様々な場合がありうる。
  *
 * Three.jsではTHREE.AnimationClipに対応する対象と考えてもらいたい。
 */
export interface PoseMotion {
  /**
   * 物理演算が必要な場合にRigidBodyやColliderを
   * PhysicsWorldに登録する必要があるので、このメソッドで
   * 対応する。
   * @param world 登録対象のPhysicsWorld
   */
  addOneselfToPhysics(_world: PhysicsWorld): void;

  /**
   * このPoseMotionが不必要となった時に、PhysicsWorldに
   * 登録していたRigidBodyやColliderを、登録解除する
   * 処理を行うメソッド。
   * @param world 解除対象のPhysicsWorld
   */
  removeOneselfFromPhysics(_world: PhysicsWorld): void;

  /**
   * このPoseMotionが再生されるように準備し再生を開始する。
   */
  //enable(): void;

  /**
   * このPoseMotionの再生を停止しする。
   */
  //disable(): void;

  /**
   * 動きをコントロールするための情報を引数に与えて呼び出す
   * メソッド。典型的には一部のglTFファイルに内在するモーフ
   * (Morh)などのコントロールをする時に使われる。
   * @param args 動きをコントロールするための情報
   */
  controlMotion(...args: string[]): void;

  /**
   * このモーションの動作を一時停止させたり、停止状態を
   * 解除したりするためのメソッド。
   * @param p trueの時停止、falseの時停止解除する
   */
  setPause(p: boolean): void;

  /**
   * モーションがデータを再生させるような種類の物であれば、
   * そのデータの再生時間を設定する。
   * @param time 時間(秒)
   */
  setTime(time: number): void;

  /**
   * 経過時間に応じて対象のObjectA3の内部の動きをおこす。
   * 毎フレーム呼び出されることで、アニメーションを作り出す。
   * @param dt 経過時間(秒)
   */
  update(dt: number): Pose;
}


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
  objectA3?: ObjectA3;
  object3D?: THREE.Object3D;
  private interpolation?: Interpolation;
  private billboard?: Billboard;

  constructor(objectA3?: ObjectA3) {
    this.objectA3 = objectA3;
    this.object3D = objectA3?.object;
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
   * このMotionを操作しても、接続されている
   * ObjectA3に影響したりしないように完全に切り離す。
   * @param _objectA3 切り離すObjectA3
   */
  detachObject(_objectA3: ObjectA3) {
    this.objectA3 = undefined;
    this.object3D = undefined;
  }

  /**
   * 補間モードのON,OFFを切り替えます。
   */
  enableInterpolation(on_off: boolean) {
    if (on_off && !this.interpolation && this.object3D)
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
    else if (target && !this.billboard && this.objectA3)
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

  setLocation(loc: Vec3) {
    if (this.interpolation)
      this.interpolation.setLocation(loc);
    else
      this.object3D?.position.set(loc.x,loc.y,loc.z);
    if (this.billboard)
      this.billboard.update();
  }
  setLocationNow(loc: Vec3) {
    if (this.interpolation)
      this.interpolation.setLocationNow(loc);
    else
      this.object3D?.position.set(loc.x,loc.y,loc.z);
    if (this.billboard)
      this.billboard.update();
  }
  setQuat(quat: Quat) {
    if (this.billboard)
      return;
    if (this.interpolation)
      this.interpolation.setQuat(quat);
    else
      this.object3D?.quaternion.set(quat.x,quat.y,quat.z,quat.w);
  }
  setQuatNow(quat: Quat) {
    if (this.billboard)
      return;
    if (this.interpolation)
      this.interpolation.setQuatNow(quat);
    else
      this.object3D?.quaternion.set(quat.x,quat.y,quat.z,quat.w);
  }
  setScale(scale: Vec3) {
    if (this.interpolation)
      this.interpolation.setScale(scale);
    else
      this.object3D?.scale.set(scale.x,scale.y,scale.z);
  }
  setScaleNow(scale: Vec3) {
    if (this.interpolation)
      this.interpolation.setScaleNow(scale);
    else
      this.object3D?.scale.set(scale.x,scale.y,scale.z);
  }

  controlMotion(..._args: string[]) {}
  setPause(_p: boolean) {}
  setTime(_time: number) {}

  addOneselfToPhysics(_world: PhysicsWorld) {}
  removeOneselfFromPhysics(_world: PhysicsWorld) {}
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

  setLocation(newLoc: Vec3) {
    this.firstLoc.set(this.obj.position);
    this.firstRot.set(this.obj.quaternion);
    this.firstScale.set(this.obj.scale);
    this.lastLoc.set(newLoc);
    //this.lastRot.set(this.obj.quaternion);
    //this.lastScale.set(this.obj.scale);
    this.nowTime = 0;
  }

  setLocationNow(newLoc: Vec3) {
    this.setLocation(newLoc);
    this.nowTime = 1;
  }

  setQuat(newQuat: Quat) {
    this.firstLoc.set(this.obj.position);
    this.firstRot.set(this.obj.quaternion);
    this.firstScale.set(this.obj.scale);
    //this.lastLoc.set(this.obj.position);
    this.lastRot.set(newQuat);
    //this.lastScale.set(this.obj.scale);
    this.nowTime = 0;
  }

  setQuatNow(newQuat: Quat) {
    this.setQuat(newQuat);
    this.nowTime = 1;
  }

  setScale(newScale: Vec3) {
    this.firstLoc.set(this.obj.position);
    this.firstRot.set(this.obj.quaternion);
    this.firstScale.set(this.obj.scale);
    //this.lastLoc.set(this.obj.position);
    //this.lastRot.set(this.obj.quaternion);
    this.lastScale.set(newScale);
    this.nowTime = 0;
  }

  setScaleNow(newScale: Vec3) {
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
