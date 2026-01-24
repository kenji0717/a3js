// a3.View.camera.add(obj)のテスト
import * as a3 from 'a3js';

const view = new a3.Window(600,300);
const obj1 = new a3.Box();
view.scene.add(obj1);

const obj2 = new a3.Test();
obj2.setScale(0.1,0.1,0.1);
obj2.setLocation(-0.5,0,-1.3);
view.camera.add(obj2);
