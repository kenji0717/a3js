// CarControlのテスト
// RapierのDynamicRayCastVehicleController
// を使っている。
import * as a3 from 'a3js';

const stk_kart = {
  mass: 10.0, // ブレーキの効きが悪いので、こちらで調節することにした
  chassisWidth: 0.7,
  chassisHeight: 0.5,
  chassisLength: 1.5,
  chassisOffset: {x:  0.0, y: -0.25,  z:  0.0 },
  wheelFLPosition: {x:  0.30, y: -0.05,  z:  0.40 },
  wheelFRPosition: {x: -0.30, y: -0.05,  z:  0.40 },
  wheelRLPosition: {x:  0.35, y: -0.00,   z: -0.35 },
  wheelRRPosition: {x: -0.35, y: -0.00,   z: -0.35 },
  wheelFLRadius: 0.1,
  wheelFRRadius: 0.1,
  wheelRLRadius: 0.15,
  wheelRRRadius: 0.15,
  wheelFLWidth: 0.19,
  wheelFRWidth: 0.19,
  wheelRLWidth: 0.24,
  wheelRRWidth: 0.24,
  wheelFLSuspensionRestLength: 0.26,
  wheelFRSuspensionRestLength: 0.26,
  wheelRLSuspensionRestLength: 0.25,
  wheelRRSuspensionRestLength: 0.25,
  wheelFLSuspensionStiffness: 200.0, // ほとんど述び縮みしない設定
  wheelFRSuspensionStiffness: 200.0, // ほとんど述び縮みしない設定
  wheelRLSuspensionStiffness: 250.0, // ほとんど述び縮みしない設定
  wheelRRSuspensionStiffness: 250.0, // ほとんど述び縮みしない設定
  wheelFLSuspensionCompression: 4.0,
  wheelFRSuspensionCompression: 4.0,
  wheelRLSuspensionCompression: 4.0,
  wheelRRSuspensionCompression: 4.0,
  wheelFLSuspensionRelaxation: 10.0,
  wheelFRSuspensionRelaxation: 10.0,
  wheelRLSuspensionRelaxation: 10.0,
  wheelRRSuspensionRelaxation: 10.0,
  wheelFLMaxSuspensionTravel: 0.05, // ほとんど述び縮みしない設定
  wheelFRMaxSuspensionTravel: 0.05, // ほとんど述び縮みしない設定
  wheelRLMaxSuspensionTravel: 0.05, // ほとんど述び縮みしない設定
  wheelRRMaxSuspensionTravel: 0.05 // ほとんど述び縮みしない設定
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
view.scene.setAvatar(obj);
view.setController(new a3.FollowAvatarController());

let t=0;
while (true) {
  t += await view.waitForRender();
  if (Math.floor(t/5)%2===0) {
    cc.accelerator(8);
  } else {
    cc.accelerator(-8);
  }
}
