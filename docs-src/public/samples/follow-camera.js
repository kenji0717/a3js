import * as a3 from 'a3js';

const lookFrom = new a3.Vec3(0,3,-5);

const view = new a3.Window(600,300);
const player = await new a3.Acerola3D('/a3js/assets/vesma9.a3').ready;
view.scene.add(player);
view.camera.setMode('Follow',{target:player,lookFrom});

// lookFrom(ターゲットから見たカメラの相対位置)を動かすと
// カメラがなめらかについていく
let t = 0;
while (true) {
  t += await view.waitForRender();
  lookFrom.x = 5*Math.cos(0.3*t);
  lookFrom.y = 3*Math.sin(t);
  lookFrom.z = 5*Math.sin(0.3*t);
}
