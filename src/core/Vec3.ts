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
  public x: number;
  public y: number;
  public z: number;

  constructor(x: number, y: number, z: number) {
    this.x = x;
    this.y = y;
    this.z = z;
  }

  set(x: number, y: number, z: number) {
    this.x = x;
    this.y = y;
    this.z = z;
  }

  add(v: MutableVec3) {
    this.x += v.x;
    this.y += v.y;
    this.z += v.z;
    return this;
  }
}
