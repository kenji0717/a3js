//import * as THREE from 'three';
//import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { Scene } from './Scene';
import type { Camera } from './Camera';
import type { Controller } from './Controller';
import { Vec3 } from './LinearMath';
import { OrbitController } from './Controller';
import { Sound } from '../three/Sound';


/**
 * 3D 表示を担うクラスが実装するインターフェースです。
 *
 * `Canvas`・`Window`・`GameCanvas` などはすべてこのインターフェースを実装しています。
 * `scene`・`camera`・`controller` を持ち、生成直後から表示できる状態で作られます。
 * `replaceScene()` でシーンを切り替えることができます。
 */
export interface View {
  /** このビューが表示している `Scene`。 */
  scene: Scene;
  /** このビューのカメラ。初期位置は `(0, 0, 3)` です。 */
  camera: Camera;
  /** このビューの入力コントローラー。デフォルトは `OrbitController` です。 */
  controller: Controller;
  /**
   * このビューが表示するシーンを切り替えます。
   * @param newScene 新しいシーン
   * @returns 古いシーン
   */
  replaceScene(newScene: Scene): Scene;
  /**
   * 入力コントローラーを切り替えます。
   * @param controller 新しいコントローラー
   */
  setController(controller: Controller): void;
  /**
   * ワールド座標を画面上のピクセル座標に変換します。
   * @param loc ワールド座標
   * @returns 画面上のピクセル座標 `{ x, y }`
   */
  worldToScreen(loc: Vec3): { x: number, y: number };
  /**
   * 画面上のピクセル座標をワールド座標に変換します。
   * @param x 画面上の x 座標
   * @param y 画面上の y 座標
   * @param depth カメラからの深度（クリップ座標系）
   * @returns ワールド座標
   */
  screenToWorld(x: number, y: number, depth: number): Vec3;
  /**
   * カメラ座標を画面上のピクセル座標に変換します。
   * @param loc カメラ座標
   * @returns 画面上のピクセル座標 `{ x, y }`
   */
  cameraToScreen(loc: Vec3): { x: number, y: number };
  /**
   * 画面上のピクセル座標をカメラ座標に変換します。
   * @param x 画面上の x 座標
   * @param y 画面上の y 座標
   * @param depth カメラからの深度
   * @returns カメラ座標
   */
  screenToCamera(x: number, y: number, depth: number): Vec3;
  /**
   * 次のフレームが描画されるまで待機します。
   * @returns 経過時間（ミリ秒）を解決する `Promise`
   */
  waitForRender(): Promise<number>;
  /**
   * このViewのレンダラが影の描画のためのShadowMapを有効にするかどうかを設定します。
   * @param value `true`の時は有効にします。`false`の時は無効にします。
   */
  setShadowMap(value: boolean): void;
}


/**
 * `View` インターフェースの基本実装クラスです。
 * `Canvas` などの HTML 要素は `BaseView` を内部にプロパティとして持ちラッパーとして実装されています。
 * 独自の表示クラスを作る場合は、このクラスを継承するか参考にしてください。
 */
export class BaseView implements View {
  /** このビューが表示している `Scene`。 */
  scene: Scene;
  /** このビューのカメラ。 */
  camera: Camera;
  /** このビューの入力コントローラー。 */
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

  /**
   * シーンの更新処理を行います。毎フレーム呼び出される内部メソッドです。
   * @param dt 前フレームからの経過時間（秒）
   */
  updateScene(dt: number) {
    this.scene.update(dt);
    this.controller?.update(dt);
    this.camera.update(dt);
  }

  /**
   * 入力コントローラーを切り替えます。
   * 現在のコントローラーを無効化してから新しいコントローラーを有効化します。
   * @param controller 新しいコントローラー
   */
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

  setShadowMap(_value: boolean) {
    throw new Error(`BaseViewはsetShadowMap()は実装していません`);
  }
}
