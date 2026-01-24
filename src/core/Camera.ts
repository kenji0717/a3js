//import * as THREE from 'three';
import { ObjectA3 } from './ObjectA3';
import type { MutableVec3 } from './Vec3';

/**
  * a3jsのカメラのベーストなるアブストラクトクラス。
  * a3jsのカメラはデフォルトでヘッドライトがONの状態
  * で持ってないといけないので、それもカメラに含まれる
  * ものとする。
  */
export abstract class Camera extends ObjectA3 {

  /**
   * ワールド座標 → 正規化デバイス座標（NDC）
   */
  abstract calcNDC(loc: MutableVec3): {x: number, y: number}; 

  abstract setHeadLightEnable(b: boolean): void;
}
