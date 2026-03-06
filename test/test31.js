// a3.ImageとBillboardのテスト
import * as a3 from 'a3js';

const view = new a3.Window(600,300);
const obj = new a3.Image('./assets/kinkakuji.jpg');
obj.setTransformMode('Billboard',view.camera);
view.scene.add(obj);

let t=0;
while (true) {
  t += await view.waitForRender();
  obj.setLocation(3*Math.sin(t),0,3*Math.cos(t)+3);
}
