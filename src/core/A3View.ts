import type { A3Transform } from './A3Transform';
/**
  * A3Canvasなどの3D表示を担当するクラスをまとめるための
  * インターフェース。つまり必ず同じ操作ができるcameraを
  * 必ず持っているということ。将来的にはTHREE.StereoCameraとか
  * WebXRとか実装したいところ。
  */
export interface A3View {
  camera: A3Transform;
}
