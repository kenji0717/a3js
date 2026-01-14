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

  constructor(x: number, y: number, z: number) {
    this._x = x;
    this._y = y;
    this._z = z;
  }

  set(x: number, y: number, z: number) {
    this._x = x;
    this._y = y;
    this._z = z;
  }

  add(v: MutableVec3) {
    this._x += v.x;
    this._y += v.y;
    this._z += v.z;
    return this;
  }
}
