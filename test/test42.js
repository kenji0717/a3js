// Acerola3Dのサウンドのテスト。
import * as a3 from 'a3js';

const view = new a3.Window(600,300);
await view.alert('音声が再生されます。',a3.initSound);
a3.Sound.listener.setMasterVolume(0.3);
const obj = await new a3.Acerola3D('./assets/footfalls.a3').ready;
obj.setState('walk');
view.scene.add(obj);
await a3.asyncSleep(2000);
obj.setState('run');
