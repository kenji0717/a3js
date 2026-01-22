// a3.Canvasのテスト
import * as a3 from 'a3js';

const view = new a3.Canvas();
document.body.appendChild(view);
const obj = new a3.Test();
view.scene.add(obj);
