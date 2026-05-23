import * as THREE from 'three';
import { ObjectA3 } from './ObjectA3';

/**
 * x, y, z の3成分を持つ可変オブジェクトのインターフェースです。
 * `THREE.Vector3` など、x/y/z プロパティを持つオブジェクトはこのインターフェースを満たします。
 */
export interface MutableVec3 {
    x: number;
    y: number;
    z: number;
}

type Arg1Vec3 = number | Vec3 | MutableVec3;

/**
 * x, y, z, w の4成分を持つ可変オブジェクトのインターフェースです。
 * `THREE.Quaternion` など、x/y/z/w プロパティを持つオブジェクトはこのインターフェースを満たします。
 */
export interface MutableQuat {
    x: number;
    y: number;
    z: number;
    w: number;
}

type Arg1Quat = number | Quat | MutableQuat;

/**
 * 3次元ベクトルを表すクラスです。
 *
 * 3D 空間上の位置・方向・速度などを x, y, z の3成分で表現します。
 * `add()`・`sub()`・`scale()` など基本的な演算メソッドを持ちます。
 *
 * @example
 * ```ts
 * // 成分を直接指定して作成
 * const v = new Vec3(1, 2, 3);
 *
 * // 別のベクトルをコピーして作成
 * const v2 = new Vec3(v);
 *
 * // 足し算
 * v.add(v2);
 * ```
 */
export class Vec3 {
  x = 0;
  y = 0;
  z = 0;

  constructor();
  constructor(v: Vec3);
  constructor(v: MutableVec3);
  constructor(x: number,y: number,z: number)
  constructor(xOrV?: Arg1Vec3, y?: number, z?: number) {
    if (typeof xOrV === "number") {
      this.x = xOrV;
      this.y = y!;
      this.z = z!;
    } else if (typeof xOrV === "undefined") {
      this.x = this.y = this.z = 0;
    } else {
      this.x = xOrV.x;
      this.y = xOrV.y;
      this.z = xOrV.z;
    }
  }

  /**
   * このベクトルのコピーを新しい `Vec3` インスタンスとして返します。
   * @returns コピーされた新しい `Vec3`
   */
  clone() {
    return new Vec3(this);
  }

  /**
   * このベクトルの値を `MutableVec3` を実装したオブジェクト（例: `THREE.Vector3`）に書き込みます。
   * @param q 書き込み先のオブジェクト
   */
  write(q: MutableVec3) {
    q.x = this.x;
    q.y = this.y;
    q.z = this.z;
  }

  /**
   * このベクトルを正規化します（長さを1にします）。
   * ゼロベクトルを正規化しようとした場合はコンソールに警告を出します。
   * @returns `this`（メソッドチェーン用）
   */
  normalize() {
    const l0 = this.x*this.x + this.y*this.y + this.z*this.z;
    const l1 = Math.sqrt(l0);
    if (l1 !== 0) {
      this.x /= l1;
      this.y /= l1;
      this.z /= l1;
    } else {
      console.warn(`Vec3.normalize.`);
    }
    return this;
  }

  /**
   * このベクトルの各成分の符号を反転します（x, y, z をそれぞれ -1 倍します）。
   * @returns `this`（メソッドチェーン用）
   */
  negate() {
    this.x *= -1;
    this.y *= -1;
    this.z *= -1;
    return this;
  }

  /**
   * このベクトルの長さ（ユークリッドノルム）を返します。
   * @returns ベクトルの長さ
   */
  length() {
    return Math.sqrt(this.x*this.x + this.y*this.y + this.z*this.z);
  }

  /**
   * このベクトルの値を設定します。
   * @param x x 成分（または `Vec3` / `MutableVec3`）
   * @param y y 成分
   * @param z z 成分
   * @returns `this`（メソッドチェーン用）
   */
  set(v: Vec3): Vec3;
  set(v: MutableVec3): Vec3;
  set(x: number, y: number, z: number): Vec3;
  set(xOrVV: Arg1Vec3, y?: number, z?: number): Vec3 {
    if (typeof xOrVV === "number") {
      this.x = xOrVV;
      this.y = y!;
      this.z = z!;
    } else {
      this.x = xOrVV.x;
      this.y = xOrVV.y;
      this.z = xOrVV.z;
    }
    return this;
  }

  /**
   * 別のベクトルをこのベクトルに加算します（`this += v`）。
   * @param x x 成分（または `Vec3` / `MutableVec3`）
   * @param y y 成分
   * @param z z 成分
   * @returns `this`（メソッドチェーン用）
   */
  add(v: Vec3): Vec3;
  add(v: MutableVec3): Vec3;
  add(x: number, y: number, z: number): Vec3;
  add(xOrV: Arg1Vec3, y?: number, z?: number) {
    if (typeof xOrV === "number") {
      this.x += xOrV;
      this.y += y!;
      this.z += z!;
    } else {
      this.x += xOrV.x;
      this.y += xOrV.y;
      this.z += xOrV.z;
    }
    return this;
  }
  
  /**
   * 別のベクトルをこのベクトルから減算します（`this -= v`）。
   * @param x x 成分（または `Vec3` / `MutableVec3`）
   * @param y y 成分
   * @param z z 成分
   * @returns `this`（メソッドチェーン用）
   */
  sub(v: Vec3): Vec3;
  sub(v: MutableVec3): Vec3;
  sub(x: number, y: number, z: number): Vec3;
  sub(xOrV: Arg1Vec3, y?: number, z?: number) {
    if (typeof xOrV === "number") {
      this.x -= xOrV;
      this.y -= y!;
      this.z -= z!;
    } else {
      this.x -= xOrV.x;
      this.y -= xOrV.y;
      this.z -= xOrV.z;
    }
    return this;
  }

  /**
   * このベクトルをスカラー倍します（`this *= s`）。
   * @param s スケール値
   * @returns `this`（メソッドチェーン用）
   */
  scale(s: number) {
    this.x *= s;
    this.y *= s;
    this.z *= s;
    return this;
  }

  /**
   * `v1` と `v2` の外積を計算し、結果をこのベクトルに設定します。
   *
   * @remarks
   * `v1` または `v2` にこのベクトル自身（`this`）を渡すと結果が不正になります。
   * 自分自身を引数として渡さないでください。
   *
   * @param v1 外積の第1ベクトル
   * @param v2 外積の第2ベクトル
   * @returns `this`（メソッドチェーン用）
   */
  cross(v1: Vec3, v2: Vec3) {
    this.x = v1.y*v2.z - v1.z*v2.y;
    this.y = v1.z*v2.x - v1.x*v2.z;
    this.z = v1.x*v2.y - v1.y*v2.x;
    return this;
  }

  /**
   * クォータニオン `q` による回転をこのベクトルに適用します。
   * 方向ベクトルを回転させる際に使います。
   * @param q 適用するクォータニオン（または x, y, z, w の数値）
   * @returns `this`（メソッドチェーン用）
   */
  apply(q: Quat): Vec3;
  apply(q: MutableQuat): Vec3;
  apply(x: number, y: number, z: number, w: number): Vec3;
  apply(xOrQ: Arg1Quat, argY?: number, argZ?: number, argW?: number): Vec3 {
    let qx: number, qy: number, qz: number, qw: number;
    if (typeof xOrQ === "number") {
      qx = xOrQ; qy = argY!; qz = argZ!; qw = argW!;
    } else {
      qx = xOrQ.x; qy = xOrQ.y; qz = xOrQ.z; qw = xOrQ.w;
    }
    // t = 2 * cross(q.xyz, v)
    const tx = 2 * (qy * this.z - qz * this.y);
    const ty = 2 * (qz * this.x - qx * this.z);
    const tz = 2 * (qx * this.y - qy * this.x);
    this.x += qw * tx + qy * tz - qz * ty;
    this.y += qw * ty + qz * tx - qx * tz;
    this.z += qw * tz + qx * ty - qy * tx;
    return this;
  }

  /**
   * 2つのベクトル `v1` と `v2` を線形補間し、結果をこのベクトルに設定します。
   * `t=0` のとき `v1`、`t=1` のとき `v2` と等しくなります。
   * @param v1 補間の始点
   * @param v2 補間の終点
   * @param t 補間係数（0〜1）
   */
  lerp(v1: Vec3, v2: Vec3, t: number) {
    this.x = (1-t)*v1.x + t*v2.x;
    this.y = (1-t)*v1.y + t*v2.y;
    this.z = (1-t)*v1.z + t*v2.z;
  }
}


// ################################################################

/**
 * オイラー角を四元数に変換するときに、軸の回転順番を
 * 指定するための型です。デフォルトは `"ZXY"` です。
 */
export type RotationOrder = "XYZ" | "XZY" | "YXZ" | "YZX" | "ZXY" | "ZYX";

/**
 * 四元数（クォータニオン）を表すクラスです。
 *
 * 3D 空間における回転を表現するために使います。
 * オイラー角（X, Y, Z 軸まわりの角度）よりも数値的に安定しているため、
 * a3js では回転の内部表現としてこのクラスを使用しています。
 *
 * 通常はこのクラスを直接操作するよりも `ObjectA3.setRotation()` などの
 * 高レベルなメソッドを使うことを推奨します。
 *
 * @example
 * ```ts
 * // 単位クォータニオン（回転なし）を作成
 * const q = new Quat();
 *
 * // 別のクォータニオンをコピーして作成
 * const q2 = new Quat(q);
 * ```
 */
export class Quat {
  x = 0;
  y = 0;
  z = 0;
  w = 1;

  constructor();
  constructor(q: Quat);
  constructor(q: MutableQuat);
  constructor(x: number, y: number, z: number, w: number);
  constructor(xOrQQ?: Arg1Quat, y?: number, z?: number, w?: number) {
    if (typeof xOrQQ === "number") {
      this.x = xOrQQ;
      this.y = y!;
      this.z = z!;
      this.w = w!;
    } else if (typeof xOrQQ === "undefined") {
      this.x = this.y = this.z = 0;
      this.w = 1;
    } else {
      this.x = xOrQQ.x;
      this.y = xOrQQ.y;
      this.z = xOrQQ.z;
      this.w = xOrQQ.w;
    }
  }

  /**
   * このクォータニオンのコピーを新しい `Quat` インスタンスとして返します。
   * @returns コピーされた新しい `Quat`
   */
  clone() {
    return new Quat(this);
  }

  /**
   * このクォータニオンの値を `MutableQuat` を実装したオブジェクト（例: `THREE.Quaternion`）に書き込みます。
   * @param q 書き込み先のオブジェクト
   */
  write(q: MutableQuat) {
    q.x = this.x;
    q.y = this.y;
    q.z = this.z;
    q.w = this.w;
  }

  /**
   * このクォータニオンを正規化します（長さを1にします）。
   * @returns `this`（メソッドチェーン用）
   */
  normalize() {
    const l0 = this.x*this.x + this.y*this.y + this.z*this.z + this.w*this.w;
    const l1 = Math.sqrt(l0);
    if (l1 !== 0) {
      this.x /= l1;
      this.y /= l1;
      this.z /= l1;
      this.w /= l1;
    } else {
      console.warn(`Quat.normalize.`);
    }
    return this;
  }

  /**
   * このクォータニオンの共役を返します（x, y, z 成分の符号を反転します）。
   * 逆回転を表すために使います（正規化されている場合は逆クォータニオンと一致します）。
   * @returns `this`（メソッドチェーン用）
   */
  conjugate() {
    this.x *= -1;
    this.y *= -1;
    this.z *= -1;
    // wはそのまま
    return this;
  }

  /**
   * このクォータニオンの値を設定します。
   * @param x x 成分（または `Quat` / `MutableQuat`）
   * @param y y 成分
   * @param z z 成分
   * @param w w 成分
   * @returns `this`（メソッドチェーン用）
   */
  set(q: Quat): Quat;
  set(q: MutableQuat): Quat;
  set(x: number, y: number, z: number, w: number): Quat;
  set(xOrQ: Arg1Quat, y?: number, z?: number, w?: number): Quat {
    if (typeof xOrQ === "number") {
      this.x = xOrQ;
      this.y = y!;
      this.z = z!;
      this.w = w!;
    } else {
      this.x = xOrQ.x;
      this.y = xOrQ.y;
      this.z = xOrQ.z;
      this.w = xOrQ.w;
    }
    return this;
  }

  /**
   * このクォータニオンに別のクォータニオン `q` を右から掛け合わせます（`this = this * q`）。
   * 回転を合成するために使います。
   * @param q 掛けるクォータニオン（または x, y, z, w の数値）
   * @returns `this`（メソッドチェーン用）
   */
  mul(q: Quat): Quat;
  mul(q: MutableQuat): Quat;
  mul(x: number, y: number, z: number, w: number): Quat;
  mul(xOrQ: Arg1Quat, y?: number, z?: number, w?: number): Quat {
    const ax = this.x, ay = this.y, az = this.z, aw = this.w;
    let bx: number, by: number, bz: number, bw: number;
    if (typeof xOrQ === "number") {
      bx = xOrQ; by = y!; bz = z!; bw = w!;
    } else {
      bx = xOrQ.x; by = xOrQ.y; bz = xOrQ.z; bw = xOrQ.w;
    }
    this.x = aw*bx + ax*bw + ay*bz - az*by;
    this.y = aw*by - ax*bz + ay*bw + az*bx;
    this.z = aw*bz + ax*by - ay*bx + az*bw;
    this.w = aw*bw - ax*bx - ay*by - az*bz;
    return this;
  }

  /**
   * 2つのクォータニオン `q1` と `q2` を線形補間し、結果をこのクォータニオンに設定します。
   * `t=0` のとき `q1`、`t=1` のとき `q2` と等しくなります。
   * `q1` に `this` 自身を渡しても安全です。
   * @param q1 補間の始点
   * @param q2 補間の終点
   * @param t 補間係数（0〜1）
   */
  lerp(q1: Quat, q2: Quat, t: number) {
    this.x = (1-t)*q1.x + t*q2.x;
    this.y = (1-t)*q1.y + t*q2.y;
    this.z = (1-t)*q1.z + t*q2.z;
    this.w = (1-t)*q1.w + t*q2.w;
  }

  /**
   * 2つのクォータニオン `q1` と `q2` を球面線形補間（Slerp）し、結果をこのクォータニオンに設定します。
   * `t=0` のとき `q1`、`t=1` のとき `q2` と等しくなります。
   * `lerp()` より滑らかな回転補間が得られます。`q1` に `this` 自身を渡しても安全です。
   * @param q1 補間の始点
   * @param q2 補間の終点
   * @param t 補間係数（0〜1）
   */
  slerp(q1: Quat, q2: Quat, t: number) {
    if (t<0 || t>1) {
      console.warn('Quat.slerp(): t must be in [0,1]');
      return;
    }
    let cosR =
      q1.x * q2.x
      + q1.y * q2.y
      + q1.z * q2.z
      + q1.w * q2.w;
    q3.set(q2); // <- q3はQuatクラスの下で定義してる
    if (cosR < 0) {
      cosR *= -1;
      q3.set(-q3.x,-q3.y,-q3.z,-q3.w);
    }
    if (cosR > 0.9995) {
      this.x = (1-t)*q1.x + t*q3.x;
      this.y = (1-t)*q1.y + t*q3.y;
      this.z = (1-t)*q1.z + t*q3.z;
      this.w = (1-t)*q1.w + t*q3.w;
      const s = Math.sqrt(
        this.x * this.x
        + this.y * this.y
        + this.z * this.z
        + this.w * this.w
      );
      if (s<0.0001) { // かなりダメな時
        console.warn("Quat.slerp(); ???!");
        this.x = q1.x;
        this.y = q1.y;
        this.z = q1.z;
        this.w = q1.w;
      } else {
        this.x *= 1/s;
        this.y *= 1/s;
        this.z *= 1/s;
        this.w *= 1/s;
      }
    } else {
      const tt = Math.acos(cosR);
      const w1 = Math.sin((1-t)*tt) / Math.sin(tt);
      const w2 = Math.sin(t*tt) / Math.sin(tt);
      this.x = w1*q1.x + w2*q3.x;
      this.y = w1*q1.y + w2*q3.y;
      this.z = w1*q1.z + w2*q3.z;
      this.w = w1*q1.w + w2*q3.w;
    }
  }
}

const q3 = new Quat(); // 計算のテンポラリで使う

/**
 * ある地点（`me`）から対象（`target`）の方を向くためのクォータニオンを計算します。
 * glTF モデルの座標系に合わせ、Z 軸の正方向を「前」として計算します。
 * @param me 自分の位置
 * @param target 向く先の位置
 * @param up 上方向ベクトル（通常 `(0, 1, 0)`）
 * @param out 結果を書き込む `Quat`。省略時は新しい `Quat` を返します。
 * @returns 計算されたクォータニオン
 */
export function getLookAtQuaternion(me: Vec3, target: Vec3, up: Vec3, out?: Quat): Quat {
  up.normalize();
  const forward = me.clone().sub(target).normalize();
  const right = new Vec3().cross(forward,up).normalize();
  const trueUp = new Vec3().cross(right, forward);

  const m00 = right.x; const m01 = trueUp.x; const m02 = -forward.x;
  const m10 = right.y; const m11 = trueUp.y; const m12 = -forward.y;
  const m20 = right.z; const m21 = trueUp.z; const m22 = -forward.z;

  let qx: number, qy: number, qz: number, qw: number;
  const trace = m00 + m11 + m22;
  if (trace > 0) {
    const s = Math.sqrt(trace+1.0)*2.0;
    qx = (m21-m12)/s; qy = (m02-m20)/s; qz = (m10-m01)/s; qw = 0.25*s;
  } else if ((m00>m11) && (m00>m22)) {
    const s = Math.sqrt(1.0+m00-m11-m22) * 2.0;
    qx = 0.25*s; qy = (m01+m10)/s; qz = (m02+m20)/s; qw = (m21-m12)/s;
  } else if (m11>m22) {
    const s = Math.sqrt(1.0+m11-m00-m22) * 2.0;
    qx = (m01+m10)/s; qy = 0.25*s; qz = (m12+m21)/s; qw = (m02-m20)/s;
  } else {
    const s = Math.sqrt(1.0+m22-m00-m11) * 2.0;
    qx = (m02+m20)/s; qy = (m12+m21)/s; qz = 0.25*s; qw = (m10-m01)/s;
  }
  const result = out ?? new Quat();
  result.set(qx, qy, qz, qw);
  return result;
}


/**
 * オイラー角（ラジアン）をクォータニオンに変換します。
 * @param rot 各軸の回転角（ラジアン）を表す `Vec3`
 * @param order 軸の回転順番。デフォルトは `"ZXY"`
 * @param out 結果を書き込む `Quat`。省略時は新しい `Quat` を返します。
 * @returns 変換されたクォータニオン
 */
export function eulerToQuaternion(rot: Vec3, order: RotationOrder = "ZXY", out?: Quat): Quat {
  const quat = out !== undefined ? out.set(0, 0, 0, 1) : new Quat(0, 0, 0, 1);
  for (let i=0;i<3;i++) {
    const c = order.charAt(i);
    switch(c) {
      case 'X':
        quat.mul(Math.sin(rot.x),0,0,Math.cos(rot.x));
        break;
      case 'Y':
        quat.mul(0,Math.sin(rot.y),0,Math.cos(rot.y));
        break;
      case 'Z':
        quat.mul(0,0,Math.sin(rot.z),Math.cos(rot.z));
        break;
    }
  }
  return quat;
}

/**
 * 与えられた四元数に対応する3x3の行列を返します。
 * @param q 四元数
 * @returns 行列(二次元配列)
 */
export function quatToMatrix(q: Quat): number[][] {
  const m: number[][] = [[],[],[]];
  const x2 = q.x + q.x, y2 = q.y + q.y, z2 = q.z + q.z;
  const xx = q.x * x2, xy = q.x * y2, xz = q.x * z2;
  const yy = q.y * y2, yz = q.y * z2, zz = q.z * z2;
  const wx = q.w * x2, wy = q.w * y2, wz = q.w * z2;

  m[0][0] = 1 - (yy + zz);
  m[0][1] = xy - wz;
  m[0][2] = xz + wy;

  m[1][0] = xy + wz;
  m[1][1] = 1 - (xx + zz);
  m[1][2] = yz - wx;

  m[2][0] = xz - wy;
  m[2][1] = yz + wx;
  m[2][2] = 1 - (xx + yy);
  return m;
}

/*
 * 下のquatToVec3Eulerで使うclamp関数。
 */
const clamp = (v: number) => Math.max(-1, Math.min(1, v));

/**
 * クォータニオンをオイラー角（ラジアン）に変換します。
 * @param q 変換するクォータニオン
 * @param order 軸の回転順番。デフォルトは `"ZXY"`
 * @param out 結果を書き込む `Vec3`。省略時は新しい `Vec3` を返します。
 * @returns 変換されたオイラー角（ラジアン）を表す `Vec3`
 */
export function quatToVec3Euler(q: Quat, order: RotationOrder = "ZXY", out?: Vec3): Vec3 {
  const m = quatToMatrix(q);
  const v = out ?? new Vec3();
  let x=0,y=0,z=0;
  // --- orderごとの分岐 ---
  switch (order) {
    case "XYZ":
      y = Math.asin(clamp(m[0][2]));
      if (Math.abs(m[0][2]) < 0.9999999) {
        x = Math.atan2(-m[1][2], m[2][2]);
        z = Math.atan2(-m[0][1], m[0][0]);
      } else {
        x = Math.atan2(m[2][1], m[1][1]);
        z = 0;
      }
      break;

    case "YXZ":
      x = Math.asin(-clamp(m[1][2]));
      if (Math.abs(m[1][2]) < 0.9999999) {
        y = Math.atan2(m[0][2], m[2][2]);
        z = Math.atan2(m[1][0], m[1][1]);
      } else {
        y = Math.atan2(-m[2][0], m[0][0]);
        z = 0;
      }
      break;

    case "ZXY":
      x = Math.asin(clamp(m[2][1]));
      if (Math.abs(m[2][1]) < 0.9999999) {
        y = Math.atan2(-m[2][0], m[2][2]);
        z = Math.atan2(-m[0][1], m[1][1]);
      } else {
        y = 0;
        z = Math.atan2(m[1][0], m[0][0]);
      }
      break;

    case "ZYX":
      y = Math.asin(-clamp(m[2][0]));
      if (Math.abs(m[2][0]) < 0.9999999) {
        x = Math.atan2(m[2][1], m[2][2]);
        z = Math.atan2(m[1][0], m[0][0]);
      } else {
        x = 0;
        z = Math.atan2(-m[0][1], m[1][1]);
      }
      break;

    case "YZX":
      z = Math.asin(clamp(m[1][0]));
      if (Math.abs(m[1][0]) < 0.9999999) {
        x = Math.atan2(-m[1][2], m[1][1]);
        y = Math.atan2(-m[2][0], m[0][0]);
      } else {
        x = 0;
        y = Math.atan2(m[0][2], m[2][2]);
      }
      break;

    case "XZY":
      z = Math.asin(-clamp(m[0][1]));
      if (Math.abs(m[0][1]) < 0.9999999) {
        x = Math.atan2(m[2][1], m[1][1]);
        y = Math.atan2(m[0][2], m[0][0]);
      } else {
        x = Math.atan2(-m[1][2], m[2][2]);
        y = 0;
      }
      break;
  }
  v.set(x,y,z);
  return v;
}

// ###################################################################

/**
 * 3D オブジェクトの位置・回転・拡大率をまとめて保持するクラスです。
 * `Transformer` が管理する正式な Transform 情報として使われます。
 */
export class Transform {
  /** 位置（ワールド座標）。 */
  loc: Vec3;
  /** 回転（クォータニオン）。 */
  quat: Quat;
  /** 拡大率（各軸の倍率）。初期値は `(1, 1, 1)`。 */
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
      tOrO.getPosition(this.loc);
      tOrO.getQuat(this.quat);
      tOrO.getScale(this.scale);
    }
    return this;
  }

  write(objectA3: ObjectA3): void;
  write(object3D: THREE.Object3D): void;
  write(obj: ObjectA3 | THREE.Object3D): void {
    if (obj instanceof ObjectA3) {
      obj.object3D.position.set(this.loc.x,this.loc.y,this.loc.z);
      obj.object3D.quaternion.set(this.quat.x,this.quat.y,this.quat.z,this.quat.w);
      obj.object3D.scale.set(this.scale.x,this.scale.y,this.scale.z);
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
