// CarControlのテスト1。stk_tux.a3
// RapierのDynamicRayCastVehicleController
// を使っている。RapierのDynamicRayCastVehicleControllerは
// 未完成なところがあるんだと思う。なので少し工夫しないと
// ならない。詳しくは[memo.md](../memo.md)参照。
import * as a3 from 'a3js';

const stk_kart = {
  mass: 10.0, // ブレーキの効きが悪いので、こちらで調節することにした
  chassisWidth: 0.7,
  chassisHeight: 0.5,
  chassisLength: 1.5,
  chassisOffset: {x:  0.0, y: -0.25,  z:  0.0 },
  wheelFrontYPosition: -0.05,
  wheelFrontZPosition: 0.40,
  wheelFrontAxleLength: 0.6,
  wheelRearYPosition: -0.00,
  wheelRearZPosition: -0.35,
  wheelRearAxleLength: 0.7,
  wheelFrontRadius: 0.1,
  wheelRearRadius: 0.15,
  wheelFrontWidth: 0.19,
  wheelRearWidth: 0.24,
  wheelFrontSuspensionRestLength: 0.26,
  wheelRearSuspensionRestLength: 0.25,
  wheelFrontSuspensionStiffness: 200.0, // ほとんど述び縮みしない設定
  wheelRearSuspensionStiffness: 250.0, // ほとんど述び縮みしない設定
  wheelFrontSuspensionCompression: 4.0,
  wheelRearSuspensionCompression: 4.0,
  wheelFrontSuspensionRelaxation: 10.0,
  wheelRearSuspensionRelaxation: 10.0,
  wheelFrontMaxSuspensionTravel: 0.05, // ほとんど述び縮みしない設定
  wheelRearMaxSuspensionTravel: 0.05, // ほとんど述び縮みしない設定
  aerodynamicDrag: 0.5, // 空気抵抗
};

await a3.initPhysics();
const view = new a3.Window(600,300);
view.scene.rapierDebug(true);
const ground = await new a3.GLTF('./assets/gba_peach_circuit.glb').ready;
ground.initSimplePhysics({meshCollider:'tri_mesh',rigidBody: 'fixed'});
ground.setLocationNow(0,0,0);
view.scene.add(ground);
const obj = await new a3.Acerola3D('./assets/stk_tux.a3').ready;
const cc = new a3.CarControl(stk_kart);
obj.setTransformer(cc.trans);
obj.getAction('default').motion = cc.motion;
obj.setState('default');
view.scene.add(obj);
view.camera.setTransformer(new a3.FollowTransformer(obj));

let t=0;
while (true) {
  t += await view.waitForRender();
  if (Math.floor(t/5)%2===0) {
    cc.accelerator(8);
  } else {
    cc.accelerator(-8);
  }
}
