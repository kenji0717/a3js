
import type { A3Object } from './A3Object';
import type { MutableVec3 } from './Vec3';
import type { MutableQuat } from './Quat';


/*
 * 念のため、物理エンジンが変更されてもa3jsへの影響が少なくなるよう
 * 物理エンジンのインターフェースを作っておく。3Dグラフィック側は
 * Three.jsを信じて、ここのインターフェースで使ってしまおう。
 */

export interface A3PhysicsOption {
  gravity: { x: number; y: number; z: number };
  timestep: number;
}

/**
 * 物理エンジン全体を管理するインターフェース
 * A3Sceneのstaticなプロパティのphysicsに一つだけ
 * 生成される。
 */
export interface A3Physics {
  readonly isInitialized: boolean;
  /**
    * 物理演算用のWorldを生成して返す。
    * 必要であれば最初に物理エンジン自体の初期化を行う。
    * できれば物理エンジンを使わない場合もあることを考えて
    * 物理エンジンのライブラリは動的インポートなどの非同期
    * で読み込んで欲しいので、このメソッドはPromiseを返す。
    * 物理エンジンの初期化が複数回発生しないような工夫もして欲しい。
    * なのでコンストラクタで初期化しないようにすべし。
    */
  createWorld<T extends A3PhysicsOption>(option: T): Promise<A3PhysicsWorld>;
}

export interface A3PhysicsWorld {
  update(dt: number): void;
  createPhysicsEntity(obj: A3Object): A3PhysicsEntity;
}

export interface A3PhysicsEntity {
  synchronize(obj: A3Object): void;
  setLoc(v: MutableVec3): void;
  setQuat(q: MutableQuat): void;
}
