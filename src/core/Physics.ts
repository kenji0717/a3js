
import type { ObjectA3 } from './ObjectA3';
import type { Transforer } from './ObjectA3';
import type { Motion } from './ActionObject';

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
  createWorld(options: PhysicsWorldOptions): PhysicsWorld;
}

/**
 * PhysicsWorldを生成する時に必要となる情報をまとめたもの。
 * 物理エンジンの実装ごとに拡張可能。
 */
export interface PhysicsWorldOptions {
  gravity: { x: number; y: number; z: number };
}

/**
 * 物理演算が行われる空間を表すクラス。物理演算のステップを
 * 進めるupdate、PhysicsMotionを追加・削除するためのadd、remove
 * メソッドを持つ。
 */
export interface PhysicsWorld {
  add(motion: Transforer | Motion): void;
  remove(motion: Transforer | Motion): void;
  update(dt: number): void;
  getCollisions(): Collision[];
}

export type RigidBodyType = "dynamic" | "kinematic" | "fixed";
export type ColliderKind = "solid" | "sensor";
export type MeshColliderKind = "tri_mesh" | "convex_hull";
/**
 * PhysicsMotionを生成する時に必要な情報をまとめたもの。
 * 現在はRapierの実装に合わせた物になってしまっている。
 */
export interface PhysicsMotionOptions {
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

/**
 * デフォルト値となるPhysicsMotionOptions
 */
export const defaultPhysicsMotionOptions: PhysicsMotionOptions = {
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
