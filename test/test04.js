// glTFのactionやmorphのテスト
import * as a3 from 'a3js';

const view = new a3.Window(600,300);
const obj = await new a3.GLTF('./assets/RobotExpressive.glb').ready;
obj.setLocation(0,-2,0);
obj.setState('Walking');
console.log(obj);
obj.morph('Head_4.Surprised',1);
view.scene.add(obj);
view.camera.setLocation(0,0,5);

await a3.asyncSleep(3000);
obj.setEmote('Wave');
