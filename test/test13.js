// ObjectA3.setRotationのテスト
import * as a3 from 'a3js';
import * as THREE from 'three';

const view = new a3.Window(600,300);
const geo = new THREE.BoxGeometry();
const mat = new THREE.MeshStandardMaterial({ color: 0x00ff00 });
const mesh = new THREE.Mesh(geo, mat);
const obj = new a3.ThreeJS(mesh);
view.scene.add(obj);

let x=0,y=0,z=0;
for (let i=0;i<=360;i++) {
  x += 1;
  obj.setRotation(x,y,z);
  await a3.asyncSleep(10);
}
