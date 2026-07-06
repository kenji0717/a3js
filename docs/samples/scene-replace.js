import * as a3 from 'a3js';

await a3.initFont('/a3js/assets/M-PLUS-1_Bold.json.zip');
const view = new a3.Window(600,300);

// Viewに最初から入っているシーンをスタート画面として使う
const gameStart = new a3.Text3D('Start Game');
view.scene.add(gameStart);

// メイン画面用のシーンを別に作っておく
const gameMainScene = new a3.Scene();
const obj = await new a3.Acerola3D('/a3js/assets/stk_tux.a3').ready;
gameMainScene.add(obj);

// ゲームオーバー画面用のシーンも作っておく
const gameOverScene = new a3.Scene();
const gameOver = new a3.Text3D('Game Over');
gameOverScene.add(gameOver);

await view.alert('ゲームの準備ができたら「OK」ボタンを押して下さい。');

view.replaceScene(gameMainScene); // メイン画面に切り替え

await a3.asyncSleep(3000);

view.replaceScene(gameOverScene); // ゲームオーバー画面に切り替え
