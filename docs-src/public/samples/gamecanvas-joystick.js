import * as a3 from 'a3js';

// touchDevice:trueでPCでもジョイスティックUIを表示
const view = new a3.GameCanvas({touchDevice:true});
document.body.appendChild(view);

const box = new a3.Box('red');
view.scene.add(box);
const sphere = new a3.Sphere('green');
sphere.setPosition(2,0,0);
view.scene.add(sphere);

while (true) {
  await view.waitForRender();
  // 左ジョイスティックで赤い箱を移動
  const {x,y} = view.leftJoystick;
  box.setPosition(x*2,y*2,0);
  // 左ボタン(PCではSpaceキー)で緑の球を縮小
  if (view.leftButton) sphere.setScale(0.5,0.5,0.5);
  else sphere.setScale(1,1,1);
}
