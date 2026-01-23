import { Vec3 } from './Vec3';

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
    this._w = (1-t)*q1.z + t*q2.w;
  }

  // 球面線形補間
  slerp(q1: MutableQuat, q2: MutableQuat, t: number) {
    if (t<0 || t>1) {
      console.log('Quat.slerp(): t must be in [0,1]');
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
  const right = new Vec3().cross(up,forward).normalize();
  const trueUp = new Vec3().cross(forward, right);
  const back = new Vec3(forward).negate();

  const m00 = right.x; const m01 = trueUp.x; const m02 = back.x;
  const m10 = right.y; const m11 = trueUp.x; const m12 = back.x;
  const m20 = right.z; const m21 = trueUp.x; const m22 = back.x;

  const trace = m00 + m11 + m22;
  if (trace > 0) {
    const s = 2*Math.sqrt(trace+1);
    return new Quat(
      (m21-m12)/s,
      (m02-m20)/s,
      (m10-m01)/s,
      s/4
    );
  } else {
    const max = Math.max(m00,m11,m22);
    if (max===m00) {
      const s = 2*Math.sqrt(1+m00-m11-m22);
      return new Quat(
        s/4,
        (m01+m10)/s,
        (m02+m20)/s,
        s/4
      );
    } else if (max===m11) {
      const s = 2*Math.sqrt(1+m11-m00-m22);
      return new Quat(
        (m01+m10)/s,
        s/4,
        (m12+m21)/s,
        (m02-m20)/s
      );
    } else {
      const s = 2*Math.sqrt(1+m22-m00-m11);
      return new Quat(
        (m02+m20)/s,
        (m12+m21)/s,
        s/4,
        (m10-m01)/s
      );
    }
  }
}
