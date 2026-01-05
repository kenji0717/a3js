import * as THREE from 'three';
import type { A3Transform } from './A3Transform';

/**
  * Three.jsのPerspectiveCameraとかの一般的なカメラを
  * A3Transformに対応させ、サイズ変更に対応させるためのラッパー
  */
export class GeneralCamera implements A3Transform {
  camera: THREE.Camera;

  constructor(camera: THREE.Camera) {
    this.camera = camera;
  }

  setAspect(aspect: number) {
    if (isPerspectiveCamera(this.camera)) {
      this.camera.aspect = aspect;
      this.camera.updateProjectionMatrix();
    }
  }

  setLoc(x: number, y: number, z: number) {
    this.camera.position.set(x,y,z);
  }
}

// カメラの種類を判別する関数が必要っぽい。
function isPerspectiveCamera(
  camera: THREE.Camera
): camera is THREE.PerspectiveCamera {
  return (camera as any).isPerspectiveCamera === true;
}
