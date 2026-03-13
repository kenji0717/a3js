// a3.GameCanvasのalertとpromptのテスト
import * as a3 from 'a3js';

const view = new a3.GameCanvas({touchDevice:true});
view.style.cssText = 'width:600px;height:300px;';
document.body.appendChild(view);
const name = await view.prompt("名前を入力して下さい。");
await view.alert(`${name}さん、こんにちは。`)
