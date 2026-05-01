// a3.Canvasのテスト
import * as a3 from 'a3js';

const view = new a3.Canvas();
view.style.cssText='width:600px;height:300px;';
document.body.appendChild(view);
const obj = new a3.SampleObject();
view.scene.add(obj);
