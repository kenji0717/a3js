import * as THREE from 'three';
import { ObjectA3 } from '../core/ObjectA3';

/**
 * 標準的なライティングを提供する光源オブジェクトです。
 * 太陽光に相当する `THREE.DirectionalLight`（指向性ライト）と、
 * 全体を均一に照らす `THREE.AmbientLight`（環境光）の組み合わせです。
 *
 * `MeshStandardMaterial` を使ったオブジェクトを正しく表示するには光源が必要です。
 *
 * @example
 * ```ts
 * const lights = new StandardLights();
 * scene.add(lights);
 * ```
 */
export class StandardLights extends ObjectA3 {
    constructor() {
        super();
    }

    initObject() {
        const o = new THREE.Object3D();
        // 光源を作る1(太陽)
        const light1 = new THREE.DirectionalLight(0xFFFFFF);
        light1.position.set(1,1,1);
        o.add(light1);
        // 光源を作る2(環境光)
        const light2 = new THREE.AmbientLight(0x404040);
        o.add(light2);
        return o;
    }
}
