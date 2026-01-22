// 日本語フォントのテスト
import * as a3 from 'a3js';

await a3.initFont('./assets/M-PLUS-1_Bold.json.zip');
const view = new a3.Window(600,300);
const obj = new a3.Text3D("日本語");
view.scene.add(obj);
