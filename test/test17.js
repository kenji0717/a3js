// 使ったことなかったのでthree.jsのPositionalAudioのテスト
// ユーザアクションが必要なので面倒なプログラム追加している。
import * as a3 from 'a3js';
import * as THREE from 'three';

const button = document.createElement('button');
button.textContent = "プログラムスタート(音が出ます)"
button.addEventListener('click',start);
document.body.appendChild(button);

async function start() {
  await a3.Sound.init();
  const view = new a3.Window(600,300);

  const geo = new THREE.BoxGeometry();
  const mat = new THREE.MeshStandardMaterial({ color: 0x00ff00 });
  const mesh = new THREE.Mesh(geo, mat);
  const obj = new a3.ThreeJS(mesh);
  view.scene.add(obj);

  //const sound = new a3.Sound('./assets/maou_se_system23.wav');
  const sound = await new a3.Sound('./assets/maou_bgm_8bit29.ogg').ready;
  //view.scene.add(sound);
  obj.add(sound);
  sound.play();

  let t=0;
  while (true) {
    await a3.asyncSleep(10);
    obj.setLocation(10*Math.cos(t),0,10*Math.sin(t)+3);
    t+=0.01;
  }
}
