
import * as THREE from 'three';
import { Scene } from './Scene';
import { DefaultTransformMotion, InterpolationTransformMotion,
         BillboardTransformMotion, InterpolationBillboardTransformMotion } from './Motion';
import type { TransformMotion, PoseMotion, Pose } from './Motion';
import { defaultPhysicsMotionOption } from './Physics';
import type { PhysicsMotionOption } from './Physics';
import { RapierTransformMotion } from '../rapier/RapierPhysics';
import { CharactorTransformMotion } from '../rapier/CharactorTransformMotion';
import { Vec3, Quat, Transform, getQuatOfLookAt, vec3EulerToQuat } from './LinearMath';
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
 * ObjectA3の位置、回転、拡大・縮小率をコントロール
 * するモードの選択。setTransformMotionMode()メソッドの
 * 引数として使用する。ここで示される選択肢以外の
 * モードもあるが、それらはsetTransfromMotion()メソッド
 * を用いて指定することになる。
 */
export type TransformMotionMode =
  | "Default"
  | "Interpolation"
  | "Billboard"
  | "InterpolationBillboard"
  | "SimplePhysics";



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
  transformMotion: TransformMotion;
  poseMotions: Record<string,PoseMotion>;
  statePoseMotion?: PoseMotion;
  emotePoseMotion?: PoseMotion;
  currentPoseMotion?: PoseMotion;
  parent?: ObjectA3;
  children: ObjectA3[] = [];
  clickListener?: (o: ObjectA3)=>void;
  //以下PoseMotionを処理するための情報。一部スーパークラスでの対応が必要。
  skeletons: THREE.Skeleton[];
  bones: Record<string,THREE.Object3D>;
  morphs: Record<string, {array: Array<number>, idx: number}>;
  morphsOverwrite: boolean;

  constructor(data?: any) {
    this.skeletons = [];
    this.bones = {};
    this.morphs = {};
    this.morphsOverwrite = false;
    this.object = this.initObject(data);
    this.object.traverse((o)=>{
      o.userData['a3js'] = { objectA3: this };
    });
    this.transformMotion = this.initTransformMotion(data);
    this.poseMotions = this.initPoseMotions(data);
  }

  // 非同期でないと無理な場合などはとりあえず
  // 空のTHREE.Object3Dだけ返しておいて後で、
  // そのObject3DにaddすればOK。
  abstract initObject(data?: any): THREE.Object3D;

  /**
   * このObjectA3のコンストラクタから呼び出され、デフォルトで
   * 使用されるTransformMotionの配列を返す。
   * このメソッドをオーバーライドすることでデフォルトの
   * TransformMotionを変更することが可能。
   * @param _data コンストラクタから渡された情報
   * @returns このObjectA3で使用されるTransformMotionの配列
   */
  initTransformMotion(_data?: any): TransformMotion {
    return new DefaultTransformMotion();
  }

  /**
   * ObjectA3生成後に使用されるTransformMotionを変更する。
   * @param transformMotion 新しいTransformMotion
   */
  setTransformMotion(transformMotion: TransformMotion): void {
    tmp.t0.set(this.transformMotion.trans);
    transformMotion.init(tmp.t0, this);
    this.transformMotion = transformMotion;
  }

  /**
   * ObjectA3に現在設定されているTransformMotionを返す。
   * @return 現在のTransformMotion
   */
  getTransformMotion(): TransformMotion {
    return this.transformMotion;
  }

  setTransformMotionMode(mode: TransformMotionMode,option?: any) {
    if (mode === "Default")
      this.setTransformMotion(new DefaultTransformMotion());
    else if (mode === "Interpolation")
      this.setTransformMotion(new InterpolationTransformMotion());
    else if (mode === "Billboard")
      this.setTransformMotion(new BillboardTransformMotion(option));
    else if (mode === "InterpolationBillboard")
      this.setTransformMotion(new InterpolationBillboardTransformMotion(option));
    else if (mode === "SimplePhysics") {
      const opt = {
        ...defaultPhysicsMotionOption,
        ...option
      };
      this.setTransformMotion(new RapierTransformMotion(opt));
    }
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
   * ObjectA3生成後に使用されるPoseMotionの辞書を設定する。
   * @param poseMotions PoseMotionの辞書
   */
  setPoseMotions(poseMotions: Record<string,PoseMotion>): void {
    this.poseMotions = poseMotions;
  }

  /**
   * ObjectA3に現在設定されているPoseMotionの辞書を返す。
   * @return PoseMotionの辞書
   */
  getPoseMotions(): Record<string,PoseMotion> {
    return this.poseMotions;
  }

  /**
   * 引数の名前でObjectA3に現在設定されているPoseMotion
   * を返す。
   * @return PoseMotion
   */
  getPoseMotion(name: string): PoseMotion {
    return this.poseMotions[name];
  }

  /**
   * ObjectA3生成後に、使用されるPoseMotionの辞書に
   * 追加でPoseMotionを1つ加える。
   */
  addPoseMotion(poseMotion: PoseMotion): void {
    this.poseMotions[poseMotion.name] = poseMotion;
  }

  /**
   * ObjectA3に設定されているPoseMotionを名前を指定して
   * 削除する。
   */
  removePoseMotion(name: string): PoseMotion {
    const pm = this.poseMotions[name];
    delete this.poseMotions[name];
    return pm;
  }

  setState(name: string) {
    this.statePoseMotion = this.poseMotions[name];
    if (this.statePoseMotion) {
      this.currentPoseMotion?.cleanup3D(this);
      this.statePoseMotion.prepare3D(this);
      this.statePoseMotion.playCount = 0;
      this.statePoseMotion.time = 0;
      this.currentPoseMotion = this.statePoseMotion;
    }
  }

  setEmote(name: string) {
    this.emotePoseMotion = this.poseMotions[name];
    if (this.emotePoseMotion) {
      this.currentPoseMotion?.cleanup3D(this);
      this.emotePoseMotion.prepare3D(this);
      this.emotePoseMotion.playCount = 0;
      this.emotePoseMotion.time = 0;
      this.currentPoseMotion = this.emotePoseMotion;
    }
  }

  // 今のところ、こんな感じでにげる。AnimationMixerを
  // 完全に真似するまでは時間がかかりそう。
  setMorphsOverwrite(b: boolean) {
    this.morphsOverwrite = b;
  }

  morph(name: string, value: number) {
    if (name in this.morphs) {
      const { array, idx } = this.morphs[name];
      array[idx] = value;
    }
  }

  // setTransformMotionModeでも同じことできるけど。。。
  initSimplePhysics(option: PhysicsMotionOption) {
    const opt = {
      ...defaultPhysicsMotionOption,
      ...option
    };
    this.setTransformMotion(new RapierTransformMotion(opt));
    this.poseMotions = {};
  }

  pose: Pose = {};
  update(dt: number) {
    //TransformMosionを反映
    this.transformMotion.update(dt);
    this.transformMotion.trans.write(this);
    //PoseMosionを反映
    let pose;
    if (this.emotePoseMotion && this.emotePoseMotion.playCount<=0) {
      pose = this.emotePoseMotion.update(dt);
      if (this.emotePoseMotion.playCount>0) {
        this.emotePoseMotion.cleanup3D(this);
        this.emotePoseMotion = undefined;
        if (this.statePoseMotion)
          this.statePoseMotion.prepare3D(this);
      }
    } else if (this.statePoseMotion) {
      pose = this.statePoseMotion.update(dt);
    }
    if (pose && this.bones) {
      for (const [boneName,data] of Object.entries(pose)) {
        //位置、回転、拡大率対応
        const bone = this.bones[boneName];
        if (bone) {
          if (data.loc) bone.position.set(data.loc.x,data.loc.y,data.loc.z);
          if (data.quat) bone.quaternion.set(data.quat.x,data.quat.y,data.quat.z,data.quat.w);
          if (data.scale) bone.scale.set(data.scale.x,data.scale.y,data.scale.z);
        }
        // モーフィング対応。無いと動かないglTFもある。
        // モーフィングのデータの保存のしかた失敗してる説ある。GAHA
        if (!this.morphsOverwrite) {
          if (data.morphs) {
            for (const pMorph of data.morphs) {
              for (const myMName of Object.keys(this.morphs)) {
                if (myMName.startsWith(pMorph.name)) {
                  const {array} = this.morphs[myMName];
                  for (let i=0;i<array.length;i++) {
                    array[i] = pMorph.vals[i];
                  }
                  break;
                }
              }
            }
          }
        }
      }
    }
    this.object.updateMatrixWorld(true); // 必要なのか？
    this.skeletons.forEach((skeleton)=> { // 必要なのか？
      skeleton.update();
    });

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

  get trans(): Transform {
    return this.transformMotion.trans.clone();
  }

  get loc(): Vec3 { return this.trans.loc; }
  setLocation(x: number, y: number, z: number): void;
  setLocation(v: Vec3): void;
  setLocation(xOrV: number | Vec3, y?: number, z?: number): void {
    if (typeof xOrV === "number") {
      tmp.v0.set(xOrV, y!, z!);
    } else {
      tmp.v0.set(xOrV);
    }
    this.transformMotion.setLocation(tmp.v0);
  }

  setLocationNow(x: number, y: number, z: number): void;
  setLocationNow(v: Vec3): void;
  setLocationNow(xOrV: number | Vec3, y?: number, z?: number): void {
    if (typeof xOrV === "number") {
      tmp.v0.set(xOrV, y!, z!);
    } else {
      tmp.v0.set(xOrV);
    }
    this.transformMotion.setLocationNow(tmp.v0);
  }




  get quat(): Quat { return this.trans.quat; }
  setQuat(x: number, y: number, z: number, w: number): void;
  setQuat(q: Quat): void;
  setQuat(xOrQ: number | Quat, y?: number, z?: number, w?: number): void {
    if (typeof xOrQ === "number") {
      tmp.q0.set(xOrQ, y!, z!, w!);
    } else {
      tmp.q0.set(xOrQ);
    }
    this.transformMotion.setQuat(tmp.q0);
  }

  setQuatNow(x: number, y: number, z: number, w: number): void;
  setQuatNow(q: Quat): void;
  setQuatNow(xOrQ: number | Quat, y?: number, z?: number, w?: number): void {
    if (typeof xOrQ === "number") {
      tmp.q0.set(xOrQ, y!, z!, w!);
    } else {
      tmp.q0.set(xOrQ);
    }
    this.transformMotion.setQuatNow(tmp.q0);
  }

  get scale(): Vec3 { return this.trans.scale; }
  setScale(x: number, y: number, z: number): void;
  setScale(v: Vec3): void;
  setScale(xOrV: number | Vec3, y?: number, z?: number): void {
    if (typeof xOrV === "number") {
      tmp.v0.set(xOrV, y!, z!);
    } else {
      tmp.v0.set(xOrV);
    }
    this.transformMotion.setScale(tmp.v0);
  }

  setScaleNow(x: number, y: number, z: number): void;
  setScaleNow(v: Vec3): void;
  setScaleNow(xOrV: number | Vec3, y?: number, z?: number): void {
    if (typeof xOrV === "number") {
      tmp.v0.set(xOrV, y!, z!);
    } else {
      tmp.v0.set(xOrV);
    }
    this.transformMotion.setScaleNow(tmp.v0);
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
      target.set(xVO.loc);
    } else {
      target.set(xVO);
    }
    const up = this.upVector ? this.upVector : ObjectA3.defaultUpVector;
    const newQuat = getQuatOfLookAt(this.loc,target,up);
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
      target.set(xVO.loc);
    } else {
      target.set(xVO);
    }
    const up = this.upVector ? this.upVector : ObjectA3.defaultUpVector;
    const newQuat = getQuatOfLookAt(this.loc,target,up);
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

  addLocation(v: Vec3): void;
  addLocation(x: number, y: number, z: number): void;
  addLocation(xOrV: number | Vec3, y?: number, z?: number) {
    const tmpV = new Vec3();
    tmpV.set(this.loc);
    if (typeof xOrV === 'number')
      tmpV.add(xOrV,y!,z!);
    else
      tmpV.add(xOrV);
    this.setLocation(tmpV);
  }

  addLocationNow(v: Vec3): void;
  addLocationNow(x: number, y: number, z: number): void;
  addLocationNow(xOrV: number | Vec3, y?: number, z?: number) {
    const tmpV = new Vec3();
    tmpV.set(this.loc);
    if (typeof xOrV === 'number')
      tmpV.add(xOrV,y!,z!);
    else
      tmpV.add(xOrV);
    this.setLocationNow(tmpV);
  }

  mulQuat(q: Quat): void;
  mulQuat(x: number, y: number, z: number, w: number): void;
  mulQuat(xOrQ: number | Quat, y?: number, z?: number, w?: number) {
    const tmpQ = new Quat();
    tmpQ.set(this.quat);
    if (typeof xOrQ === 'number')
      tmpQ.mul(xOrQ,y!,z!,w!);
    else
      tmpQ.mul(xOrQ);
    this.setQuat(tmpQ);
  }

  mulQuatNow(q: Quat): void;
  mulQuatNow(x: number, y: number, z: number, w: number): void;
  mulQuatNow(xOrQ: number | Quat, y?: number, z?: number, w?: number) {
    const tmpQ = new Quat();
    tmpQ.set(this.quat);
    if (typeof xOrQ === 'number')
      tmpQ.mul(xOrQ,y!,z!,w!);
    else
      tmpQ.mul(xOrQ);
    this.setQuatNow(tmpQ);
  }

  mulRotation(v: Vec3): void;
  mulRotation(x: number, y: number, z: number): void;
  mulRotation(xOrV: number | Vec3, y?: number, z?: number) {
    if (typeof xOrV === 'number')
      tmp.v0.set(xOrV, y!, z!);
    else
      tmp.v0.set(xOrV);
    tmp.v0.scale(Math.PI/360); // デグリー to ラジアン & t to t/2
    const order = this.rotationOrder ? this.rotationOrder : ObjectA3.defaultRotationOrder;
    const quat = vec3EulerToQuat(tmp.v0,order);
    tmp.q0.set(this.quat);
    tmp.q0.mul(quat);
    this.setQuat(tmp.q0);
  }

  mulRotationNow(v: Vec3): void;
  mulRotationNow(x: number, y: number, z: number): void;
  mulRotationNow(xOrV: number | Vec3, y?: number, z?: number) {
    if (typeof xOrV === 'number')
      tmp.v0.set(xOrV, y!, z!);
    else
      tmp.v0.set(xOrV);
    tmp.v0.scale(Math.PI/360); // デグリー to ラジアン & t to t/2
    const order = this.rotationOrder ? this.rotationOrder : ObjectA3.defaultRotationOrder;
    const quat = vec3EulerToQuat(tmp.v0,order);
    tmp.q0.set(this.quat);
    tmp.q0.mul(quat);
    this.setQuatNow(tmp.q0);
  }

  mulScale(v: Vec3): void;
  mulScale(x: number, y: number, z: number): void;
  mulScale(xOrV: number | Vec3, y?: number, z?: number) {
    tmp.v0.set(this.scale);
    if (typeof xOrV === 'number')
      tmp.v0.set(tmp.v0.x*xOrV, tmp.v0.y*y!, tmp.v0.z*z!);
    else
      tmp.v0.set(tmp.v0.x*xOrV.x, tmp.v0.y*xOrV.y, tmp.v0.z*xOrV.z);
    this.setScale(tmp.v0);
  }

  mulScaleNow(v: Vec3): void;
  mulScaleNow(x: number, y: number, z: number): void;
  mulScaleNow(xOrV: number | Vec3, y?: number, z?: number) {
    tmp.v0.set(this.scale);
    if (typeof xOrV === 'number')
      tmp.v0.set(tmp.v0.x*xOrV, tmp.v0.y*y!, tmp.v0.z*z!);
    else
      tmp.v0.set(tmp.v0.x*xOrV.x, tmp.v0.y*xOrV.y, tmp.v0.z*xOrV.z);
    this.setScaleNow(tmp.v0);
  }

  moveForward(f: number) {
    tmp.v0.set(this.getUnitVecZ());
    tmp.v0.scale(f);
    this.addLocation(tmp.v0);
  }

  moveForwardNow(f: number) {
    tmp.v0.set(this.getUnitVecZ());
    tmp.v0.scale(f);
    this.addLocationNow(tmp.v0);
  }

  moveBackward(b: number) {
    tmp.v0.set(this.getUnitVecZ());
    tmp.v0.scale(-b);
    this.addLocation(tmp.v0);
  }

  moveBackwardNow(b: number) {
    tmp.v0.set(this.getUnitVecZ());
    tmp.v0.scale(-b);
    this.addLocationNow(tmp.v0);
  }

  moveRight(r: number) {
    tmp.v0.set(this.getUnitVecX());
    tmp.v0.scale(-r);
    this.addLocation(tmp.v0);
  }

  moveRightNow(r: number) {
    tmp.v0.set(this.getUnitVecX());
    tmp.v0.scale(-r);
    this.addLocationNow(tmp.v0);
  }

  moveLeft(l: number) {
    tmp.v0.set(this.getUnitVecX());
    tmp.v0.scale(l);
    this.addLocation(tmp.v0);
  }

  moveLeftNow(l: number) {
    tmp.v0.set(this.getUnitVecX());
    tmp.v0.scale(l);
    this.addLocationNow(tmp.v0);
  }

  moveUp(u: number) {
    tmp.v0.set(this.getUnitVecY());
    tmp.v0.scale(u);
    this.addLocation(tmp.v0);
  }

  moveUpNow(u: number) {
    tmp.v0.set(this.getUnitVecY());
    tmp.v0.scale(u);
    this.addLocationNow(tmp.v0);
  }

  moveDown(d: number) {
    tmp.v0.set(this.getUnitVecY());
    tmp.v0.scale(-d);
    this.addLocation(tmp.v0);
  }

  moveDownNow(d: number) {
    tmp.v0.set(this.getUnitVecY());
    tmp.v0.scale(-d);
    this.addLocationNow(tmp.v0);
  }

  turnUp(u: number) {
    this.mulRotation(-u,0,0);
  }

  turnUpNow(u: number) {
    this.mulRotationNow(-u,0,0);
  }

  turnDown(d: number) {
    this.mulRotation(d,0,0);
  }

  turnDownNow(d: number) {
    this.mulRotationNow(d,0,0);
  }

  turnRight(r: number) {
    this.mulRotation(0,-r,0);
  }

  turnRightNow(r: number) {
    this.mulRotationNow(0,-r,0);
  }

  turnLeft(l: number) {
    this.mulRotation(0,l,0);
  }

  turnLeftNow(l: number) {
    this.mulRotationNow(0,l,0);
  }

  rollRight(r: number) {
    this.mulRotation(0,0,r);
  }

  rollRightNow(r: number) {
    this.mulRotationNow(0,0,r);
  }

  rollLeft(l: number) {
    this.mulRotation(0,0,-l);
  }

  rollLeftNow(l: number) {
    this.mulRotationNow(0,0,-l);
  }

  setLinvel(v: Vec3): void;
  setLinvel(x: number, y: number, z: number): void;
  setLinvel(xOrV: number | Vec3, y?: number, z?: number) {
    if (typeof xOrV === "number") {
      tmp.v0.set(xOrV, y!, z!);
    } else {
      tmp.v0.set(xOrV);
    }
    this.transformMotion.setLinvel(tmp.v0);
  }

  setAngvel(v: Vec3): void;
  setAngvel(x: number, y: number, z: number): void;
  setAngvel(xOrV: number | Vec3, y?: number, z?: number) {
    if (typeof xOrV === "number") {
      tmp.v0.set(xOrV, y!, z!);
    } else {
      tmp.v0.set(xOrV);
    }
    this.transformMotion.setAngvel(tmp.v0);
  }

  resetForce(): void {
    this.transformMotion.resetForce();
  }
  addForce(v: Vec3): void;
  addForce(x: number, y: number, z: number): void;
  addForce(xOrV: number | Vec3, y?: number, z?: number) {
    if (typeof xOrV === "number") {
      tmp.v0.set(xOrV, y!, z!);
    } else {
      tmp.v0.set(xOrV);
    }
    this.transformMotion.addForce(tmp.v0);
  }

  addForceAtPoint(f: Vec3, p: Vec3): void;
  addForceAtPoint(fx: number, fy: number, fz: number, px: number, py: number, pz: number): void;
  addForceAtPoint(fOrFx: Vec3 | number, pOrFy: Vec3 | number, fz?: number, px?: number, py?: number, pz?: number): void {
    if (typeof fOrFx === "number") {
      if (typeof pOrFy === "number") {
        tmp.v0.set(fOrFx,pOrFy,fz!);
        tmp.v1.set(px!,py!,pz!);
      } else {
        console.warn('ObjectA3.addForceAtPoint(): type of arguments mismatch.');
        return;
      }
    } else {
      if (typeof pOrFy === "number") {
        console.warn('ObjectA3.addForceAtPoint(): type of arguments mismatch.');
        return;
      } else {
        tmp.v0.set(fOrFx);
        tmp.v1.set(pOrFy);
      }
    }
    this.transformMotion.addForceAtPoint(tmp.v0,tmp.v1);
  }

  resetTorque(): void {
    this.transformMotion.resetTorque();
  }
  addTorque(v: Vec3): void;
  addTorque(x: number, y: number, z: number): void;
  addTorque(xOrV: number | Vec3, y?: number, z?: number) {
    if (typeof xOrV === "number") {
      tmp.v0.set(xOrV, y!, z!);
    } else {
      tmp.v0.set(xOrV);
    }
    this.transformMotion.addTorque(tmp.v0);
  }

  applyImpulse(v: Vec3): void;
  applyImpulse(x: number, y: number, z: number): void;
  applyImpulse(xOrV: number | Vec3, y?: number, z?: number) {
    if (typeof xOrV === "number") {
      tmp.v0.set(xOrV, y!, z!);
    } else {
      tmp.v0.set(xOrV);
    }
    this.transformMotion.applyImpulse(tmp.v0);
  }

  applyImpulseAtPoint(i: Vec3, p: Vec3): void;
  applyImpulseAtPoint(ix: number, iy: number, iz: number, px: number, py: number, pz: number): void;
  applyImpulseAtPoint(iOrFx: Vec3 | number, pOrFy: Vec3 | number, iz?: number, px?: number, py?: number, pz?: number): void {
    if (typeof iOrFx === "number") {
      if (typeof pOrFy === "number") {
        tmp.v0.set(iOrFx,pOrFy,iz!);
        tmp.v1.set(px!,py!,pz!);
      } else {
        console.warn('ObjectA3.addForceAtPoint(): type of arguments mismatch.');
        return;
      }
    } else {
      if (typeof pOrFy === "number") {
        console.warn('ObjectA3.addForceAtPoint(): type of arguments mismatch.');
        return;
      } else {
        tmp.v0.set(iOrFx);
        tmp.v1.set(pOrFy);
      }
    }
    this.transformMotion.applyImpulseAtPoint(tmp.v0,tmp.v1);
  }

  applyTorqueImpulse(v: Vec3): void;
  applyTorqueImpulse(x: number, y: number, z: number): void;
  applyTorqueImpulse(xOrV: number | Vec3, y?: number, z?: number) {
    if (typeof xOrV === "number") {
      tmp.v0.set(xOrV, y!, z!);
    } else {
      tmp.v0.set(xOrV);
    }
    this.transformMotion.applyTorqueImpulse(tmp.v0);
  }

  /**
   * TransformMotionがCharactorTransformMotionに設定されている
   * 時だけ他のオブジェクトを考慮して現在接地していうかどうかを
   * 判定してくれる。それ以外の時は、Y座標が0以下の時接地している
   * と判定する。
   * @returns 接地してるかどうか
   */
  isGrounded(): boolean {
    if (this.transformMotion instanceof CharactorTransformMotion) {
      return this.transformMotion.isGrounded();
    } else {
      if (this.loc.y<=0)
        return true;
      else
        return false;
    }
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
