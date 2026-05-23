import * as THREE from 'three';
import { Camera } from './Camera';
import { isPerspectiveCamera } from '../utils/TypeGuard';
import { Vec3 } from './LinearMath';

/**
 * Three.js の `THREE.Camera`（透視投影カメラなど）を a3js のカメラとして使用するためのラッパーです。
 * ヘッドライト（スポットライト）を内蔵しており、カメラと一緒に移動します。
 *
 * `Canvas`・`Window`・`GameCanvas` はデフォルトで透視投影カメラを持つ `ThreeCamera` を生成します。
 *
 * @example
 * ```ts
 * // 視野角 60° の透視投影カメラを作成する
 * const threeCamera = new ThreeCamera(new THREE.PerspectiveCamera(60, 16/9, 0.1, 1000));
 * ```
 */
export class ThreeCamera extends Camera {
  /** 内部で使用している Three.js の `THREE.Camera`。 */
  camera: THREE.Camera;
  /** カメラに取り付けられているヘッドライト（`THREE.SpotLight`）。 */
  headLight: THREE.SpotLight;

  constructor(camera: THREE.Camera) {
    super();
    this.camera = camera;
    this.headLight = new THREE.SpotLight(0xffffff,1,0,Math.PI/3,0,0);
    this.headLight.position.set(0,0,0);
    const lightTarget = new THREE.Object3D();
    lightTarget.position.set(0,0,-10);
    this.headLight.target = lightTarget;
    this.object3D.add(this.camera);
    this.object3D.add(this.headLight);
    this.object3D.add(lightTarget);
  }

  initObject() {
    return new THREE.Object3D();
  }

  setAudioListener(listener: THREE.AudioListener) {
    this.camera.add(listener);
  }

  /**
   * ヘッドライト（`THREE.SpotLight`）を返します。
   * 強度や角度などを直接カスタマイズしたい場合に使用します。
   * @returns ヘッドライト
   */
  getHeadLight() { return this.headLight; }

  /**
   * カメラのアスペクト比（横幅÷縦幅）を設定します。
   * ウィンドウのリサイズ時などに呼び出します。
   * 透視投影カメラ（`THREE.PerspectiveCamera`）以外には効果がありません。
   * @param aspect 新しいアスペクト比
   */
  setAspect(aspect: number) {
    if (isPerspectiveCamera(this.camera)) {
      this.camera.aspect = aspect;
      this.camera.updateProjectionMatrix();
    }
  }

  setHeadLightEnable(b: boolean) {
    if (b)
      this.headLight.intensity = 1;
    else
      this.headLight.intensity = 0;
  }

  calcNDC(loc: Vec3) {
    const v = new THREE.Vector3(loc.x,loc.y,loc.z);
    v.project(this.camera);
    return { x: v.x, y: v.y };
  }
}
