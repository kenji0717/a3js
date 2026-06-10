// GameCanvasのテスト
// キーボードでもタッチ操作でも利用できる。
// タッチ用のUIはnavigator.maxTouchPointsで判定して
// PCの時は表示しないようにしているけど、以下のように
// オプションで指定することもできる。

import * as a3 from 'a3js';

//const view = new a3.GameCanvas();
const view = new a3.GameCanvas({touchDevice:true,width:'1000px',height:'300px'});
document.body.appendChild(view);

const leftBox = new a3.Box('red');
leftBox.setPosition(-3,0,0);
view.scene.add(leftBox);
const rightBox = new a3.Box('blue');
rightBox.setPosition(3,0,0);
view.scene.add(rightBox);

const leftSphere = new a3.Sphere('green');
leftSphere.setPosition(-1,0,0);
view.scene.add(leftSphere);
const rightSphere = new a3.Sphere('yellow');
rightSphere.setPosition(1,0,0);
view.scene.add(rightSphere);

while (true) {
  await view.waitForRender();
    let {x,y} = view.leftJoystick;
    leftBox.setPosition(-3+x,y,0);
    ({x,y} = view.rightJoystick);
    rightBox.setPosition(+3+x,y,0);
    if (view.leftButton)
      leftSphere.setScale(0.5,0.5,0.5);
    else
      leftSphere.setScale(1,1,1);
    if (view.rightButton)
      rightSphere.setScale(0.5,0.5,0.5);
    else
      rightSphere.setScale(1,1,1);
}
