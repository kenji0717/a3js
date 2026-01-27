// Soundのテスト。デフォルトのtype: 'Sound'のやつのテスト。
// 遠く離れても音が減衰しないというテスト。
import * as a3 from 'a3js';

const view = new a3.Window(600,300);
await view.alert("ボタンを押すとスタートします",a3.initSound);

const obj = new a3.Test();
view.scene.add(obj);

const opt = { loop: true, volume: 0.3 };
//const sound = await new a3.Sound('./assets/maou_se_system23.wav',opt).ready;
const sound = await new a3.Sound('./assets/maou_bgm_8bit29.ogg',opt).ready;
obj.add(sound);
sound.play();

let t=0;
while (true) {
  await a3.asyncSleep(1000/60);
  obj.setLocation(0,0,-t);
  t+=0.05;
}
