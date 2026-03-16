// a3.FollowTransformerと移動系のテスト
import * as a3 from 'a3js';

const view = new a3.Window(600,300);
const ground = await new a3.GLTF('./assets/gba_peach_circuit.glb').ready;
view.scene.add(ground);
const obj = await new a3.GLTF('./assets/RobotExpressive.glb').ready;
obj.setState('Idle');
view.scene.add(obj);
view.camera.setTransformer(new a3.FollowTransformer(obj));

document.addEventListener('keydown',(e)=>{
  if (e.code === 'KeyW') obj.moveForward(0.3);
  else if (e.code === 'KeyA') obj.moveLeft(0.3);
  else if (e.code === 'KeyS') obj.moveBackward(0.3);
  else if (e.code === 'KeyD') obj.moveRight(0.3);
  else if (e.code === 'KeyQ') obj.rollLeft(3);
  else if (e.code === 'KeyE') obj.rollRight(3);
  else if (e.code === 'KeyR') obj.moveUp(0.3);
  else if (e.code === 'KeyF') obj.moveDown(0.3);
  else if (e.code === 'ArrowUp') obj.turnDown(3);
  else if (e.code === 'ArrowLeft') obj.turnLeft(3);
  else if (e.code === 'ArrowDown') obj.turnUp(3);
  else if (e.code === 'ArrowRight') obj.turnRight(3);
});
