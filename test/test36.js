// a3.CarControlのテスト2。TestCar.a3
// というかa3.defaultCarControlOptionのテスト。

import * as a3 from 'a3js';

await a3.initPhysics();
const view = new a3.Window(600,300);
const ground = await new a3.GLTF('./assets/gba_peach_circuit.glb').ready;
//ground.setScale(10,10,10);
ground.setPosition(0,-10,0);
ground.setMode('SimplePhysics',{meshCollider:'tri_mesh',rigidBody: 'fixed'});
view.scene.add(ground);

const obj = await new a3.Acerola3D('./assets/TestCar/TestCar.a3').ready;
const cc = new a3.CarControl();
obj.setTransformer(cc.trans);
obj.getAction('default').motion = cc.motion;
obj.setState('default');
view.scene.add(obj);
cc.reset(new a3.Vec3(100,1.5,100));

view.camera.setTransformer(new a3.FollowTransformer({target:obj}));

let keyW = false, keyA = false, keyS = false, keyD = false;
let keySpace, keyEnter; keySpace=keyEnter=false;
window.addEventListener('keydown',(e)=>{
  if (e.code==='KeyW') keyW = true;
  else if (e.code==='KeyA') keyA = true;
  else if (e.code==='KeyS') keyS = true;
  else if (e.code==='KeyD') keyD = true;
  else if (e.code==='Space') keySpace = true;
  else if (e.code==='Enter') keyEnter = true;
});
window.addEventListener('keyup',(e)=>{
  if (e.code==='KeyW') keyW = false;
  else if (e.code==='KeyA') keyA = false;
  else if (e.code==='KeyS') keyS = false;
  else if (e.code==='KeyD') keyD = false;
  else if (e.code==='Space') keySpace = false;
  else if (e.code==='Enter') keyEnter = false;
});

while (true) {
  await view.waitForRender();
  let a = 0, h = 0, b = 0;
  if (keyA) h+=0.3;
  if (keyD) h-=0.3;
  if (keyW) a+=30.0;
  if (keyS) a-=30.0;
  if (keySpace) b = 1000.0;
  cc.steer(h);
  cc.accelerate(a);
  cc.brake(b);
  if (keyEnter)
    cc.reset(new a3.Vec3(100,0.8,100),new a3.Quat());
}
