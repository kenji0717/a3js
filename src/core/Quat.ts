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
        console.log("Quat.slerp(); ???!");
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
