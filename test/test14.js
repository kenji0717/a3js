// ObjectA3.lookAtのテスト
import * as a3 from 'a3js';
import * as THREE from 'three';

const view = new a3.Window(600,300);
view.setController(new a3.ControllerBase(view));
const light = new THREE.DirectionalLight(0xffffff,1);
light.position.set(100,100,100);
const lightObj = new a3.ThreeJS(light);
view.scene.add(lightObj);
//view.camera.setHeadLightEnable(false);

const geo = new THREE.BoxGeometry();

const r = (n)=>Math.floor(n*Math.random());

for (let t=0;t<2*Math.PI;t+=Math.PI/4) {
  const mat = new THREE.MeshStandardMaterial({ color: `rgb(${r(256)},${r(256)},${r(256)})` });
  const obj = new a3.ThreeJS(new THREE.Mesh(geo, mat));
  obj.setLocation(10*Math.cos(t),0,10*Math.sin(t));
  view.scene.add(obj);
}


view.camera.setLocation(0,10,10);
//view.camera.setControlMode('interpolated');
view.camera.lookAt(0,0,0);

view.addEventListener('click3d',(e)=>{
  view.camera.lookAt(e.detail.value[0].o2);
});
