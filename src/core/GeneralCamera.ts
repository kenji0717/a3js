import * as THREE from 'three';
import { Camera } from './Camera';
import { isPerspectiveCamera } from '../utils/TypeGuard';
import { Vec3 } from './LinearMath';

/**
 * Three.jsのPerspectiveCameraとかの一般的なカメラを
 * a3jsのカメラにするためのラッパー。ヘッドライトは
 * SpotLightで実装。
 */
export class GeneralCamera extends Camera {
  camera: THREE.Camera;
  headLight: THREE.SpotLight;

  constructor(camera: THREE.Camera) {
    super();
    this.camera = camera;
    this.headLight = new THREE.SpotLight(0xffffff,1,0,Math.PI/3,0,0);
    this.headLight.rotation.x = 3.14/2;
    this.object.add(this.camera);
    this.object.add(this.headLight);
  }

  initObject() {
    return new THREE.Object3D();
  }

  setAudioListener(listener: THREE.AudioListener) {
    this.camera.add(listener);
  }

  getHeadLight() { return this.headLight; }

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

