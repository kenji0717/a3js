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

  add(v: MutableVec3) {
    this._x += v.x;
    this._y += v.y;
    this._z += v.z;
    return this;
  }

  scale(s: number) {
    this._x *= s;
    this._y *= s;
    this._z *= s;
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

    const xx = q.x * q.x, yy = q.y * q.y, zz = q.z * q.z;
    const xy = q.x * q.y, xz = q.x * q.z, yz = q.y * q.z;
    const wx = q.w * q.x, wy = q.w * q.y, wz = q.w * q.z;

    const x = this._x;
    const y = this._y;
    const z = this._z;

    this._x = (1-2*(yy+zz))*x + 2*(xy-wz)*y + 2*(xz+wy)*z;
    this._y = 2*(xy+wz)*x + (1-2*(xx+zz))*y + 2*(yz-wx)*z;
    this._z = 2*(xz-wy)*x + 2*(yz+wx)*y + (1-2*(xx+yy))*z;

    return this;
  }

  // 線形補間
  lerp(v1: MutableVec3, v2: MutableVec3, t: number) {
    this._x = (1-t)*v1.x + t*v2.x;
    this._y = (1-t)*v1.y + t*v2.y;
    this._z = (1-t)*v1.z + t*v2.z;
  }
}
