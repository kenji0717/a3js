// CarMotionのテスト
// RapierのDynamicRayCastVehicleController
// を使っている。
import * as a3 from 'a3js';

const stk_kart = {
  mass: 100.0,
  chassisWidth: 0.7,
  chassisHeight: 0.5,
  chassisLength: 1.5,
  wheelFLPosition: {x:  0.3, y: 0.0,  z:  0.3 },
  wheelFRPosition: {x: -0.3, y: 0.0,  z:  0.3 },
  wheelRLPosition: {x:  0.3, y: 0.0, z: -0.35 },
  wheelRRPosition: {x: -0.3, y: 0.0, z: -0.35 },
  wheelFLRadius: 0.15,
  wheelFRRadius: 0.15,
  wheelRLRadius: 0.2,
  wheelRRRadius: 0.2,
  wheelFLWidth: 0.15,
  wheelFRWidth: 0.15,
  wheelRLWidth: 0.2,
  wheelRRWidth: 0.2,
  wheelFLSuspensionRestLength: 0.2,
  wheelFRSuspensionRestLength: 0.2,
  wheelRLSuspensionRestLength: 0.2,
  wheelRRSuspensionRestLength: 0.2,
  wheelFLSuspensionStiffness: 10.0,
  wheelFRSuspensionStiffness: 10.0,
  wheelRLSuspensionStiffness: 10.0,
  wheelRRSuspensionStiffness: 10.0
};

await a3.initPhysics();
const view = new a3.Window(600,300);
view.scene.rapierDebug(true);
view.camera.setHeadLightEnable(false);
const lights = new a3.StandardLights();
lights.setLocation(100,100,100);
view.scene.add(lights);
const ground = await new a3.GLTF('./assets/gba_peach_circuit.glb').ready;
ground.initSimplePhysics({meshCollider:'tri_mesh',rigidBody: 'fixed'});
ground.setLocationNow(0,0,0);
view.scene.add(ground);
const obj = await new a3.Acerola3D('./assets/stk_tux.a3').ready;
const cm = new a3.CarMotion(stk_kart);
obj.setTransformMotion(cm.trans);
obj.getAction('default').motion = cm.pose;
obj.setState('default');
view.scene.add(obj);
view.scene.setAvatar(obj);
view.setController(new a3.FollowAvatarController());

let t=0;
while (true) {
  t += await view.waitForRender();
  if (Math.floor(t/5)%2===0) {
    cm.accelerator(200);
  } else {
    cm.accelerator(-200);
  }
}
