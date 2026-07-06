import * as a3 from 'a3js';

const view = new a3.Window(600,300);
view.camera.setHeadLight(false);
view.camera.setPosition(0,2,5);
view.camera.lookAt(0,0,0);
view.setShadowMap(true); // (1) Viewの影の描画を有効化

const light = new a3.StandardLights();
const opt = {left:-5,right:5,top:5,bottom:-5};
light.setLightShadow(true,opt); // (2) ライトが影を作るようにする
view.scene.add(light);

const field = await new a3.GLTF('/a3js/assets/grass-ground2.glb').ready;
field.setReceiveShadow(true); // (3) 地面が影を描画するようにする
view.scene.add(field);

const obj = new a3.SampleObject();
obj.setCastShadow(true); // (4) オブジェクトが影を落すようにする
obj.setPositionNow(0,2,0);
view.scene.add(obj);

light.setDebugMode(true); // 影の計算に使うカメラの範囲を表示

// ライトを動かすと影も動く
let t = 0;
while (true) {
  t += await view.waitForRender();
  light.setPosition(Math.cos(t),1,Math.sin(t));
}
