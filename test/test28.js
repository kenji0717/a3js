// a3.CharactorMotionのテスト
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
view.scene.add(ground);
const obj = await new a3.GLTF('./assets/RobotExpressive.glb').ready;
obj.setLocation(0,50,3);
const motion = new a3.CharactorTransformMotion(obj);
obj.setTransformMotion(motion);
obj.setLocation(0,50,3);
view.scene.add(obj);
view.scene.setAvatar(obj);
view.setController(new a3.FollowAvatarController(view));

let keyW=false, keyA=false, keyS=false, keyD=false,
    keyLeft=false, keyRight=false, keySpace = false;
document.addEventListener('keydown',(e)=>{
  if (e.code === 'KeyW') keyW=true;
  else if (e.code === 'KeyA') keyA=true;
  else if (e.code === 'KeyS') keyS=true;
  else if (e.code === 'KeyD') keyD=true;
  else if (e.code === 'ArrowLeft') keyLeft=true;
  else if (e.code === 'ArrowRight') keyRight=true;
  else if (e.code === 'Space') keySpace=true;
});
document.addEventListener('keyup',(e)=>{
  if (e.code === 'KeyW') keyW=false;
  else if (e.code === 'KeyA') keyA=false;
  else if (e.code === 'KeyS') keyS=false;
  else if (e.code === 'KeyD') keyD=false;
  else if (e.code === 'ArrowLeft') keyLeft=false;
  else if (e.code === 'ArrowRight') keyRight=false;
  else if (e.code === 'Space') keySpace=false;
});

let nextLoc = new a3.Vec3();
let nextQuat = new a3.Quat();
let velY = 0.0;
while (true) {
  await view.waitForRender();
  nextLoc.set(obj.loc); // この一行大事
  //nextQuat.set(obj.quat);
  const forward = obj.getUnitVecZ().scale(0.1);
  const left = obj.getUnitVecX().scale(0.1);
  if (keyW) nextLoc.add(forward);
  if (keyA) nextLoc.add(left);
  if (keyS) nextLoc.sub(forward);
  if (keyD) nextLoc.sub(left);
  if (motion.isGrounded()) {
    velY = 0.0;
    if (keySpace) velY = 2.0;
  }
  velY += (-9.8*10/1000);
  nextLoc.add(0.0, velY, 0.0);
  if (keyLeft) nextQuat.mul(a3.vec3EulerToQuat(new a3.Vec3(0,+0.01,0)));
  if (keyRight) nextQuat.mul(a3.vec3EulerToQuat(new a3.Vec3(0,-0.01,0)));
  obj.setLocation(nextLoc);
  obj.setQuat(nextQuat);
}
