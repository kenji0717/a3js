import * as a3 from 'a3js';

// stk_tux.a3のカート用の設定
const stk_kart = {
  mass: 10.0, // ブレーキの効きの調整のため
  chassisWidth: 0.7,
  chassisHeight: 0.5,
  chassisLength: 1.5,
  chassisOffset: {x:  0.0, y: -0.25,  z:  0.0 },
  wheelFrontYPosition: -0.05,
  wheelFrontZPosition: 0.40,
  wheelFrontAxleLength: 0.6,
  wheelRearYPosition: -0.00,
  wheelRearZPosition: -0.35,
  wheelRearAxleLength: 0.7,
  wheelFrontRadius: 0.1,
  wheelRearRadius: 0.15,
  wheelFrontWidth: 0.19,
  wheelRearWidth: 0.24,
  wheelFrontSuspensionRestLength: 0.26,
  wheelRearSuspensionRestLength: 0.25,
  wheelFrontSuspensionStiffness: 200.0,
  wheelRearSuspensionStiffness: 250.0,
  wheelFrontSuspensionCompression: 4.0,
  wheelRearSuspensionCompression: 4.0,
  wheelFrontSuspensionRelaxation: 10.0,
  wheelRearSuspensionRelaxation: 10.0,
  wheelFrontMaxSuspensionTravel: 0.05,
  wheelRearMaxSuspensionTravel: 0.05,
  aerodynamicDrag: 0.5, // 空気抵抗
};

await a3.initPhysics();
const view = new a3.Window(600,300);
const ground = await new a3.Acerola3D('/a3js/assets/stk_racetrack.a3').ready;
ground.setMode('SimplePhysics',{meshCollider:'tri_mesh',rigidBody:'fixed'});
view.scene.add(ground);

const kart = await new a3.Acerola3D('/a3js/assets/stk_tux.a3').ready;
const cc = new a3.CarControl(stk_kart);
kart.setTransformer(cc.trans);
kart.getAction('default').motion = cc.motion;
kart.setState('default');
view.scene.add(kart);
view.camera.setMode('Follow',{target:kart});

// 5秒ごとに前進・後退を切り替えて自動走行
let t = 0;
while (true) {
  t += await view.waitForRender();
  if (Math.floor(t/5)%2===0) cc.accelerate(8);
  else cc.accelerate(-8);
}
