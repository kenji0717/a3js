import * as THREE from 'three';
import { ObjectA3 } from './ObjectA3';
import type { View } from './View';
import { Vec3, getLookAtQuaternion } from './LinearMath';

/**
  * a3jsのカメラのベーストなるアブストラクトクラス。
  * a3jsのカメラはデフォルトでヘッドライトがONの状態
  * で持ってないといけないので、それもカメラに含まれる
  * ものとする。
  */
export abstract class Camera extends ObjectA3 {
  view?: View;

  setView(view: View) {
    this.view = view;
  }

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
      xVO.getPosition(target);
    } else {
      target.set(xVO);
    }
    const up = this.upVector ? this.upVector : ObjectA3.defaultUpVector;
    const newQuat = getLookAtQuaternion(this.getPosition(),target,up);
    newQuat.mul(up.x,up.y,up.z,0); // up軸まわりで180度回転！
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
      xVO.getPosition(target);
    } else {
      target.set(xVO);
    }
    const up = this.upVector ? this.upVector : ObjectA3.defaultUpVector;
    const newQuat = getLookAtQuaternion(this.getPosition(),target,up);
    newQuat.mul(up.x,up.y,up.z,0); // up軸まわりで180度回転！
    this.setQuatNow(newQuat);
  }
}
