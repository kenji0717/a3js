//import * as THREE from 'three';
import { ObjectA3 } from '../core/ObjectA3';
import { CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';

/**
 * HTMLElementを受け取りViewに2D表示する。
 *
 * 現在の所、view.scene.remove(Html3Dのインスタンス)
 * しても上手く消えてくれない。
 */
export class Html3D extends ObjectA3 {
  constructor(element: HTMLElement) {
    super(element);
  }

  // 引数が上とあってなさそうだけど、こうするのが正解
  initObject(element: HTMLElement) {
    return new CSS2DObject(element);
  }
}
