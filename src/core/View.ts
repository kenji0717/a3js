import { Scene } from './Scene';
import type { Camera } from './Camera';
import type { Controller } from './Controller';
import type { MutableVec3 } from './Vec3';
import type { Label, Balloon } from './ObjectA3';
/**
  * Canvasなどの3D表示を担当するクラスをまとめるための
  * インターフェース。基本、表示がメインのクラスだが、
  * 初心者用であることを考えてコンストラクタ内で必ず
  * 空のSceneとCameraも生成して持っておき、すぐに
  * 表示可能な状態で生成されるようにする。このSceneは、
  * 必要な時に交換することができ、シーンの切り替えができる。
  * 将来的にはTHREE.StereoCameraとかWebXRとか実装したい
  * ところ。
  * 
  * 細かいこととして、これを実装するクラスでは、Cameraは
  * Sceneに配置した上で、座標(0,0,3)の場所に配置し、
  * (0,0,-1)の方向を向かせて、上は(0,1,0)にするように統一する。
  * ViewBaseクラスも参照。
  */
export interface View {
  scene: Scene;
  camera: Camera;
  controller: Controller;
  replaceScene(newScene: Scene): Scene
  setController(controller: Controller): void;
  worldToScreen(loc: MutableVec3): { x: number, y: number };
  addLabel(label: Label): void;
  removeLabel(label: Label): void;
  addBalloon(balloon: Balloon): void;
  removeBalloon(balloon: Balloon): void;
}
