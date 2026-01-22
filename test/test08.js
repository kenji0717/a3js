// interpolatedモードのテスト
import * as a3 from 'a3js';

const view = new a3.Window(600,300);
const obj = new a3.Test();
obj.setControlMode("interpolated");
view.scene.add(obj);
let i=0;
while (true) {
  await a3.asyncSleep(2000);
  if (i%2 === 0) {
    obj.setLocation(1,0,0);
    obj.setQuat(0,0.707,0,0.707);
    obj.setScale(2,2,2);
  } else {
    obj.setLocation(-1,0,0);
    obj.setQuat(0,0.707,0,-0.707);
    obj.setScale(0.5,0.5,0.5);
  }
  i++;
}
