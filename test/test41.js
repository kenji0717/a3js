// リソース大量に読み込む場合の書き方見本。
import * as a3 from 'a3js';

const view = new a3.Window(600,300);
const gameStart = new a3.Test();
view.scene.add(gameStart);

const gameMainScene = new a3.Scene();
const loadings = [];
loadings.push(new a3.GLTF('./assets/gba_peach_circuit.glb').ready);
loadings.push(new a3.Acerola3D('./assets/stk_tux.a3').ready);
loadings.push(new a3.GLTF('./assets/RobotExpressive.glb').ready);
const [obj1,obj2,obj3] = await Promise.all(loadings);
gameMainScene.add(obj1);
obj2.setLocation(1,0,0);
gameMainScene.add(obj2);
obj3.setLocation(-1,0,0);
gameMainScene.add(obj3);

const name = await view.alert("ゲームの準備ができたら「OK」ボタンを押して下さい。");

view.replaceScene(gameMainScene);
