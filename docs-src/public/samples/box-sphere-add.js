import * as a3 from 'a3js';

const view = new a3.Window(600,300);
view.camera.setPosition(0,0,6);

// 赤い箱(腕1)をシーンに追加
const arm1 = new a3.Box(0.3,2,0.3,'red');
view.scene.add(arm1);
// 青い箱(腕2)をarm1の子として取り付ける
const arm2 = new a3.Box(0.3,2,0.3,'blue');
arm1.add(arm2);
arm2.setPosition(0,1,0);
// 緑の球をarm2の子として取り付ける
const ball = new a3.Sphere(0.3,'green');
arm2.add(ball);
ball.setPosition(0,1,0);

let t = 0;
while (true) {
  await view.waitForRender();
  t += 1;
  arm1.setRotation(0,0,t);   // 親が回ると子もついてくる
  arm2.setRotation(0,0,2*t); // 子の回転は親からの相対
}
