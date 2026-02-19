// a3.FolloAvatarControllerのテスト
import * as a3 from 'a3js';

const view = new a3.Window(600,300);
const ground = await new a3.GLTF('./assets/gba_peach_circuit.glb').ready;
view.scene.add(ground);
const obj = await new a3.GLTF('./assets/RobotExpressive.glb').ready;
view.scene.add(obj);
view.scene.setAvatar(obj);
view.setController(new a3.FollowAvatarController(view));

document.addEventListener('keydown',(e)=>{
console.log(`GAHA: `,e.code);
  if (e.code === 'KeyW') obj.moveForward(0.1);
  else if (e.code === 'KeyA') obj.moveLeft(0.1);
  else if (e.code === 'KeyS') obj.moveBackward(0.1);
  else if (e.code === 'KeyD') obj.moveRight(0.1);
  else if (e.code === 'ArrowUp') obj.turnDown(0.1);
  else if (e.code === 'ArrowLeft') obj.turnLeft(0.1);
  else if (e.code === 'ArrowDown') obj.turnUp(0.1);
  else if (e.code === 'ArrowRight') obj.turnRight(0.1);
});
