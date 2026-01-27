// a3.ObjectA3.add(obj);のテスト
import * as a3 from 'a3js';

const view = new a3.Window(600,300);
const obj1 = new a3.Box(0.3,2,0.3);
view.scene.add(obj1);

const obj2 = new a3.Box(0.3,2,0.3);
obj1.add(obj2);
obj2.setLocation(0,1,0);
obj2.setRotation(0,0,90);


for (let t=0;t<=360;t++) {
  await a3.asyncSleep(1000/60);
  obj1.setRotation(0,0,t);
  obj2.setRotation(0,0,t);
}

await a3.asyncSleep(3000);

obj1.remove(obj2);

