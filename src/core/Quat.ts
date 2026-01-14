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
  public x: number;
  public y: number;
  public z: number;
  public w: number;

  constructor(x: number, y: number, z: number, w: number) {
    this.x = x;
    this.y = y;
    this.z = z;
    this.w = w;
  }

  set(x: number, y: number, z: number, w: number) {
    this.x = x;
    this.y = y;
    this.z = z;
    this.w = w;
  }
}
