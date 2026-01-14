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


import { A3Window, A3Test } from 'a3js';

const view = new A3Window(600,300);
await view.scene.initPhysics();
const obj = new A3Test({physics: true});
view.scene.add(obj);

