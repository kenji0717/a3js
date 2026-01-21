import * as a3 from 'a3js';
/*
window.a3 = a3;
*/


/*
const view = new a3.Window(600,300);
const obj = new a3.Test();
view.scene.add(obj);
*/

/*
const view = new a3.Canvas();
document.body.appendChild(view);
const obj = new a3.Test();
view.scene.add(obj);
*/

/*
await a3.initFont('M-PLUS-1_Bold.json.zip');
const view = new a3.Window(600,300);
const obj = new a3.Text3D("日本語");
view.scene.add(obj);
*/

/*
const view = new a3.Window(600,300);
const obj = await new a3.GLTFA3('RobotExpressive.glb').ready;
obj.setLocation(0,-2,-2);
obj.action('Walking');
obj.morph('Head_4.Surprised',1);
view.scene.add(obj);
*/

/*
import * as THREE from 'three';

const view = new a3.Window(600,300);
const geo = new THREE.BoxGeometry();
const mat = new THREE.MeshStandardMaterial({ color: 0x00ff00 });
const mesh = new THREE.Mesh(geo, mat);
const obj = new a3.ThreeJS(mesh);
view.scene.add(obj);
*/

/*
await a3.Scene.physics.init();
const view = new a3.Window(600,300);
const obj = new a3.Test({physics: true});
view.scene.add(obj);
*/

/*
const p = document.createElement('p');
p.textContent = `${"あ".repeat(1000)}`;
document.body.appendChild(p);
const view = new a3.Canvas({antialias: true, transparent: true});
view.style = "position:fixed;top:0;left:0;width:600px;height:300px;border:solid;";
document.body.appendChild(view);
const obj = await new a3.GLTFA3('RobotExpressive.glb').ready;
obj.action('Walking');
view.scene.add(obj);
view.camera.setLocation(0,2,4);
*/

/*
const view = new a3.Window(600,300);
const obj = new a3.Test();
obj.setControlMode("interpolated");
view.scene.add(obj);
let i=0;
while (true) {
  await a3.asyncSleep(2000);
  if (i%2 === 0) {
    obj.setLocation(1,0,0);
    obj.setQuat(0,0.707,0,0.707);
    obj.setScale(2,2,2);
  } else {
    obj.setLocation(-1,0,0);
    obj.setQuat(0,0.707,0,-0.707);
    obj.setScale(0.5,0.5,0.5);
  }
  i++;
}
*/

/*
const view = new a3.Window(600,300);
const obj1 = new a3.Test();
view.scene.add(obj1);
const obj2 = new a3.Test();
obj2.setLocation(0.3,0,0);
view.scene.add(obj2);
view.addEventListener('click3d',(e)=>{console.log((e as CustomEvent).detail.value);});
*/

/*
const view = new a3.Canvas();
document.body.appendChild(view);
const obj1 = new a3.Test();
view.scene.add(obj1);
const obj2 = new a3.Test();
obj2.setLocation(0.3,0,0);
view.scene.add(obj2);
view.addEventListener('click3d',(e)=>{console.log((e as CustomEvent).detail.value);});
*/


await a3.Scene.physics.init();
const view = new a3.Window(600,300);
view.camera.setLocation(0,0,10);
const ground = new a3.Box(10,0.5,10,"red");
ground.setLocation(0,-3,0);
let opt = ground.getPhysicsOption();
opt.rigidBody = "fixed";
ground.initPhysics(opt);
view.scene.add(ground);
const obj = await new a3.Acerola3D('axis.a3').ready;
opt = obj.getPhysicsOption();
opt.meshCollider = "tri_mesh"; // "convex_hull"
obj.setQuat(0.5,0.5,0,0.5);
obj.setControlMode("physics");
view.scene.add(obj);
await a3.asyncSleep(1000);
obj.setQuatOverride(0.5,0.5,0,-0.5);

