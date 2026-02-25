// a3.CharactorMotionとAvatarControllerのテスト
import * as a3 from 'a3js';

await a3.initPhysics();
const view = new a3.Window(600,300);
view.scene.rapierDebug(true);
view.camera.setHeadLightEnable(false);
const lights = new a3.StandardLights();
lights.setLocation(1,1,1);
view.scene.add(lights);
const ground = await new a3.GLTF('./assets/gba_peach_circuit.glb').ready;
ground.initSimplePhysics({meshCollider:'tri_mesh',rigidBody: 'fixed'});
ground.setLocation(0,-10,0);
view.scene.add(ground);
const obj = await new a3.GLTF('./assets/RobotExpressive.glb').ready;
obj.setLocation(0,50,13);
const motion = new a3.CharactorTransformMotion(obj);
obj.setTransformMotion(motion);
obj.setLocation(0,50,3);
view.scene.add(obj);
view.scene.setAvatar(obj);
view.setController(new a3.AvatarController());
