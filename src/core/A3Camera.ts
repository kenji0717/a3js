//import * as THREE from 'three';
import { A3Object } from './A3Object';

/**
  * a3jsのカメラのベーストなるアブストラクトクラス。
  * a3jsのカメラはデフォルトでヘッドライトがONの状態
  * で持ってないといけないので、それもカメラに含まれる
  * ものとする。
  */
export abstract class A3Camera extends A3Object {
  /*
   * 必ずHeadLightを準備しなければならない。
   */
  //initObject(): THREE.Object3D;

  abstract setHeadLightEnable(b: boolean): void;
}
