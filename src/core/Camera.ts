//import * as THREE from 'three';
import { ObjectA3 } from './ObjectA3';

/**
  * a3jsのカメラのベーストなるアブストラクトクラス。
  * a3jsのカメラはデフォルトでヘッドライトがONの状態
  * で持ってないといけないので、それもカメラに含まれる
  * ものとする。
  */
export abstract class Camera extends ObjectA3 {
  /*
   * 必ずHeadLightを準備しなければならない。
   */
  //initObject(): THREE.Object3D;

  abstract setHeadLightEnable(b: boolean): void;
}
