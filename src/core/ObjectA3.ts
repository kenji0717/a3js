
import * as THREE from 'three';
import { Scene } from './Scene';
import { DefaultRootMotion } from './Motion';
import { InterpolationRootMotion } from './Motion';
import type { RootMotion, PoseMotion, Pose } from './Motion';
import { defaultPhysicsMotionOption } from './Physics';
import type { PhysicsMotionOption } from './Physics';
import { RapierRootMotion } from '../rapier/RapierPhysics';
import { Vec3, Quat, getQuatOfLookAt, vec3EulerToQuat } from './LinearMath';
import type { RotationOrder } from './LinearMath';
import { tmp } from '../utils/math';

/**
 * スクリーン上における方向を表します。
 * オブジェクトに吹き出しを出す場合の方向で使いますが、
 * それ以外でも使うかも。
 */
export type Dir =
  | "TOP"
  | "RIGHT"
  | "LEFT"
  | "BOTTOM";

/**
 * シーンの中に配置される全てのオブジェクトのベース
 * となるアブストラクトクラス。シーンの中の表示対象
 * はもちろん、カメラやライトなどもこのクラスのサブ
 * クラスにしないといけない。特に、このアブストラクト
 * クラスでは、3D空間内での移動や、物理演算に関する
 * 必要なメソッドを実装する。
 */
export abstract class ObjectA3 {
  static defaultRotationOrder: RotationOrder = "XYZ";
  static defaultUpVector: Vec3 = new Vec3(0,1,0);
  rotationOrder?: RotationOrder;
  upVector?: Vec3;
  object: THREE.Object3D;
  scene?: Scene;
  private balloon?: BalloonInfo;
  rootMotions: RootMotion[];
  poseMotions: Record<string,PoseMotion>;
  statePoseMotion?: PoseMotion;
  emotePoseMotion?: PoseMotion;
  parent?: ObjectA3;
  children: ObjectA3[] = [];
  clickListener?: (o: ObjectA3)=>void;
  bones?: Record<string,THREE.Object3D>;

  constructor(data?: any) {
    this.object = this.initObject(data);
    this.object.traverse((o)=>{
      o.userData['a3js'] = { objectA3: this };
    });
    this.rootMotions = this.initRootMotions(data);
    this.poseMotions = this.initPoseMotions(data);
  }

  // 非同期でないと無理な場合などはとりあえず
  // 空のTHREE.Object3Dだけ返しておいて後で、
  // そのObject3DにaddすればOK。
  abstract initObject(data?: any): THREE.Object3D;

  /**
   * このObjectA3のコンストラクタから呼び出され、デフォルトで
   * 使用されるRootMotionの配列を返す。
   * このメソッドをオーバーライドすることでデフォルトの
   * RootMotionを変更することが可能。
   * @param _data コンストラクタから渡された情報
   * @returns このObjectA3で使用されるRootMotionの配列
   */
  initRootMotions(_data?: any): RootMotion[] {
    return [new DefaultRootMotion()];
  }

  /**
   * ObjectA3生成後に使用されるRootMotionの配列を変更する。
   * @param rootMotions RootMotionの配列
   */
  setRootMotions(rootMotions: RootMotion[]): void {
    this.rootMotions = rootMotions;
  }

  /**
   * ObjectA3生成後に、使用されるRootMotionの配列の最後に
   * 追加でRootMotionを1つ加える。
   */
  addRootMotion(rootMotion: RootMotion): void {
    this.rootMotions.push(rootMotion);
  }

  /**
   * このObjectA3のコンストラクタから呼び出され、デフォルトで
   * 使用されるPoseMotionの辞書を返す。ただObjectA3の実装では
   * 空の辞書を返すだけ。このメソッドをオーバーライドすることで
   * デフォルトのPoseMotionを変更することが可能。
   * @param _data コンストラクタから渡された情報
   * @returns このObjectA3で使用されるPoseMotionの辞書
   */
  initPoseMotions(_data?: any): Record<string,PoseMotion> {
    return {};
  }

  /**
   * ObjectA3生成後に使用されるRootMotionの配列を変更する。
   * @param poseMotions PoseMotionの辞書
   */
  setPoseMotions(poseMotions: Record<string,PoseMotion>): void {
    this.poseMotions = poseMotions;
  }

  /**
   * ObjectA3生成後に、使用されるPoseMotionの辞書に
   * 追加でPoseMotionを1つ加える。
   */
  addPoseMotion(name: string, poseMotion: PoseMotion): void {
    this.poseMotions[name] = poseMotion;
  }

  enableInterpolation(i: boolean) {
    if (i) {
      this.rootMotions.push(new InterpolationRootMotion());
    } else {
      const newRootMotions: RootMotion[] = [];
      this.rootMotions.forEach((m)=>{
        if (!(m instanceof InterpolationRootMotion))
          newRootMotions.push(m);
      });
      this.rootMotions = newRootMotions;
    }
  }

  initSimplePhysics(option: PhysicsMotionOption) {
    const opt = {
      ...defaultPhysicsMotionOption,
      ...option
    };
    this.rootMotions = [new RapierRootMotion(this,opt)];
    this.poseMotions = {};
  }

  pose: Pose = {};
  update(dt: number) {
    //RootMosionを反映
    tmp.t0.set(this);
    this.rootMotions.reduce((acc,motion)=>motion.update(dt,acc),tmp.t0);
    tmp.t0.write(this);
    //PoseMosionを反映
    let pose;
    if (this.emotePoseMotion && !this.emotePoseMotion.isFinished) {
      pose = this.emotePoseMotion.update(dt);
      if (this.emotePoseMotion.isFinished)
        this.emotePoseMotion = undefined;
    } else if (this.statePoseMotion) {
      pose = this.statePoseMotion.update(dt);
    }
    if (pose && this.bones) {
      for (const [boneName,trans] of Object.entries(pose)) {
        const bone = this.bones[boneName];
        if (bone) trans.write(bone);
      }
    }

    this.children.forEach((child)=>{
      child.update(dt);
    });
  }

  add(obj: ObjectA3) {
    if (obj.scene) {console.warn('ObjectA3.add(obj) is ignored.');return;}
    if (obj.parent) {console.warn('ObjectA3.add(obj) is ignored.');return;}
    // if (this.children.includes(obj)) return; // ちゃんと管理されてれば必要ない
    this.children.push(obj);
    obj.parent = this;
    this.object.add(obj.object);
  }

  remove(obj: ObjectA3) {
    if (obj.parent !== this) {console.warn('ObjectA3.remove(obj) is ignored.');return;}
    // if (!this.children.includes(obj)) return; // ちゃんと管理されてれば必要ない
    const idx = this.children.indexOf(obj);
    this.children.splice(idx,1);
    obj.parent = undefined;
    this.object.remove(obj.object);
  }

  setBalloon(message: string) {
    if (!this.balloon)
      this.balloon = new BalloonInfo(message);
    else
      this.balloon.message = message;
  }

  /**
   * リスナーは1個しか登録されません。2つ
   * 登録しようとすると、最初のリスナーは
   * 捨てられます。
   */
  setClickListener(func: (o: ObjectA3)=>void) {
    this.clickListener = func;
  }

  /**
   * 物理エンジンにより衝突が検知されたら呼び出される。
   * @param obj 衝突相手
   * @param started 衝突開始の時true、衝突終了の時false
   * @param myPartNo ぶつかったパーツのColliderの番号
   * @param yourPartNo 相手のぶつかったパーツのClliderの番号
   */
  handleCollision(obj: ObjectA3, started: boolean, myPartNo: number, yourPartNo: number) {
    obj; started; myPartNo; yourPartNo;
  }

  async clicked() {
    if (this.clickListener)
      await this.clickListener(this);
  }

  get locX(): number { return this.object.position.x; }
  get locY(): number { return this.object.position.y; }
  get locZ(): number { return this.object.position.z; }
  setLocation(x: number, y: number, z: number): void;
  setLocation(v: Vec3): void;
  setLocation(xOrV: number | Vec3, y?: number, z?: number): void {
    const newLoc = new Vec3();
    if (typeof xOrV === "number") {
      newLoc.set(xOrV, y!, z!);
    } else {
      newLoc.set(xOrV);
    }
    this.rootMotions.forEach((rootMotion)=>{
      rootMotion.setLocation(newLoc);
    });
  }

  setLocationNow(x: number, y: number, z: number): void;
  setLocationNow(v: Vec3): void;
  setLocationNow(xOrV: number | Vec3, y?: number, z?: number): void {
    const newLoc = new Vec3();
    if (typeof xOrV === "number") {
      newLoc.set(xOrV, y!, z!);
    } else {
      newLoc.set(xOrV);
    }
    this.rootMotions.forEach((rootMotion)=>{
      rootMotion.setLocationNow(newLoc);
    });
  }




  get quatX(): number { return this.object.quaternion.x; }
  get quatY(): number { return this.object.quaternion.y; }
  get quatZ(): number { return this.object.quaternion.z; }
  get quatW(): number { return this.object.quaternion.w; }
  setQuat(x: number, y: number, z: number, w: number): void;
  setQuat(q: Quat): void;
  setQuat(xOrQ: number | Quat, y?: number, z?: number, w?: number): void {
    const newQuat = new Quat();
    if (typeof xOrQ === "number") {
      newQuat.set(xOrQ, y!, z!, w!);
    } else {
      newQuat.set(xOrQ);
    }
    this.rootMotions.forEach((rootMotion)=>{
      rootMotion.setQuat(newQuat);
    });
  }

  setQuatNow(x: number, y: number, z: number, w: number): void;
  setQuatNow(q: Quat): void;
  setQuatNow(xOrQ: number | Quat, y?: number, z?: number, w?: number): void {
    const newQuat = new Quat();
    if (typeof xOrQ === "number") {
      newQuat.set(xOrQ, y!, z!, w!);
    } else {
      newQuat.set(xOrQ);
    }
    this.rootMotions.forEach((rootMotion)=>{
      rootMotion.setQuatNow(newQuat);
    });
  }

  get scaleX(): number { return this.object.scale.x; }
  get scaleY(): number { return this.object.scale.y; }
  get scaleZ(): number { return this.object.scale.z; }
  setScale(x: number, y: number, z: number): void;
  setScale(v: Vec3): void;
  setScale(xOrV: number | Vec3, y?: number, z?: number): void {
    const newScale = new Vec3();
    if (typeof xOrV === "number") {
      newScale.set(xOrV, y!, z!);
    } else {
      newScale.set(xOrV);
    }
    this.rootMotions.forEach((rootMotion)=>{
      rootMotion.setScale(newScale);
    });
  }

  setScaleNow(x: number, y: number, z: number): void;
  setScaleNow(v: Vec3): void;
  setScaleNow(xOrV: number | Vec3, y?: number, z?: number): void {
    const newScale = new Vec3();
    if (typeof xOrV === "number") {
      newScale.set(xOrV, y!, z!);
    } else {
      newScale.set(xOrV);
    }
    this.rootMotions.forEach((rootMotion)=>{
      rootMotion.setScaleNow(newScale);
    });
  }

  /**
   * オイラー角で回転を設定。単位はラジアンではなくデグリー
   * (360度で1回転)とする。回転の合成の順番はthis.rotationOrderの
   * 設定によるが、それがundefinedの時はObject3D.defaultRotationOrderの
   * 順番になる。
   */
  setRotation(x: number, y: number, z: number): void;
  setRotation(v: Vec3): void;
  setRotation(xOrV: number | Vec3, y?: number, z?: number): void {
    const rot = new Vec3();
    if (typeof xOrV === "number")
      rot.set(xOrV, y!, z!);
    else
      rot.set(xOrV);
    rot.scale(Math.PI/360); // デグリー to ラジアン & t to t/2
    const order = this.rotationOrder ? this.rotationOrder : ObjectA3.defaultRotationOrder;
    const quat = vec3EulerToQuat(rot,order);
    this.setQuat(quat);
  }

  setRotationNow(x: number, y: number, z: number): void;
  setRotationNow(v: Vec3): void;
  setRotationNow(xOrV: number | Vec3, y?: number, z?: number): void {
    const rot = new Vec3();
    if (typeof xOrV === "number")
      rot.set(xOrV, y!, z!);
    else
      rot.set(xOrV);
    const order = this.rotationOrder ? this.rotationOrder : ObjectA3.defaultRotationOrder;
    const quat = new Quat(0,0,0,1);
    for (let i=0;i<3;i++) {
      const c = order.charAt(i);
      switch(c) {
        case 'X':
          quat.mul(new Quat(Math.sin(rot.x),0,0,Math.cos(rot.x)))
          break;
        case 'Y':
          quat.mul(new Quat(0,Math.sin(rot.y),0,Math.cos(rot.y)))
          break;
        case 'Z':
          quat.mul(new Quat(0,0,Math.sin(rot.z),Math.cos(rot.z)))
          break;
      }
    }
    this.setQuatNow(quat);
  }

  lookAt(x: number, y: number, z: number): void;
  lookAt(v: Vec3): void;
  lookAt(o: ObjectA3): void;
  lookAt(xVO: number | Vec3 | ObjectA3, y?: number, z?: number) {
    const target = new Vec3();
    if (typeof xVO === "number") {
      target.set(xVO,y!,z!);
    } else if (xVO instanceof ObjectA3) {
      target.set(xVO.locX,xVO.locY,xVO.locZ);
    } else {
      target.set(xVO);
    }
    const up = this.upVector ? this.upVector : ObjectA3.defaultUpVector;
    const newQuat = getQuatOfLookAt(new Vec3(this.object.position),target,up);
    this.setQuat(newQuat);
  }

  lookAtNow(x: number, y: number, z: number): void;
  lookAtNow(v: Vec3): void;
  lookAtNow(o: ObjectA3): void;
  lookAtNow(xVO: number | Vec3 | ObjectA3, y?: number, z?: number) {
    const target = new Vec3();
    if (typeof xVO === "number") {
      target.set(xVO,y!,z!);
    } else if (xVO instanceof ObjectA3) {
      target.set(xVO.locX,xVO.locY,xVO.locZ);
    } else {
      target.set(xVO);
    }
    const up = this.upVector ? this.upVector : ObjectA3.defaultUpVector;
    const newQuat = getQuatOfLookAt(new Vec3(this.object.position),target,up);
    this.setQuatNow(newQuat);
  }

  getUnitVecX(): Vec3 {
    const vecX = new Vec3(1,0,0);
    return vecX.apply(this.object.quaternion);
  }
  getUnitVecY(): Vec3 {
    const vecY = new Vec3(0,1,0);
    return vecY.apply(this.object.quaternion);
  }
  getUnitVecZ(): Vec3 {
    const vecZ = new Vec3(0,0,1);
    return vecZ.apply(this.object.quaternion);
  }
}

/*
 * 吹き出しの情報。必要な時だけObjectA3に
 * 吹き出しの情報を入れるために使用。
 */
class BalloonInfo {
  message: string;
  dir: Dir;
  offsetTop:    {x: number, y: number};
  offsetRight:  {x: number, y: number};
  offsetLeft:   {x: number, y: number};
  offsetBottom: {x: number, y: number};

  constructor(message: string) {
    this.message = message;
    this.dir = "RIGHT";
    this.offsetTop = {x:0,y:2};
    this.offsetRight = {x:1,y:1};
    this.offsetLeft = {x:-1,y:1};
    this.offsetBottom = {x:0,y:0};
  }
}
