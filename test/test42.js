// Acerola3Dのサウンドのテスト。
import * as a3 from 'a3js';

const view = new a3.Window(600,300);
await view.alert('音声が再生されます。',a3.initSound);
a3.Sound.listener.setMasterVolume(0.3);
const obj = await new a3.Acerola3D('./assets/A3/sound/footfalls/footfalls.a3').ready;
obj.setState('walk');
//obj.setState('run');
view.scene.add(obj);
