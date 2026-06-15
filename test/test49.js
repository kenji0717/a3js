// 影のテスト
import * as a3 from 'a3js';

const view = new a3.Window(600,300);
view.camera.setHeadLight(false);
view.camera.setPosition(0,2,5);
view.camera.lookAt(0,0,0);
view.setShadowMap(true);

const light = new a3.StandardLights();
const opt = {left:-5,right:5,top:5,bottom:-5,shadowMapWidth:64,shadowMapHeight:64};
light.setLightShadow(true,opt);
view.scene.add(light);

const field = await new a3.GLTF('./assets/grass-ground2.glb').ready;
field.setReceiveShadow(true);
view.scene.add(field);

const obj1 = new a3.SampleObject();
obj1.setCastShadow(true);
view.scene.add(obj1);
obj1.setPositionNow(0,2,0);

light.setDebugMode(true);
let t=0;
while (true) {
    t += await view.waitForRender();
    light.setPosition(Math.cos(t),1,Math.sin(t));
}
