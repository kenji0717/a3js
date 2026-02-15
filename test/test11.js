// 物理演算の色々テスト
import * as a3 from 'a3js';

await a3.initPhysics();
const view = new a3.Window(600,300);
//view.camera.setLocation(0,0,10); // なんとかしないと。
const ground = new a3.Box(10,0.5,10,"red");
ground.setLocation(0,-3,0);
ground.initSimplePhysics({rigidBody: 'fixed'});
view.scene.add(ground);
const obj = await new a3.Acerola3D('./assets/axis.a3').ready;
obj.setLocation(0,0,0);
obj.setRotation(45,45,0);
obj.initSimplePhysics({meshCollider: "tri_mesh"}); // or "convex_hull"
view.scene.add(obj);
await a3.asyncSleep(1000);
obj.setRotationNow(0,45,45);
