// Acerola3DのAction取り外し、取り付け
import * as a3 from 'a3js';

const view = new a3.Window(600,300);
await view.alert('音がなります。',a3.initSound);
const obj0 = await new a3.Acerola3D('./assets/vesma13.a3').ready;
obj0.setPosition(1,0,0);
obj0.setState("IamSorry");
view.scene.add(obj0);
const obj1 = await new a3.Acerola3D('./assets/vesma9.a3').ready;
obj1.setPosition(-1,0,0);
obj1.setState("run");
view.scene.add(obj1);
await a3.asyncSleep(3000);
const sorry = obj0.removeAction('IamSorry');
const run = obj1.removeAction('run');
obj0.addAction('run',run);
obj1.addAction('IamSorry',sorry);
obj0.setState("run");
obj1.setState("IamSorry");
