import * as THREE from 'three';
import { Camera } from './Camera';
import { Vec3 } from './LinearMath';

/**
 * WebXR（VR・AR）用のカメラクラスです。
 * `VRView` および `ARView` のデフォルトカメラとして使用されます。
 * ヘッドライト（スポットライト）を内蔵しており、カメラと一緒に移動します。
 *
 * XR セッション中は、ヘッドセットのトラッキングデータがこのカメラに自動的に反映されます。
 *
 * @example
 * ```ts
 * const xrCamera = new XRCamera();
 * const vrView = new VRView({ camera: xrCamera });
 * ```
 */
export class XRCamera extends Camera {
  /** 内部で使用している Three.js の `THREE.PerspectiveCamera`。 */
  camera: THREE.PerspectiveCamera;
  /** カメラに取り付けられているヘッドライト（`THREE.SpotLight`）。 */
  headLight: THREE.SpotLight;

  /**
   * XR カメラを作成します。
   * @param camera 使用する `THREE.PerspectiveCamera`。省略時はデフォルトの設定で作成されます。
   */
  constructor(camera?: THREE.PerspectiveCamera) {
    super();
    this.camera = camera ?? new THREE.PerspectiveCamera(75, 1, 0.01, 1000);
    this.headLight = new THREE.SpotLight(0xffffff, 1, 0, Math.PI / 3, 0, 0);
    this.headLight.position.set(0, 0, 0);
    const lightTarget = new THREE.Object3D();
    lightTarget.position.set(0, 0, -10);
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
   * カメラのヘッドライトの有効・無効を切り替えます。
   * @param b `true` で有効、`false` で無効
   */
  setHeadLightEnable(b: boolean) {
    this.headLight.intensity = b ? 1 : 0;
  }

  calcNDC(loc: Vec3) {
    const v = new THREE.Vector3(loc.x, loc.y, loc.z);
    v.project(this.camera);
    return { x: v.x, y: v.y };
  }
}
