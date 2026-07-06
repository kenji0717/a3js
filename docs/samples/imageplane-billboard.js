import * as a3 from 'a3js';

const view = new a3.Window(600,300);
const obj = new a3.ImagePlane('/a3js/assets/kinkakuji.jpg');
obj.setMode('Billboard',{target: view.camera});
view.scene.add(obj);

// 画像が3D空間を動き回っても常にこちらを向く
let t = 0;
while (true) {
  t += await view.waitForRender();
  obj.setPosition(3*Math.sin(t),0,3*Math.cos(t)+3);
}
