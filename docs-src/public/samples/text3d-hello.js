import * as a3 from 'a3js';

await a3.initFont('/a3js/assets/M-PLUS-1_Bold.json.zip');
const view = new a3.Window(600,300);
view.camera.setPosition(0,0,8);
const obj = new a3.Text3D("日本語もOK",{color:0xff0000});
view.scene.add(obj);

while (true) {
  obj.turnUp(1.0);
  await view.waitForRender();
}
