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
  * BaseViewクラスも参照。
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
  waitForRender(): Promise<number>;
}


/**
 * Viewに必須な機能だけを実装したクラス。
 * これを拡張して新しい表示クラスを作っても良い。
 * CanvasなどはHTMLElementのサブクラスとして実装
 * しないといけないので、このBaseViewのインスタンスを
 * プロパティに保存してラッパーとして実装している。
 */
export class BaseView implements View {
  scene: Scene;
  camera: Camera;
  controller: Controller;

  constructor(camera: Camera) {
    camera.setView(this);
    this.camera = camera;
    this.camera.setAudioListener(Sound.listener);
    this.camera.setPosition(0, 0, 3);
    this.scene = new Scene();
    this.scene.scene.add(this.camera.object3D);
    this.controller = new OrbitController(0,0,0);
    this.controller.setView(this);
    this.controller.activate();
  }

  replaceScene(newScene: Scene): Scene {
    this.scene.scene.remove(this.camera.object3D);
    newScene.scene.add(this.camera.object3D);
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
  }

  /**
   * BaseViewはworldToScreen()を実装することは不可能なので、
   * サブクラスで必ずオーバーライドして自分で実装して下さい。
   * BaseViewをラップして使っている場合も同様です。
   */
  worldToScreen(loc: Vec3): { x: number, y: number } {
    throw new Error(`BaseViewはworldToScreen()は実装していません`);
    loc;
    return {x:0, y:0};
  }
  /**
   * BaseViewはscreenToWorld()を実装することは不可能なので、
   * サブクラスで必ずオーバーライドして自分で実装して下さい。
   * BaseViewをラップして使っている場合も同様です。
   */
  screenToWorld(x: number, y: number, depth: number): Vec3 {
    throw new Error(`BaseViewはscreenToWorld()は実装していません`);
    x; y; depth;
    return new Vec3();
  }
  /**
   * BaseViewはcameraToScreen()を実装することは不可能なので、
   * サブクラスで必ずオーバーライドして自分で実装して下さい。
   * BaseViewをラップして使っている場合も同様です。
   */
  cameraToScreen(loc: Vec3): { x: number, y: number } {
    throw new Error(`BaseViewはcameraToScreen()は実装していません`);
    loc;
    return {x:0,y:0};
  }
  /**
   * BaseViewはscreenToCamera()を実装することは不可能なので、
   * サブクラスで必ずオーバーライドして自分で実装して下さい。
   * BaseViewをラップして使っている場合も同様です。
   */
  screenToCamera(x: number, y: number, depth: number): Vec3 {
    throw new Error(`BaseViewはscreenToCamera()は実装していません`);
    x; y; depth;
    return new Vec3();
  }

  async waitForRender(): Promise<number> {
    throw new Error(`BaseViewはwaitForRender()は実装していません`);
    return 0;
  }
}
