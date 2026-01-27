// Soundのテスト。type: 'positional'で
// コーンモデルで音の出る方向を限定したやつ。
import * as a3 from 'a3js';

const view = new a3.Window(600,300);
await view.alert("ボタンを押すとスタートします",a3.initSound);

const obj = new a3.Test();
obj.setControlMode('manual'); // 一応
view.scene.add(obj);

const directional = { coneInnerAngle:30, coneOuterAngle: 90, coneOuterGain: 0.1 };
const opt = { type: 'positional', loop: true, positional: { directional } };
//const sound = await new a3.Sound('./assets/maou_se_system23.wav',opt).ready;
const sound = await new a3.Sound('./assets/maou_bgm_8bit29.ogg',opt).ready;
obj.add(sound);
sound.play();

let t=0;
while (true) {
  await a3.asyncSleep(1000/60);
  obj.setRotation(0,t,0);
  t+=0.5;
}

