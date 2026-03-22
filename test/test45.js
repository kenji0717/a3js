// a3.Transformer.getLinvel(),getAngvel()のテスト。
// 物理系のObject3Dか、Interpolation系のTransformer
// の時しか有用な情報は得られない。
// CharactorTransformerは物理系だけどColliderしか使って
// ないので有用な情報は得られない。
import * as a3 from 'a3js';

await a3.initPhysics();
const view = new a3.Window(600,300);
await view.alert(`スタート。`);

const ground = new a3.Box(10,1,10,'red');
ground.initSimplePhysics({rigidBody:'fixed'});
ground.setLocationNow(0,-1.5,0);
view.scene.add(ground);

const obj = new a3.Box();
obj.initSimplePhysics();
obj.setLocationNow(0,10,0);
view.scene.add(obj);

//const obj = new a3.Box();
//obj.setTransformMode('Interpolation');
//obj.setLocationNow(0,10,0);
//view.scene.add(obj);
//await a3.asyncSleep(100);
//obj.setLocation(0,0,0);

let t=0;
while (t<5) {
  t += await view.waitForRender();
  console.log(`t=${t.toFixed(2)}, linvel: `, obj.getLinvel());
  //console.log(`t=${t.toFixed(2)}, angvel: `, obj.getAngvel());
}
