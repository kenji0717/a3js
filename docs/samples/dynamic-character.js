import * as a3 from 'a3js';

await a3.initPhysics();
const view = new a3.Window(600,300);

const ground = await new a3.GLTF('/a3js/assets/grass-ground2.glb').ready;
ground.setMode('SimplePhysics',{meshCollider:'tri_mesh',rigidBody:'fixed'});
view.scene.add(ground);

const player = await new a3.GLTF('/a3js/assets/RobotExpressive.glb').ready;
player.setScale(0.5,0.5,0.5);
player.setMode('DynamicCharacter');
player.setPosition(0,2,0);
// 速度に応じてアクションを自動切り替え(このモデルのアクション名に合わせる)
player.haltActionName = 'Idle';
player.walkActionName = 'Walking';
player.runActionName = 'Running';
player.setState('Idle');
player.setAutoAction(true);
view.scene.add(player);

// W/A/S/Dで移動、←→で回転、Spaceでジャンプ
// (キーが効かないときは一度3D表示部分をクリック)
view.setController(new a3.AvatarVelocityController(player));
view.camera.setMode('Follow',{target:player,lookFrom:{x:0,y:2,z:-4}});

// ぶつかると押せる箱(dynamic)
const box = new a3.Box('red');
box.setMode('SimplePhysics');
box.setPositionNow(0,1,3);
view.scene.add(box);
