
import * as THREE from 'three';
import type { Scene } from './Scene'; // ここをtypeにしないと循環参照になる。
import { DefaultTransformer, SmoothTransformer,
         BillboardTransformer, SmoothBillboardTransformer,
       } from './Transformers';
import { defaultPhysicsMotionOptions } from './Physics';
import type { PhysicsMotionOptions, PhysicsWorld } from './Physics';
import { RapierTransformer } from '../rapier/RapierPhysics';
import { Vec3, Quat, Transform, getLookAtQuaternion, eulerToQuaternion } from './LinearMath';
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
 * するモードの選択。setTransformMode()メソッドの
 * 引数として使用する。ここで示される選択肢以外の
 * モードもあるが、それらはsetTransfromer()メソッド
 * を用いて指定することになる。
 */
export type TransformMode =
  | "Default"
  | "Smooth"
  | "Billboard"
  | "SmoothBillboard"
  | "SimplePhysics";

const geo = new THREE.SphereGeometry();
const mat = new THREE.MeshStandardMaterial({ color: 0xff0000 });
/**
 * 以下、loadingの状態であることを表すTHREE.Mesh。
 * 書き換え可能。
 */
export let a3jsLoading = new THREE.Mesh(geo,mat);


/**
 * シーンの中に配置される全てのオブジェクトのベース
 * となるアブストラクトクラス。シーンの中の表示対象
 * はもちろん、カメラやライトなどもこのクラスのサブ
 * クラスにしないといけない。特に、このアブストラクト
 * クラスでは、3D空間内での移動や、物理演算に関する
 * 必要なメソッドを実装する。
 */
export class ObjectA3 {
  static defaultRotationOrder: RotationOrder = "ZXY";
  static defaultUpVector: Vec3 = new Vec3(0,1,0);
  rotationOrder?: RotationOrder;
  upVector?: Vec3;
  object3D: THREE.Object3D;
  scene?: Scene;
  private balloon?: BalloonInfo;
  transformer: Transformer;
  parent?: ObjectA3;
  children: ObjectA3[] = [];
  clickListener?: (o: ObjectA3)=>void;

  constructor(data?: any) {
    this.transformer = this.initTransformer(data);
    this.object3D = new THREE.Object3D();
    const r = this.initObject(data);
    if (r)
      this.object3D.add(r);
    this.object3D.traverse((o)=>{
      o.userData['a3js'] = { objectA3: this };
    });
  }

  // 非同期でないと無理な場合などはとりあえず
  // 以下のように読み込み中を表すa3jsLoadingのcloneを
  // 返しておいて、後でa3jsLoadingを削除して
  // this.objectにaddすればOK。
  initObject(_data?: any): THREE.Object3D {
    return a3jsLoading.clone();
  };

  /**
   * このObjectA3のコンストラクタから呼び出され、デフォルトで
   * 使用されるTransformerの配列を返す。
   * このメソッドをオーバーライドすることでデフォルトの
   * Transformerを変更することが可能。
   * @param _data コンストラクタから渡された情報
   * @returns このObjectA3で使用されるTransformerの配列
   */
  initTransformer(_data?: any): Transformer {
    return new DefaultTransformer();
  }

  /**
   * ObjectA3生成後に使用されるTransformerを変更する。
   * @param transformer 新しいTransformer
   */
  setTransformer(transformer: Transformer): void {
    tmp.t0.set(this.transformer.transform);
    transformer.init(tmp.t0, this);
    this.transformer = transformer;
  }

  /**
   * ObjectA3に現在設定されているTransformerを返す。
   * @return 現在のTransformer
   */
  getTransformer(): Transformer {
    return this.transformer;
  }

  setTransformMode(mode: TransformMode,options?: any) {
    if (mode === "Default")
      this.setTransformer(new DefaultTransformer());
    else if (mode === "Smooth")
      this.setTransformer(new SmoothTransformer());
    else if (mode === "Billboard")
      this.setTransformer(new BillboardTransformer(options));
    else if (mode === "SmoothBillboard")
      this.setTransformer(new SmoothBillboardTransformer(options));
    else if (mode === "SimplePhysics") {
      const opt = {
        ...defaultPhysicsMotionOptions,
        ...options
      };
      this.setTransformer(new RapierTransformer(opt));
    }
  }

  // setTransformModeでも同じことできるけど。。。
  initSimplePhysics(options: PhysicsMotionOptions) {
    const opt = {
      ...defaultPhysicsMotionOptions,
      ...options
    };
    this.setTransformer(new RapierTransformer(opt));
  }
  
  update(dt: number) {
//console.log(`GAHA:a `,this.transformer.trans.loc);
//console.log(`GAHA:f `,this.transformer.trans.quat);
//console.log(`GAHA:g `,(this.transformer instanceof DefaultTransformer));
    //TransformMosionを反映
    this.transformer.update(dt);
    this.transformer.transform.write(this);
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
    this.object3D.add(obj.object3D);
  }

  remove(obj: ObjectA3) {
    if (obj.parent !== this) {console.warn('ObjectA3.remove(obj) is ignored.');return;}
    // if (!this.children.includes(obj)) return; // ちゃんと管理されてれば必要ない
    const idx = this.children.indexOf(obj);
    this.children.splice(idx,1);
    obj.parent = undefined;
    this.object3D.remove(obj.object3D);
  }

  setSpeechBubble(message: string) {
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

  get transform(): Transform {
    return this.transformer.transform.clone();
  }

  get position(): Vec3 { return this.transform.loc; }
  setPosition(x: number, y: number, z: number): void;
  setPosition(v: Vec3): void;
  setPosition(xOrV: number | Vec3, y?: number, z?: number): void {
    if (typeof xOrV === "number") {
      tmp.v0.set(xOrV, y!, z!);
    } else {
      tmp.v0.set(xOrV);
    }
    this.transformer.setPosition(tmp.v0);
  }

  setPositionNow(x: number, y: number, z: number): void;
  setPositionNow(v: Vec3): void;
  setPositionNow(xOrV: number | Vec3, y?: number, z?: number): void {
    if (typeof xOrV === "number") {
      tmp.v0.set(xOrV, y!, z!);
    } else {
      tmp.v0.set(xOrV);
    }
    this.transformer.setPositionNow(tmp.v0);
  }

  get quat(): Quat { return this.transform.quat; }
  setQuat(x: number, y: number, z: number, w: number): void;
  setQuat(q: Quat): void;
  setQuat(xOrQ: number | Quat, y?: number, z?: number, w?: number): void {
    if (typeof xOrQ === "number") {
      tmp.q0.set(xOrQ, y!, z!, w!);
    } else {
      tmp.q0.set(xOrQ);
    }
    this.transformer.setQuat(tmp.q0);
  }

  setQuatNow(x: number, y: number, z: number, w: number): void;
  setQuatNow(q: Quat): void;
  setQuatNow(xOrQ: number | Quat, y?: number, z?: number, w?: number): void {
    if (typeof xOrQ === "number") {
      tmp.q0.set(xOrQ, y!, z!, w!);
    } else {
      tmp.q0.set(xOrQ);
    }
    this.transformer.setQuatNow(tmp.q0);
  }

  get scale(): Vec3 { return this.transform.scale; }
  setScale(x: number, y: number, z: number): void;
  setScale(v: Vec3): void;
  setScale(xOrV: number | Vec3, y?: number, z?: number): void {
    if (typeof xOrV === "number") {
      tmp.v0.set(xOrV, y!, z!);
    } else {
      tmp.v0.set(xOrV);
    }
    this.transformer.setScale(tmp.v0);
  }

  setScaleNow(x: number, y: number, z: number): void;
  setScaleNow(v: Vec3): void;
  setScaleNow(xOrV: number | Vec3, y?: number, z?: number): void {
    if (typeof xOrV === "number") {
      tmp.v0.set(xOrV, y!, z!);
    } else {
      tmp.v0.set(xOrV);
    }
    this.transformer.setScaleNow(tmp.v0);
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
    const quat = eulerToQuaternion(rot,order);
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
      target.set(xVO.position);
    } else {
      target.set(xVO);
    }
    const up = this.upVector ? this.upVector : ObjectA3.defaultUpVector;
    const newQuat = getLookAtQuaternion(this.position,target,up);
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
      target.set(xVO.position);
    } else {
      target.set(xVO);
    }
    const up = this.upVector ? this.upVector : ObjectA3.defaultUpVector;
    const newQuat = getLookAtQuaternion(this.position,target,up);
    this.setQuatNow(newQuat);
  }

  getUnitVecX(): Vec3 {
    const vecX = new Vec3(1,0,0);
    return vecX.apply(this.object3D.quaternion);
  }
  getUnitVecY(): Vec3 {
    const vecY = new Vec3(0,1,0);
    return vecY.apply(this.object3D.quaternion);
  }
  getUnitVecZ(): Vec3 {
    const vecZ = new Vec3(0,0,1);
    return vecZ.apply(this.object3D.quaternion);
  }

  translate(v: Vec3): void;
  translate(x: number, y: number, z: number): void;
  translate(xOrV: number | Vec3, y?: number, z?: number) {
    const tmpV = new Vec3();
    tmpV.set(this.position);
    if (typeof xOrV === 'number')
      tmpV.add(xOrV,y!,z!);
    else
      tmpV.add(xOrV);
    this.setPosition(tmpV);
  }

  addLocationNow(v: Vec3): void;
  addLocationNow(x: number, y: number, z: number): void;
  addLocationNow(xOrV: number | Vec3, y?: number, z?: number) {
    const tmpV = new Vec3();
    tmpV.set(this.position);
    if (typeof xOrV === 'number')
      tmpV.add(xOrV,y!,z!);
    else
      tmpV.add(xOrV);
    this.setPositionNow(tmpV);
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
    const quat = eulerToQuaternion(tmp.v0,order);
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
    const quat = eulerToQuaternion(tmp.v0,order);
    tmp.q0.set(this.quat);
    tmp.q0.mul(quat);
    this.setQuatNow(tmp.q0);
  }

  scaleBy(v: Vec3): void;
  scaleBy(x: number, y: number, z: number): void;
  scaleBy(xOrV: number | Vec3, y?: number, z?: number) {
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
    this.translate(tmp.v0);
  }

  moveForwardNow(f: number) {
    tmp.v0.set(this.getUnitVecZ());
    tmp.v0.scale(f);
    this.addLocationNow(tmp.v0);
  }

  moveBackward(b: number) {
    tmp.v0.set(this.getUnitVecZ());
    tmp.v0.scale(-b);
    this.translate(tmp.v0);
  }

  moveBackwardNow(b: number) {
    tmp.v0.set(this.getUnitVecZ());
    tmp.v0.scale(-b);
    this.addLocationNow(tmp.v0);
  }

  moveRight(r: number) {
    tmp.v0.set(this.getUnitVecX());
    tmp.v0.scale(-r);
    this.translate(tmp.v0);
  }

  moveRightNow(r: number) {
    tmp.v0.set(this.getUnitVecX());
    tmp.v0.scale(-r);
    this.addLocationNow(tmp.v0);
  }

  moveLeft(l: number) {
    tmp.v0.set(this.getUnitVecX());
    tmp.v0.scale(l);
    this.translate(tmp.v0);
  }

  moveLeftNow(l: number) {
    tmp.v0.set(this.getUnitVecX());
    tmp.v0.scale(l);
    this.addLocationNow(tmp.v0);
  }

  moveUp(u: number) {
    tmp.v0.set(this.getUnitVecY());
    tmp.v0.scale(u);
    this.translate(tmp.v0);
  }

  moveUpNow(u: number) {
    tmp.v0.set(this.getUnitVecY());
    tmp.v0.scale(u);
    this.addLocationNow(tmp.v0);
  }

  moveDown(d: number) {
    tmp.v0.set(this.getUnitVecY());
    tmp.v0.scale(-d);
    this.translate(tmp.v0);
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

  setLinearVelocity(v: Vec3): void;
  setLinearVelocity(x: number, y: number, z: number): void;
  setLinearVelocity(xOrV: number | Vec3, y?: number, z?: number) {
    if (typeof xOrV === "number") {
      tmp.v0.set(xOrV, y!, z!);
    } else {
      tmp.v0.set(xOrV);
    }
    this.transformer.setLinearVelocity(tmp.v0);
  }
  getLinearVelocity(v: Vec3 | undefined): Vec3 {
    return this.transformer.getLinearVelocity(v);
  }

  setAngularVelocity(v: Vec3): void;
  setAngularVelocity(x: number, y: number, z: number): void;
  setAngularVelocity(xOrV: number | Vec3, y?: number, z?: number) {
    if (typeof xOrV === "number") {
      tmp.v0.set(xOrV, y!, z!);
    } else {
      tmp.v0.set(xOrV);
    }
    this.transformer.setAngularVelocity(tmp.v0);
  }
  getAngularVelocity(v: Vec3 | undefined): Vec3 {
    return this.transformer.getAngularVelocity(v);
  }

  resetForce(): void {
    this.transformer.resetForce();
  }
  addForce(v: Vec3): void;
  addForce(x: number, y: number, z: number): void;
  addForce(xOrV: number | Vec3, y?: number, z?: number) {
    if (typeof xOrV === "number") {
      tmp.v0.set(xOrV, y!, z!);
    } else {
      tmp.v0.set(xOrV);
    }
    this.transformer.addForce(tmp.v0);
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
    this.transformer.addForceAtPoint(tmp.v0,tmp.v1);
  }

  resetTorque(): void {
    this.transformer.resetTorque();
  }
  addTorque(v: Vec3): void;
  addTorque(x: number, y: number, z: number): void;
  addTorque(xOrV: number | Vec3, y?: number, z?: number) {
    if (typeof xOrV === "number") {
      tmp.v0.set(xOrV, y!, z!);
    } else {
      tmp.v0.set(xOrV);
    }
    this.transformer.addTorque(tmp.v0);
  }

  applyImpulse(v: Vec3): void;
  applyImpulse(x: number, y: number, z: number): void;
  applyImpulse(xOrV: number | Vec3, y?: number, z?: number) {
    if (typeof xOrV === "number") {
      tmp.v0.set(xOrV, y!, z!);
    } else {
      tmp.v0.set(xOrV);
    }
    this.transformer.applyImpulse(tmp.v0);
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
    this.transformer.applyImpulseAtPoint(tmp.v0,tmp.v1);
  }

  applyTorqueImpulse(v: Vec3): void;
  applyTorqueImpulse(x: number, y: number, z: number): void;
  applyTorqueImpulse(xOrV: number | Vec3, y?: number, z?: number) {
    if (typeof xOrV === "number") {
      tmp.v0.set(xOrV, y!, z!);
    } else {
      tmp.v0.set(xOrV);
    }
    this.transformer.applyTorqueImpulse(tmp.v0);
  }

  /**
   * TransformerがCharacterTransformerなどの場合だけ
   * 他のオブジェクトを考慮して現在接地していうかどうかを
   * 判定してくれる。それ以外の時は、Y座標が0以下の時接地している
   * と判定するのが普通。
   * @returns 接地してるかどうか
   */
  isGrounded(): boolean {
    return this.transformer.isGrounded();
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


/**
 * ObjectA3のobjectプロパティに保存されているTHREE.Object3Dの
 * position,quaternion(rotation),scaleのみをコントロールする
 * モーションのインタフェース。コントロールするというだけでなく、
 * ObjectA3の位置、回転、拡大・縮小率に関する情報はこの
 * インタフェースのインスタンスが管理しており、これがObjectA3の
 * 正式な情報で、ObjectA3.object.positionなどは表示の都合で
 * 管理されている情報という位置付けとなる。
 * 
 * ObjectA3に各種方法で登録されることで、そのObjectA3の
 * 移動などに関する処理に影響を与える。ObjectA3に登録することが
 * できるTransformerは必ず一つである。
 * 
  * このインタフェースにはsetPosition()やsetQuat()などの外部の
 * プログラムから位置や回転を指定す要求を受け付けるメソッドが
 * あるが、これらは必ずしも要求に応答しなければならないという
 * わけではない。例えばSmoothTransformerでは、移動が
 * 目視できるように1秒ほど時間をかけて移動するし、物理系の
 * Transformerの場合は、基本的に要求を無視して物理法則通りに
 * 移動させるというのが正解の場合もある。ただし、setPositionNow()や
 * setQuatNow()のようにメソッドの最後にNowが付いている物については
 * 可能なかぎり要求に即座に答えなければならない。
 * 
 * 
 * このTransformerを実装することでInterpolateTransformer、
 * BillboardTransformer、CharacterTransformerなどが作られる。
 */
export interface Transformer {
  /**
   * このTransformerが管理している位置、回転、拡大・縮小率。
   * 常に最新の位置、回転、拡大・縮小率が、ここに反映されていなければ
   * ならない。
   */
  transform: Transform;

  /**
   * このTransformerの動作に必要な初期化処理を実装する
   * メソッド。引数にコントロール対象のa3.ObjectA3(中に
   * THREE.Object3Dも入ってる)を渡されるので、必要に応じて
   * それをスキャンして情報を得ることは許可されるが、変更を
   * 加えてはならない。特に初期の位置、回転、拡大・縮小率は、
   * 第一引数のtransから得なければならず、objectA3.object
   * (THREE.Object3D)から得てはならない。すでに設定されている
   * 状態で呼び出された場合には、再設定という意味で対応しなければ
   * ならない。
   * @param trans 初期位置、回転、拡大・縮小率
   * @param objectA3 動きをコントロールする対象となるa3.ObjectA3
   */
  init(trans: Transform, objectA3: ObjectA3): void;

  /**
   * 物理演算が必要な場合にRigidBodyやColliderを
   * PhysicsWorldに登録する必要があるので、このメソッドで
   * 対応する。必要無い場合は何もしなくてOK。
   * @param world 登録対象のPhysicsWorld
   */
  addOneselfToPhysics(world: PhysicsWorld): void;

  /**
   * このTransformerが不必要となった時に、PhysicsWorldに
   * 登録していたRigidBodyやColliderを、登録解除する
   * 処理を行うメソッド。
   * @param world 解除対象のPhysicsWorld
   */
  removeOneselfFromPhysics(world: PhysicsWorld): void;

  /**
   * このTransformerがコントロールする3Dオブジェクトが
   * 地面に接地しているかどうかを返す。実際には
   * CharacterTransformerのようなTransfomerだけが意味の
   * ある応答が可能だが、それ以外の場合は
   * 「return this.trans.loc.y <= 0;」で良し。
   */
  isGrounded(): boolean;

  /**
   * 指定の場所に移動せよとの外部からの要求を受け付ける
   * ためのメソッド。実際にそれを反映させる処理はupdate()
   * メソッドに書く。
   * @param loc 指定場所
   */
  setPosition(loc: Vec3): void;

  /**
   * 指定の場所に直ちに移動せよとの外部からの要求を受け付ける
   * ためのメソッド。実際にそれを反映させる処理はupdate()
   * メソッドに書く。
   * @param loc 指定場所
   */
  setPositionNow(loc: Vec3): void;

  /**
   * 指定の角度に回転せよとの外部からの要求を受け付ける
   * ためのメソッド。実際にそれを反映させる処理はupdate()
   * メソッドに書く。
   * @param quat 指定の回転
   */
  setQuat(quat: Quat): void;

  /**
   * 指定の角度に直ちに回転せよとの外部からの要求を受け付ける
   * ためのメソッド。実際にそれを反映させる処理はupdate()
   * メソッドに書く。
   * @param quat 指定の回転
   */
  setQuatNow(quat: Quat): void;

  /**
   * 指定の大きさ(拡大・縮小率)に変形せよとの外部からの要求を
   * 受け付けるためのメソッド。実際にそれを反映させる処理は
   * update()メソッドに書く。
   * @param scale 指定の大きさ
   */
  setScale(scale: Vec3): void;

  /**
   * 指定の大きさ(拡大・縮小率)に直ちに変形せよとの外部からの
   * 要求を受け付けるためのメソッド。実際にそれを反映させる処理は
   * update()メソッドに書く。
   * @param scale 指定の大きさ
   */
  setScaleNow(scale: Vec3): void;

  /**
   * 速度を設定する。物理系のTransformerのみ対応すれば
   * 良い物で、それ以外の場合はメソッドの実装は空で良い。
   * @param vel 速度。
   */
  setLinearVelocity(vel: Vec3): void;

  /**
   * 速度を得る。物理系のTransformerのみ対応すれば
   * 良い物で、それ以外の場合はメソッドの実装は正しい
   * 値を返さない。
   * @param v 値を受け取るためのVec3、またはundefined。
   * @return 速度。
   */
  getLinearVelocity(v: Vec3 | undefined): Vec3;

  /**
   * 角速度を設定する。単位はラジアン/秒。
   * 物理系のTransformerのみ対応すれば
   * 良い物で、それ以外の場合はメソッドの実装は空で良い。
   * @param angvel 角速度
   */
  setAngularVelocity(angvel: Vec3): void;

  /**
   * 角速度を得る。物理系のTransformerのみ対応すれば
   * 良い物で、それ以外の場合はメソッドの実装は正しい
   * 値を返さない。
   * @param v 値を受け取るためのVec3、またはundefined。
   * @return 角速度。
   */
  getAngularVelocity(v: Vec3 | undefined): Vec3;

  /**
   * addForceで加えられた力をリセットする。
   * 物理系のTransformerのみ対応すれば
   * 良い物で、それ以外の場合はメソッドの実装は空で良い。
   */
  resetForce(): void;

  /**
   * 力を設定する。
   * 物理系のTransformerのみ対応すれば
   * 良い物で、それ以外の場合はメソッドの実装は空で良い。
   * @param f 力
   */
  addForce(f: Vec3): void;

  /**
   * 力点を指定して力を設定する。力点は世界座標での座標。
   * 物理系のTransformerのみ対応すれば
   * 良い物で、それ以外の場合はメソッドの実装は空で良い。
   * @param f 力
   * @param p 力点
   */
  addForceAtPoint(f: Vec3, p: Vec3): void;

  /**
   * addTorqueで加えられたトルクをリセットする。
   * 物理系のTransformerのみ対応すれば
   * 良い物で、それ以外の場合はメソッドの実装は空で良い。
   */
  resetTorque(): void;

  /**
   * トルク(回転力)を設定する。
   * 物理系のTransformerのみ対応すれば
   * 良い物で、それ以外の場合はメソッドの実装は空で良い。
   * @param t トルク
   */
  addTorque(t: Vec3): void;

  /**
   * 一瞬、力を設定する。
   * 物理系のTransformerのみ対応すれば
   * 良い物で、それ以外の場合はメソッドの実装は空で良い。
   * @param i インパルス
   */
  applyImpulse(i: Vec3): void;

  /**
   * 力点を指定して、一瞬、力を設定する。
   * 物理系のTransformerのみ対応すれば
   * 良い物で、それ以外の場合はメソッドの実装は空で良い。
   * @param i インパルス
   * @param p 力点
   */
  applyImpulseAtPoint(i: Vec3, p: Vec3): void;

  /**
   * 一瞬、トルクを設定する。
   * 物理系のTransformerのみ対応すれば
   * 良い物で、それ以外の場合はメソッドの実装は空で良い。
   */
  applyTorqueImpulse(ti: Vec3): void;

  /**
   * 経過時間に応じて、位置、回転、拡大・縮小率を更新するための
   * メソッド。毎フレーム呼び出される。その時点での位置、回転、
   * 拡大・縮小率は必ずthis.transに反映させなければならない。
   * 外部からの指示がなくても自動的に移動するようなことが実現
   * される。
   * @param dt 経過時間(秒)
   */
  update(dt: number): void;
}
