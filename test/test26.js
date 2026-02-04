// GLTFのMotion取り外し、取り付け
// 違うモデルじゃないからあんまりテストになってないけど。
import * as a3 from 'a3js';

const view = new a3.Window(600,300);
const motion0 = new a3.GLTFMotion();
const obj = await new a3.GLTF('./assets/RobotExpressive.glb').ready;
obj.setMotion(motion0);
obj.setLocation(0,-2,0);
obj.controlMotion('Walking','Head_4.Surprised','1');
view.scene.add(obj);
view.camera.setLocation(0,0,5);

await a3.asyncSleep(3000);
const motion1 = obj.detachMotion();
await a3.asyncSleep(3000);
obj.setMotion(motion1);
obj.controlMotion('Running','Head_4.Angry','1');
