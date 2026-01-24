
import * as THREE from 'three';
import { Scene } from './Scene';
import type { PhysicsEntity,
              PhysicsEntityOption } from './Physics';
import { RapierDefaultPhysicsEntity } from '../rapier/RapierPhysics';
import { Vec3 } from './Vec3';
import type { MutableVec3 } from './Vec3';
import { Quat, getQuatOfLookAt, vec3EulerToQuat } from './Quat';
import type { MutableQuat, RotationOrder } from './Quat';


/**
 * ObjectA3のモーションコントロールモード
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
export abstract class ObjectA3 {
  static defaultRotationOrder: RotationOrder = "XYZ";
  rotationOrder: RotationOrder | null = null;
  static defaultUpVector: Vec3 = new Vec3(0,1,0);
  upVector: Vec3 | null = null;
  readonly _loc: Vec3 = new Vec3(0,0,0);
  readonly _quat: Quat = new Quat(0,0,0,1);
  readonly _scale: Vec3 = new Vec3(1,1,1);
  object: THREE.Object3D;
  controlMode: ControlMode = "manual";
  scene: Scene | null = null;
  physics: PhysicsEntity | null = null;
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
    if (mode === "physics" && !this.physics)
      this.initPhysics(this.getPhysicsOption()); // GAHAこのタイミングでやるべきか？
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
   * このObjectA3用のA3PhysicsEntity(物理計算に必要なもろもろ)
   * を生成するために必要な情報を、このメソッドで返す。物理演算
   * で特別なことをするような時には、このメソッドをオーバーライド
   * しする必要があるかもしれない。ここで生成されたオプションの
   * 情報はthis.initPhysics()に受け渡されてA3PhysicsEntityが生成
   * される。
   */
  getPhysicsOption(): PhysicsEntityOption {
    return {
      rigidBody: "dynamic",
      collider: "solid",
      meshCollider: "convex_hull",
      mass: 1.0,
      friction: 0.5,
      restitution: 0.5
    };
  }

  /**
   * 物理演算に必要なA3PhysicsEntity(物理実態)を生成して
   * this.physicsに設定します。this.controlModeも"physics"に設定
   * します。A3PhysicsEntityのデフォルト実装として
   * RapierDefaultPhysicsEntityを使用しますが、自分で作った
   * 物理実態(A3PhysicsEntity)を使いたい場合は、ObjectA3を継承した
   * クラスで、このinitPhysics()メソッドを適切にオーバーライドして
   * ください。このinitPhysics()は通常A3Scene(つまりworld)に追加
   * される瞬間に1度だけ実行されます。その場合A3PhysicsEntityの
   * 生成に必要なA3PhysicsEntityOptionはthis.getPhysicsOption();
   * から取得されます。このオプションを変更してカスタマイズしたい
   * 場合は、ObjectA3をA3Sceneにaddする前に
   * this.initPhysics(カスタマイズしたオプション);として初期化して
   * 下さい。もしくは継承したクラスでgetPhysicsOption()メソッド
   * をオーバーライドしましょう。
   */ 

  initPhysics(opt: PhysicsEntityOption): void {
    this.physics = new RapierDefaultPhysicsEntity(this,opt);
    this.controlMode = 'physics';
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
          this.interpolation.setLocation(this,newLoc);
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

  setLocationNow(x: number, y: number, z: number): void;
  setLocationNow(v: MutableVec3): void;
  setLocationNow(xOrV: number | MutableVec3, y?: number, z?: number): void {
    const newLoc = new Vec3();
    if (typeof xOrV === "number") {
      newLoc.set(xOrV, y!, z!);
    } else {
      newLoc.set(xOrV);
    }
    switch (this.controlMode) {
      case "interpolated":
        if (this.interpolation) // 絶対trueのはず
          this.interpolation.setLocationNow(this,newLoc);
        break;
      case "physics":
        if (this.physics) // 絶対trueのはず
          this.physics.setLocationNow(newLoc);
        break;
      default:
        // "manual","user"の時は下の処理だけで十分
        break;
    }
    this.location.set(newLoc);
    this.object.position.set(newLoc.x,newLoc.y,newLoc.z);
  }




  get quat(): Quat {
    return this._quat;
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
        this.quat.set(newQuat);
        this.object.quaternion.set(newQuat.x,newQuat.y,newQuat.z,newQuat.w);
        break;
    }
  }

  setQuatNow(x: number, y: number, z: number, w: number): void;
  setQuatNow(q: MutableQuat): void;
  setQuatNow(xOrQ: number | MutableQuat, y?: number, z?: number, w?: number): void {
    const newQuat = new Quat();
    if (typeof xOrQ === "number") {
      newQuat.set(xOrQ, y!, z!, w!);
    } else {
      newQuat.set(xOrQ);
    }
    switch (this.controlMode) {
      case "interpolated":
        if (this.interpolation) // 絶対trueのはず
          this.interpolation.setQuatNow(this,newQuat);
        break;
      case "physics":
        if (this.physics) // 絶対trueのはず
          this.physics.setQuatNow(newQuat);
        break;
      default:
        // "manual","user"の時は下の処理だけで十分
        break;
    }
    this.quat.set(newQuat);
    this.object.quaternion.set(newQuat.x,newQuat.y,newQuat.z,newQuat.w);
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

  setScaleNow(x: number, y: number, z: number): void;
  setScaleNow(v: MutableVec3): void;
  setScaleNow(xOrV: number | MutableVec3, y?: number, z?: number): void {
    const newScale = new Vec3();
    if (typeof xOrV === "number") {
      newScale.set(xOrV, y!, z!);
    } else {
      newScale.set(xOrV);
    }
    switch (this.controlMode) {
      case "interpolated":
        if (this.interpolation) // 絶対trueのはず
          this.interpolation.setScaleNow(this,newScale);
        break;
      case "physics":
        if (this.physics) // 絶対trueのはず
          this.physics.setScaleNow(newScale); // 普通の物理エンジンは対応させる？
        break;
      default:
        // "manual","user"の時は下の処理だけで十分
        break;
    }
    this.scale.set(newScale);
    this.object.scale.set(newScale.x,newScale.y,newScale.z);
  }

  /**
   * オイラー角で回転を設定。単位はラジアンではなくデグリー
   * (360度で1回転)とする。回転の合成の順番はthis.rotationOrderの
   * 設定によるが、それがnullの時はObject3D.defaultRotationOrderの
   * 順番になる。
   */
  setRotation(x: number, y: number, z: number): void;
  setRotation(v: MutableVec3): void;
  setRotation(xOrV: number | MutableVec3, y?: number, z?: number): void {
    const rot = new Vec3();
    if (typeof xOrV === "number")
      rot.set(xOrV, y!, z!);
    else
      rot.set(xOrV);
    rot.scale(Math.PI/360); // デグリー to ラジアン & t to t/2
    const order = this.rotationOrder ? this.rotationOrder : ObjectA3.defaultRotationOrder;
    const quat = vec3EulerToQuat(rot,order);
    this.setQuat(quat);
  }

  setRotationNow(x: number, y: number, z: number): void;
  setRotationNow(v: MutableVec3): void;
  setRotationNow(xOrV: number | MutableVec3, y?: number, z?: number): void {
    const rot = new Vec3();
    if (typeof xOrV === "number")
      rot.set(xOrV, y!, z!);
    else
      rot.set(xOrV);
    const order = this.rotationOrder ? this.rotationOrder : ObjectA3.defaultRotationOrder;
    const quat = new Quat(0,0,0,1);
    for (let i=0;i<3;i++) {
      const c = order.charAt(i);
      switch(c) {
        case 'X':
          quat.mul(new Quat(Math.sin(rot.x),0,0,Math.cos(rot.x)))
          break;
        case 'Y':
          quat.mul(new Quat(0,Math.sin(rot.y),0,Math.cos(rot.y)))
          break;
        case 'Z':
          quat.mul(new Quat(0,0,Math.sin(rot.z),Math.cos(rot.z)))
          break;
      }
    }
    this.setQuatNow(quat);
  }

  lookAt(x: number, y: number, z: number): void;
  lookAt(v: MutableVec3): void;
  lookAt(o: ObjectA3): void;
  lookAt(xVO: number | MutableVec3 | ObjectA3, y?: number, z?: number) {
    const target = new Vec3();
    if (typeof xVO === "number") {
      target.set(xVO,y!,z!);
    } else if (xVO instanceof ObjectA3) {
      target.set(xVO.location);
    } else {
      target.set(xVO);
    }
    const up = this.upVector ? this.upVector : ObjectA3.defaultUpVector;
    const newQuat = getQuatOfLookAt(this.location,target,up);
    this.setQuat(newQuat);
  }

  lookAtNow(x: number, y: number, z: number): void;
  lookAtNow(v: MutableVec3): void;
  lookAtNow(o: ObjectA3): void;
  lookAtNow(xVO: number | MutableVec3 | ObjectA3, y?: number, z?: number) {
    const target = new Vec3();
    if (typeof xVO === "number") {
      target.set(xVO,y!,z!);
    } else if (xVO instanceof ObjectA3) {
      target.set(xVO.location);
    } else {
      target.set(xVO);
    }
    const up = this.upVector ? this.upVector : ObjectA3.defaultUpVector;
    const newQuat = getQuatOfLookAt(this.location,target,up);
    this.setQuatNow(newQuat);
  }

  getUnitVecX(): Vec3 {
    const vecX = new Vec3(1,0,0);
    return vecX.apply(this.quat);
  }
  getUnitVecY(): Vec3 {
    const vecY = new Vec3(0,1,0);
    return vecY.apply(this.quat);
  }
  getUnitVecZ(): Vec3 {
    const vecZ = new Vec3(0,0,1);
    return vecZ.apply(this.quat);
  }

  /**
   * このObjectA3が引数で与えられたTHREE.Object3Dを含んでいるか
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
 * 吹き出しの情報。必要な時だけObjectA3に
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
 * 必要な時だけObjectA3に追加される。
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

  constructor(obj: ObjectA3) {
    this.firstLoc = new Vec3(obj.location);
    this.firstRot = new Quat(obj.quat);
    this.firstScale = new Vec3(obj.scale);
    this.nowLoc = new Vec3(obj.location);
    this.nowRot = new Quat(obj.quat);
    this.nowScale = new Vec3(obj.scale);
    this.lastLoc = new Vec3(obj.location);
    this.lastRot = new Quat(obj.quat);
    this.lastScale = new Vec3(obj.scale);
    this.nowTime = 0;
    this.duration = 1;
  }

  setLocation(obj: ObjectA3, newLoc: MutableVec3) {
    this.firstLoc.set(obj.location);
    this.firstRot.set(obj.quat);
    this.firstScale.set(obj.scale);
    this.lastLoc.set(newLoc);
    //this.lastRot.set(obj.rot);
    //this.lastScale.set(obj.scale);
    this.nowTime = 0;
  }

  setLocationNow(obj: ObjectA3, newLoc: MutableVec3) {
    this.firstLoc.set(obj.location);
    this.firstRot.set(obj.quat);
    this.firstScale.set(obj.scale);
    this.lastLoc.set(newLoc);
    //this.lastRot.set(obj.rot);
    //this.lastScale.set(obj.scale);
    this.nowTime = 1;
  }

  setQuat(obj: ObjectA3, newQuat: MutableQuat) {
    this.firstLoc.set(obj.location);
    this.firstRot.set(obj.quat);
    this.firstScale.set(obj.scale);
    //this.lastLoc.set(obj.loc);
    this.lastRot.set(newQuat);
    //this.lastScale.set(obj.scale);
    this.nowTime = 0;
  }

  setQuatNow(obj: ObjectA3, newQuat: MutableQuat) {
    this.firstLoc.set(obj.location);
    this.firstRot.set(obj.quat);
    this.firstScale.set(obj.scale);
    //this.lastLoc.set(obj.loc);
    this.lastRot.set(newQuat);
    //this.lastScale.set(obj.scale);
    this.nowTime = 1;
  }

  setScale(obj: ObjectA3, newScale: MutableVec3) {
    this.firstLoc.set(obj.location);
    this.firstRot.set(obj.quat);
    this.firstScale.set(obj.scale);
    //this.lastLoc.set(obj.loc);
    //this.lastRot.set(obj.rot);
    this.lastScale.set(newScale);
    this.nowTime = 0;
  }

  setScaleNow(obj: ObjectA3, newScale: MutableVec3) {
    this.firstLoc.set(obj.location);
    this.firstRot.set(obj.quat);
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

  interpolate(obj: ObjectA3, dt: number) {
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
    obj.quat.set(this.nowRot);
    obj.object.quaternion.set(this.nowRot.x,this.nowRot.y,this.nowRot.z,this.nowRot.w);
    obj.scale.set(this.nowScale);
    obj.object.scale.set(this.nowScale.x,this.nowScale.y,this.nowScale.z);
  }
}

