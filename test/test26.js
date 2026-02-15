// GLTFのMotion取り外し、取り付け
// 違うモデルじゃないからあんまりテストになってないけど。
import * as a3 from 'a3js';

const view = new a3.Window(600,300);
view.camera.setLocation(0,0,5);
const obj = await new a3.GLTF('./assets/RobotExpressive.glb').ready;
obj.setLocation(0,-2,0);
const motion1 = obj.removePoseMotion('Running');
obj.setState('Walking');
view.scene.add(obj);

await a3.asyncSleep(3000);
obj.addPoseMotion('走る',motion1);
obj.setState('走る');

