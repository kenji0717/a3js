// ObjectA3.lookAtのテスト
import * as a3 from 'a3js';
import * as THREE from 'three';

const r = (n)=>Math.floor(n*Math.random());//0<=r<nの乱数

const view = new a3.Window(600,300);
// ↓デフォルトのOrbigControllerだとカメラを操作できないので
view.setController(new a3.ControllerBase(view));

const geo = new THREE.BoxGeometry();

for (let t=0;t<2*Math.PI;t+=Math.PI/4) {
  const mat = new THREE.MeshStandardMaterial(
    { color: `rgb(${r(256)},${r(256)},${r(256)})` });
  const obj = new a3.ThreeJS(new THREE.Mesh(geo, mat));
  obj.setLocation(10*Math.cos(t),0,10*Math.sin(t));
  view.scene.add(obj);
}

view.camera.setLocation(0,10,10);
view.camera.lookAt(0,0,0);

view.addEventListener('click3d',(e)=>{
  if (e.detail.value[0] && e.detail.value[0].o2)
    view.camera.lookAt(e.detail.value[0].o2);
});
