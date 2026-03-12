// a3.Windowのpromptのテスト
import * as a3 from 'a3js';

await a3.initFont('./assets/M-PLUS-1_Bold.json.zip');
const view = new a3.Window(600,300);

const msg = await view.prompt("何か入力してボタンを押して下さい。",a3.initSound);

const obj = new a3.Text3D(msg);
view.scene.add(obj);
