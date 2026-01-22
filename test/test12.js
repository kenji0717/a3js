// Acerola3Dのテスト
import * as a3 from 'a3js';

const view = new a3.Window(600,300);
view.camera.setLocation(0,0,50);
const obj = await new a3.Acerola3D('./assets/vesma9.a3').ready;
obj.action('walk');
obj.setControlMode('user');
view.scene.add(obj);
await a3.asyncSleep(10000);
obj.action('run');
