// 物理演算の色々テスト
import * as a3 from 'a3js';

await a3.Scene.physics.init();
const view = new a3.Window(600,300);
view.camera.setLocation(0,0,10);
const ground = new a3.Box(10,0.5,10,"red");
ground.setLocation(0,-3,0);
let opt = ground.getPhysicsOption();
opt.rigidBody = "fixed";
ground.initPhysics(opt);
view.scene.add(ground);
const obj = await new a3.Acerola3D('./assets/axis.a3').ready;
opt = obj.getPhysicsOption();
opt.meshCollider = "tri_mesh"; // "convex_hull"
obj.setQuat(0.5,0.5,0,0.5);
obj.setControlMode("physics");
view.scene.add(obj);
await a3.asyncSleep(1000);
obj.setQuatOverride(0.5,0.5,0,-0.5);
