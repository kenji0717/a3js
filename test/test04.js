// glTFのactionやmorphのテスト
import * as a3 from 'a3js';

const view = new a3.Window(600,300);
const obj = await new a3.GLTFA3('./assets/RobotExpressive.glb').ready;
obj.setLocation(0,-2,-2);
obj.action('Walking');
obj.morph('Head_4.Surprised',1);
view.scene.add(obj);
