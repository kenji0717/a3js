// a3.CharacterTransformerとAvatarControllerのテスト
import * as a3 from 'a3js';

await a3.initPhysics();
const view = new a3.Window(600,300);
view.scene.setPhysicsDebugMode(true);
const ground = await new a3.GLTF('./assets/gba_peach_circuit.glb').ready;
ground.initSimplePhysics({meshCollider:'tri_mesh',rigidBody: 'fixed'});
ground.setPosition(0,-10,0);
view.scene.add(ground);
const obj = await new a3.GLTF('./assets/RobotExpressive.glb').ready;
obj.setScale(0.5,0.5,0.5);
const trans = new a3.KinematicCharacterTransformer(obj);
obj.setTransformer(trans);
obj.setState('Idle');
obj.setPosition(0,5,3);
view.scene.add(obj);
view.setController(new a3.AvatarPositionController(obj));
view.camera.setTransformer(new a3.FollowTransformer(obj));


const obj1 = new a3.Box();
obj1.setPosition(3,0,0);
obj1.initSimplePhysics();
view.scene.add(obj1);

const obj2 = new a3.Box();
obj2.setPosition(-3,0,0);
obj2.initSimplePhysics({rigidBody: 'kinematic'});
view.scene.add(obj2);

let t=0;
while (true) {
  t += await view.waitForRender();
  obj2.setPositionNow(-3,0,3*Math.sin(t));
}
