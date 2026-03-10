// a3.Canvasのalertのテスト
import * as a3 from 'a3js';

const view = new a3.Canvas();
view.style.cssText = 'width:600px;height:300px;';
document.body.appendChild(view);

//view.alert("ただメッセージを出すだけのalert()");
await view.alert("ボタンを押すとスタートします",a3.initSound);

const obj = new a3.Test();
view.scene.add(obj);
