//import * as THREE from 'three';
//import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { Scene } from './Scene';
import type { Camera } from './Camera';
import type { Controller } from './Controller';
import { Vec3 } from './LinearMath';
import { OrbitController } from './Controller';
import { Sound } from '../three/Sound';


/**
  * Canvasなどの3D表示を担当するクラスをまとめるための
  * インターフェース。基本、表示がメインのクラスだが、
  * 初心者用であることを考えてコンストラクタ内で必ず
  * 空のSceneとCameraも生成して持っておき、すぐに
  * 表示可能な状態で生成されるようにする。このSceneは、
  * 必要な時に交換することができ、シーンの切り替えができる。
  * 将来的にはTHREE.StereoCameraとかWebXRとか実装したい
  * ところ。
  * 
  * 細かいこととして、これを実装するクラスでは、Cameraは
  * Sceneに配置した上で、座標(0,0,3)の場所に配置し、
  * (0,0,-1)の方向を向かせて、上は(0,1,0)にするように統一する。
  * ViewBaseクラスも参照。
  */
export interface View {
  scene: Scene;
  camera: Camera;
  controller: Controller;
  replaceScene(newScene: Scene): Scene
  setController(controller: Controller): void;
  worldToScreen(loc: Vec3): { x: number, y: number };
  screenToWorld(x: number, y: number, depth: number): Vec3;
  cameraToScreen(loc: Vec3): { x: number, y: number };
  screenToCamera(x: number, y: number, depth: number): Vec3;
  waitForRender(): Promise<void>;
}


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
    this.controller = new OrbitController(0,0,0);
    this.controller.setView(this);
    this.controller.activate();
    this.camera.setController(this.controller);
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
    this.controller.deactivate();
    this.controller = controller;
    this.controller.setView(this);
    this.controller.activate();
    this.camera.setController(controller);
  }

  /**
   * ViewBaseはworldToScreen()を実装することは不可能なので、
   * サブクラスで必ずオーバーライドして自分で実装して下さい。
   * ViewBaseをラップして使っている場合も同様です。
   */
  worldToScreen(loc: Vec3): { x: number, y: number } {
    throw new Error(`ViewBaseはworldToScreen()は実装していません`);
    loc;
    return {x:0, y:0};
  }
  /**
   * ViewBaseはscreenToWorld()を実装することは不可能なので、
   * サブクラスで必ずオーバーライドして自分で実装して下さい。
   * ViewBaseをラップして使っている場合も同様です。
   */
  screenToWorld(x: number, y: number, depth: number): Vec3 {
    throw new Error(`ViewBaseはscreenToWorld()は実装していません`);
    x; y; depth;
    return new Vec3();
  }
  /**
   * ViewBaseはcameraToScreen()を実装することは不可能なので、
   * サブクラスで必ずオーバーライドして自分で実装して下さい。
   * ViewBaseをラップして使っている場合も同様です。
   */
  cameraToScreen(loc: Vec3): { x: number, y: number } {
    throw new Error(`ViewBaseはcameraToScreen()は実装していません`);
    loc;
    return {x:0,y:0};
  }
  /**
   * ViewBaseはscreenToCamera()を実装することは不可能なので、
   * サブクラスで必ずオーバーライドして自分で実装して下さい。
   * ViewBaseをラップして使っている場合も同様です。
   */
  screenToCamera(x: number, y: number, depth: number): Vec3 {
    throw new Error(`ViewBaseはscreenToCamera()は実装していません`);
    x; y; depth;
    return new Vec3();
  }

  async waitForRender(): Promise<void> {
    throw new Error(`ViewBaseはwaitForRender()は実装していません`);
    return;
  }
}
