
import * as THREE from 'three';
import { Scene } from './Scene';
import { Motion } from './Motion';
import { defaultPhysicsMotionOption } from './Physics';
import type { PhysicsMotionOption } from './Physics';
import { RapierDefaultMotion } from '../rapier/RapierPhysics';
import { Vec3 } from './Vec3';
import type { MutableVec3 } from './Vec3';
import { Quat, getQuatOfLookAt, vec3EulerToQuat } from './Quat';
import type { MutableQuat, RotationOrder } from './Quat';

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
  static defaultUpVector: Vec3 = new Vec3(0,1,0);
  rotationOrder: RotationOrder | null = null;
  upVector: Vec3 | null = null;
  object: THREE.Object3D;
  scene: Scene | null = null;
  private balloon: BalloonInfo | null = null;
  motion: Motion;
  parent: ObjectA3 | null = null;
  children: ObjectA3[] = [];
  clickListener?: (o: ObjectA3)=>void;

  constructor(data?: any) {
    this.object = this.initObject(data);
    this.object.traverse((o)=>{
      o.userData['a3js'] = { objectA3: this };
    });
    this.motion = this.initMotion();
    this.motion.setObject(this);
  }

  // 非同期でないと無理な場合などはとりあえず
  // 空のTHREE.Object3Dだけ返しておいて後で、
  // そのObject3DにaddすればOK。
  abstract initObject(data?: any): THREE.Object3D;

  /**
   * このObjectA3で使用されるMotionを返す。
   * デフォルトではMotionなのだが、
   * このメソッドをオーバーライドすることで
   * Motionを継承した物に変更可能。
   * @param _data コンストラクタから渡された情報
   * @returns このObjectA3で使用されるMotion
   */
  initMotion(_data?: any): Motion {
    return new Motion(this);
  }
  setMotion(motion: Motion) {
    motion.setObject(this);
    this.motion = motion;
  }
  detachMotion(): Motion {
    const newMotion = new Motion(this);
    const oldMotion = this.motion;
    oldMotion.detachObject(this);
    this.motion = newMotion;
    newMotion.setObject(this);
    return oldMotion;
  }
  replaceMotion(newMotion: Motion): Motion {
    const oldMotion = this.motion;
    oldMotion.detachObject(this);
    this.motion = newMotion;
    newMotion.setObject(this);
    return oldMotion;
  }
  controlMotion(...args: string[]) {
    this.motion.controlMotion(...args);
  }
  enableInterpolation(i: boolean) {
    this.motion.enableInterpolation(i);
  }
  initDefaultPhysics(option: PhysicsMotionOption) {
    const opt = {
      ...defaultPhysicsMotionOption,
      ...option
    };
    this.motion = new RapierDefaultMotion(this,opt);
    this.motion.setObject(this);
  }

  update(dt: number) {
    this.motion.update(dt);
    this.children.forEach((child)=>{
      child.update(dt);
    });
  }

  add(obj: ObjectA3) {
    if (obj.scene) {console.warn('ObjectA3.add(obj) is ignored.');return;}
    if (obj.parent) {console.warn('ObjectA3.add(obj) is ignored.');return;}
    // if (this.children.includes(obj)) return; // ちゃんと管理されてれば必要ない
    this.children.push(obj);
    obj.parent = this;
    this.object.add(obj.object);
  }

  remove(obj: ObjectA3) {
    if (obj.parent !== this) {console.warn('ObjectA3.remove(obj) is ignored.');return;}
    // if (!this.children.includes(obj)) return; // ちゃんと管理されてれば必要ない
    const idx = this.children.indexOf(obj);
    this.children.splice(idx,1);
    obj.parent = null;
    this.object.remove(obj.object);
  }

  setBalloon(message: string) {
    if (!this.balloon)
      this.balloon = new BalloonInfo(message);
    else
      this.balloon.message = message;
  }

  /**
   * リスナーは1個しか登録されません。2つ
   * 登録しようとすると、最初のリスナーは
   * 捨てられます。
   */
  setClickListener(func: (o: ObjectA3)=>void) {
    this.clickListener = func;
  }

  /**
   * 物理エンジンにより衝突が検知されたら呼び出される。
   * @param obj 衝突相手
   * @param started 衝突開始の時true、衝突終了の時false
   * @param myPartNo ぶつかったパーツのColliderの番号
   * @param yourPartNo 相手のぶつかったパーツのClliderの番号
   */
  handleCollision(obj: ObjectA3, started: boolean, myPartNo: number, yourPartNo: number) {
    obj; started; myPartNo; yourPartNo;
  }

  async clicked() {
    if (this.clickListener)
      await this.clickListener(this);
  }

  get locX(): number { return this.object.position.x; }
  get locY(): number { return this.object.position.y; }
  get locZ(): number { return this.object.position.z; }
  setLocation(x: number, y: number, z: number): void;
  setLocation(v: MutableVec3): void;
  setLocation(xOrV: number | MutableVec3, y?: number, z?: number): void {
    const newLoc = new Vec3();
    if (typeof xOrV === "number") {
      newLoc.set(xOrV, y!, z!);
    } else {
      newLoc.set(xOrV);
    }
    this.motion.setLocation(newLoc);
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
    this.motion.setLocationNow(newLoc);
    this.object.position.set(newLoc.x,newLoc.y,newLoc.z);
  }




  get quatX(): number { return this.object.quaternion.x; }
  get quatY(): number { return this.object.quaternion.y; }
  get quatZ(): number { return this.object.quaternion.z; }
  get quatW(): number { return this.object.quaternion.w; }
  setQuat(x: number, y: number, z: number, w: number): void;
  setQuat(q: MutableQuat): void;
  setQuat(xOrQ: number | MutableQuat, y?: number, z?: number, w?: number): void {
    const newQuat = new Quat();
    if (typeof xOrQ === "number") {
      newQuat.set(xOrQ, y!, z!, w!);
    } else {
      newQuat.set(xOrQ);
    }
    this.motion.setQuat(newQuat);
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
    this.motion.setQuatNow(newQuat);
  }

  get scaleX(): number { return this.object.scale.x; }
  get scaleY(): number { return this.object.scale.y; }
  get scaleZ(): number { return this.object.scale.z; }
  setScale(x: number, y: number, z: number): void;
  setScale(v: MutableVec3): void;
  setScale(xOrV: number | MutableVec3, y?: number, z?: number): void {
    const newScale = new Vec3();
    if (typeof xOrV === "number") {
      newScale.set(xOrV, y!, z!);
    } else {
      newScale.set(xOrV);
    }
    this.motion.setScale(newScale);
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
    this.motion.setScaleNow(newScale);
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
      target.set(xVO.locX,xVO.locY,xVO.locZ);
    } else {
      target.set(xVO);
    }
    const up = this.upVector ? this.upVector : ObjectA3.defaultUpVector;
    const newQuat = getQuatOfLookAt(new Vec3(this.object.position),target,up);
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
      target.set(xVO.locX,xVO.locY,xVO.locZ);
    } else {
      target.set(xVO);
    }
    const up = this.upVector ? this.upVector : ObjectA3.defaultUpVector;
    const newQuat = getQuatOfLookAt(new Vec3(this.object.position),target,up);
    this.setQuatNow(newQuat);
  }

  getUnitVecX(): Vec3 {
    const vecX = new Vec3(1,0,0);
    return vecX.apply(this.object.quaternion);
  }
  getUnitVecY(): Vec3 {
    const vecY = new Vec3(0,1,0);
    return vecY.apply(this.object.quaternion);
  }
  getUnitVecZ(): Vec3 {
    const vecZ = new Vec3(0,0,1);
    return vecZ.apply(this.object.quaternion);
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
