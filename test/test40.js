// a3.View.replaceScene()のテスト。
import * as a3 from 'a3js';

await a3.initFont('./assets/M-PLUS-1_Bold.json.zip');
const view = new a3.Window(600,300);
const gameStart = new a3.Text3D('Start Game');
view.scene.add(gameStart);

const gameMainScene = new a3.Scene();
const obj = await new a3.Acerola3D('./assets/stk_tux.a3').ready;
gameMainScene.add(obj);

const gameOverScene = new a3.Scene();
const gameOver = new a3.Text3D('Game Over');
gameOverScene.add(gameOver);

const name = await view.alert("ゲームの準備ができたら「OK」ボタンを押して下さい。");

view.replaceScene(gameMainScene);

await a3.asyncSleep(3000);

view.replaceScene(gameOverScene);

