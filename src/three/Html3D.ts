//import * as THREE from 'three';
import { ObjectA3 } from '../core/ObjectA3';
import { CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';

/**
 * HTML 要素を 3D 空間内の特定位置に表示するためのオブジェクトです。
 * CSS2DRenderer を使って、3D オブジェクトに追従する HTML ラベルやアイコンを表示できます。
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
    // view.scene.remove(html);のようなプログラムを書いても消えてくれないので、
    // 以下の実装を追加。たぶんThree.jsのCSS3DObjectのバグ。
    const css2dObj = this.object3D.children[0] as CSS2DObject;
    this.object3D.addEventListener('removed', () => {
      css2dObj.element.remove();
    });
  }

  // 引数が上とあってなさそうだけど、こうするのが正解
  initObject(element: HTMLElement) {
    return new CSS2DObject(element);
  }
}
