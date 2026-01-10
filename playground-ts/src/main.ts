import { A3Window, A3Test } from 'a3js';

const view = new A3Window(600,300);
const obj = new A3Test();
view.scene.add(obj);

/*
import { A3Canvas, A3Test } from 'a3js';

const view = new A3Canvas();
document.body.appendChild(view);
const obj = new A3Test();
view.scene.add(obj);
*/
