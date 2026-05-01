import * as THREE from 'three';
import { ObjectA3 } from './ObjectA3';
import type { Controller } from './Controller';
import { Vec3, Quat, getLookAtQuaternion } from './LinearMath';

/**
  * a3jsのカメラのベーストなるアブストラクトクラス。
  * a3jsのカメラはデフォルトでヘッドライトがONの状態
  * で持ってないといけないので、それもカメラに含まれる
  * ものとする。
  */
export abstract class Camera extends ObjectA3 {
  controller?: Controller;

  /**
   * 耳の役割を持つTHREE.AudioListenerをカメラに
   * 取り付ける。普通にTHREE.Cameraだったら、Object3D
   * のサブクラスなんで、それにaddすればOK。
   */
  abstract setAudioListener(listener: THREE.AudioListener): void;

  /**
   * ワールド座標 → 正規化デバイス座標（NDC）
   */
  abstract calcNDC(loc: Vec3): {x: number, y: number}; 

  abstract setHeadLightEnable(b: boolean): void;

  setController(controller: Controller) {
    this.controller = controller;
  }

  /**
   * カメラの位置指定は最終的にはカメラに設定されている
   * コントローラ(Controller)が決めるので、設定されている
   * コントローラによって挙動が異なる。
   * @param v 座標
   */
  setPosition(v: Vec3): void;
  setPosition(x: number, y: number, z: number): void;
  setPosition(xOrV: number | Vec3, y?: number, z?: number): void {
    const v = new Vec3();
    if (typeof xOrV === 'number') {
      super.setPosition(xOrV,y!,z!);
      v.set(xOrV,y!,z!);
    } else {
      super.setPosition(xOrV);
      v.set(xOrV);
    }
    if (this.controller)
      this.controller.setCameraLocation(v);
    else
      super.setPosition(v);
  }

  /**
   * カメラの位置指定は最終的にはカメラに設定されている
   * コントローラ(Controller)が決めるので、設定されている
   * コントローラによって挙動が異なる。
   * @param v 座標
   */
  snapPosition(v: Vec3): void;
  snapPosition(x: number, y: number, z: number): void;
  snapPosition(xOrV: number | Vec3, y?: number, z?: number): void {
    const v = new Vec3();
    if (typeof xOrV === 'number') {
      super.setPosition(xOrV,y!,z!);
      v.set(xOrV,y!,z!);
    } else {
      super.setPosition(xOrV);
      v.set(xOrV);
    }
    if (this.controller)
      this.controller.setCameraLocationNow(v);
    else
      super.snapPosition(v);
  }

  /**
   * カメラの回転指定は最終的にはカメラに設定されている
   * コントローラ(Controller)が決めるので、設定されている
   * コントローラによって挙動が異なる。
   * @param q 回転
   */
  setQuat(q: Quat): void;
  setQuat(x: number, y: number, z: number, w: number): void;
  setQuat(xOrQ: number | Quat, y?: number, z?: number, w?: number): void {
    const q = new Quat();
    if (typeof xOrQ === "number") {
      q.set(xOrQ, y!, z!, w!);
    } else {
      q.set(xOrQ);
    }
    if (this.controller)
      this.controller.setCameraQuat(q);
    else
      this.transformer.setQuat(q);
  }

  /**
   * カメラの回転指定は最終的にはカメラに設定されている
   * コントローラ(Controller)が決めるので、設定されている
   * コントローラによって挙動が異なる。
   * @param q 回転
   */
  snapQuat(q: Quat): void;
  snapQuat(x: number, y: number, z: number, w: number): void;
  snapQuat(xOrQ: number | Quat, y?: number, z?: number, w?: number): void {
    const q = new Quat();
    if (typeof xOrQ === "number") {
      q.set(xOrQ, y!, z!, w!);
    } else {
      q.set(xOrQ);
    }
    if (this.controller)
      this.controller.setCameraQuatNow(q);
    else
      this.transformer.snapQuat(q);
  }


  /**
   * カメラのlookAtは通常のObjectA3のlookAtと異なり、
   * Z軸の負の方向を正面として処理される。
   * @param v ターゲットの座標
   */
  lookAt(v: Vec3): void;
  lookAt(o: ObjectA3): void;
  lookAt(x: number, y: number, z: number): void;
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
    newQuat.mul(new Quat(up.x,up.y,up.z,0)); // up軸まわりで180度回転！
    this.setQuat(newQuat);
  }

  /**
   * カメラのlookAtNowは通常のObjectA3のlookAtNowと異なり、
   * Z軸の負の方向を正面として処理される。
   * @param v ターゲットの座標
   */
  lookAtNow(v: Vec3): void;
  lookAtNow(o: ObjectA3): void;
  lookAtNow(x: number, y: number, z: number): void;
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
    newQuat.mul(new Quat(up.x,up.y,up.z,0)); // up軸まわりで180度回転！
    this.snapQuat(newQuat);
  }
}
