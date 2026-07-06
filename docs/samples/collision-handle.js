import * as a3 from 'a3js';

// Sphereを継承してhandleCollision()を実装する
class MySphere extends a3.Sphere {
  handleCollision(obj, started, myPartNo, yourPartNo) {
    console.log(`衝突${started ? '開始' : '終了'}: `, obj);
  }
}

await a3.initPhysics();
const view = new a3.Window(600,300);
view.camera.setPosition(0,0,10);

const ground = new a3.Box(10,0.5,10,"red");
ground.setMode('SimplePhysics',{rigidBody:'fixed', collisionDetection:true});
ground.setPositionNow(0,-3,0);
view.scene.add(ground);

// よく弾む(restitution:0.8)ボールを落とす
const ball = new MySphere('blue');
ball.setMode('SimplePhysics',{collisionDetection:true, restitution:0.8});
ball.setPositionNow(0,3,0);
view.scene.add(ball);
