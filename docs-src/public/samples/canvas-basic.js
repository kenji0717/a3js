import * as a3 from 'a3js';

const view = new a3.Canvas();
view.style.cssText = 'width:100%;height:280px;border:solid 1px gray;border-radius:8px;';
document.body.appendChild(view);
const obj = new a3.SampleObject();
view.scene.add(obj);
