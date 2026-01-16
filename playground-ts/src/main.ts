/*
import * as a3 from 'a3js';
window.a3 = a3;
*/

/*
import { A3Window, A3Test } from 'a3js';

const view = new A3Window(600,300);
const obj = new A3Test();
view.scene.add(obj);
*/

/*
import { A3Canvas, A3Test } from 'a3js';

const view = new A3Canvas();
document.body.appendChild(view);
const obj = new A3Test();
view.scene.add(obj);
*/

/*
import { A3Window, A3Text3D, initFont } from 'a3js';

await initFont('M-PLUS-1_Bold.json.zip');
const view = new A3Window(600,300);
const obj = new A3Text3D("日本語");
view.scene.add(obj);
*/

/*
import { A3Window, A3glTF } from 'a3js';

const view = new A3Window(600,300);
const obj = await new A3glTF('RobotExpressive.glb').ready;
obj.setLocation(0,-2,-2);
obj.action('Walking');
obj.morph('Head_4.Surprised',1);
view.scene.add(obj);
*/

/*
import * as THREE from 'three';
import { A3Window, ThreeJS } from 'a3js';

const view = new A3Window(600,300);
const geo = new THREE.BoxGeometry();
const mat = new THREE.MeshStandardMaterial({ color: 0x00ff00 });
const mesh = new THREE.Mesh(geo, mat);
const obj = new ThreeJS(mesh);
view.scene.add(obj);
*/

/*
import { A3Window, A3Test } from 'a3js';

const view = new A3Window(600,300);
const obj = new A3Test({physics: true});
view.scene.add(obj);
*/

/*
import { A3Canvas, A3glTF } from 'a3js';

const p = document.createElement('p');
p.textContent = `${"あ".repeat(1000)}`;
document.body.appendChild(p);
const view = new A3Canvas({antialias: true, transparent: true});
view.style = "position:fixed;top:0;left:0;width:600px;height:300px;border:solid;";
document.body.appendChild(view);
const obj = await new A3glTF('RobotExpressive.glb').ready;
obj.action('Walking');
view.scene.add(obj);
view.camera.setLocation(0,2,4);
*/

/*
import { A3Window, A3Test, asyncSleep } from 'a3js';

const view = new A3Window(600,300);
const obj = new A3Test();
obj.setControlMode("interpolated");
view.scene.add(obj);
for (let i=0; i<10;i++) {
  await asyncSleep(2000);
  if (i%2 === 0) {
    obj.setLocation(1,0,0);
    obj.setQuat(0,0.707,0,0.707);
    obj.setScale(2,2,2);
  } else {
    obj.setLocation(-1,0,0);
    obj.setQuat(0,0.707,0,-0.707);
    obj.setScale(0.5,0.5,0.5);
  }
}
*/

/*
import { A3Window, A3Test } from 'a3js';

const view = new A3Window(600,300);
const obj1 = new A3Test();
view.scene.add(obj1);
const obj2 = new A3Test();
obj2.setLocation(0.1,0,0);
view.scene.add(obj2);
view.addEventListener('click3d',(e)=>{console.log((e as CustomEvent).detail.value);});
*/


import { A3Canvas, A3Test } from 'a3js';

const view = new A3Canvas();
document.body.appendChild(view);
const obj1 = new A3Test();
view.scene.add(obj1);
const obj2 = new A3Test();
obj2.setLocation(0.1,0,0);
view.scene.add(obj2);
view.addEventListener('click3d',(e)=>{console.log((e as CustomEvent).detail.value);});









