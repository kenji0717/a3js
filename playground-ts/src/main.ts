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
obj.setLoc(0,-2,-2);
obj.change('Walking');
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
await view.scene.initPhysics();
const obj = new A3Test({physics: true});
view.scene.add(obj);
*/


import { A3Canvas, A3glTF } from 'a3js';

const p = document.createElement('p');
p.textContent = `${"あ".repeat(1000)}`;
document.body.appendChild(p);
const view = new A3Canvas({antialias: true, opaque: 0.5});
view.style = "position:fixed;top:0;left:0;width:600px;height:300px;border:solid;";
document.body.appendChild(view);
const obj = await new A3glTF('RobotExpressive.glb').ready;
obj.change('Walking');
view.scene.add(obj);
view.camera.setLoc(0,2,4);
