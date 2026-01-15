
import * as THREE from 'three';
import { A3Scene } from './A3Scene';
import type { A3Physics, A3PhysicsWorld, A3PhysicsEntity } from './A3Physics';
import { A3PhysicsEntityDummy } from './A3Physics';
import { Vec3 } from './Vec3';
import type { MutableVec3 } from './Vec3';
import { Quat } from './Quat';
import type { MutableQuat } from './Quat';


/**
 * A3Objectのモーションコントロールモード
 */
export type MotionControlMode =
  | "manual" // プログラマ指定の場所に瞬時に移動するモード
  | "interpolated" // プログラマ指定の場所に1秒とかで補完で移動するモード
  | "physics" // 物理演算で動くモード
  | "user"; // 自分で動きを実装するモード

/**
 * スクリーン上における方向を表します。
 * オブジェクトに吹き出しを出す場合の方向で使いますが、
 * それ以外でも使うかも。
 */
export type Dir =
  | "TOP"
  | "RIGHT"
  | "LEFT"
  | "BOTTOM"; 

/*
 * 吹き出しの情報。必要な時だけA3Objectに
 * 吹き出しの情報を入れるために使用。
 */
class BalloonInfo {
  message: string;
  dir: Dir;
  offsetTop:    {x: number, y: number};
  offsetRight:  {x: number, y: number};
  offsetLeft:   {x: number, y: number};
  offsetBottom: {x: number, y: number};

  constructor(message: string) {
    this.message = message;
    this.dir = "RIGHT";
    this.offsetTop = {x:0,y:2};
    this.offsetRight = {x:1,y:1};
    this.offsetLeft = {x:-1,y:1};
    this.offsetBottom = {x:0,y:0};
  }
}

/*
 * 補間のための情報と処理を実装したクラス。
 * 必要な時だけA3Objectに追加される。
 */
class Interpolation {
  loc: Vec3;
  rot: Quat;
  scale: Vec3;
  ratio: number = 0.9;

  constructor(obj: A3Object) {
    this.loc = new Vec3(obj.loc.x,obj.loc.y,obj.loc.z);
    this.rot = new Quat(obj.rot.x,obj.rot.y,obj.rot.z,obj.rot.w);
    this.scale = new Vec3(obj.scale.x,obj.scale.y,obj.scale.z);
  }

  interpolate(obj: A3Object, dt: number) {
    obj;
    dt;
    console.log('Interpolation.interpolate() is not implemented yet!');
  }
}

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
  readonly _scale: Vec3 = new Vec3(1,1,1);
  object: THREE.Object3D;
  motionControlMode: MotionControlMode = "manual";
  scene: A3Scene | null = null;
  physics: A3PhysicsEntity | null = null;
  private balloon: BalloonInfo | null = null;
  private interpolation: Interpolation | null = null;

  constructor(data?: any) {
    this.object = this.initObject(data);
  }

  // 非同期でないと無理な場合などはとりあえず
  // 空のTHREE.Object3Dだけ返しておいて後で、
  // そのObject3DにaddすればOK。
  abstract initObject(data?: any): THREE.Object3D;

  setMotionControlMode(mode: MotionControlMode) {
    this.motionControlMode = mode;
    if (mode === "interpolated" && !this.interpolation)
      this.interpolation = new Interpolation(this);
    //このタイミングでphysicsは初期化不可能。A3Scene.addでやる。
  }

  update(dt: number) {
    switch(this.motionControlMode) {
      case "interpolated":
        if (this.interpolation) // 必ずtrueのはず
          this.interpolation.interpolate(this,dt);
        break;
      case "physics":
        if (this.physics) // 必ずtrueのはず
          this.physics.synchronize(this);
        break;
      case "user":
        console.log('"user"モードを使う場合は自分でupdateメソッドをオーバーライドして実装して下さい。');
        break;
    }        
  }

  /**
   * 物理演算に必要なA3PhysicsEntityを用意する。ただ、物理演算が
   * 必要無い場合には、わざわざ実装しなくて良いようにデフォルト
   * 実装を作ってあるけど、その実装内容は物理エンジンの方のに
   * まかせる形になっている。物理演算を本当に使用したい場合には
   * スーパークラスでオーバーライドして実装するべき。
   */ 
  initPhysics(physics?: A3Physics, world?: A3PhysicsWorld) {
    if (physics) console.log(`physics: ${typeof physics}`);
    if (world) console.log(`world: ${typeof world}`);
    this.physics = new A3PhysicsEntityDummy(this);
  }

  setBalloon(message: string) {
    if (!this.balloon)
      this.balloon = new BalloonInfo(message);
    else
      this.balloon.message = message;
  }

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
  get rot(): Quat {
    return this._rot;
  }

  setScale(x: number, y: number, z: number): void;
  setScale(v: MutableVec3): void;
  setScale(xOrV: number | MutableVec3, y?: number, z?: number): void {
    if (typeof xOrV === "number") {
      this._scale.set(xOrV, y!, z!);
      this.object.scale.set(xOrV, y!, z!);
    } else {
      this._scale.set(xOrV.x, xOrV.y, xOrV.z);
      this.object.scale.set(xOrV.x,xOrV.y,xOrV.z);
    }
  }
  get scale(): Vec3 {
    return this._scale;
  }
}
