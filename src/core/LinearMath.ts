import * as THREE from 'three';
import { ObjectA3 } from './ObjectA3';

export interface MutableVec3 {
    x: number;
    y: number;
    z: number;
}

type Arg1Vec3 = number | Vec3 | MutableVec3;

export interface MutableQuat {
    x: number;
    y: number;
    z: number;
    w: number;
}

type Arg1Quat = number | Quat | MutableQuat;

/**
 * 3次元ベクトル
 */
export class Vec3 {
  private _x: number;
  private _y: number;
  private _z: number;

  get x() { return this._x; }
  get y() { return this._y; }
  get z() { return this._z; }

  constructor();
  constructor(v: Vec3);
  constructor(v: MutableVec3);
  constructor(x: number,y: number,z: number)
  constructor(xOrV?: Arg1Vec3, y?: number, z?: number) {
    if (typeof xOrV === "number") {
      this._x = xOrV;
      this._y = y!;
      this._z = z!;
    } else if (typeof xOrV === "undefined") {
      this._x = this._y = this._z = 0;
    } else {
      this._x = xOrV.x;
      this._y = xOrV.y;
      this._z = xOrV.z;
    }
  }

  clone() {
    return new Vec3(this);
  }

  write(q: MutableVec3) {
    q.x = this._x;
    q.y = this._y;
    q.z = this._z;
  }

  normalize() {
    const l0 = this._x*this._x + this._y*this._y + this._z*this._z;
    const l1 = Math.sqrt(l0);
    if (l1 !== 0) {
      this._x /= l1;
      this._y /= l1;
      this._z /= l1;
    } else {
      console.warn(`Vec3.normalize.`);
    }
    return this;
  }

  negate() {
    this._x *= -1;
    this._y *= -1;
    this._z *= -1;
    return this;
  }

  length() {
    return Math.sqrt(this._x*this._x + this._y*this._y + this._z*this._z);
  }

  set(v: Vec3): Vec3;
  set(v: MutableVec3): Vec3;
  set(x: number, y: number, z: number): Vec3;
  set(xOrVV: Arg1Vec3, y?: number, z?: number): Vec3 {
    if (typeof xOrVV === "number") {
      this._x = xOrVV;
      this._y = y!;
      this._z = z!;
    } else {
      this._x = xOrVV.x;
      this._y = xOrVV.y;
      this._z = xOrVV.z;
    }
    return this;
  }

  add(v: Vec3): Vec3;
  add(v: MutableVec3): Vec3;
  add(x: number, y: number, z: number): Vec3;
  add(xOrV: Arg1Vec3, y?: number, z?: number) {
    if (typeof xOrV === "number") {
      this._x += xOrV;
      this._y += y!;
      this._z += z!;
    } else {
      this._x += xOrV.x;
      this._y += xOrV.y;
      this._z += xOrV.z;
    }
    return this;
  }
  
  sub(v: Vec3): Vec3;
  sub(v: MutableVec3): Vec3;
  sub(x: number, y: number, z: number): Vec3;
  sub(xOrV: Arg1Vec3, y?: number, z?: number) {
    if (typeof xOrV === "number") {
      this._x -= xOrV;
      this._y -= y!;
      this._z -= z!;
    } else {
      this._x -= xOrV.x;
      this._y -= xOrV.y;
      this._z -= xOrV.z;
    }
    return this;
  }

  scale(s: number) {
    this._x *= s;
    this._y *= s;
    this._z *= s;
    return this;
  }

  // 自分自身ん引数に与えるとダメな実装
  cross(v1: Vec3, v2: Vec3) {
    this._x = v1.y*v2.z - v1.z*v2.y;
    this._y = v1.z*v2.x - v1.x*v2.z;
    this._z = v1.x*v2.y - v1.y*v2.x;
    return this;
  }

  apply(q: Quat): Vec3;
  apply(q: MutableQuat): Vec3;
  apply(x: number, y: number, z: number, w: number): Vec3;
  apply(xOrQ: Arg1Quat, argY?: number, argZ?: number, argW?: number): Vec3 {
    const q = new Quat();
    if (typeof xOrQ === "number")
      q.set(xOrQ,argY!,argZ!,argW!);
    else
      q.set(xOrQ);

    const v = new Quat(this._x,this._y,this._z,0);
    const q_inv = new Quat(q).conjugate();

    q.mul(v).mul(q_inv);

    this._x = q.x;
    this._y = q.y;
    this._z = q.z;

    return this;
  }

  // 線形補間
  lerp(v1: Vec3, v2: Vec3, t: number) {
    this._x = (1-t)*v1.x + t*v2.x;
    this._y = (1-t)*v1.y + t*v2.y;
    this._z = (1-t)*v1.z + t*v2.z;
  }
}


// ################################################################

/**
 * オイラー角(ラジアン)を四元数に変換する時に、軸の回転順番を
 * 指定するための型。
 */
export type RotationOrder = "XYZ" | "XZY" | "YXZ" | "YZX" | "ZXY" | "ZYX";

/**
 * 四元数
 */
export class Quat {
  private _x: number;
  private _y: number;
  private _z: number;
  private _w: number;

  get x() { return this._x; }
  get y() { return this._y; }
  get z() { return this._z; }
  get w() { return this._w; }

  constructor();
  constructor(q: Quat);
  constructor(q: MutableQuat);
  constructor(x: number, y: number, z: number, w: number);
  constructor(xOrQQ?: Arg1Quat, y?: number, z?: number, w?: number) {
    if (typeof xOrQQ === "number") {
      this._x = xOrQQ;
      this._y = y!;
      this._z = z!;
      this._w = w!;
    } else if (typeof xOrQQ === "undefined") {
      this._x = this._y = this._z = 0;
      this._w = 1;
    } else {
      this._x = xOrQQ.x;
      this._y = xOrQQ.y;
      this._z = xOrQQ.z;
      this._w = xOrQQ.w;
    }
  }

  clone() {
    return new Quat(this);
  }

  write(q: MutableQuat) {
    q.x = this._x;
    q.y = this._y;
    q.z = this._z;
    q.w = this._w;
  }

  normalize() {
    const l0 = this._x*this._x + this._y*this._y + this._z*this._z + this._w*this._w;
    const l1 = Math.sqrt(l0);
    if (l1 !== 0) {
      this._x /= l1;
      this._y /= l1;
      this._z /= l1;
      this._w /= l1;
    } else {
      console.warn(`Quat.normalize.`);
    }
    return this;
  }

  conjugate() {
    this._x *= -1;
    this._y *= -1;
    this._z *= -1;
    // wはそのまま
    return this;
  }

  set(q: Quat): Quat;
  set(q: MutableQuat): Quat;
  set(x: number, y: number, z: number, w: number): Quat;
  set(xOrQ: Arg1Quat, y?: number, z?: number, w?: number): Quat {
    if (typeof xOrQ === "number") {
      this._x = xOrQ;
      this._y = y!;
      this._z = z!;
      this._w = w!;
    } else {
      this._x = xOrQ.x;
      this._y = xOrQ.y;
      this._z = xOrQ.z;
      this._w = xOrQ.w;
    }
    return this;
  }

  mul(q: Quat): Quat;
  mul(q: MutableQuat): Quat;
  mul(x: number, y: number, z: number, w: number): Quat;
  mul(xOrQ: Arg1Quat, y?: number, z?: number, w?: number): Quat {
    const q1 = new Quat(this);
    const q2 = new Quat();
    if (typeof xOrQ === "number")
      q2.set(xOrQ, y!, z!, w!);
    else
      q2.set(xOrQ);

    this._x = q1.w*q2.x + q1.x*q2.w + q1.y*q2.z - q1.z*q2.y;
    this._y = q1.w*q2.y - q1.x*q2.z + q1.y*q2.w + q1.z*q2.x;
    this._z = q1.w*q2.z + q1.x*q2.y - q1.y*q2.x + q1.z*q2.w;
    this._w = q1.w*q2.w - q1.x*q2.x - q1.y*q2.y - q1.z*q2.z;

    return this;
  }

  // 線形補間
  // 引数のq1が自分自身という場合でも使える
  lerp(q1: Quat, q2: Quat, t: number) {
    this._x = (1-t)*q1.x + t*q2.x;
    this._y = (1-t)*q1.y + t*q2.y;
    this._z = (1-t)*q1.z + t*q2.z;
    this._w = (1-t)*q1.w + t*q2.w;
  }

  // 球面線形補間
  // 引数のq1が自分自身という場合でも使えるはず
  slerp(q1: Quat, q2: Quat, t: number) {
    if (t<0 || t>1) {
      console.warn('Quat.slerp(): t must be in [0,1]');
      return;
    }
    const cosR =
      q1.x * q2.x
      + q1.y * q2.y
      + q1.z * q2.z
      + q1.w * q2.w;
    if (cosR < 0.9995) {
      const tt = Math.acos(cosR);
      const w1 = Math.sin((1-t)*tt) / Math.sin(tt);
      const w2 = Math.sin(t*tt) / Math.sin(tt);
      this._x = w1*q1.x + w2*q2.x;
      this._y = w1*q1.y + w2*q2.y;
      this._z = w1*q1.z + w2*q2.z;
      this._w = w1*q1.w + w2*q2.w;
    } else {
      
      this._x = (1-t)*q1.x + t*q2.x;
      this._y = (1-t)*q1.y + t*q2.y;
      this._z = (1-t)*q1.z + t*q2.z;
      this._w = (1-t)*q1.w + t*q2.w;
      const s = Math.sqrt(
        this._x * this._x
        + this._y * this._y
        + this._z * this._z
        + this._w * this._w
      );
      if (s<0.0001) { // かなりダメな時
        console.warn("Quat.slerp(); ???!");
        this._x = q1.x;
        this._y = q1.y;
        this._z = q1.z;
        this._w = q1.w;
      } else {
        this._x *= 1/s;
        this._y *= 1/s;
        this._z *= 1/s;
        this._w *= 1/s;
      }
    }
  }
}

/**
 * 自分(me)が対象(target)の方を向くための四元数を計算で出します。
 * 3つ目の引数に上方向ベクトル(up)も与えて下さい。glTFのモデルを
 * 基準にしたいので、これにあわせてZ軸の正の方向を自分の前方向と
 * 考えて、これを対象に向ける回転を計算する。
 *
 * 直接、ここの計算とは関係ないがカメラだけはZ軸の負の方向を
 * 前としなければならないので、a3.Camera.lookAt()は
 * a3.ObjectA3.lookAt()をオーバーライドすることで反対方向を向く
 * ようにしている。
 */
export function getQuatOfLookAt(me: Vec3,target: Vec3,up: Vec3) {
  up.normalize();
  const forward = me.clone().sub(target).normalize();
  const right = new Vec3().cross(forward,up).normalize();
  const trueUp = new Vec3().cross(right, forward);

  const m00 = right.x; const m01 = trueUp.x; const m02 = -forward.x;
  const m10 = right.y; const m11 = trueUp.y; const m12 = -forward.y;
  const m20 = right.z; const m21 = trueUp.z; const m22 = -forward.z;

  const trace = m00 + m11 + m22;
  if (trace > 0) {
    const s = Math.sqrt(trace+1.0)*2.0;
    return new Quat(
      (m21-m12)/s,
      (m02-m20)/s,
      (m10-m01)/s,
      0.25*s
    );
  } else {
    if ((m00>m11) && (m00>m22)) {
      const s = Math.sqrt(1.0+m00-m11-m22) * 2.0;
      return new Quat(
        0.25*s,
        (m01+m10)/s,
        (m02+m20)/s,
        (m21-m12)/s
      );
    } else if (m11>m22) {
      const s = Math.sqrt(1.0+m11-m00-m22) * 2.0;
      return new Quat(
        (m01+m10)/s,
        0.25*s,
        (m12+m21)/s,
        (m02-m20)/s
      );
    } else {
      const s = Math.sqrt(1.0+m22-m00-m11) * 2.0;
      return new Quat(
        (m02+m20)/s,
        (m12+m21)/s,
        0.25*s,
        (m10-m01)/s
      );
    }
  }
}


/**
 * オイラー角(ラジアン)を四元数に変換する関数、2番目の引数は
 * 軸の回転順番を指定するRotationOrder。
 */
export function vec3EulerToQuat(rot: Vec3, order: RotationOrder = "XYZ" ): Quat {
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
  return quat;
}

// ###################################################################

export class Transform {
  loc: Vec3;
  quat: Quat;
  scale: Vec3;

  constructor() {
    this.loc = new Vec3();
    this.quat = new Quat();
    this.scale = new Vec3(1,1,1);
  }

  set(trans: Transform): Transform;
  set(obj: ObjectA3): Transform;
  set(tOrO: Transform | ObjectA3) {
    if (tOrO instanceof Transform) {
      this.loc.set(tOrO.loc);
      this.quat.set(tOrO.quat);
      this.scale.set(tOrO.scale);
    } else {
      const t = tOrO.trans;
      this.loc.set(t.loc);
      this.quat.set(t.quat);
      this.scale.set(t.scale);
    }
    return this;
  }

  write(objectA3: ObjectA3): void;
  write(object3D: THREE.Object3D): void;
  write(obj: ObjectA3 | THREE.Object3D): void {
    if (obj instanceof ObjectA3) {
      obj.object.position.set(this.loc.x,this.loc.y,this.loc.z);
      obj.object.quaternion.set(this.quat.x,this.quat.y,this.quat.z,this.quat.w);
      obj.object.scale.set(this.scale.x,this.scale.y,this.scale.z);
    } else {
      obj.position.set(this.loc.x,this.loc.y,this.loc.z);
      obj.quaternion.set(this.quat.x,this.quat.y,this.quat.z,this.quat.w);
      obj.scale.set(this.scale.x,this.scale.y,this.scale.z);
    }
  }

  blend(trans: Transform, t: number): Transform {
    this.loc.lerp(this.loc,trans.loc,t);
    this.quat.slerp(this.quat,trans.quat,t);
    this.scale.lerp(this.scale,trans.scale,t);
    return this;
  }

  clone(): Transform {
    const t = new Transform();
    t.set(this);
    return t;
  }
}
