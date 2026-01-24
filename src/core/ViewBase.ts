//import * as THREE from 'three';
//import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { Scene } from './Scene';
import { Camera } from './Camera';
import type { View } from './View';
import { OrbitController } from './Controller';
import type { Controller } from './Controller';
import { Label, Balloon } from './ObjectA3';
import type { MutableVec3 } from './Vec3';

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
  controller: Controller;
  labels: Label[] = [];
  balloons: Balloon[] = [];
  
  constructor(camera: Camera) {
    this.scene = new Scene();
    this.camera = camera;
    this.scene.scene.add(this.camera.object);
    this.camera.setLocation(0, 0, 3);
    this.controller = new OrbitController(this,0,0,0);
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
    this.controller?.update(dt);
    this.camera.update(dt);
  }

  setController(controller: Controller) {
    this.controller?.deactivate();
    this.controller = controller;
    this.controller.activate();
  }

  /**
   * ViewBaseはworldToScreen()を実装することは不可能なので、
   * サブクラスで必ずオーバーライドして自分で実装して下さい。
   * ViewBaseをラップして使っている場合も同様です。
   */
  worldToScreen(loc: MutableVec3) {
    throw new Error(`ViewBaseはworldToScreen()は実装していません`);
    const ndc = this.camera.calcNDC(loc);
    return ndc;
  }

  addLabel(label: Label) {
    if (!this.labels.includes(label))
      this.labels.push(label);
  }
  removeLabel(label: Label) {
    const idx = this.labels.indexOf(label);
    if (idx !== -1)
      this.labels.splice(idx,1);
  }
  addBalloon(balloon: Balloon) {
    if (!this.balloons.includes(balloon))
      this.balloons.push(balloon);
  }
  removeBalloon(balloon: Balloon) {
    const idx = this.balloons.indexOf(balloon);
    if (idx !== -1)
      this.balloons.splice(idx,1);
  }
}
