// 初期ColliderのScale対応
// ObjectA3.getScale()の情報をSimplePhysicの
// ColliderDesc生成に反映。
import * as a3 from 'a3js';

await a3.initPhysics();
const view = new a3.Window(600,300);
view.scene.setPhysicsDebugMode(true);

const obj1 = await new a3.Acerola3D('./assets/vesma9.a3').ready;
//const obj1 = new a3.Box(); // プリミティブの場合
obj1.setMode('SimplePhysics',{rigidBody:'kinematic'});
obj1.setPositionNow(-2,0,0);
view.scene.add(obj1);

const obj2 = await new a3.Acerola3D('./assets/vesma9.a3').ready;
//const obj2 = new a3.Box(); // プリミティブの場合
obj2.setScale(2,2,2); // この段階ではDefaultモードなのでNow無しで行ける
obj2.setMode('SimplePhysics',{rigidBody:'kinematic'});
obj2.setPositionNow(2,0,0);
view.scene.add(obj2);
