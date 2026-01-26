// 使ったことなかったのでthree.jsのPositionalAudioのテスト
// こんどはコーンモデルで音の出る方向を限定
import * as a3 from 'a3js';
import * as THREE from 'three';

const button = document.createElement('button');
button.textContent = "プログラムスタート(音が出ます)"
button.addEventListener('click',start);
document.body.appendChild(button);

async function start() {
  const view = new a3.Window(600,300);
  const listener = new THREE.AudioListener();
  view.camera.camera.add(listener);

  const geo = new THREE.BoxGeometry();
  const mat = new THREE.MeshStandardMaterial({ color: 0x00ff00 });
  const mesh = new THREE.Mesh(geo, mat);

  const sound = new THREE.PositionalAudio(listener);
  const audioLoader = new THREE.AudioLoader();
  //audioLoader.load('./assets/maou_se_system23.wav', (buffer) => {
  audioLoader.load('./assets/maou_bgm_8bit29.ogg', (buffer) => {
    sound.setBuffer(buffer);
    sound.setRefDistance(1);
    sound.setLoop(true);
    sound.setDirectionalCone(30,90,0.1);
    sound.play();
  });
  mesh.add(sound);

  const obj = new a3.ThreeJS(mesh);
  view.scene.add(obj);

  let t=0;
  while (true) {
    await a3.asyncSleep(10);
    obj.setRotation(0,t,0);
    t+=0.5;
  }
}
