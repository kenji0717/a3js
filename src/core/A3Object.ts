
import * as THREE from 'three';

/**
 * シーンの中に配置される全てのオブジェクトのベース
 * となるアブストラクトクラス。シーンの中の表示対象
 * はもちろん、カメラやライトなどもこのクラスのサブ
 * クラスにしないといけない。特に、このアブストラクト
 * クラスでは、3D空間内での移動や、物理演算に関する
 * 必要なメソッドを実装する。
 */
export abstract class A3Object {
  object: THREE.Object3D;
  needsUpdate: boolean;

  constructor(data?: any) {
    this.object = this.initObject(data);
    this.needsUpdate = this.initNeedsUpdate();
  }

  abstract initObject(data?: any): THREE.Object3D;
  initNeedsUpdate() { return false; } // デフォルトfalse
  update(dt: number) {dt;} // デフォルト: 何もしない

  setLoc(x: number, y: number, z: number) {
    this.object.position.set(x,y,z);
  }
}
