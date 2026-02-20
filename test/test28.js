// a3.CharactorMotionのテスト
import * as a3 from 'a3js';

await a3.initPhysics();
const view = new a3.Window(600,300);
view.scene.rapierDebug(true);
const ground = await new a3.GLTF('./assets/gba_peach_circuit.glb').ready;
ground.initSimplePhysics({meshCollider:'tri_mesh',rigidBody: 'fixed'});
view.scene.add(ground);
const obj = await new a3.GLTF('./assets/RobotExpressive.glb').ready;
obj.setScaleNow(0.5,0.5,0.5);
obj.setLocationNow(0,5,3);
const motion = new a3.CharactorTransformMotion(obj);
obj.setTransformMotion(motion);
view.scene.add(obj);
view.scene.setAvatar(obj);
view.setController(new a3.FollowAvatarController(view));

document.addEventListener('keydown',(e)=>{
  if (e.code === 'KeyW') obj.moveForward(0.3);
  else if (e.code === 'KeyA') obj.moveLeft(0.3);
  else if (e.code === 'KeyS') obj.moveBackward(0.3);
  else if (e.code === 'KeyD') obj.moveRight(0.3);
  else if (e.code === 'ArrowLeft') obj.turnLeft(3);
  else if (e.code === 'ArrowRight') obj.turnRight(3);
});
