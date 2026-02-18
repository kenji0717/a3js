// ⚠️   a3.CharactorMotionのテスト
import * as a3 from 'a3js';

await a3.initPhysics();
const view = new a3.Window(600,300);
view.setController(new a3.ControllerBase(view));
view.camera.setLocation(0,10,10);
view.camera.lookAt(0,0,0);
view.scene.rapierDebug(true);
const ground = await new a3.GLTF('./assets/gba_peach_circuit.glb').ready;
ground.initSimplePhysics({meshCollider:'tri_mesh',rigidBody: 'fixed'});
view.scene.add(ground);
const obj = await new a3.GLTF('./assets/RobotExpressive.glb').ready;
obj.setLocationNow(0,3,0);
const motion = new a3.CharactorRootMotion(obj);
obj.setRootMotion(motion);
view.scene.add(obj);

let keyW = false;
let keyS = false;
let keyA = false;
let keyD = false;
document.addEventListener('keydown',(e)=>{
  if (e.code === 'KeyW') keyW = true;
  else if (e.code === 'KeyS') keyS = true;
  else if (e.code === 'KeyA') keyA = true;
  else if (e.code === 'KeyD') keyD = true;
});
document.addEventListener('keyup',(e)=>{
  if (e.code === 'KeyW') keyW = false;
  else if (e.code === 'KeyS') keyS = false;
  else if (e.code === 'KeyA') keyA = false;
  else if (e.code === 'KeyD') keyD = false;
});

const loc = new a3.Vec3();
while (true) {
  await a3.asyncSleep(10);
  loc.set(obj.object.position);
  if (keyW) loc.add(0,0,-0.1);
  if (keyS) loc.add(0,0,+0.1);
  if (keyA) loc.add(-0.1,0,0);
  if (keyD) loc.add(+0.1,0,0);
  obj.setLocation(loc);
}
