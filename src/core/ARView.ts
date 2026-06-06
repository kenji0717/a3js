import * as THREE from 'three';
import { Scene } from './Scene';
import { Camera } from './Camera';
import { BaseView } from './View';
import { XRCamera } from './XRCamera';
import type { View } from './View';
import type { Controller } from './Controller';
import { Vec3 } from './LinearMath';
import { tmp } from '../utils/math';
import { recreateGLTFLoader } from './GLTF';

/**
 * `ARView` の生成オプションです。
 */
export interface ARViewOptions {
  /** 使用するカメラ。省略時はデフォルトの `XRCamera` が使用されます。 */
  camera: XRCamera | undefined;
  /** アンチエイリアスを有効にするかどうか。デフォルトは `false`。 */
  antialias: boolean;
  /**
   * XR セッションに要求するオプション機能の配列。
   * 例: `['dom-overlay', 'light-estimation']`
   */
  optionalFeatures: string[];
  /**
   * XR セッションに必須の機能の配列。
   * 例: `['hit-test']`
   */
  requiredFeatures: string[];
}

/** `ARViewOptions` のデフォルト値です。 */
export const defaultARViewOptions: ARViewOptions = {
  camera: undefined,
  antialias: false,
  optionalFeatures: [],
  requiredFeatures: []
};

/**
 * HTML カスタム要素 `<ar-view-a3>` として使用できる WebXR AR 対応の 3D 表示クラスです。
 *
 * WebXR の "immersive-ar" セッションを使用して AR デバイスへの表示を行います。
 * 「AR に入る」ボタンが自動的に `document.body` に追加されます。
 * 要素自体は非表示で、AR セッション中はカメラ映像の上に 3D オブジェクトが重畳表示されます。
 * `scene`・`camera`・`controller` が生成時に自動的に作られます。
 *
 * @example
 * ```ts
 * const view = new ARView({ requiredFeatures: ['hit-test'] });
 * document.body.appendChild(view);
 *
 * const box = new Box();
 * view.scene.add(box);
 * ```
 */
export class ARView extends HTMLElement implements View {
  /** 生成オプション。 */
  options: ARViewOptions;
  /** `View` の基本機能を提供する `BaseView`。 */
  base: BaseView;
  /** 3D レンダリングに使用する Three.js の `THREE.WebGLRenderer`。XR が有効化されています。 */
  renderer: THREE.WebGLRenderer;
  /** このビューが表示している `Scene`。 */
  scene: Scene;
  /** このビューのカメラ。 */
  camera: Camera;
  /** このビューの入力コントローラー。 */
  controller: Controller;
  /** 内部で使用している Three.js の `THREE.PerspectiveCamera`。 */
  camera3js: THREE.PerspectiveCamera;
  /** フレーム間の経過時間を計測する `THREE.Timer`。 */
  timer: THREE.Timer;
  /** AR セッションへの入口となるボタン要素。`document.body` に追加されます。 */
  arButton: HTMLButtonElement;

  private currentSession: XRSession | null = null;

  constructor(options?: Partial<ARViewOptions>) {
    super();

    this.options = { ...defaultARViewOptions, ...options };

    if (this.options.camera) {
      this.camera3js = this.options.camera.camera;
      this.camera = this.options.camera;
    } else {
      this.camera3js = new THREE.PerspectiveCamera(75, 1, 0.01, 1000);
      this.camera = new XRCamera(this.camera3js);
    }

    this.base = new BaseView(this.camera);
    this.scene = this.base.scene;
    this.camera = this.base.camera;
    this.controller = this.base.controller;
    this.timer = new THREE.Timer();

    this.renderer = new THREE.WebGLRenderer({ antialias: this.options.antialias, alpha: true });
    this.renderer.xr.enabled = true;
    recreateGLTFLoader({ renderer: this.renderer });

    this.arButton = this.createARButton();

    this.renderer.setAnimationLoop(this.renderingLoop);
  }

  connectedCallback() {
    this.appendChild(this.arButton);
  }

  private createARButton(): HTMLButtonElement {
    const button = document.createElement('button');
    button.textContent = 'AR非対応';
    button.disabled = true;

    if (!navigator.xr) return button;

    navigator.xr.isSessionSupported('immersive-ar').then((supported) => {
      if (supported) {
        button.textContent = 'ARに入る';
        button.disabled = false;
        button.addEventListener('click', () => this.onButtonClick());
      } else {
        button.textContent = 'AR非対応';
      }
    });

    return button;
  }

  private async onButtonClick() {
    if (this.currentSession) {
      await this.currentSession.end();
      return;
    }

    const sessionInit: XRSessionInit = {
      optionalFeatures: this.options.optionalFeatures,
      requiredFeatures: this.options.requiredFeatures
    };
    const session = await navigator.xr!.requestSession('immersive-ar', sessionInit);
    this.renderer.xr.setSession(session as any);
    this.currentSession = session;
    this.arButton.textContent = 'ARを終了';

    session.addEventListener('end', () => {
      this.currentSession = null;
      this.arButton.textContent = 'ARに入る';
    });
  }

  disconnectedCallback() {
    this.renderer.setAnimationLoop(null);
    if (this.currentSession) {
      this.currentSession.end();
    }
  }

  replaceScene(newScene: Scene): Scene {
    this.scene = newScene;
    return this.base.replaceScene(newScene);
  }

  setController(controller: Controller): void {
    this.controller = controller;
    this.base.setController(controller);
  }

  private renderingLoop = () => {
    this.timer.update();
    const dt = this.timer.getDelta();
    this.base.updateScene(dt);
    this.renderer.render(this.scene.scene, this.camera3js);
    this.waitingRenderResolves.forEach((resolve) => { resolve(dt); });
    this.waitingRenderResolves = [];
  };

  private waitingRenderResolves: ((dt: number) => void)[] = [];
  waitForRender(): Promise<number> {
    return new Promise((resolve) => {
      this.waitingRenderResolves.push(resolve);
    });
  }

  worldToScreen(loc: Vec3): { x: number; y: number } {
    const v = new THREE.Vector3(loc.x, loc.y, loc.z);
    v.project(this.camera3js);
    const size = new THREE.Vector2();
    this.renderer.getSize(size);
    const x = (v.x + 1) / 2 * size.x;
    const y = (1 - v.y) / 2 * size.y;
    return { x, y };
  }

  screenToWorld(x: number, y: number, depth: number): Vec3 {
    const size = new THREE.Vector2();
    this.renderer.getSize(size);
    const ndc = new THREE.Vector3(
      (x / size.x) * 2 - 1,
      -(y / size.y) * 2 + 1,
      0.5
    );
    ndc.unproject(this.camera3js);
    const dir = ndc.sub(this.camera3js.position).normalize();
    const p = this.camera3js.position;
    return new Vec3(p.x + dir.x * depth, p.y + dir.y * depth, p.z + dir.z * depth);
  }

  cameraToScreen(loc: Vec3): { x: number; y: number } {
    const v = new THREE.Vector3(loc.x, loc.y, loc.z);
    const worldPos = v.applyMatrix4(this.camera3js.matrixWorld);
    tmp.v0.set(worldPos);
    return this.worldToScreen(tmp.v0);
  }

  screenToCamera(x: number, y: number, depth: number): Vec3 {
    const vec = this.screenToWorld(x, y, depth);
    const worldPos = new THREE.Vector3(vec.x, vec.y, vec.z);
    vec.set(worldPos.applyMatrix4(this.camera3js.matrixWorldInverse));
    return vec;
  }

  setShadowMap(value: boolean): void {
    this.renderer.shadowMap.enabled = value;
  }
}

customElements.define('ar-view-a3', ARView);
