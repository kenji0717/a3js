// a3.Canvasの背景透過のテスト
import * as a3 from 'a3js';

const view = new a3.Canvas({antialias: true, transparent: true});
view.style = "position:fixed;top:0;left:0;width:600px;height:300px;border:solid;";
document.body.appendChild(view);
const obj = await new a3.GLTFA3('./assets/RobotExpressive.glb').ready;
obj.action('Walking');
view.scene.add(obj);
view.camera.setLocation(0,2,4);
