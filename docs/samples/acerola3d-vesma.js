import * as a3 from 'a3js';

const view = new a3.Window(600,300);
const obj = await new a3.Acerola3D('/a3js/assets/vesma9.a3').ready;
console.log(obj.getActionNames());
view.scene.add(obj);
obj.setState('walk');

await a3.asyncSleep(3000);
obj.setEmote('Bye');
