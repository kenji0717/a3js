import * as THREE from 'three';
import { ObjectA3 } from '../core/ObjectA3';

/**
 * 球体の 3D オブジェクトです。
 * `THREE.SphereGeometry` と `THREE.MeshStandardMaterial`（標準的な光の反射を持つマテリアル）で作られます。
 *
 * コンストラクタに数値を渡すと半径・水平セグメント数・垂直セグメント数を指定できます。
 * 文字列を渡すと色を指定できます（CSS カラー文字列 / 16進数）。
 *
 * @example
 * ```ts
 * // 半径1の灰色の球体（デフォルト）
 * const sphere = new Sphere();
 *
 * // 半径0.5の青い球体
 * const sphere = new Sphere(0.5, 16, 8, 'blue');
 * ```
 */
export class Sphere extends ObjectA3 {
  constructor(...args: (number | string)[]) {
    super(args);
  }

  // 引数が上とあってなさそうだけど、こうするのが正解
  initObject(args: (number | string)[]) {
    const nums = args.filter((a): a is number => typeof a === "number");
    const strs = args.filter((a): a is string => typeof a === "string");
    const geo = new THREE.SphereGeometry(...nums);
    const c = strs.length > 0 ? strs[0] : "rgb(128,128,128)";
    const mat = new THREE.MeshStandardMaterial({color:c});
    const mesh = new THREE.Mesh(geo, mat);
    return mesh;
  }
}
