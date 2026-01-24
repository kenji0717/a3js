import { Vec3 } from './Vec3';

/**
 * オイラー角(ラジアン)を四元数に変換する時に、軸の回転順番を
 * 指定するための型。
 */
export type RotationOrder = "XYZ" | "XZY" | "YXZ" | "YZX" | "ZXY" | "ZYX";

/**
 * Readonlyな四元数のインタフェース。
 * a3.QuatもTHREE.QuaternionもRapierの{x,y,z,w}にも
 * あてはめられる型。
 */
export interface MutableQuat {
  readonly x: number;
  readonly y: number;
  readonly z: number;
  readonly w: number;
}

/**
 * 四元数
 */
export class Quat implements MutableQuat {
  private _x: number;
  private _y: number;
  private _z: number;
  private _w: number;

  get x() { return this._x; }
  get y() { return this._y; }
  get z() { return this._z; }
  get w() { return this._w; }

  constructor();
  constructor(q: MutableQuat);
  constructor(x: number, y: number, z: number, w: number);
  constructor(xOrQ?: undefined | MutableQuat | number, y?: number, z?: number, w?: number) {
    if (typeof xOrQ === "number") {
      this._x = xOrQ;
      this._y = y!;
      this._z = z!;
      this._w = w!;
    } else if (typeof xOrQ === "undefined") {
      this._x = this._y = this._z = 0;
      this._w = 1;
    } else {
      this._x = xOrQ.x;
      this._y = xOrQ.y;
      this._z = xOrQ.z;
      this._w = xOrQ.w;
    }
  }

  clone() {
    return new Quat(this);
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

  set(q: MutableQuat): Quat;
  set(x: number, y: number, z: number, w: number): Quat;
  set(xOrQ: MutableQuat | number, y?: number, z?: number, w?: number): Quat {
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

  mul(x: number, y: number, z: number, w: number): Quat;
  mul(q: MutableQuat): Quat;
  mul(xOrQ: number | MutableQuat, y?: number, z?: number, w?: number): Quat {
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
  lerp(q1: MutableQuat, q2: MutableQuat, t: number) {
    this._x = (1-t)*q1.x + t*q2.x;
    this._y = (1-t)*q1.y + t*q2.y;
    this._z = (1-t)*q1.z + t*q2.z;
    this._w = (1-t)*q1.w + t*q2.w;
  }

  // 球面線形補間
  slerp(q1: MutableQuat, q2: MutableQuat, t: number) {
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

export function getQuatOfLookAt(camera: Vec3,target: Vec3,up: Vec3) {
  up.normalize();
  const forward = target.clone().sub(camera).normalize();
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
