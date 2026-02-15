// 当り判定のテストObject3A編
import * as a3 from 'a3js';

class MySphere extends a3.Sphere {
  handleCollision(obj, started, myPartNo, yourPartNo) {
    console.log("obj: ",obj);
    console.log("started: ",started);
    console.log("myPartNo: ",myPartNo);
    console.log("yourPartNo: ",yourPartNo);
  }
}

await a3.initPhysics();
const view = new a3.Window(600,300);
const ground = new a3.Box(10,0.5,10,"red");
ground.setLocation(0,-3,0);
ground.initSimplePhysics({rigidBody: 'fixed', collisionDetection: true});
view.scene.add(ground);
const obj = new MySphere();
obj.setLocation(0,0,0);
obj.initSimplePhysics({collisionDetection: true});
view.scene.add(obj);
