import * as a3 from 'a3js';

const view = new a3.Window(600,300);
const obj = new a3.Box("blue");
view.scene.add(obj);

let t = 0;
while (true) {
  t += 2;
  obj.setRotation(0,t,0);
  obj.setPosition(2*Math.sin(t*Math.PI/180),0,0);
  await view.waitForRender();
}
