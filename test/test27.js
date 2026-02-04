// Acerola3DのMotion取り外し、取り付け
// 違うモデルじゃないからあんまりテストになってないけど。
import * as a3 from 'a3js';

const view = new a3.Window(600,300);
const motion0 = new a3.Acerola3DMotion();
const obj = await new a3.Acerola3D('./assets/vesma9.a3').ready;
obj.setMotion(motion0);
obj.setLocation(0,-2,0);
obj.controlMotion('walk');
view.scene.add(obj);
view.camera.setLocation(0,0,5);

await a3.asyncSleep(3000);
const motion1 = obj.detachMotion();
await a3.asyncSleep(3000);
obj.setMotion(motion1);
obj.controlMotion('run');
