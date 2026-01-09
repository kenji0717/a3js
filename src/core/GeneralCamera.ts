import * as THREE from 'three';
import type { A3Camera } from './A3Camera';

/**
 * Three.jsのPerspectiveCameraとかの一般的なカメラを
 * A3Transformに対応させ、サイズ変更に対応させるためのラッパー。
 * 初心者用ということで、カメラにはデフォルトでヘッドライトが
 * 付いているものとし、これのOnとOffもできるようにする。
 */
export class GeneralCamera implements A3Camera {
  camera: THREE.Camera;
  headLight: THREE.SpotLight;

  constructor(camera: THREE.Camera) {
    this.camera = camera;
    this.headLight = new THREE.SpotLight(0xffffff,1,0,Math.PI/3,0,0);
    this.headLight.rotation.x = 3.14/2;
  }

  setAspect(aspect: number) {
    if (isPerspectiveCamera(this.camera)) {
      this.camera.aspect = aspect;
      this.camera.updateProjectionMatrix();
    }
  }

  setLoc(x: number, y: number, z: number) {
    this.camera.position.set(x,y,z);
    this.headLight.position.set(x,y,z);
  }

  disableHeadlight() {
    this.headLight.intensity = 0;
  }

  enableHeadlight() {
    this.headLight.intensity = 1;
  }
}

// カメラの種類を判別する関数が必要っぽい。
function isPerspectiveCamera(
  camera: THREE.Camera
): camera is THREE.PerspectiveCamera {
  return (camera as any).isPerspectiveCamera === true;
}
