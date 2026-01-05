import * as a3 from 'a3js';

const canvas = new a3.A3Canvas();
document.body.appendChild(canvas);

const scene = new a3.A3Scene();
canvas.setScene(scene);

const obj = new a3.A3Test();
scene.add(obj);
