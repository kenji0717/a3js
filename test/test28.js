// a3.CharactorMotionとAvatarControllerのテスト
import * as a3 from 'a3js';

await a3.initPhysics();
const view = new a3.Window(600,300);
view.scene.rapierDebug(true);
view.camera.setHeadLightEnable(false);
const lights = new a3.StandardLights();
lights.setLocation(100,100,-100);
view.scene.add(lights);
const ground = await new a3.GLTF('./assets/gba_peach_circuit.glb').ready;
ground.initSimplePhysics({meshCollider:'tri_mesh',rigidBody: 'fixed'});
ground.setLocation(0,-10,0);
view.scene.add(ground);
const obj = await new a3.GLTF('./assets/RobotExpressive.glb').ready;
//obj.setScale(0.5,0.5,0.5);
obj.setLocation(0,50,13);
obj.setState('Idle');
const trans = new a3.CharactorTransformer(obj);
obj.setTransformer(trans);
obj.setLocation(0,5,3);
view.scene.add(obj);
view.scene.setAvatar(obj);
view.setController(new a3.AvatarController());
