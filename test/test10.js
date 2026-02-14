// a3.Canvasの'click3d'イベントのテスト
import * as a3 from 'a3js';

const view = new a3.Canvas();
document.body.appendChild(view);
const obj1 = new a3.Test();
view.scene.add(obj1);
const obj2 = new a3.Test();
obj2.setLocation(0.5,0,0);
view.scene.add(obj2);
view.addEventListener('click3d',(e)=>{console.log(e.detail.value);});
