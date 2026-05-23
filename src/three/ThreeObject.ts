import * as THREE from 'three';
import { ObjectA3 } from '../core/ObjectA3';

/**
 * Three.js で作成した `THREE.Mesh` などの `Object3D` を a3js のオブジェクトとして扱うためのラッパークラスです。
 *
 * Three.js を使って自分でメッシュを作成した場合に、このクラスを使って `Scene` に追加できます。
 *
 * @example
 * ```ts
 * const geo = new THREE.TorusGeometry();
 * const mat = new THREE.MeshStandardMaterial({ color: 0xff0000 });
 * const torus = new ThreeObject(new THREE.Mesh(geo, mat));
 * scene.add(torus);
 * ```
 */
export class ThreeObject extends ObjectA3 {
  constructor(data: THREE.Object3D) {
    super(data);
  }

  initObject(data: THREE.Object3D) {
    return data;
  }
}
