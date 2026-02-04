// Acerola3Dのテスト
import * as a3 from 'a3js';

const view = new a3.Window(600,300);
const obj = await new a3.Acerola3D('./assets/vesma9.a3').ready;
obj.controlMotion('walk');
view.scene.add(obj);
await a3.asyncSleep(5000);
obj.controlMotion('run');
