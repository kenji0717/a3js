import { Vec3, Quat, getQuatOfLookAt, Transform } from './LinearMath';
import type { PhysicsWorld } from "./Physics";
import { ObjectA3 } from "./ObjectA3";


/**
 * ObjectA3のobjectプロパティに保存されているTHREE.Object3Dの
 * position,quaternion(rotation),scaleのみをコントロールする
 * モーションのインタフェース。コントロールするというだけでなく、
 * ObjectA3の位置、回転、拡大・縮小率に関する情報はこの
 * インタフェースのインスタンスが管理しており、これがObjectA3の
 * 正式な情報で、ObjectA3.object.positionなどは表示の都合で
 * 管理されている情報という位置付けとなる。
 * 
 * ObjectA3に各種方法で登録されることで、そのObjectA3の
 * 移動などに関する処理に影響を与える。ObjectA3に登録することが
 * できるTransformMotionは必ず一つである。
 * 
 * このインタフェースにはsetLocation()やsetQuat()などの外部の
 * プログラムから位置や回転を指定す要求を受け付けるメソッドが
 * あるが、これらは必ずしも要求に応答しなければならないという
 * わけではない。例えばInterpolationTransformMotionでは、移動が
 * 目視できるように1秒ほど時間をかけて移動するし、物理系の
 * TransformMotionの場合は、基本的に要求を無視して物理法則通りに
 * 移動させるというのが正解の場合もある。ただし、setLocationNow()や
 * setQuatNow()のようにメソッドの最後にNowが付いている物については
 * 可能なかぎり要求に即座に答えなければならない。
 * 
 * このTransformMotionを実装することでInterpolateTransformMotion、
 * BillboardTransformMotion、CharactorTransformMotionなどが作られる。
 */
export interface TransformMotion {
  /**
   * このTransformMotionが管理している位置、回転、拡大・縮小率。
   * 常に最新の位置、回転、拡大・縮小率が、ここに反映されていなければ
   * ならない。
   */
  trans: Transform;

  /**
   * このTransformMotionの動作に必要な初期化処理を実装する
   * メソッド。引数にコントロール対象のa3.ObjectA3(中に
   * THREE.Object3Dも入ってる)を渡されるので、必要に応じて
   * それをスキャンして情報を得ることは許可されるが、変更を
   * 加えてはならない。特に初期の位置、回転、拡大・縮小率は、
   * 第一引数のtransから得なければならず、objectA3.object
   * (THREE.Object3D)から得てはならない。すでに設定されている
   * 状態で呼び出された場合には、再設定という意味で対応しなければ
   * ならない。
   * @param trans 初期位置、回転、拡大・縮小率
   * @param objectA3 動きをコントロールする対象となるa3.ObjectA3
   */
  init(trans: Transform, objectA3: ObjectA3): void;

  /**
   * 物理演算が必要な場合にRigidBodyやColliderを
   * PhysicsWorldに登録する必要があるので、このメソッドで
   * 対応する。必要無い場合は何もしなくてOK。
   * @param world 登録対象のPhysicsWorld
   */
  addOneselfToPhysics(world: PhysicsWorld): void;

  /**
   * このTransformMotionが不必要となった時に、PhysicsWorldに
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
   * 速度を設定する。物理系のTransformMotionのみ対応すれば
   * 良い物で、それ以外の場合はメソッドの実装は空で良い。
   */
  setLinvel(vel: Vec3): void;

  /**
   * 角速度を設定する。単位はラジアン/秒。
   * 物理系のTransformMotionのみ対応すれば
   * 良い物で、それ以外の場合はメソッドの実装は空で良い。
   */
  setAngvel(angvel: Vec3): void;

  /**
   * 力を設定する。
   * 物理系のTransformMotionのみ対応すれば
   * 良い物で、それ以外の場合はメソッドの実装は空で良い。
   */
  addForce(f: Vec3): void;

  /**
   * addForceで加えられた力をリセットする。
   * 物理系のTransformMotionのみ対応すれば
   * 良い物で、それ以外の場合はメソッドの実装は空で良い。
   */
  resetForce(): void;

  /**
   * トルク(回転力)を設定する。
   * 物理系のTransformMotionのみ対応すれば
   * 良い物で、それ以外の場合はメソッドの実装は空で良い。
   */
  addTorque(t: Vec3): void;

  /**
   * addTorqueで加えられたトルクをリセットする。
   * 物理系のTransformMotionのみ対応すれば
   * 良い物で、それ以外の場合はメソッドの実装は空で良い。
   */
  resetTorque(): void;

  /**
   * 一瞬、力を設定する。
   * 物理系のTransformMotionのみ対応すれば
   * 良い物で、それ以外の場合はメソッドの実装は空で良い。
   */
  applyImpulse(i: Vec3): void;

  /**
   * 一瞬、トルクを設定する。
   * 物理系のTransformMotionのみ対応すれば
   * 良い物で、それ以外の場合はメソッドの実装は空で良い。
   */
  applyTorqueImpulse(ti: Vec3): void;

  /**
   * 経過時間に応じて、位置、回転、拡大・縮小率を更新するための
   * メソッド。毎フレーム呼び出される。その時点での位置、回転、
   * 拡大・縮小率は必ずthis.transに反映させなければならない。
   * 外部からの指示がなくても自動的に移動するようなことが実現
   * される。
   * @param dt 経過時間(秒)
   */
  update(dt: number): void;
}


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
  addForce(_f: Vec3): void {}
  resetForce(): void {}
  addTorque(_t: Vec3): void {}
  resetTorque(): void {}
  applyImpulse(_i: Vec3): void {}
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
  addForce(_f: Vec3): void {}
  resetForce(): void {}
  addTorque(_t: Vec3): void {}
  resetTorque(): void {}
  applyImpulse(_i: Vec3): void {}
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
 * 例えば、モーションキャプチャデータに並進移動のデータが含まれていない
 * 場合、(0,0,0)を仮定してはいけない、そのような場合はundefinedとしておく。
 * またglTFのモデルではモーフィングのデータも含めてるものが多くあったので、
 * それも忘れずに。
 */
export type Pose = Record<string, {loc?: Vec3, quat?: Quat, scale?: Vec3, morphs?: Morph[]}>;


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
   * このPoseMotionにつける名前。
   */
  name: string;

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
  addOneselfToPhysics(world: PhysicsWorld): void;

  /**
   * このPoseMotionが不必要となった時に、PhysicsWorldに
   * 登録していたRigidBodyやColliderを、登録解除する
   * 処理を行うメソッド。
   * @param world 解除対象のPhysicsWorld
   */
  removeOneselfFromPhysics(world: PhysicsWorld): void;

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
