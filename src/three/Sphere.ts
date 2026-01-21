import * as THREE from 'three';
import { ObjectA3 } from '../core/ObjectA3';

/**
 * SphereGeometryとMeshStandardMaterialでBoxを作る。
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
