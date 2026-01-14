
import * as THREE from 'three';
import { A3Scene } from './A3Scene';
import type { A3PhysicsEntity } from './A3Physics';
import { Vec3 } from './Vec3';
import type { MutableVec3 } from './Vec3';
import { Quat } from './Quat';
import type { MutableQuat } from './Quat';

/**
 * シーンの中に配置される全てのオブジェクトのベース
 * となるアブストラクトクラス。シーンの中の表示対象
 * はもちろん、カメラやライトなどもこのクラスのサブ
 * クラスにしないといけない。特に、このアブストラクト
 * クラスでは、3D空間内での移動や、物理演算に関する
 * 必要なメソッドを実装する。
 */
export abstract class A3Object {
  readonly _loc: Vec3 = new Vec3(0,0,0);
  readonly _rot: Quat = new Quat(0,0,0,1);
  object: THREE.Object3D;
  needsUpdate: boolean = false; // デフォルトfalse
  needsPhysics: boolean = false; // デフォルトfalse
  scene: A3Scene | null = null;
  physics: A3PhysicsEntity | null = null;

  constructor(data?: any) {
    this.object = this.initObject(data);
  }

  // 非同期でないと無理な場合などはとりあえず
  // 空のTHREE.Object3Dだけ返しておいて後で、
  // そのObject3DにaddすればOK。
  abstract initObject(data?: any): THREE.Object3D;

  update(dt: number) {
    dt;
    if (this.physics)
      this.physics.synchronize(this);
  }

/*
  initPhysics() {
    if (this.physics) return;
    this.physics = new RapierRigidBody(this);
    this.needsUpdate = true;
  }
*/

  setLoc(x: number, y: number, z: number): void;
  setLoc(v: MutableVec3): void;
  setLoc(xOrV: number | MutableVec3, y?: number, z?: number): void {
    if (typeof xOrV === "number") {
      this._loc.set(xOrV, y!, z!);
      this.object.position.set(xOrV, y!, z!);
    } else {
      this._loc.set(xOrV.x, xOrV.y, xOrV.z);
      this.object.position.set(xOrV.x,xOrV.y,xOrV.z);
    }
  }

  get loc(): Vec3 {
    return this._loc;
  }

  setQuat(x: number, y: number, z: number, w: number): void;
  setQuat(q: MutableQuat): void;
  setQuat(xOrQ: number | MutableQuat, y?: number, z?: number, w?: number): void {
    if (typeof xOrQ === "number") {
      this._rot.set(xOrQ, y!, z!, w!);
      this.object.quaternion.set(xOrQ, y!, z!, w!);
    } else {
      this._rot.set(xOrQ.x, xOrQ.y, xOrQ.z, xOrQ.w);
      this.object.quaternion.set(xOrQ.x,xOrQ.y,xOrQ.z,xOrQ.w);
    }
  }

  get quat(): Quat {
    return this._rot;
  }
}
