// three.jsのObject3Dをそのまま表示させるThreeJSのテスト
import * as a3 from 'a3js';
import * as THREE from 'three';

const view = new a3.Window(600,300);
const geo = new THREE.BoxGeometry();
const mat = new THREE.MeshStandardMaterial({ color: 0x00ff00 });
const mesh = new THREE.Mesh(geo, mat);
const obj = new a3.ThreeObject(mesh);
view.scene.add(obj);
