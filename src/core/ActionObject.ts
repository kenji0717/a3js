import * as THREE from 'three';
import { ObjectA3 } from './ObjectA3';
import type { AsyncInitRequired } from './AsyncInitRequired';
import { Vec3, Quat, getLookAtQuaternion } from './LinearMath';
import type { PhysicsWorld } from './Physics';
import { Scene } from './Scene';
import { tmp } from '../utils/math';

/**
 * `ActionObject` が持つひとつのアクション（アニメーション状態）を表すクラスです。
 * 3D モデルの形状（`Figure`）とそのモーション（`Motion`）をセットで管理します。
 */
export class Action {
  /** このアクションの 3D モデル形状。 */
  shape: Figure;
  /** このアクションのモーション（アニメーション）。 */
  motion: Motion;

  constructor(shape: Figure, motion: Motion) {
    this.shape = shape;
    this.motion = motion;
  }

  enable(rootObject: THREE.Object3D, _scene?: Scene): void {
    this.motion.playCount = 0;
    this.motion.time = 0;
    rootObject.add(this.shape.root);
  };

  disable(rootObject: THREE.Object3D, _scene?: Scene): void {
    rootObject.remove(this.shape.root);
  }
}

/**
 * `Action` が持つ 3D モデルの形状を表すインターフェースです。
 * ルートの `Object3D` と、ボーン情報・スケルトン情報を持ちます。
 */
export interface Figure {
  /** この形状のルートとなる Three.js `Object3D`。 */
  root: THREE.Object3D;
  /** ボーン名と `Object3D` のマップ。ボーンアニメーションに使用します。 */
  bones?: Record<string,THREE.Object3D>;
  /** スケルトン情報（スキンメッシュアニメーション用）。 */
  skeleton?: THREE.Skeleton;
}

/**
 * 複数のアクション（アニメーション）を持つ 3D オブジェクトの基底クラスです。
 *
 * `GLTF`・`Acerola3D` などはこのクラスを継承しています。
 * アクションは名前で管理され、`setState()` でループするアクション、
 * `setEmote()` で一度だけ再生するアクションを切り替えられます。
 *
 * @remarks
 * このクラスは `AsyncInitRequired<T>` を実装しており、
 * 非同期でのモデル読み込みが完了するまで `await obj.ready` で待機する必要があります。
 *
 * @example
 * ```ts
 * const gltf = new GLTF('model.glb');
 * await gltf.ready;         // 読み込み完了を待つ
 * scene.add(gltf);
 * gltf.setState('walk');    // 歩きアクションをループ再生
 * gltf.setEmote('jump');    // ジャンプアクションを一度だけ再生
 * ```
 */
export abstract class ActionObject<T> extends ObjectA3 implements AsyncInitRequired<T> {
  /**
   * 非同期初期化の完了を待つための `Promise`。
   * `await obj.ready` でモデルの読み込み完了を待機してください。
   */
  readonly ready: Promise<T>;
  /** 名前で管理されているアクションの辞書。 */
  actions: Record<string,Action>;
  /** 現在再生中のアクション。 */
  currentAction?: Action;
  /** ループ再生するアクション（`setState()` で設定）。 */
  stateAction?: Action;
  /** 一度だけ再生するアクション（`setEmote()` で設定）。再生終了後に `stateAction` に戻ります。 */
  emoteAction?: Action;
  /** モーフィング（表情・形状変化）の情報。 */
  morphs: Record<string, {array: Array<number>, idx: number}>;
  /** `true` のとき、モーションのモーフィング値を上書きしません。 */
  overwriteMorphs: boolean;
  /** 自動アクション切り替え機能のON、OFF。デフォルトOFF。 */
  autoAction: boolean = false;
  /** 自動向き調整機能のON、OFF。デフォルトOFF。 */
  autoDirection: boolean = false;
  /** 静止時のアクション名。 */
  haltActionName: string = 'default';
  /** 歩行時のアクション名。 */
  walkActionName: string = 'walk';
  /** 走行時のアクション名。 */
  runActionName: string = 'run';
  /** 歩行と判定する最低速度（m/s）。 */
  minWalkSpeed: number = 0.1;
  /** 走行と判定する最低速度（m/s）。 */
  minRunSpeed: number = 1.0;

  constructor(data?: any) {
    super(data);
    this.actions = {};
    this.morphs = {};
    this.overwriteMorphs = false;
    this.ready = this.asyncInit(data);
    this.autoAction = false;
    this.autoDirection = false;
  }

  /**
   * 非同期で初期化処理をする。全て処理が終った段階で、
   * syncInit()を呼び出して初期化処理を完了して下さい。
   * syncInit()の引数に与える情報を初期化しなければならないので、
   * つまり、初期アクション名(defaultName)、アクションの辞書(actions)、
   * オプションでモーフィングの情報を初期化して用意する。
   * 返り値はPromise<T>となっているが、通常はreturn this;と
   * することを推奨。
   * @param data 初期化に必要なデータ
   */
  abstract asyncInit(data?: any): Promise<T>;

  /**
   * 非同期のasyncInitで用意された情報を最終的にthisに反映させて
   * 初期化を完了する。
   * @param defaultName 初期アクション名
   * @param actions アクションの辞書
   * @param morphs モーフィングの情報
   */
  syncInit(defaultName: string, actions: Record<string,Action>, morphs: Record<string, {array: Array<number>, idx: number}> = {}): void {
    this.actions = actions;
    this.stateAction = this.actions[defaultName];
    this.currentAction = this.stateAction;
    this.object3D.clear();
    this.morphs = morphs;
    this.stateAction?.enable(this.object3D, this.scene);
  }

  /**
   * ObjectA3生成後に使用されるActionの辞書を設定する。
   * @param actions Actionの辞書
   */
  setActions(actions: Record<string,Action>): void {
    this.actions = actions;
  }

  /**
   * 引数の名前でObjectA3に現在設定されているActionを返す。
   * @param name アクション名
   * @return Action
   */
  getAction(name: string): Action {
    return this.actions[name];
  }

  /**
   * 追加でアクションを設定する。
   * @param name アクション名
   * @param action 追加するアクション
   */
  addAction(name: string, action: Action) {
    this.actions[name] = action;
  }

  /**
   * 指定したアクション名に現在設定されているアクションを削除する。
   * @param name アクション名
   * @returns 設定されていたアクション
   */
  removeAction(name: string): Action {
    const a = this.actions[name];
    delete this.actions[name];
    return a;
  }

  /**
   * 現在設定されているアクションのアクション名のリストを返す。
   * @returns アクション名のリスト
   */
  getActionNames(): Array<string> {
    return Object.keys(this.actions);
  }

  /**
   * 指定した名前のアクションをループ再生します（基本アクション）。
   * 現在のアクションを停止してから切り替えます。
   * `setEmote()` で一時的に別のアクションを再生した後も、このアクションに戻ります。
   * @param name アクション名
   */
  setState(name: string) {
    const a = this.actions[name];
    if (a) {
      if (this.currentAction)
        this.currentAction.disable(this.object3D,this.scene);
      a.enable(this.object3D, this.scene);

      this.currentAction = a;
      this.stateAction = a;
    }
  }

  /**
   * 指定した名前のアクションを一度だけ再生します（エモートアクション）。
   * 再生が終わると `setState()` で設定したアクションに自動的に戻ります。
   * @param name アクション名
   */
  setEmote(name: string) {
    const a = this.actions[name];
    if (a) {
      if (this.currentAction)
        this.currentAction.disable(this.object3D, this.scene);
      a.enable(this.object3D, this.scene);
      this.currentAction = a;
      this.emoteAction = a;
    }
  }

  /**
   * `true` にすると、モーションのモーフィング値がオブジェクトに上書きされなくなります。
   * `setMorph()` で手動設定した値を保持したい場合に使います。
   * @param b `true` で上書きを無効化
   */
  setMorphsOverwrite(b: boolean) {
    this.overwriteMorphs = b;
  }

  /**
   * 指定した名前のモーフ（表情・形状変化）の値を設定します。
   * 値の範囲はモデルによって異なりますが、通常は 0.0 〜 1.0 です。
   * @param name モーフ名
   * @param value モーフの値
   */
  setMorph(name: string, value: number) {
    if (name in this.morphs) {
      const { array, idx } = this.morphs[name];
      array[idx] = value;
    }
  }

  /**
   * このオブジェクトが持つモーフ名の一覧を返します。
   * @returns モーフ名の配列
   */
  getMorphNames() {
    return Object.keys(this.morphs);
  }

  pose: Pose = {};
  update(dt: number) {
    super.update(dt);
    let pose;
    if (this.emoteAction && this.emoteAction.motion.playCount<=0) {
      pose = this.emoteAction.motion.update(dt);
      if (this.emoteAction.motion.playCount>0) {
        // emoteAction再生終了で切り替え
        // まずはemoteActionの停止
        this.emoteAction.disable(this.object3D, this.scene);
        // emoteActionはundefinedに
        this.emoteAction = undefined;
        // stateActionがあれば開始
        if (this.stateAction) {
          this.stateAction.enable(this.object3D, this.scene);
          this.currentAction = this.stateAction;
        }
      }
    } else if (this.stateAction) {
      pose = this.stateAction.motion.update(dt);
    }
    if (pose && this.currentAction && this.currentAction.shape.bones) {
      for (const [boneName,data] of Object.entries(pose)) {
        //位置、回転、拡大率対応
        const bone = this.currentAction.shape.bones[boneName];
        if (bone) {
          if (data.loc) bone.position.set(data.loc.x,data.loc.y,data.loc.z);
          if (data.quat) bone.quaternion.set(data.quat.x,data.quat.y,data.quat.z,data.quat.w);
          if (data.scale) bone.scale.set(data.scale.x,data.scale.y,data.scale.z);
        }
        // モーフィング対応。無いと動かないglTFもある。
        // モーフィングのデータの保存のしかた失敗してる説ある。GAHA
        if (!this.overwriteMorphs) {
          if (data.morphs) {
            for (const pMorph of data.morphs) {
              for (const myMName of Object.keys(this.morphs)) {
                if (myMName.startsWith(pMorph.name)) {
                  const {array} = this.morphs[myMName];
                  for (let i=0;i<array.length;i++) {
                    array[i] = pMorph.vals[i];
                  }
                  break;
                }
              }
            }
          }
        }
      }
    }
    this.object3D.updateMatrixWorld(true); // 必要なのか？
    if (this.currentAction)
      this.currentAction.shape.skeleton?.update(); // 必要なのか？
    // 以下、自動アクション切り替え機能の実装
    const vel = this.getLinearVelocity();
    const speed = vel.length();
    if (this.autoAction) {
      if (speed < this.minWalkSpeed) {
        if (this.actions[this.haltActionName]!==this.stateAction){
          this.setState(this.haltActionName);}
      } else if (speed < this.minRunSpeed) {
        if (this.actions[this.walkActionName]!==this.stateAction){
          this.setState(this.walkActionName);}
      } else {
        if (this.actions[this.runActionName]!==this.stateAction) {
          this.setState(this.runActionName);}
      }
    }
    // 以下、自動向き調整機能の実装
    if (this.autoDirection) {
      if (speed>0.0001) {
        vel.normalize();
        const up = this.upVector ? this.upVector : ObjectA3.defaultUpVector;
        tmp.v0.cross(vel,up)
        if (tmp.v0.length()>0.0001) {
          tmp.v0.set(0,0,0);
          getLookAtQuaternion(tmp.v0,vel,up,tmp.q0);
          this.setQuatNow(tmp.q0);
        }
      }
    }
  }

  /**
   * 自動アクション切り替え機能のON、OFFを設定します。
   * @param value `true`の時ON。`false`の時OFF。
   */
  setAutoAction(value: boolean) {
    this.autoAction = value;
  }

  /**
   * 自動向き調整機能のON、OFFを設定します。
   * @param value `true`の時ON。`false`の時OFF。
   */
  setAutoDirection(value: boolean) {
    this.autoDirection = value;
  }
}












export type Morph = {
  name: string, // これは省略不可。
  vals: number[]
}
/**
 * キャラクタのポーズを表すインターフェース。主に3Dキャラクタ
 * を想定しているが、車のシャーシーやタイヤの動きも、このPose
 * インターフェースで表現することができ、Motionインターフェース
 * は、このPoseインターフェースを用いることで、モーションキャプチャー
 * データも物理演算結果も、その他の動きも統一して扱えるようになる。
 * 例えば、モーションキャプチャデータに並進移動のデータが含まれていない
 * 場合、(0,0,0)を仮定してはいけない、そのような場合はundefinedとしておく。
 * またglTFのモデルではモーフィングのデータも含めてるものが多くあったので、
 * それも忘れずに。
 */
export type Pose = Record<string, {loc?: Vec3, quat?: Quat, scale?: Vec3, morphs?: Morph[]}>;


/**
 * `ActionObject` の内部アニメーションを制御するインターフェースです。
 *
 * 毎フレーム `update()` が呼ばれ、`Pose` 型のボーン情報を返すことでアニメーションを実現します。
 * Three.js の `THREE.AnimationClip` に相当します。
 *
 * 独自のモーションを作る場合はこのインターフェースを実装してください。
 */
export interface Motion {
  /** このモーションが何回再生されたかを表す値。`emoteAction` の終了判定に使用されます。 */
  playCount: number;

  /** 現在の再生位置（スタートから何秒経過したか）。 */
  time: number;

  /** モーションの再生が最後まで終わったときに呼び出されるリスナー。 */
  finishListener?: ()=>void;

  /**
   * 物理演算が必要な場合にRigidBodyやColliderを
   * PhysicsWorldに登録する必要があるので、このメソッドで
   * 対応する。
   * @param world 登録対象のPhysicsWorld
   */
  addOneselfToPhysics(world: PhysicsWorld): void;

  /**
   * このMotionが不必要となった時に、PhysicsWorldに
   * 登録していたRigidBodyやColliderを、登録解除する
   * 処理を行うメソッド。
   * @param world 解除対象のPhysicsWorld
   */
  removeOneselfFromPhysics(world: PhysicsWorld): void;

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
   * このモーションの再生が一巡して最後まで来た時に呼び出される
   * イベントリスナーを登録する。
   */
  setFinishListener(listener: ()=>void | undefined): void;

  /**
   * 経過時間に応じて対象のObjectA3の内部の動きをおこす。
   * 毎フレーム呼び出されることで、アニメーションを作り出す。
   * @param dt 経過時間(秒)
   */
  update(dt: number): Pose;
}

/**
 * 何もしない `Motion` の実装です。
 * ポーズも動きも持たないプレースホルダーとして使います。
 */
export class DummyMotion implements Motion {
  name: string;
  playCount: number;
  time: number;
  finishListener?: ()=>void;
  constructor() {
    this.name = 'dummy';
    this.playCount = 0;
    this.time = 0;
  }
  addOneselfToPhysics(_world: PhysicsWorld): void {}
  removeOneselfFromPhysics(_world: PhysicsWorld): void {}
  setPause(_p: boolean): void {}
  setTime(_time: number): void {}
  setFinishListener(listener: ()=>void | undefined) { this.finishListener=listener}
  update(_dt: number): Pose { return {};}
}

