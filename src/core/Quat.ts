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

  constructor(x: number, y: number, z: number, w: number) {
    this._x = x;
    this._y = y;
    this._z = z;
    this._w = w;
  }

  set(x: number, y: number, z: number, w: number) {
    this._x = x;
    this._y = y;
    this._z = z;
    this._w = w;
  }
}
