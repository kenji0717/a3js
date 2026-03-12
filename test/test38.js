// a3.Canvasのalertのテスト
import * as a3 from 'a3js';

await a3.initFont('./assets/M-PLUS-1_Bold.json.zip');
const view = new a3.Canvas();
view.style.cssText = 'width:600px;height:300px;';
document.body.appendChild(view);

const msg = await view.prompt("何か入力してボタンを押して下さい。",a3.initSound);

const obj = new a3.Text3D(msg);
view.scene.add(obj);
