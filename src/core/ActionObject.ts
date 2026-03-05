import * as THREE from 'three';
import { ObjectA3, a3jsLoading } from './ObjectA3';
import type { PoseMotion, Pose } from './Motion';
import type { AsyncInitRequired } from './AsyncInitRequired';

export interface Action {
  name: string;
  shape: Shape;
  motion: PoseMotion;
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
    this.currentAction = this.actions[defaultName];
    this.object.remove(a3jsLoading); // 無い時エラー出る？
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
      if (this.currentAction)
        this.object.remove(this.currentAction.shape.root);
      this.object.add(a.shape.root);
      a.motion.playCount = 0;
      a.motion.time = 0;
      this.currentAction = a;
      this.stateAction = a;
    }
  }

  setEmote(name: string) {
    const a = this.actions[name];
    if (a) {
      if (this.currentAction)
        this.object.remove(this.currentAction.shape.root);
      this.object.add(a.shape.root);
      a.motion.playCount = 0;
      a.motion.time = 0;
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
        if (this.currentAction?.shape.root)
          this.object.remove(this.currentAction?.shape.root);
        this.emoteAction = undefined;
        if (this.stateAction) {
          this.object.add(this.stateAction.shape.root);
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

