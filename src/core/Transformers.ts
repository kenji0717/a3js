import { Vec3, Quat, getLookAtQuaternion, quatToVec3Euler, Transform } from './LinearMath';
import type { MutableVec3 } from './LinearMath';
import type { PhysicsWorld } from "./Physics";
import { ObjectA3 } from "./ObjectA3";
import type { Transformer } from "./ObjectA3";

/**
 * `"Default"` モードの `Transformer` 実装です。
 * 位置・回転・拡大率の変更を即座に反映します。
 * `setMode("Default")` と同等です。
 *
 * 独自の `Transformer` を作る場合は、このクラスを継承して必要なメソッドだけオーバーライドするのがおすすめです。
 */
export class DefaultTransformer implements Transformer {
  transform: Transform;

  /**
   * コンストラクタ。生成する段階ではObjectA3と独立に
   * 生成できるようにするのが理想。実際に使うにはsetObject()を
   * してから使うことになる。
   */
  constructor() {
    this.transform = new Transform();
  }

  init(trans: Transform, _objectA3: ObjectA3) {
    this.transform.set(trans);
  }

  addOneselfToPhysics(_world: PhysicsWorld): void {}
  removeOneselfFromPhysics(_world: PhysicsWorld): void {}
  isGrounded(): boolean { return this.transform.loc.y <= 0; }

  setPosition(loc: Vec3) {
    this.transform.loc.set(loc);
  }
  setPositionNow(loc: Vec3) {
    this.transform.loc.set(loc);
  }
  setQuat(quat: Quat) {
    this.transform.quat.set(quat);
  }
  setQuatNow(quat: Quat) {
    this.transform.quat.set(quat);
  }
  setScale(scale: Vec3) {
    this.transform.scale.set(scale);
  }
  setScaleNow(scale: Vec3) {
    this.transform.scale.set(scale);
  }
  setLinearVelocity(_vel: Vec3): void {}
  getLinearVelocity(v: Vec3) { return v?v:new Vec3(); }
  setAngularVelocity(_angvel: Vec3): void {}
  getAngularVelocity(v: Vec3) { return v?v:new Vec3(); }
  resetForce(): void {}
  addForce(_f: Vec3): void {}
  addForceAtPoint(_v: Vec3, _p: Vec3): void {}
  resetTorque(): void {}
  addTorque(_t: Vec3): void {}
  applyImpulse(_i: Vec3): void {}
  applyImpulseAtPoint(_i: Vec3, _p: Vec3): void {}
  applyTorqueImpulse(_ti: Vec3): void {}
  update(_dt: number) {}
}

/**
 * 一切動かない `Transformer` 実装です。
 * `setPosition()` などの変更要求をすべて無視します。
 * 物理エンジン連携の `Transformer` を作る場合のベースクラスとして利用しやすいです。
 */
export class StaticTransformer implements Transformer {
  transform: Transform;

  /**
   * コンストラクタ。生成する段階ではObjectA3と独立に
   * 生成できるようにするのが理想。実際に使うにはsetObject()を
   * してから使うことになる。
   */
  constructor() {
    this.transform = new Transform();
  }

  init(trans: Transform, _objectA3: ObjectA3) {
    this.transform.set(trans);
  }

  addOneselfToPhysics(_world: PhysicsWorld): void {}
  removeOneselfFromPhysics(_world: PhysicsWorld): void {}
  isGrounded(): boolean { return this.transform.loc.y <= 0; }

  setPosition(_loc: Vec3) {}
  setPositionNow(_loc: Vec3) {}
  setQuat(_quat: Quat) {}
  setQuatNow(_quat: Quat) {}
  setScale(_scale: Vec3) {}
  setScaleNow(_scale: Vec3) {}
  setLinearVelocity(_vel: Vec3): void {}
  getLinearVelocity(v: Vec3) { return v?v:new Vec3(); }
  setAngularVelocity(_angvel: Vec3): void {}
  getAngularVelocity(v: Vec3) { return v?v:new Vec3(); }
  resetForce(): void {}
  addForce(_f: Vec3): void {}
  addForceAtPoint(_v: Vec3, _p: Vec3): void {}
  resetTorque(): void {}
  addTorque(_t: Vec3): void {}
  applyImpulse(_i: Vec3): void {}
  applyImpulseAtPoint(_i: Vec3, _p: Vec3): void {}
  applyTorqueImpulse(_ti: Vec3): void {}
  update(_dt: number) {}
}

/** `SmoothTransformer` のオプション型。 */
export interface SmoothTransformerOptions {
  /** 移動時間（秒）。 */
  duration: number;
}

/** `SmoothTransformerOptions` のデフォルト値。 */
export const defaultSmoothTransformerOptions: SmoothTransformerOptions = {
  duration: 1.0
};

/**
 * `"Smooth"` モードの `Transformer` 実装です。
 * 位置・回転・拡大率の変更をデフォルトで1秒かけてなめらかに補間します。
 * `setMode("Smooth")` と同等です。
 */
export class SmoothTransformer implements Transformer {
  options: SmoothTransformerOptions;
  startTransform: Transform;
  transform: Transform; // 現在のTransform
  endTransform: Transform;
  currentTime: number;
  duration: number;

  constructor(options: Partial<SmoothTransformerOptions> = {}) {
    this.options = {
      ...defaultSmoothTransformerOptions,
      ...options
    };
    this.startTransform = new Transform();
    this.transform = new Transform();
    this.endTransform = new Transform();
    this.currentTime = 0;
    this.duration = this.options.duration;
  }

  init(trans: Transform, _objectA3: ObjectA3) {
    this.startTransform.set(trans);
    this.transform.set(trans);
    this.endTransform.set(trans);
  }

  addOneselfToPhysics(_world: PhysicsWorld): void {}
  removeOneselfFromPhysics(_world: PhysicsWorld): void {}
  isGrounded(): boolean { return this.transform.loc.y <= 0; }

  setPosition(newLoc: Vec3) {
    this.startTransform.set(this.transform);
    this.endTransform.loc.set(newLoc);
    this.currentTime = 0;
  }

  setPositionNow(newLoc: Vec3) {
    this.setPosition(newLoc);
    this.currentTime = 1;
  }

  setQuat(newQuat: Quat) {
    this.startTransform.set(this.transform);
    this.endTransform.quat.set(newQuat);
    this.currentTime = 0;
  }

  setQuatNow(newQuat: Quat) {
    this.setQuat(newQuat);
    this.currentTime = 1;
  }

  setScale(newScale: Vec3) {
    this.startTransform.set(this.transform);
    this.endTransform.scale.set(newScale);
    this.currentTime = 0;
  }

  setScaleNow(newScale: Vec3) {
    this.setScale(newScale);
    this.currentTime = 1;
  }

  setLinearVelocity(_vel: Vec3): void {}
  getLinearVelocity(v?: Vec3) {
    if (!v)
      v = new Vec3();
    const x = this.endTransform.loc.x-this.startTransform.loc.x;
    const y = this.endTransform.loc.y-this.startTransform.loc.y;
    const z = this.endTransform.loc.z-this.startTransform.loc.z;
    v.set(x,y,z);
    const t = this.currentTime<this.duration?this.currentTime:this.duration;
    v.scale((-6*t*t+6*t)/this.duration)
    return v;
  }
  setAngularVelocity(_angvel: Vec3): void {}
  getAngularVelocity(v?: Vec3) {
    if (!v)
      v = new Vec3();
    quatToVec3Euler(this.startTransform.quat, 'ZXY', tmpVec1);
    quatToVec3Euler(this.endTransform.quat, 'ZXY', tmpVec2);
    v.set(tmpVec2.x-tmpVec1.x, tmpVec2.y-tmpVec1.y, tmpVec2.z-tmpVec1.z);
    const t = this.currentTime<this.duration?this.currentTime:this.duration;
    v.scale((-6*t*t+6*t)/this.duration)
    return v;
  }
  resetForce(): void {}
  addForce(_f: Vec3): void {}
  addForceAtPoint(_v: Vec3, _p: Vec3): void {}
  resetTorque(): void {}
  addTorque(_t: Vec3): void {}
  applyImpulse(_i: Vec3): void {}
  applyImpulseAtPoint(_i: Vec3, _p: Vec3): void {}
  applyTorqueImpulse(_ti: Vec3): void {}

  // cssのanimation-timing-functionみたいに
  // 切り替えられるようにしたいね。
  smoothstep(t: number): number {
    return t * t * (3 - 2 * t);
  }

  update(dt: number): void {
    this.currentTime += dt;
    if (this.currentTime > this.duration) this.currentTime = this.duration;
    const t0 = this.currentTime/this.duration;
    const t = this.smoothstep(t0);

    this.transform.set(this.startTransform);
    this.transform.blend(this.endTransform,t);
  }
}

const tmpObjLoc: Vec3 = new Vec3();
const tmpTargetLoc: Vec3 = new Vec3();
const tmpQuat: Quat = new Quat();
const tmpTransform: Transform = new Transform();
const tmpVec1: Vec3 = new Vec3();
const tmpVec2: Vec3 = new Vec3();


/** `BillboardTransformer` の内部オプション型。 */
export interface BillboardTransformerOptions {
  target?: ObjectA3;
  up: Vec3;
}

/**
 * `BillboardTransformer` の生成オプションです。
 */
export interface BillboardTransformerInputOptions {
  /** 常に向き続ける対象のオブジェクト。通常はカメラを指定します。 */
  target: ObjectA3;
  /** 上方向ベクトル。省略時は `(0, 1, 0)` です。 */
  up?: Vec3;
}

/** `BillboardTransformerOptions` のデフォルト値。 */
export const defaultBillboardTransformerOptions: BillboardTransformerOptions = {
  up: new Vec3(0,1,0)
}

/**
 * `"Billboard"` モードの `Transformer` 実装です。
 * `target` で指定したオブジェクトの方向に常に向き続けます。
 * カメラを `target` に指定すれば、常にカメラを向くビルボード表示ができます。
 * 回転への外部からの変更はすべて無視されます。
 * `setMode("Billboard", { target: camera })` と同等です。
 */
export class BillboardTransformer extends DefaultTransformer {
  /** 上方向ベクトル。 */
  up: Vec3;
  /** 常に向き続ける対象のオブジェクト。 */
  target: ObjectA3;

  constructor(options: BillboardTransformerInputOptions) {
    super();
    const completeOpt = {
      ...defaultBillboardTransformerOptions,
      ...options
    };
    this.target = completeOpt.target;
    this.up = completeOpt.up;
  }

  setTarget(target: ObjectA3) {
    this.target = target;
  }

  init(trans: Transform, objectA3: ObjectA3) {
    super.init(trans, objectA3);
    if (objectA3.upVector) {
      //this.up.set(objectA3.upVector);
      this.up = objectA3.upVector;
    } else {
      //this.up.set(ObjectA3.defaultUpVector);
      this.up = ObjectA3.defaultUpVector;
    }
  }

  setQuat(_quat: Quat) {}
  setQuatNow(_quat: Quat) {}

  update(_dt: number): void {
    tmpObjLoc.set(this.transform.loc);
    this.target.getPosition(tmpTargetLoc);
    getLookAtQuaternion(tmpObjLoc, tmpTargetLoc, this.up, tmpQuat);
    this.transform.quat.set(tmpQuat);
  }
}

/** `SmoothBillboardTransformer` の内部オプション型。 */
export interface SmoothBillboardTransformerOptions {
  target?: ObjectA3;
  up: Vec3;
  duration: number;
}

/**
 * `SmoothBillboardTransformer` の生成オプションです。
 */
export interface SmoothBillboardTransformerInputOptions {
  /** 常に向き続ける対象のオブジェクト。 */
  target: ObjectA3;
  /** 上方向ベクトル。省略時は `(0, 1, 0)` です。 */
  up?: Vec3;
  /** 補間時間。省略時は `1.0` です。 */
  duration?: number;
}

/** `SmoothBillboardTransformerOptions` のデフォルト値。 */
export const defaultSmoothBillboardTransformerOptions: SmoothBillboardTransformerOptions = {
  up: new Vec3(0,1,0),
  duration: 1.0
};

/**
 * `"SmoothBillboard"` モードの `Transformer` 実装です。
 * `BillboardTransformer` のスムーズ補間版です。なめらかにターゲットの方向を向きます。
 * `setMode("SmoothBillboard", { target: camera })` と同等です。
 */
export class SmoothBillboardTransformer extends SmoothTransformer {
  /** 上方向ベクトル。 */
  up: Vec3;
  /** 常に向き続ける対象のオブジェクト。 */
  target: ObjectA3;

  constructor(options: SmoothBillboardTransformerInputOptions) {
    super();
    const completeOpt = {
      ...defaultSmoothBillboardTransformerOptions,
      ...options
    };
    this.target = completeOpt.target;
    this.up = completeOpt.up;
    this.duration = completeOpt.duration;
  }

  init(trans: Transform, objectA3: ObjectA3) {
    super.init(trans, objectA3);
    if (objectA3.upVector) {
      this.up = objectA3.upVector;
    } else {
      this.up = ObjectA3.defaultUpVector;
    }
  }

  setQuat(_newQuat: Quat) { /* do nothing. */ }
  setQuatNow(_newQuat: Quat) { /* do nothing. */ }

  update(dt: number) {
    super.update(dt);
    tmpObjLoc.set(this.transform.loc);
    this.target.getPosition(tmpTargetLoc);
    getLookAtQuaternion(tmpObjLoc, tmpTargetLoc, this.up, tmpQuat);
    this.transform.quat.set(tmpQuat);
  }
}

/** `FollowTransformer` の内部オプション型。 */
export interface FollowTransformerOptions {
  target?: ObjectA3;
  lookFrom: MutableVec3;
  /** なめらかさ。0 に近いほどすぐに追従し、1 に近いほどゆっくり追従します。0 以上 1 未満で指定します。 */
  smoothness: number;
}

/**
 * `FollowTransformer` の生成オプションです。
 */
export interface FollowTransformerInputOptions {
  /** 追従する対象のオブジェクト。 */
  target: ObjectA3;
  /** 対象から見た相対位置（カメラをどこから見るか）。省略時は `{ x:0, y:5, z:-10 }`（後方上方）。 */
  lookFrom?: {x:number, y:number, z:number};
  /** なめらかさ。0 に近いほどすぐに追従し、1 に近いほどゆっくり追従します。省略時は `0.9`。 */
  smoothness?: number;
}

/** `FollowTransformerOptions` のデフォルト値。 */
export const defaultFollowTransformerOptions: FollowTransformerOptions = {
  lookFrom: {x:0, y:5, z:-10},
  smoothness: 0.9
};

/**
 * `"Follow"` モードの `Transformer` 実装です。
 * `target` で指定したオブジェクトを追従し続けます。
 * カメラに設定すれば特定のキャラクターを追尾する三人称視点カメラを実現できます。
 * `setPosition()` などの外部からの変更はすべて無視されます。
 * `setMode("Follow", { target: avatar })` と同等です。
 */
export class FollowTransformer extends StaticTransformer {
  /** 追従する対象のオブジェクト。 */
  target: ObjectA3;
  /** 対象から見た相対位置（カメラをどこに配置するか）。 */
  lookFrom: MutableVec3;
  /** 上方向ベクトル。 */
  up: Vec3;
  /** なめらかさ（0 以上 1 未満）。 */
  smoothness: number;

  constructor(options: FollowTransformerInputOptions) {
    super();
    const completeOpt = {
      ...defaultFollowTransformerOptions,
      ...options
    };
    this.target = completeOpt.target;
    this.lookFrom = completeOpt.lookFrom; // 2026,06/07: そのまま使うことにした
    if (this.target.upVector) {
      this.up = this.target.upVector;
    } else {
      this.up = ObjectA3.defaultUpVector;
    }
    this.smoothness = completeOpt.smoothness;
  }

  init(trans: Transform, objectA3: ObjectA3) {
    super.init(trans, objectA3);
  }

  update(dt: number) {
    super.update(dt);
    tmpObjLoc.set(this.transform.loc);
    this.target.getPosition(tmpTargetLoc);
    getLookAtQuaternion(tmpObjLoc, tmpTargetLoc, this.up, tmpQuat);
    tmpQuat.mul(0, 1, 0, 0);
    tmpTransform.quat.set(tmpQuat);

    tmpObjLoc.set(this.lookFrom);
    tmpObjLoc.apply(this.target.getQuat());
    tmpObjLoc.add(this.target.getPosition());
    tmpTransform.loc.set(tmpObjLoc);

    this.transform.loc.lerp(this.transform.loc, tmpTransform.loc, (1-this.smoothness));
    this.transform.quat.slerp(this.transform.quat, tmpTransform.quat, (1-this.smoothness));
  }
}
