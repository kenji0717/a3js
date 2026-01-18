
import type { A3Object } from './A3Object';
import type { MutableVec3 } from './Vec3';
import type { MutableQuat } from './Quat';


/*
 * 念のため、物理エンジンが変更されてもa3jsへの影響が少なくなるよう
 * 物理エンジンのインターフェースを作っておく。3Dグラフィック側は
 * Three.jsを信じて、ここのインターフェースで使ってしまおう。
 */

/**
 * 物理エンジン全体を管理するインターフェース
 * A3Sceneのstaticなプロパティのphysicsに一つだけ
 * 生成される。
 */
export interface A3PhysicsEngine {
  readonly isInitialized: boolean;

  /**
    * 物理エンジンを初期化する。最初は必要な時に自動で
    * 初期化させることを目指したけど、難しいのであきらめた。
    * 物理演算が必要な場合は、ユーザがこれを実行することになる。
    * 現在のところ初期化の処理は以下のようなプログラムになる。
    * await A3Scene.physics.init();
    */
  init(): Promise<void>;

  /**
    * 物理演算用のWorldを生成して返す。
    */
  createWorld(option: A3PhysicsWorldOption): A3PhysicsWorld;
}

/**
 * A3PhysicsWorldを生成する時に必要となる情報をまとめたもの。
 * 物理エンジンの実装ごとに拡張可能。
 */
export interface A3PhysicsWorldOption {
  gravity: { x: number; y: number; z: number };
}

/**
 * 物理演算が行われる空間を表すクラス。物理演算のステップを
 * 進めるupdate、A3PhysicsEntityを追加・削除するためのadd、remove
 * メソッドを持つ。
 */
export interface A3PhysicsWorld {
  add(entity: A3PhysicsEntity): void;
  remove(entity: A3PhysicsEntity): void;
  update(dt: number): void;
}

/**
 * A3PhysicsEngityを生成する時に必要な情報をまとめたもの。
 * 物理エンジンや個別のA3PhysicsEntityごとに拡張可能。
 */
export interface A3PhysicsEntityOption {
  
}

/**
 * RigidBodyなどの個別のA3Objectに必要な物理計算のための
 * 色々な実体が含まれる物のインターフェース。
 */
export interface A3PhysicsEntity {
  
  /**
   * 物理演算の結果をA3Objectの位置や回転に反映させる。
   */
  synchronize(obj: A3Object): void;

  /**
   * 物理演算対象であっても位置を外部から操作できるようにする。
   */
  forceSetLoc(v: MutableVec3): void;

  /**
   * 物理演算対象であっても回転を外部から操作できるようにする。
   */
  forceSetQuat(q: MutableQuat): void;

  /**
   * 物理演算対象であっても拡大率を外部から操作できるようにする。
   * ただ、これは普通難しいかも。
   */
  forceSetScale(v: MutableVec3): void;
}

