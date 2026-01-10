import { A3Scene } from './A3Scene';
import type { A3Camera } from './A3Camera';
/**
  * A3Canvasなどの3D表示を担当するクラスをまとめるための
  * インターフェース。基本、表示がメインのクラスだが、
  * 初心者用であることを考えてコンストラクタ内で必ず
  * 空のA3SceneとA3Cameraも生成して持っておき、すぐに
  * 表示可能な状態で生成されるようにする。このA3Sceneは、
  * 必要な時に交換することができ、シーンの切り替えができる。
  * 将来的にはTHREE.StereoCameraとかWebXRとか実装したい
  * ところ。
  * 
  * 細かいこととして、これを実装するクラスでは、A3Cameraは
  * A3Sceneに配置した上で、座標(0,0,3)の場所に配置し、
  * (0,0,-1)の方向を向かせて、上は(0,1,0)にするように統一する。
  * A3ViewBaseクラスも参照。
  */
export interface A3View {
  scene: A3Scene;
  camera: A3Camera;
  replaceScene(newScene: A3Scene): A3Scene
}
