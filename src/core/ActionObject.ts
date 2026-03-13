import * as THREE from 'three';
import { ObjectA3 } from './ObjectA3';
import type { AsyncInitRequired } from './AsyncInitRequired';
import { Vec3, Quat } from './LinearMath';
import type { PhysicsWorld } from './Physics';
import { Sound } from '../three/Sound';

export interface Action {
  name: string; // 本当はこのnameを取り除きたい。GAHA
  shape: Shape;
  motion: Motion;
  sound?: Sound;
  soundContinue: boolean;
}

export interface Shape {
  root: THREE.Object3D;
  bones?: Record<string,THREE.Object3D>;
  skeleton?: THREE.Skeleton;
}

/**
 * アクションを含む3Dオブジェクト。a3jsではアクション(Action)という
 * 単位で3Dオブジェクト内の動きを扱う方法を提供する。アニメーションの
 * 情報を含むglTFなどが典型的な対象。必ずしも初期化に非同期処理を必要
 * としない場合も考えられるが、非同期処理が必要な場合にあわせた。
  * 
 * a3jsのActionという方法に馴染まない場合は、ObjectA3を独自に継承して
 * 独自の方法で動きを含む3Dオブジェクトを作成してもかまわない。
 */
export abstract class ActionObject<T> extends ObjectA3 implements AsyncInitRequired<T> {
  readonly ready: Promise<T>;
  actions: Record<string,Action>;
  currentAction?: Action;
  stateAction?: Action;
  emoteAction?: Action;
  morphs: Record<string, {array: Array<number>, idx: number}>;
  morphsOverwrite: boolean;

  constructor(data?: any) {
    super(data);
    this.actions = {};
    this.morphs = {};
    this.morphsOverwrite = false;
    this.ready = this.asyncInit(data);
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
    this.object.clear();
    this.object.add(this.currentAction.shape.root);
    this.morphs = morphs;
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

  setState(name: string) {
    const a = this.actions[name];
    if (a) {
      if (this.currentAction) {
        if (this.currentAction.sound) {
          if (!this.currentAction.soundContinue)
            this.currentAction.sound.stop();
        }
        this.object.remove(this.currentAction.shape.root);
      }
      this.object.add(a.shape.root);
      a.motion.playCount = 0;
      a.motion.time = 0;
      if (a.sound) {
        a.sound.play();
        a.motion.setFinishListener(()=>{
          a.sound?.play();
        });
      }
      this.currentAction = a;
      this.stateAction = a;
    }
  }

  setEmote(name: string) {
    const a = this.actions[name];
    if (a) {
      if (this.currentAction) {
        if (this.currentAction.sound) {
          if (!this.currentAction.soundContinue)
            this.currentAction.sound.stop();
        }
        this.object.remove(this.currentAction.shape.root);
      }
      this.object.add(a.shape.root);
      a.motion.playCount = 0;
      a.motion.time = 0;
      if (a.sound) {
        a.sound.play();
        a.motion.setFinishListener(()=>{
          a.sound?.play();
        });
      }
      this.currentAction = a;
      this.emoteAction = a;
    }
  }

  // 今のところ、こんな感じでにげる。AnimationMixerを
  // 完全に真似するまでは時間がかかりそう。
  setMorphsOverwrite(b: boolean) {
    this.morphsOverwrite = b;
  }

  morph(name: string, value: number) {
    if (name in this.morphs) {
      const { array, idx } = this.morphs[name];
      array[idx] = value;
    }
  }

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
        // まずはcurrentActionの停止
        if (this.currentAction?.shape.root) {
          this.object.remove(this.currentAction.shape.root);
        }
        if (this.currentAction?.sound) {
          if (!this.currentAction.soundContinue)
            this.currentAction.sound.stop();
        }
        // emoteActionはundefinedに
        this.emoteAction = undefined;
        // stateActionがあれば開始
        if (this.stateAction) {
          this.object.add(this.stateAction.shape.root);
          this.currentAction = this.stateAction;
          if (this.stateAction.sound) {
            const sound = this.stateAction.sound;
            sound.play();
            this.stateAction.motion.setFinishListener(()=>{
              sound.play();
            });
          }
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
        if (!this.morphsOverwrite) {
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
    this.object.updateMatrixWorld(true); // 必要なのか？
    if (this.currentAction)
      this.currentAction.shape.skeleton?.update(); // 必要なのか？
  }
}












export type Morph = {
  name: string,
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
export interface Motion {
  /**
   * このMotionにつける名前。「GAHA不要である可能性」
   */
  name: string;

  /**
   * このMotionが何回再生されたかを保存している。
   *
   */
  playCount: number;
  
  /**
   * 現在再生中のモーションがスータトから何秒経過した状態かを示す。
   */
  time: number;

  /**
   * モーションの再生が最後まで来た時に呼び出されるイベントリスナー。
   */
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

