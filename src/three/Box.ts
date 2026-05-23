import * as THREE from 'three';
import { ObjectA3 } from '../core/ObjectA3';

/**
 * 直方体（ボックス）の 3D オブジェクトです。
 * `THREE.BoxGeometry` と `THREE.MeshStandardMaterial`（標準的な光の反射を持つマテリアル）で作られます。
 *
 * コンストラクタに数値を渡すと幅・高さ・奥行きを指定できます。
 * 文字列を渡すと色を指定できます（CSS カラー文字列 / 16進数）。
 *
 * @example
 * ```ts
 * // 幅1、高さ2、奥行き1の灰色のボックス（デフォルト）
 * const box = new Box();
 *
 * // 幅2、高さ1、奥行き1の赤いボックス
 * const box = new Box(2, 1, 1, 'red');
 * ```
 */
export class Box extends ObjectA3 {
  constructor(...args: (number | string)[]) {
    super(args);
  }

  // 引数が上とあってなさそうだけど、こうするのが正解
  initObject(args: (number | string)[]) {
    const nums = args.filter((a): a is number => typeof a === "number");
    const strs = args.filter((a): a is string => typeof a === "string");
    const geo = new THREE.BoxGeometry(...nums);
    const c = strs.length > 0 ? strs[0] : "rgb(128,128,128)";
    const mat = new THREE.MeshStandardMaterial({color:c});
    const mesh = new THREE.Mesh(geo, mat);
    return mesh;
  }
}
