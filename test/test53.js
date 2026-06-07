// ActionObjectの自動ジェスチャー切り替えと自動向き調整機能のテスト。
// **未完成**
// 自動ジェスチャー切り替え機能とは現在スピードに応じて、
// 止まる、歩く、走るが切り替わる機能。自動向き調整機能とは、
// 移動方向が正面になるように回転をコントロールする機能。
//
// 自動ジェスチャー切り替え機能はモードが以下の時しか機能しない。
// 'SimplePhysics'、'Smooth'、'SmoothBillboard'、'DynamicCharacter'の
// 自動向き調整機能はモードが以下の時しか機能しない。
// 'SimplePhysics'、'Smooth'、'SmoothBillboard'、'DynamicCharacter'の
import * as a3 from 'a3js';

const view = new a3.Window(600,300);
const player = await new a3.Acerola3D('./assets/vesma9.a3');
player.setTransformMode('Smooth');
view.scene.add(player);
player.setAutoMotion(true);
player.setAutoDirection(true);

let t = 0;
while (true) {
  t += await view.waitForRender();
  player = 5*Math.cos(t/(2*Math.PI));
  lookFrom.z = 5*Math.sin(t/(2*Math.PI));
}
