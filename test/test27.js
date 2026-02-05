// Acerola3DのMotion取り外し、取り付け
import * as a3 from 'a3js';

const view = new a3.Window(600,300);
const obj0 = await new a3.Acerola3D('./assets/vesma13.a3').ready;
obj0.setLocation(1,0,0);
obj0.controlMotion("IamSorry");
view.scene.add(obj0);
const obj1 = await new a3.Acerola3D('./assets/vesma9.a3').ready;
obj1.setLocation(-1,0,0);
obj1.controlMotion("run");
view.scene.add(obj1);

await a3.asyncSleep(3000);
const m0 = obj0.detachMotion();
const m1 = obj1.detachMotion();
obj1.setMotion(m0);
obj0.setMotion(m1);
await a3.asyncSleep(3000);
obj0.controlMotion("run");
obj1.controlMotion("IamSorry");
