// a3.View.camera.add(obj)のテスト
import * as a3 from 'a3js';

const view = new a3.Window(600,300);
//const view = new a3.Window(300,600);
const obj1 = new a3.Box();
view.scene.add(obj1);

const obj2 = new a3.SampleObject();
obj2.setScale(0.1,0.1,0.1);
const v = view.screenToCamera(100,100,1);
//const v = view.screenToCamera(300,100,1);
obj2.setPosition(v);
view.camera.add(obj2);
