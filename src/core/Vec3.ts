import { Quat } from './Quat';

/**
 * Readonlyな3次元ベクトルのインタフェース。
 * a3.Vec3もTHREE.Vector3もRapierの{x,y,z}にも
 * あてはめられる型。
 */
export interface MutableVec3 {
  readonly x: number;
  readonly y: number;
  readonly z: number;
}

/**
 * 3次元ベクトル
 */
export class Vec3 implements MutableVec3 {
  private _x: number;
  private _y: number;
  private _z: number;

  get x() { return this._x; }
  get y() { return this._y; }
  get z() { return this._z; }

  constructor();
  constructor(v: MutableVec3);
  constructor(x: number,y: number,z: number)
  constructor(xOrV?: undefined | MutableVec3 | number, y?: number, z?: number) {
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

  set(v: MutableVec3): Vec3;
  set(x: number, y: number, z: number): Vec3;
  set(xOrV: MutableVec3 | number, y?: number, z?: number): Vec3 {
    if (typeof xOrV === "number") {
      this._x = xOrV;
      this._y = y!;
      this._z = z!;
    } else {
      this._x = xOrV.x;
      this._y = xOrV.y;
      this._z = xOrV.z;
    }
    return this;
  }

  add(x: number, y: number, z: number): Vec3;
  add(v: MutableVec3): Vec3;
  add(xOrV: number | MutableVec3, y?: number, z?: number) {
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
  
  sub(x: number, y: number, z: number): Vec3;
  sub(v: MutableVec3): Vec3;
  sub(xOrV: number | MutableVec3, y?: number, z?: number) {
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
  cross(v1: MutableVec3, v2: MutableVec3) {
    this._x = v1.y*v2.z - v1.z*v2.y;
    this._y = v1.z*v2.x - v1.x*v2.z;
    this._z = v1.x*v2.y - v1.y*v2.x;
    return this;
  }

  apply(x: number, y: number, z: number, w: number): Vec3;
  apply(q: Quat): Vec3;
  apply(xOrQ: number | Quat, argY?: number, argZ?: number, argW?: number): Vec3 {
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
  lerp(v1: MutableVec3, v2: MutableVec3, t: number) {
    this._x = (1-t)*v1.x + t*v2.x;
    this._y = (1-t)*v1.y + t*v2.y;
    this._z = (1-t)*v1.z + t*v2.z;
  }
}
