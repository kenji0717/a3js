import * as a3 from 'a3js';

await a3.initPhysics();
const view = new a3.Window(600,300);
view.camera.setPosition(0,2,5);
view.camera.lookAt(0,0,0);

const ground = new a3.Box(30,1,30,"red");
ground.setPosition(0,-0.5,0);
ground.setMode('SimplePhysics',{rigidBody:'fixed'});
view.scene.add(ground);

const player = await new a3.Acerola3D('/a3js/assets/vesma9.a3').ready;
player.setMode('DynamicCharacter');
view.scene.add(player);
player.setAutoAction(true);    // 速度に応じてアクションを自動切り替え
player.setAutoDirection(true); // 進行方向を自動で向く

// 3秒ごとに 停止(0m/s)→歩き(0.5m/s)→走り(4m/s) と
// 速さを変えながら円を描くように速度を与える
let t = 0;
while (true) {
  t += await view.waitForRender();
  const speed = [0, 0.5, 4][Math.floor(t/3)%3];
  player.setLinearVelocity(speed*Math.cos(10*t/(2*Math.PI)),0,
                           speed*Math.sin(10*t/(2*Math.PI)));
}
