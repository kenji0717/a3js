//import * as THREE from 'three';
//import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { Scene } from './Scene';
import { Camera } from './Camera';
import type { View } from './View';
import { OrbitController } from './Controller';
import type { Controller } from './Controller';
import type { MutableVec3 } from './Vec3';
import { Sound } from '../three/Sound';

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
  
  constructor(camera: Camera) {
    this.scene = new Scene();
    this.camera = camera;
    this.camera.setAudioListener(Sound.listener);
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
  worldToScreen(loc: MutableVec3): { x: number, y: number } {
    throw new Error(`ViewBaseはworldToScreen()は実装していません`);
    loc;
    return {x:0, y:0};
  }
  /**
   * ViewBaseはscreenToWorld()を実装することは不可能なので、
   * サブクラスで必ずオーバーライドして自分で実装して下さい。
   * ViewBaseをラップして使っている場合も同様です。
   */
  screenToWorld(x: number, y: number, depth: number): MutableVec3 {
    throw new Error(`ViewBaseはscreenToWorld()は実装していません`);
    x; y; depth;
    return {x:0,y:0,z:0};
  }
  /**
   * ViewBaseはcameraToScreen()を実装することは不可能なので、
   * サブクラスで必ずオーバーライドして自分で実装して下さい。
   * ViewBaseをラップして使っている場合も同様です。
   */
  cameraToScreen(loc: MutableVec3): { x: number, y: number } {
    throw new Error(`ViewBaseはcameraToScreen()は実装していません`);
    loc;
    return {x:0,y:0};
  }
  /**
   * ViewBaseはscreenToCamera()を実装することは不可能なので、
   * サブクラスで必ずオーバーライドして自分で実装して下さい。
   * ViewBaseをラップして使っている場合も同様です。
   */
  screenToCamera(x: number, y: number, depth: number): MutableVec3 {
    throw new Error(`ViewBaseはscreenToCamera()は実装していません`);
    x; y; depth;
    return {x:0,y:0,z:0};
  }
}
