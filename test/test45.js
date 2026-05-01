// a3.Transformer.getLinearVelocity(),getAngularVelocity()のテスト。
// 実際にはObjectA3のgetLinearVelocity()やgetAngularVelocity()経由で
// テストする。ただ、ObjectA3が物理系か、Smooth(Interpolation)系の
// Transformerを使っている時しか有用な情報は得られない。
// KinematicCharactorTransformerは物理系だけどColliderしか使って
// ないので有用な情報は得られない。
import * as a3 from 'a3js';

await a3.initPhysics();
const view = new a3.Window(600,300);
await view.alert(`スタート。`);

const ground = new a3.Box(10,1,10,'red');
ground.initSimplePhysics({rigidBody:'fixed'});
ground.setPositionNow(0,-1.5,0);
view.scene.add(ground);

const obj = new a3.Box();
obj.initSimplePhysics();
obj.setPositionNow(0,10,0);
view.scene.add(obj);

//const obj = new a3.Box();
//obj.setTransformMode('Smooth');
//obj.setPositionNow(0,10,0);
//view.scene.add(obj);
//await a3.asyncSleep(100);
//obj.setPosition(0,0,0);

let t=0;
while (t<5) {
  t += await view.waitForRender();
  console.log(`t=${t.toFixed(2)}, linvel: `, obj.getLinearVelocity());
  //console.log(`t=${t.toFixed(2)}, angvel: `, obj.getAngularVelocity());
}
