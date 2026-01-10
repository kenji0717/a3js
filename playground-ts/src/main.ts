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


import { A3Window, A3Text3D, initFont } from 'a3js';

await initFont('M-PLUS-1_Bold.json');
const view = new A3Window(600,300);
const obj = new A3Text3D("日本語");
view.scene.add(obj);
view.camera.setLoc(2,0.6,3);
