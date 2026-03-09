import * as a3 from 'a3js';

await a3.initPhysics();
const view = new a3.Window(600,300);
for (let x=0;x<=200;x+=10) {
  for (let z=0;z<=200;z+=10) {
    let ground;
    if (x/10%2===0&&z/10%2===0 || x/10%2===1&&z/10%2===1)
      ground = new a3.Box(10,1,10,'white');
    else
      ground = new a3.Box(10,1,10,'black');
    ground.setLocation(x,-0.5,z);
    ground.initSimplePhysics({rigidBody:'fixed'});
    view.scene.add(ground);
  }
}

const obj = await new a3.Acerola3D('./assets/TestCar/TestCar.a3').ready;
const cc = new a3.CarControl();
obj.setTransformer(cc.trans);
obj.getAction('default').motion = cc.motion;
obj.setState('default');
view.scene.add(obj);
cc.reset(new a3.Vec3(100,1.5,100));

view.scene.setAvatar(obj);
//view.setController(new a3.FollowAvatarController({offset:{x:0,y:2,z:-6}}));
view.setController(new a3.FollowAvatarController({offset:{x:2,y:2,z:-5}}));

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
  cc.handle(h);
  cc.accelerator(a);
  cc.brake(b);
  if (keyEnter)
    cc.reset(new a3.Vec3(100,0.8,100),new a3.Quat());
}
