// DynamicCharacterTransformerとRapierTransformer(SimplePhysics)とのCollisionテスト。
import * as a3 from 'a3js';

// クラス名を見やすくするためだけに継承
class Player extends a3.Acerola3D {}
class Field extends a3.GLTF {}
class MyBox extends a3.Box {}

await a3.initPhysics();
const view = new a3.Window(600,300);
view.scene.setCollisionListener((is)=>{
  is.forEach((i)=>{
    console.log(`${i.objectA.constructor.name}->${i.objectB.constructor.name},${i.started}`);
  });
});

const field = await new Field('./assets/grass-ground2.glb').ready;
field.setMode('SimplePhysics',{meshCollider: 'tri_mesh', rigidBody: 'fixed', collisionDetection: false});
view.scene.add(field);

const obj1 = await new Player('./assets/vesma9.a3').ready;
obj1.setMode('DynamicCharacter',{collisionDetection: true});
view.scene.add(obj1);
obj1.setPositionNow(2,0,0);

const obj2 = new MyBox();
obj2.setPosition(-2,0.5,0);
obj2.setMode('SimplePhysics',{collisionDetection: true});
view.scene.add(obj2);

while (true) {
  await view.waitForRender();
  obj1.setLinearVelocity(-1,0,0);
}
