// 物理演算で色々力を加えるテスト
import * as a3 from 'a3js';

await a3.initPhysics();
const view = new a3.Window(600,300);
view.camera.setLocation(0,0,10); // なんとかしないと。
const ground = new a3.Box(10,0.5,10,"red");
ground.initSimplePhysics({rigidBody: 'fixed'});
ground.setLocationNow(0,-3,0);
view.scene.add(ground);
const obj = new a3.Box();
obj.initSimplePhysics(); // or "convex_hull"
obj.setLocationNow(0,-2.5,0);
view.scene.add(obj);

const v0 = new a3.Vec3(1,0,0);
const v1 = new a3.Vec3();
let flag = true;
let t = 0;
while (true) {
  const dt = await view.waitForRender();
  t += dt;
  v1.set(v0);
  let flagMustBeChanged = false;
  if (!flag && Math.floor(t)%2===0)
    flagMustBeChanged = true;
  else if (flag && Math.floor(t)%2===1)
    flagMustBeChanged = true;
  
  if (flagMustBeChanged) {
    flag = !flag;
    v0.scale(-1);
    v1.set(v0);
    //v1.scale(5); obj.setLinvel(v1);
    //v1.scale(7); obj.setAngvel(v1);
    //v1.scale(7); obj.resetForce(); obj.addForce(v1);
    //v1.scale(5);obj.resetTorque(); obj.addTorque(v1);
    //v1.scale(5);obj.applyImpulse(v1);
    v1.scale(3);obj.applyTorqueImpulse(v1);
  }
}

