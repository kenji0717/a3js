// a3.Windowのalertのテスト
import * as a3 from 'a3js';

const view = new a3.Window(600,300);

//view.alert("ただメッセージを出すだけのalert()");
await view.alert("ボタンを押すとスタートします",a3.initSound);

const obj = new a3.Test();
view.scene.add(obj);
