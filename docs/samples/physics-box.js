import * as a3 from 'a3js';

await a3.initPhysics();
const view = new a3.Window(600,300);
view.camera.setPosition(0,0,10);

const ground = new a3.Box(10,0.5,10,"red");
ground.setMode('SimplePhysics',{rigidBody: 'fixed'});
ground.setPositionNow(0,-3,0);
view.scene.add(ground);

const box = new a3.Box("blue");
box.setMode('SimplePhysics');
box.setPositionNow(0,2,0);
box.setRotationNow(45,30,0);
view.scene.add(box);
