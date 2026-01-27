// 物理演算の初期のテスト
import * as a3 from 'a3js';

await a3.initPhysics();
const view = new a3.Window(600,300);
const obj = new a3.Test({physics: true});
view.scene.add(obj);
