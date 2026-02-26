import * as THREE from 'three';
import { ObjectA3 } from '../core/ObjectA3';

/**
 * PlaneGeometryにテクスチャとして画像を貼り付けて
 * 3D空間中に画像を表示させる。
 */
export class Image extends ObjectA3 {
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
