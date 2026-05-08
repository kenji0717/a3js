import * as THREE from 'three';
import { ObjectA3 } from './ObjectA3';

export interface MutableVec3 {
    x: number;
    y: number;
    z: number;
}

type Arg1Vec3 = number | Vec3 | MutableVec3;

export interface MutableQuat {
    x: number;
    y: number;
    z: number;
    w: number;
}

type Arg1Quat = number | Quat | MutableQuat;

/**
 * 3次元ベクトル
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

  clone() {
    return new Vec3(this);
  }

  write(q: MutableVec3) {
    q.x = this.x;
    q.y = this.y;
    q.z = this.z;
  }

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

  negate() {
    this.x *= -1;
    this.y *= -1;
    this.z *= -1;
    return this;
  }

  length() {
    return Math.sqrt(this.x*this.x + this.y*this.y + this.z*this.z);
  }

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

  scale(s: number) {
    this.x *= s;
    this.y *= s;
    this.z *= s;
    return this;
  }

  // 自分自身ん引数に与えるとダメな実装
  cross(v1: Vec3, v2: Vec3) {
    this.x = v1.y*v2.z - v1.z*v2.y;
    this.y = v1.z*v2.x - v1.x*v2.z;
    this.z = v1.x*v2.y - v1.y*v2.x;
    return this;
  }

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

  // 線形補間
  lerp(v1: Vec3, v2: Vec3, t: number) {
    this.x = (1-t)*v1.x + t*v2.x;
    this.y = (1-t)*v1.y + t*v2.y;
    this.z = (1-t)*v1.z + t*v2.z;
  }
}


// ################################################################

/**
 * オイラー角(ラジアン)を四元数に変換する時に、軸の回転順番を
 * 指定するための型。
 */
export type RotationOrder = "XYZ" | "XZY" | "YXZ" | "YZX" | "ZXY" | "ZYX";

/**
 * 四元数
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

  clone() {
    return new Quat(this);
  }

  write(q: MutableQuat) {
    q.x = this.x;
    q.y = this.y;
    q.z = this.z;
    q.w = this.w;
  }

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

  conjugate() {
    this.x *= -1;
    this.y *= -1;
    this.z *= -1;
    // wはそのまま
    return this;
  }

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

  // 線形補間
  // 引数のq1が自分自身という場合でも使える
  lerp(q1: Quat, q2: Quat, t: number) {
    this.x = (1-t)*q1.x + t*q2.x;
    this.y = (1-t)*q1.y + t*q2.y;
    this.z = (1-t)*q1.z + t*q2.z;
    this.w = (1-t)*q1.w + t*q2.w;
  }

  // 球面線形補間
  // 引数のq1が自分自身という場合でも使えるはず
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
 * 自分(me)が対象(target)の方を向くための四元数を計算で出します。
 * 3つ目の引数に上方向ベクトル(up)も与えて下さい。glTFのモデルを
 * 基準にしたいので、これにあわせてZ軸の正の方向を自分の前方向と
 * 考えて、これを対象に向ける回転を計算する。
 *
 * 直接、ここの計算とは関係ないがカメラだけはZ軸の負の方向を
 * 前としなければならないので、a3.Camera.lookAt()は
 * a3.ObjectA3.lookAt()をオーバーライドすることで反対方向を向く
 * ようにしている。
 */
export function getLookAtQuaternion(me: Vec3,target: Vec3,up: Vec3) {
  up.normalize();
  const forward = me.clone().sub(target).normalize();
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
export function eulerToQuaternion(rot: Vec3, order: RotationOrder = "ZXY" ): Quat {
  const quat = new Quat(0,0,0,1);
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
 * 四元数をオイラー角(ラジアン)に変換する関数、2番目の引数は
 * 軸の回転順番を指定するRotationOrder。
 */
export function quatToVec3Euler(q: Quat, order: RotationOrder = "ZXY" ): Vec3 {
  const m = quatToMatrix(q);
  const v = new Vec3();
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

export class Transform {
  loc: Vec3;
  quat: Quat;
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
      const t = tOrO.transform;
      this.loc.set(t.loc);
      this.quat.set(t.quat);
      this.scale.set(t.scale);
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
