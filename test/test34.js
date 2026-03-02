// CarMotionのテスト
// RapierのDynamicRayCastVehicleController
// を使っている。
import * as a3 from 'a3js';

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
const cm = new a3.CarMotion();
obj.setTransformMotion(cm.transformMotion);
obj.addPoseMotion('default', cm.poseMotion);
obj.setState('default');
view.scene.add(obj);
view.scene.setAvatar(obj);
view.setController(new a3.FollowAvatarController());

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
