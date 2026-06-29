// kinematic同士の辺り判定
// Rapierのデフォルトではkinematic同士はcollisionしない
// けど、a3jsではデフォルトでcollisionするようにしたい。
import * as a3 from 'a3js';

await a3.initPhysics();
const view = new a3.Window(600,300);
view.scene.setPhysicsDebugMode(true);
view.scene.setCollisionListener((collistions)=>{
  console.log(collistions);
});

const obj1 = await new a3.Acerola3D('./assets/vesma9.a3').ready;
//const obj1 = new a3.Box(); // プリミティブの場合
obj1.setMode('SimplePhysics',{rigidBody:'kinematic',collisionDetection:true});
obj1.setPositionNow(-1,0,0);
view.scene.add(obj1);

const obj2 = await new a3.Acerola3D('./assets/vesma9.a3').ready;
//const obj2 = new a3.Box(); // プリミティブの場合
obj2.setMode('SimplePhysics',{rigidBody:'kinematic',collisionDetection:true});
obj2.setPositionNow(1,0,0);
view.scene.add(obj2);

let t=0;
while (true) {
  t += await view.waitForRender();
  obj1.setPositionNow( 1.0+Math.sin(t),0,0);
  obj2.setPositionNow(-1.0-Math.sin(t),0,0);
}
