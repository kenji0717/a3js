import * as THREE from 'three';
import { ObjectA3 } from './ObjectA3';
import type { Controller } from './Controller';
import { Vec3 } from './LinearMath';

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

  setLocation(x: number, y: number, z: number): void;
  setLocation(v: Vec3): void;
  setLocation(xOrV: number | Vec3, y?: number, z?: number): void {
    const v = new Vec3();
    if (typeof xOrV === 'number') {
      super.setLocation(xOrV,y!,z!);
      v.set(xOrV,y!,z!);
    } else {
      super.setLocation(xOrV);
      v.set(xOrV);
    }
    this.controller?.setCameraLocation(v);
  }
}
