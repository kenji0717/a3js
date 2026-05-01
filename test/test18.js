// Soundのテスト。ここではtype: 'positional'なやつのテスト。
// ステレオで聞けば左右に音が動く。
import * as a3 from 'a3js';

const view = new a3.Window(600,300);
await view.alert("ボタンを押すとスタートします",a3.initSound);
a3.Sound.listener.setMasterVolume(0.5); // 全体のボリューム設定

const obj = new a3.SampleObject(); // 場所認識のためだけのobj
view.scene.add(obj);

const opt = { type: 'positional', loop: true };
//const sound = await new a3.Sound('./assets/maou_se_system23.wav',opt).ready;
const sound = await new a3.Sound('./assets/maou_bgm_8bit29.ogg',opt).ready;
obj.add(sound);
sound.play();

let t=0;
while (true) {
  t += await view.waitForRender();
  obj.setPosition(10*Math.cos(-t),0,10*Math.sin(-t)+3);
}

