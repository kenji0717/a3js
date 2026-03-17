// a3.GameCanvasの全画面表示のテスト
// スマホの縦画面への対応もテストするべし
import * as a3 from 'a3js';

const view = new a3.GameCanvas({touchDevice:true});
view.style.cssText = 'width:600px;height:300px;';
document.body.appendChild(view);
await view.alert(`音声初期化、フルスクリーン、ゲームスタート。`, async ()=>{
  await a3.initSound();
  view.requestFullscreen();
});

view.scene.add(new a3.Test());
