import * as THREE from 'three';
import { ObjectA3 } from '../core/ObjectA3';

/**
 * 3D 空間に画像を表示するためのオブジェクトです。
 * 平面（`THREE.PlaneGeometry`）に指定した画像をテクスチャとして貼り付けて表示します。
 *
 * @example
 * ```ts
 * const img = new ImagePlane('image.png');
 * scene.add(img);
 * ```
 */
export class ImagePlane extends ObjectA3 {
  constructor(file: string) {
    super(file);
  }

  // 引数が上とあってなさそうだけど、こうするのが正解
  initObject(file: string) {
    const geo = new THREE.PlaneGeometry(1,1);
    const tex = new THREE.TextureLoader().load(file);
    const mat = new THREE.MeshBasicMaterial({map:tex});
    const mesh = new THREE.Mesh(geo, mat);
    return mesh;
  }
}
