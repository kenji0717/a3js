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


type Morph = {
  name: string,
  vals: number[]
}
/**
 * キャラクタのポーズを表すインターフェース。主に3Dキャラクタ
 * を想定しているが、車のシャーシーやタイヤの動きも、このPose
 * インターフェースで表現することができ、PoseMotionインターフェース
 * は、このPoseインターフェースを用いることで、モーションキャプチャー
 * データも物理演算結果も、その他の動きも統一して扱えるようになる。
 * 試してみたら、glTFのモデルではモーフィングのデータも含めてるものが
 * 多いみたいだったので、それも忘れずに。
 */
export type Pose = Record<string, {trans: Transform, morphs: Morph[]}>;


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
   * このPoseMotionが何回再生されたかを保存している。
   *
   */
  playCount: number;
  
  /**
   * 現在再生中のモーションがスータトから何秒経過した状態かを示す。
   */
  time: number;

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
   * このPoseMotionが再生の前に、3Dの表示についての追加処理が
   * 必要な場合に引数のObjectA3にアクセスして準備する。
   */
  prepare3D(objectA3: ObjectA3): void;

  /**
   * このPoseMotionが再生停止した後に、3Dの表示についての
   * 後片付けの処理が必要な場合に引数のObjectA3にアクセス
   * して後片付けする。
   */
  cleanup3D(objectA3: ObjectA3): void;

  /**
   * 動きをコントロールするための情報を引数に与えて呼び出す
   * メソッド。典型的には一部のglTFファイルに内在するモーフ
   * (Morh)などのコントロールをする時に使われる。
   * @param args 動きをコントロールするための情報
   */
  //controlMotion(...args: string[]): void;

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
