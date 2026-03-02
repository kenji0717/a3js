// RapierのJointのプログラム方法(3Dモデル使用)
// Acerola3Dのモデルを使ってリヤカー作る。
// 一つクラス作らなくて済むので少しだけ楽。
import * as a3 from 'a3js';
import * as THREE from 'three';
import RAPIER from "@dimforge/rapier3d-compat";

await a3.initPhysics();
const view = new a3.Window(600,300);
view.scene.rapierDebug(true);
const ground = new a3.Box(10,1,10);
ground.initSimplePhysics({rigidBody: 'fixed'});
ground.setLocationNow(0,-2,0);
view.scene.add(ground);
const obj = await new a3.Acerola3D('./assets/stk_tux.a3').ready;
const cm = new a3.CarMotion();
obj.setTransformMotion(cm.transformMotion);
obj.addPoseMotion('default', cm.poseMotion);
obj.setState('default');
view.scene.add(obj);
view.camera.setLocationNow(0,10,20);
view.camera.lookAtNow(0,-3,0);

let t=0;
while (true) {
  t += await view.waitForRender();
  if (Math.floor(t/5)%2===0) {
    cm.setWheelEngineForce(0,30);
    cm.setWheelEngineForce(1,30);
  } else {
    cm.setWheelEngineForce(0,-30);
    cm.setWheelEngineForce(1,-30);
  }
}
