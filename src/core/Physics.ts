
import type { ObjectA3 } from './ObjectA3';
import type { MutableVec3 } from './Vec3';
import type { MutableQuat } from './Quat';


/*
 * 念のため、物理エンジンが変更されてもa3jsへの影響が少なくなるよう
 * 物理エンジンのインターフェースを作っておく。3Dグラフィック側は
 * Three.jsを信じて、ここのインターフェースで使ってしまおう。
 */

/**
 * 物理エンジン全体を管理するインターフェース
 * Sceneのstaticなプロパティのphysicsに一つだけ
 * 生成される。
 */
export interface PhysicsEngine {
  readonly isInitialized: boolean;

  /**
    * 物理エンジンを初期化する。最初は必要な時に自動で
    * 初期化させることを目指したけど、難しいのであきらめた。
    * 物理演算が必要な場合は、ユーザがこれを実行することになる。
    * 現在のところ初期化の処理は以下のようなプログラムになる。
    * await Scene.physics.init();
    */
  init(): Promise<void>;

  /**
    * 物理演算用のWorldを生成して返す。
    */
  createWorld(option: PhysicsWorldOption): PhysicsWorld;
}

/**
 * PhysicsWorldを生成する時に必要となる情報をまとめたもの。
 * 物理エンジンの実装ごとに拡張可能。
 */
export interface PhysicsWorldOption {
  gravity: { x: number; y: number; z: number };
}

/**
 * 物理演算が行われる空間を表すクラス。物理演算のステップを
 * 進めるupdate、PhysicsEntityを追加・削除するためのadd、remove
 * メソッドを持つ。
 */
export interface PhysicsWorld {
  add(entity: PhysicsEntity): void;
  remove(entity: PhysicsEntity): void;
  update(dt: number): void;
  getCollisions(): Collision[];
}

export type RigidBodyType = "dynamic" | "kinematic" | "fixed";
export type ColliderKind = "solid" | "sensor";
export type MeshColliderKind = "tri_mesh" | "convex_hull";
/**
 * PhysicsEngityを生成する時に必要な情報をまとめたもの。
 * 物理エンジンや個別のPhysicsEntityごとに拡張可能。
 */
export interface PhysicsEntityOption {
  rigidBody: RigidBodyType;
  collider: ColliderKind;
  meshCollider: MeshColliderKind;
  mass: number;
  friction: number;
  restitution: number;
  membership: number;
  filter: number;
  collisionDetection: boolean
}

export const defaultPhysicsEntityOption: PhysicsEntityOption = {
  rigidBody: "dynamic",
  collider: "solid",
  meshCollider: "convex_hull",
  mass: 1.0,
  friction: 0.5,
  restitution: 0.5,
  membership: 0b0000000000000001,
  filter: 0b0000000000000001,
  collisionDetection: false
};

/**
 * RigidBodyなどの個別のObjectA3に必要な物理計算のための
 * 色々な実体が含まれる物のインターフェース。
 */
export abstract class PhysicsEntity {
  object: ObjectA3;
  option: PhysicsEntityOption;

  constructor(object: ObjectA3, option: PhysicsEntityOption) {
    this.object = object;
    this.option = option;
  }
  
  /**
   * 物理演算の結果をObjectA3の位置や回転に反映させる。
   */
  abstract synchronize(obj: ObjectA3): void;

  /**
   * 物理演算対象であっても位置を外部から操作できるようにする。
   */
  abstract setLocationNow(v: MutableVec3): void;

  /**
   * 物理演算対象であっても回転を外部から操作できるようにする。
   */
  abstract setQuatNow(q: MutableQuat): void;

  /**
   * 物理演算対象であっても拡大率を外部から操作できるようにする。
   * ただ、これは普通難しいかも。
   */
  abstract setScaleNow(v: MutableVec3): void;
}

/**
 * 衝突の情報を保持するオブジェクトのインタフェース。
 * もうRapierと独立に設計するのが難しいのでRapierベースで
 * 設計する。
 */
export interface Collision {
  objectA: ObjectA3;
  partOfA: number;
  objectB: ObjectA3;
  partOfB: number;
  started: boolean;
}
