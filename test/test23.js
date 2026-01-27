// 物理演算の初期のテスト
import * as a3 from 'a3js';

await a3.initPhysics();
const view = new a3.Window(600,300);
view.scene.setCollisionListener((collistions)=>{
  console.log(collistions);
});
const ground = new a3.Box(10,0.5,10,"red");
ground.setLocation(0,-3,0);
ground.initPhysics({rigidBody: 'fixed', collisionDetection: true});
view.scene.add(ground);
const obj = new a3.Sphere();
obj.setLocation(0,0,0);
obj.initPhysics({collisionDetection: true});
view.scene.add(obj);
