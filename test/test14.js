// ObjectA3.lookAtのテスト
// の前に普通にカメラの移動のテスト
import * as a3 from 'a3js';
import * as THREE from 'three';

const view = new a3.Window(600,300);
view.setController(new a3.ControllerBase(view));
console.log(view.camera.controlMode);

const geo = new THREE.BoxGeometry();
const mat = new THREE.MeshStandardMaterial({ color: 0x00ff00 });


for (let t=0;t<2*Math.PI;t+=Math.PI/4) {
  const obj = new a3.ThreeJS(new THREE.Mesh(geo, mat));
  obj.setLocation(5*Math.cos(t),0,5*Math.sin(t));
  view.scene.add(obj);
}



view.camera.setLocation(0,0,0);
let t=0;
while (true) {
  await a3.asyncSleep(10);
  t+=0.1;
  view.camera.setRotation(0,t,0);
}

