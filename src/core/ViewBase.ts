//import * as THREE from 'three';
//import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { Scene } from './Scene';
import { Camera } from './Camera';
import type { View } from './View';

/**
 * Viewに必須な機能だけを実装したクラス。
 * これを拡張して新しい表示クラスを作っても良い。
 * CanvasなどはHTMLElementのサブクラスとして実装
 * しないといけないので、このViewBaseのインスタンスを
 * プロパティに保存してラッパーとして実装している。
 */
export class ViewBase implements View {
  scene: Scene;
  camera: Camera;
  
  constructor(camera: Camera) {
    this.scene = new Scene();
    this.camera = camera;
    this.scene.scene.add(this.camera.object);
    this.camera.setLocation(0, 0, 3);
  }

  replaceScene(newScene: Scene): Scene {
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
