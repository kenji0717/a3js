//import * as THREE from 'three';
//import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { A3Scene } from './A3Scene';
import { A3Camera } from './A3Camera';
import type { A3View } from './A3View';

/**
 * A3Viewに必須な機能だけを実装したクラス。
 * これを拡張して新しい表示クラスを作っても良い。
 * A3CanvasなどはHTMLElementのサブクラスとして実装
 * しないといけないので、このA3ViewBaseのインスタンスを
 * プロパティに保存してラッパーとして実装している。
 */
export class A3ViewBase implements A3View {
  scene: A3Scene;
  camera: A3Camera;
  
  constructor(camera: A3Camera) {
    this.scene = new A3Scene();
    this.camera = camera;
    this.scene.scene.add(this.camera.object);
    this.camera.setLoc(0, 0, 3);
  }

  replaceScene(newScene: A3Scene): A3Scene {
    this.scene.scene.remove(this.camera.object);
    newScene.scene.add(this.camera.object);
    const oldScene = this.scene;
    this.scene = newScene;
    return oldScene;
  }

  updateScene(dt: number) {
    this.scene.update(dt);
  }
}
