import { A3Canvas, A3Test } from 'a3js';

const canvas = new A3Canvas();
document.body.appendChild(canvas);

const obj = new A3Test();
canvas.scene.add(obj);
