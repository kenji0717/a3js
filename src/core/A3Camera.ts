import * as THREE from 'three';
import type { A3Transform } from './A3Transform';
/**
  * a3jsのカメラが持つべき機能を表現するインターフェース
  * カメラは移動できるようにA3Transformも実装してないと
  * いけないし、ヘッドライトというのがデフォルトでONで
  * これを制御する機能を持っていないといけない。
  */
export interface A3Camera extends A3Transform {
  headLight: THREE.Light;
  disableHeadlight(): void;
  enableHeadlight(): void;
}
