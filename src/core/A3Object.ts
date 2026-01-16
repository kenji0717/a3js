
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
export type ControlMode =
  | "manual" // プログラマ指定の場所に瞬時に移動するモード
  | "interpolated" // プログラマ指定の場所に1秒とかで補完で移動するモード
  | "physics" // 物理エンジンを使うモード
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

// BalloonInfoとInterpolationの実装は長いので一番下に移動した。

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
  controlMode: ControlMode = "manual";
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

  setControlMode(mode: ControlMode) {
    this.controlMode = mode;
    if (mode === "interpolated" && !this.interpolation)
      this.interpolation = new Interpolation(this);
    //このタイミングでphysicsは初期化不可能。A3Scene.addでやる。
  }

  update(dt: number) {
    switch(this.controlMode) {
      case "manual":
        // "manual"モードの時は何もしない
        break;
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

  get location(): Vec3 {
    return this._loc;
  }
  setLocation(x: number, y: number, z: number): void;
  setLocation(v: MutableVec3): void;
  setLocation(xOrV: number | MutableVec3, y?: number, z?: number): void {
    const newLoc = new Vec3();
    if (typeof xOrV === "number") {
      newLoc.set(xOrV, y!, z!);
    } else {
      newLoc.set(xOrV);
    }
    switch (this.controlMode) {
      case "interpolated":
        if (this.interpolation) // 絶対trueのはず
          this.interpolation.setLoc(this,newLoc);
        break;
      case "physics":
        // "physicsモードの時はsetLocationできないということにする。
        break;
      default:
        // "manual","user"の時
        this.location.set(newLoc);
        this.object.position.set(newLoc.x,newLoc.y,newLoc.z);
        break;
    }
  }

  forceSetLocation(x: number, y: number, z: number): void;
  forceSetLocation(v: MutableVec3): void;
  forceSetLocation(xOrV: number | MutableVec3, y?: number, z?: number): void {
    const newLoc = new Vec3();
    if (typeof xOrV === "number") {
      newLoc.set(xOrV, y!, z!);
    } else {
      newLoc.set(xOrV);
    }
    switch (this.controlMode) {
      case "interpolated":
        if (this.interpolation) // 絶対trueのはず
          this.interpolation.forceSetLoc(this,newLoc);
        break;
      case "physics":
        if (this.physics) // 絶対trueのはず
          this.physics.forceSetLoc(newLoc);
        break;
      default:
        // "manual","user"の時
        this.location.set(newLoc);
        this.object.position.set(newLoc.x,newLoc.y,newLoc.z);
        break;
    }
  }




  get rot(): Quat {
    return this._rot;
  }
  setQuat(x: number, y: number, z: number, w: number): void;
  setQuat(q: MutableQuat): void;
  setQuat(xOrQ: number | MutableQuat, y?: number, z?: number, w?: number): void {
    const newQuat = new Quat();
    if (typeof xOrQ === "number") {
      newQuat.set(xOrQ, y!, z!, w!);
    } else {
      newQuat.set(xOrQ);
    }
    switch (this.controlMode) {
      case "interpolated":
        if (this.interpolation) // 絶対trueのはず
          this.interpolation.setQuat(this,newQuat);
        break;
      case "physics":
        // "physicsモードの時はsetQuatできないということにする。
        break;
      default:
        // "manual","user"の時
        this.rot.set(newQuat);
        this.object.quaternion.set(newQuat.x,newQuat.y,newQuat.z,newQuat.w);
        break;
    }
  }

  forceSetQuat(x: number, y: number, z: number, w: number): void;
  forceSetQuat(q: MutableQuat): void;
  forceSetQuat(xOrQ: number | MutableQuat, y?: number, z?: number, w?: number): void {
    const newQuat = new Quat();
    if (typeof xOrQ === "number") {
      newQuat.set(xOrQ, y!, z!, w!);
    } else {
      newQuat.set(xOrQ);
    }
    switch (this.controlMode) {
      case "interpolated":
        if (this.interpolation) // 絶対trueのはず
          this.interpolation.forceSetQuat(this,newQuat);
        break;
      case "physics":
        if (this.physics) // 絶対trueのはず
          this.physics.forceSetQuat(newQuat);
        break;
      default:
        // "manual","user"の時
        this.rot.set(newQuat);
        this.object.quaternion.set(newQuat.x,newQuat.y,newQuat.z,newQuat.w);
        break;
    }
  }

  get scale(): Vec3 {
    return this._scale;
  }
  setScale(x: number, y: number, z: number): void;
  setScale(v: MutableVec3): void;
  setScale(xOrV: number | MutableVec3, y?: number, z?: number): void {
    const newScale = new Vec3();
    if (typeof xOrV === "number") {
      newScale.set(xOrV, y!, z!);
    } else {
      newScale.set(xOrV);
    }
    switch (this.controlMode) {
      case "interpolated":
        if (this.interpolation) // 絶対trueのはず
          this.interpolation.setScale(this,newScale);
        break;
      case "physics":
        // "physicsモードの時はsetScaleできないということにする。
        break;
      default:
        // "manual","user"の時
        this.scale.set(newScale);
        this.object.scale.set(newScale.x,newScale.y,newScale.z);
        break;
    }
  }

  forceSetScale(x: number, y: number, z: number): void;
  forceSetScale(v: MutableVec3): void;
  forceSetScale(xOrV: number | MutableVec3, y?: number, z?: number): void {
    const newScale = new Vec3();
    if (typeof xOrV === "number") {
      newScale.set(xOrV, y!, z!);
    } else {
      newScale.set(xOrV);
    }
    switch (this.controlMode) {
      case "interpolated":
        if (this.interpolation) // 絶対trueのはず
          this.interpolation.forceSetScale(this,newScale);
        break;
      case "physics":
        if (this.physics) // 絶対trueのはず
          this.physics.forceSetScale(newScale); // 普通の物理エンジンは対応させる？
        break;
      default:
        // "manual","user"の時
        this.scale.set(newScale);
        this.object.scale.set(newScale.x,newScale.y,newScale.z);
        break;
    }
  }

  /**
   * このA3Objectが引数で与えられたTHREE.Object3Dを含んでいるか
   * どうかを判定するメソッド。
   */
  contains(obj: THREE.Object3D): boolean {
    let contain = false;
    this.object.traverse((o) => {
      if (o==obj) contain = true;
    });
    return contain;
  }
}

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
  firstLoc: Vec3;
  firstRot: Quat;
  firstScale: Vec3;
  nowLoc: Vec3;
  nowRot: Quat;
  nowScale: Vec3;
  lastLoc: Vec3;
  lastRot: Quat;
  lastScale: Vec3;
  nowTime: number;
  duration: number;

  constructor(obj: A3Object) {
    this.firstLoc = new Vec3(obj.location);
    this.firstRot = new Quat(obj.rot);
    this.firstScale = new Vec3(obj.scale);
    this.nowLoc = new Vec3(obj.location);
    this.nowRot = new Quat(obj.rot);
    this.nowScale = new Vec3(obj.scale);
    this.lastLoc = new Vec3(obj.location);
    this.lastRot = new Quat(obj.rot);
    this.lastScale = new Vec3(obj.scale);
    this.nowTime = 0;
    this.duration = 1;
  }

  setLoc(obj: A3Object, newLoc: MutableVec3) {
    this.firstLoc.set(obj.location);
    this.firstRot.set(obj.rot);
    this.firstScale.set(obj.scale);
    this.lastLoc.set(newLoc);
    //this.lastRot.set(obj.rot);
    //this.lastScale.set(obj.scale);
    this.nowTime = 0;
  }

  forceSetLoc(obj: A3Object, newLoc: MutableVec3) {
    this.firstLoc.set(obj.location);
    this.firstRot.set(obj.rot);
    this.firstScale.set(obj.scale);
    this.lastLoc.set(newLoc);
    //this.lastRot.set(obj.rot);
    //this.lastScale.set(obj.scale);
    this.nowTime = 1;
  }

  setQuat(obj: A3Object, newQuat: MutableQuat) {
    this.firstLoc.set(obj.location);
    this.firstRot.set(obj.rot);
    this.firstScale.set(obj.scale);
    //this.lastLoc.set(obj.loc);
    this.lastRot.set(newQuat);
    //this.lastScale.set(obj.scale);
    this.nowTime = 0;
  }

  forceSetQuat(obj: A3Object, newQuat: MutableQuat) {
    this.firstLoc.set(obj.location);
    this.firstRot.set(obj.rot);
    this.firstScale.set(obj.scale);
    //this.lastLoc.set(obj.loc);
    this.lastRot.set(newQuat);
    //this.lastScale.set(obj.scale);
    this.nowTime = 1;
  }

  setScale(obj: A3Object, newScale: MutableVec3) {
    this.firstLoc.set(obj.location);
    this.firstRot.set(obj.rot);
    this.firstScale.set(obj.scale);
    //this.lastLoc.set(obj.loc);
    //this.lastRot.set(obj.rot);
    this.lastScale.set(newScale);
    this.nowTime = 0;
  }

  forceSetScale(obj: A3Object, newScale: MutableVec3) {
    this.firstLoc.set(obj.location);
    this.firstRot.set(obj.rot);
    this.firstScale.set(obj.scale);
    //this.lastLoc.set(obj.loc);
    //this.lastRot.set(obj.rot);
    this.lastScale.set(newScale);
    this.nowTime = 1;
  }

  // cssのanimation-timing-functionみたいに
  // 切り替えられるようにしたいね。
  smoothstep(t: number): number {
    return t * t * (3 - 2 * t);
  }

  interpolate(obj: A3Object, dt: number) {
    this.nowTime += dt;
    if (this.nowTime > this.duration) this.nowTime = this.duration;
    const t0 = this.nowTime/this.duration;
    const t = this.smoothstep(t0);

    this.nowLoc.lerp(this.firstLoc,this.lastLoc,t);
    // 以下、たぶん球面線形補間。重いけど必要な時ある。
    this.nowRot.slerp(this.firstRot,this.lastRot,t);
    this.nowScale.lerp(this.firstScale,this.lastScale,t);

    obj.location.set(this.nowLoc);
    obj.object.position.set(this.nowLoc.x,this.nowLoc.y,this.nowLoc.z);
    obj.rot.set(this.nowRot);
    obj.object.quaternion.set(this.nowRot.x,this.nowRot.y,this.nowRot.z,this.nowRot.w);
    obj.scale.set(this.nowScale);
    obj.object.scale.set(this.nowScale.x,this.nowScale.y,this.nowScale.z);
  }
}

