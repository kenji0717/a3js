import * as a3 from 'a3js';

const view = new a3.Window(600,300);
view.camera.setHeadLight(false); // ヘッドライトを消してライトの効果を見る

const light = new a3.StandardLights({
  direction: {x:-1,y:-1,z:0}, // 平行光の向き
  colorDL: 0xffddaa,          // 夕日っぽい平行光
  intensityDL: 2.0,
  colorAL: 0x8888ff,          // 青っぽい環境光
  intensityAL: 0.3
});
view.scene.add(light);

view.scene.add(new a3.SampleObject());
