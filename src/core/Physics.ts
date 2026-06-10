
import type { ObjectA3 } from './ObjectA3';
import type { Transformer } from './ObjectA3';
import type { Motion } from './ActionObject';

/*
 * 念のため、物理エンジンが変更されてもa3jsへの影響が少なくなるよう
 * 物理エンジンのインターフェースを作っておく。3Dグラフィック側は
 * Three.jsを信じて、ここのインターフェースで使ってしまおう。
 */

/**
 * 物理エンジン全体を管理するインターフェースです。
 * 物理演算を使用するには、事前に `initPhysics()` を呼んで初期化する必要があります。
 */
export interface PhysicsEngine {
  /** 物理エンジンが初期化済みかどうか。 */
  readonly isInitialized: boolean;

  /**
   * 物理エンジンを初期化します。
   * 物理演算が必要な場合は、`Scene` の生成前に `await initPhysics()` を呼び出してください。
   */
  init(): Promise<void>;

  /**
   * 物理演算が行われる空間（`PhysicsWorld`）を生成して返します。
   * `Scene` の生成時に自動的に呼び出されます。
   * @param options 物理ワールドの設定（重力など）
   */
  createWorld(options: PhysicsWorldOptions): PhysicsWorld;
}

/**
 * `PhysicsWorld` の生成オプションです。
 */
export interface PhysicsWorldOptions {
  /** 重力加速度ベクトル（m/s²）。通常は `{ x: 0, y: -9.81, z: 0 }` です。 */
  gravity: { x: number; y: number; z: number };
}

/**
 * 物理演算が行われる空間を表すインターフェースです。
 * `Scene` が内部で自動的に管理します。
 */
export interface PhysicsWorld {
  add(motion: Transformer | Motion): void;
  remove(motion: Transformer | Motion): void;
  update(dt: number): void;
  getCollisions(): Collision[];
}

/**
 * 剛体の種類を表す型です。
 * - `"dynamic"` — 力や衝突の影響を受けて自由に動く剛体です。
 * - `"kinematic"` — プログラムで直接位置を制御する剛体です。力の影響は受けません。
 * - `"fixed"` — 動かない固定剛体です（地面・壁等に使用）。
 */
export type RigidBodyType = "dynamic" | "kinematic" | "fixed";

/**
 * コライダー（衝突判定形状）の種類を表す型です。
 * - `"solid"` — 通常の衝突判定。他の剛体と物理的に衝突します。
 * - `"sensor"` — センサー判定。衝突イベントは発生しますが、物理的な衝突は起こりません。
 */
export type ColliderType = "solid" | "sensor";

/**
 * メッシュ形状のコライダー種別を表す型です。
 * - `"tri_mesh"` — 三角メッシュ（複雑な形状に対応しますが、動く物体には非推奨）。
 * - `"convex_hull"` — 凸包（三角メッシュより高速で、動く物体にも使用可能）。
 */
export type MeshColliderType = "tri_mesh" | "convex_hull";

/**
 * 物理オブジェクトの挙動を設定するオプションです。
 * `setMode("SimplePhysics", options)` に渡します。
 */
export interface PhysicsMotionOptions {
  /** 剛体の種類。デフォルトは `"dynamic"`。 */
  rigidBody: RigidBodyType;
  /** コライダーの種類。デフォルトは `"solid"`。 */
  collider: ColliderType;
  /** メッシュコライダーの種類。デフォルトは `"convex_hull"`。 */
  meshCollider: MeshColliderType;
  /** 質量（kg）。デフォルトは `1.0`。 */
  mass: number;
  /** 摩擦係数（0.0 〜 1.0）。デフォルトは `0.5`。 */
  friction: number;
  /** 反発係数（0.0 〜 1.0）。0 で完全非弾性衝突、1 で完全弾性衝突。デフォルトは `0.5`。 */
  restitution: number;
  /** 衝突グループのメンバーシップビットマスク。デフォルトは `0b0000000000000001`。 */
  membership: number;
  /** 衝突フィルタービットマスク（`membership` と AND を取って衝突を判定）。デフォルトは `0b0000000000000001`。 */
  filter: number;
  /** 衝突検知コールバック（`handleCollision()`）を有効にするか。デフォルトは `false`。 */
  collisionDetection: boolean;
}

/**
 * `PhysicsMotionOptions` のデフォルト値です。
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
 * 衝突情報を保持するオブジェクトです。
 * `Scene.setCollisionListener()` で登録したリスナーや `ObjectA3.handleCollision()` に渡されます。
 */
export interface Collision {
  /** 衝突した一方のオブジェクト。 */
  objectA: ObjectA3;
  /** `objectA` のぶつかったパーツのコライダー番号。 */
  partOfA: number;
  /** 衝突したもう一方のオブジェクト。 */
  objectB: ObjectA3;
  /** `objectB` のぶつかったパーツのコライダー番号。 */
  partOfB: number;
  /** 衝突開始のとき `true`、衝突終了のとき `false`。 */
  started: boolean;
}
