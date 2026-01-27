// Soundのテスト。ここではtype: 'positional'なやつのテスト。
// ステレオで聞けば左右に音が動く。
import * as a3 from 'a3js';

const view = new a3.Window(600,300);
await view.alert("ボタンを押すとスタートします",a3.initSound);

const obj = new a3.Test();
view.scene.add(obj);

const opt = { type: 'positional', loop: true };
//const sound = await new a3.Sound('./assets/maou_se_system23.wav',opt).ready;
const sound = await new a3.Sound('./assets/maou_bgm_8bit29.ogg',opt).ready;
obj.add(sound);
sound.play();

let t=0;
while (true) {
  await a3.asyncSleep(10);
  obj.setLocation(10*Math.cos(t),0,10*Math.sin(t)+3);
  t+=0.01;
}

