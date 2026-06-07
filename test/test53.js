// ActionObjectの自動アクション切り替えと自動向き調整機能のテスト。
// 自動アクション切り替え機能とは現在スピードに応じて、
// 止まる、歩く、走るが切り替わる機能。自動向き調整機能とは、
// 移動方向が正面になるように回転をコントロールする機能。
//
// 自動ジェスチャー切り替え機能はモードが以下の時しか機能しない。
// 'SimplePhysics'、'DynamicCharacter'、'Smooth'、'SmoothBillboard'の
// 自動向き調整機能はモードが以下の時しか機能しない。
// 'SimplePhysics'、'DynamicCharacter'、'Smooth'の
//
// 'Smooth'、'SmoothBillboard'時の速度の計算が間違ってそう。
import * as a3 from 'a3js';

await a3.initPhysics();
const view = new a3.Window(600,300);
view.camera.setPosition(0,2,5);
view.camera.lookAt(0,0,0);
const ground = new a3.Box(30,1,30,"red");
ground.setPosition(0,-0.5,0);
ground.setTransformMode('SimplePhysics',{rigidBody:'fixed'});
view.scene.add(ground);
const player = await new a3.Acerola3D('./assets/vesma9.a3').ready;
//player.setTransformMode('SimplePhysics');
player.setTransformMode('DynamicCharacter');
//player.setTransformMode('Smooth',{duration:0.01});
//player.setTransformMode('SmoothBillboard',{target:view.camera,duration:0.01});
view.scene.add(player);
player.setAutoAction(true);
player.setAutoDirection(true);

let t = 0;
const vel = new a3.Vec3();
while (true) {
  t += await view.waitForRender();
  if (t<20) {
    player.getLinearVelocity(vel);
    console.log(`speed=${vel.length()}`);
  }
  //速度指定('SimplePhysics'、'DynamicCharacter'の時)
  player.setLinearVelocity(4*Math.cos(10*t/(2*Math.PI)),0,4*Math.sin(10*t/(2*Math.PI)));
  //座標指定('Smooth'、'SmoothBillboard'の時)
  //player.setPosition(3*Math.cos(15*t/(2*Math.PI)),0,3*Math.sin(15*t/(2*Math.PI)));
}
