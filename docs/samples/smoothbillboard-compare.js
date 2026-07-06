import * as a3 from 'a3js';

const view = new a3.Window(600,300);
view.camera.setPosition(0,0,8);

// 動き回るターゲット(赤い球)
const target = new a3.Sphere(0.3,'red');
view.scene.add(target);

// 左: Billboardモード(即座にターゲットを向く)
const plane1 = new a3.ImagePlane('/a3js/assets/kinkakuji.jpg');
plane1.setMode('Billboard',{target});
plane1.setPosition(-2,0,0);
view.scene.add(plane1);

// 右: SmoothBillboardモード(なめらかにターゲットを向く)
const plane2 = new a3.ImagePlane('/a3js/assets/kinkakuji.jpg');
plane2.setMode('SmoothBillboard',{target,duration:1.0});
plane2.setPosition(2,0,0);
view.scene.add(plane2);

let t = 0;
while (true) {
  t += await view.waitForRender();
  target.setPosition(4*Math.sin(t),0,4*Math.cos(t));
}
