// 物理演算の色々テスト
import * as a3 from 'a3js';

await a3.initPhysics();
const view = new a3.Window(600,300);
view.camera.setPosition(0,0,10);
const ground = new a3.Box(10,0.5,10,"red");
ground.setMode('SimplePhysics',{rigidBody: 'fixed'});
ground.setPositionNow(0,-3,0);
view.scene.add(ground);
const obj = await new a3.Acerola3D('./assets/axis.a3').ready;
obj.setMode('SimplePhysics',{meshCollider: "tri_mesh"}); // or "convex_hull"
obj.setPositionNow(0,0,0);
obj.setRotationNow(45,45,0);
view.scene.add(obj);
await a3.asyncSleep(3000);
obj.setRotationNow(0,0,0);
obj.setPositionNow(0,1,0);
