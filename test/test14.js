// ObjectA3.lookAtのテスト
// BaseControllerのテストも兼ねる
import * as a3 from 'a3js';

const r = (n)=>Math.floor(n*Math.random());//0<=r<nの乱数

const view = new a3.Window(600,300);
// ControllerBaseでマウスでグリグリできなくする。
view.setController(new a3.BaseController());

for (let t=0;t<2*Math.PI;t+=Math.PI/4) {
  const obj = new a3.Box(`rgb(${r(256)},${r(256)},${r(256)})`);
  obj.setPosition(10*Math.cos(t),0,10*Math.sin(t));
  view.scene.add(obj);
}

view.camera.setPosition(0,10,10);
view.camera.lookAt(0,0,0);

view.addEventListener('click3d',(e)=>{
  if (e.detail.value[0] && e.detail.value[0].a3js)
    view.camera.lookAtNow(e.detail.value[0].a3js);
});
