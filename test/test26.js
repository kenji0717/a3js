// GLTFのAction取り外し、取り付け
// 違うモデルじゃないからあんまりテストになってないけど。
import * as a3 from 'a3js';

const view = new a3.Window(600,300);
view.camera.setPosition(0,0,5);
const obj = await new a3.GLTF('./assets/RobotExpressive.glb').ready;
console.log(obj.getActionNames());
obj.setPosition(0,-2,0);
const action1 = obj.removeAction('Running');
obj.setState('Walking');
view.scene.add(obj);

await a3.asyncSleep(3000);
obj.addAction('走る',action1);
obj.setState('走る');
