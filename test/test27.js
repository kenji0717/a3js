// ⚠️   Acerola3DのMotion取り外し、取り付け
import * as a3 from 'a3js';

const view = new a3.Window(600,300);
const obj0 = await new a3.Acerola3D('./assets/vesma13.a3').ready;
obj0.setLocation(1,0,0);
obj0.setState("IamSorry");
view.scene.add(obj0);
const obj1 = await new a3.Acerola3D('./assets/vesma9.a3').ready;
obj1.setLocation(-1,0,0);
obj1.setState("run");
view.scene.add(obj1);
await a3.asyncSleep(3000);
obj0.setState("default");
obj1.setState("default");
await a3.asyncSleep(1000);
const m_sorry = obj0.removePoseMotion('IamSorry');
const m_run = obj1.removePoseMotion('run');
obj0.addPoseMotion('run',m_run);
obj1.addPoseMotion('IamSorry',m_sorry);
await a3.asyncSleep(3000);
obj0.setState("run");
obj1.setState("IamSorry");
