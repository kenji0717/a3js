// a3.CharactorTransformerとAvatarControllerのテスト
import * as a3 from 'a3js';

await a3.initPhysics();
const view = new a3.Window(600,300);
view.scene.rapierDebug(true);
const ground = await new a3.GLTF('./assets/gba_peach_circuit.glb').ready;
ground.initSimplePhysics({meshCollider:'tri_mesh',rigidBody: 'fixed'});
ground.setLocation(0,-10,0);
view.scene.add(ground);
const obj = await new a3.GLTF('./assets/RobotExpressive.glb').ready;
obj.setScale(0.5,0.5,0.5);
const trans = new a3.CharactorTransformer(obj);
obj.setTransformer(trans);
obj.setState('Idle');
obj.setLocation(0,5,3);
view.scene.add(obj);
view.setController(new a3.AvatarController(obj));
view.camera.setTransformer(new a3.FollowTransformer(obj));
