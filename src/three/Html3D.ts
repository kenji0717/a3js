//import * as THREE from 'three';
import { ObjectA3 } from '../core/ObjectA3';
import { CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';

/**
 * HTML 要素を 3D 空間内の特定位置に表示するためのオブジェクトです。
 * CSS2DRenderer を使って、3D オブジェクトに追従する HTML ラベルやアイコンを表示できます。
 *
 * @remarks
 * **既知の問題**: `scene.remove(html3dInstance)` を呼び出しても CSS2D 表示が画面から消えない場合があります。
 *
 * @example
 * ```ts
 * const label = document.createElement('div');
 * label.textContent = 'Hello!';
 * label.style.color = 'white';
 *
 * const html3d = new Html3D(label);
 * scene.add(html3d);
 * ```
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
