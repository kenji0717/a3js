// a3.Canvasの'click3d'イベントのテスト
import * as a3 from 'a3js';

const view = new a3.Canvas();
view.style.cssText = 'width:600px;height:300px;';
document.body.appendChild(view);
const obj1 = new a3.SampleObject();
view.scene.add(obj1);
const obj2 = new a3.SampleObject();
obj2.setPosition(0.5,0,0);
view.scene.add(obj2);
view.addEventListener('click3d',(e)=>{console.log(e.detail.value);});
