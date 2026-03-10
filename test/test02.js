// a3.Canvasのテスト
import * as a3 from 'a3js';

const view = new a3.Canvas();
view.style.width='600px';
view.style.height='300px';
document.body.appendChild(view);
const obj = new a3.Test();
view.scene.add(obj);
