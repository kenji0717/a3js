// RapierのJointのプログラム方法
// モデリング無しで、プログラミングのみで対処する。
// リヤカーっぽい物にしてみる。
// いや、面倒すぎるな。
import * as a3 from 'a3js';
import * as THREE from 'three';
import RAPIER from "@dimforge/rapier3d-compat";

// Z軸の正の方向を前とするので、リヤカーの右車輪はX軸のマイナス
// の方向にある。つまり、向って左側の車輪が右の車輪ということにする。
class JointTest extends a3.ActionObject {
  constructor() {
    super();
  }

  async asyncInit() {
    const jointTestTransformer = new JointTestTransformer(this);
    this.setTransformer(jointTestTransformer);

    const bones = {};
    const root = new THREE.Object3D();

    const chassis = new THREE.Mesh(
      new THREE.BoxGeometry(1.0,0.2,2.0),
      new THREE.MeshStandardMaterial({ color: 0x00ff00 }));
    root.add(chassis);
    bones['chassis'] = chassis;

    const rightWheel = new THREE.Mesh(
      new THREE.CylinderGeometry(0.5, 0.5, 0.2),
      new THREE.MeshStandardMaterial({ color: 0xff0000 }));
    rightWheel.quaternion.set(0,0,Math.sin(Math.PI/4),Math.cos(Math.PI/4));
    const rightWheelWrapper = new THREE.Object3D();
    rightWheelWrapper.add(rightWheel);
    root.add(rightWheelWrapper);
    bones['rightWheel'] = rightWheelWrapper;

    const leftWheel = new THREE.Mesh(
      new THREE.CylinderGeometry(0.5, 0.5, 0.2),
      new THREE.MeshStandardMaterial({ color: 0xff0000 }));
    leftWheel.quaternion.set(0,0,Math.sin(Math.PI/4),Math.cos(Math.PI/4));
    const leftWheelWrapper = new THREE.Object3D();
    leftWheelWrapper.add(leftWheel);
    root.add(leftWheelWrapper);
    bones['leftWheel'] = leftWheelWrapper;

    const actions = {};
    actions['JointTest'] = new a3.Action(
      { root, bones },
      jointTestTransformer.motion
    );
    this.syncInit('JointTest',actions);
    return this;
  }

  rightWheelAngvel(an) {
    this.actions['JointTest'].motion.rightWheelAngvel(an);
  }
  leftWheelAngvel(an) {
    this.actions['JointTest'].motion.leftWheelAngvel(an);
  }
}

class JointTestTransformer extends a3.FixedTransformer {
  motion;
  constructor(objectA3) {
    super();
    this.motion = new JointTestMotion(objectA3);
  }
}

class JointTestMotion {
  name;
  playCount;
  time;
  objectA3;

  chassisColliderDesc;
  chassisCollider;
  chassisRigidBodyDesc;
  chassisRigidBody;
  rightWheelColliderDesc;
  rightWheelCollider;
  rightWheelRigidBodyDesc;
  rightWheelRigidBody;
  leftWheelColliderDesc;
  leftWheelCollider;
  leftWheelRigidBodyDesc;
  leftWheelRigidBody;

  rightRevoluteJointData;
  rightRevoluteJoint;
  leftRevoluteJointData;
  leftRevoluteJoint;
  

  constructor(objectA3) {
    this.name = "JointTest";
    this.playCount = 0;
    this.time = 0;
    this.objectA3 = objectA3;

    this.chassisRigidBodyDesc = RAPIER.RigidBodyDesc.dynamic();
    this.chassisColliderDesc = RAPIER.ColliderDesc.cuboid(0.5, 0.1, 1);

    this.rightWheelRigidBodyDesc = RAPIER.RigidBodyDesc.dynamic();
    this.rightWheelColliderDesc = RAPIER.ColliderDesc.cylinder(0.1, 0.5).setFriction(0.9);
    this.rightWheelColliderDesc.setRotation({x:0,y:0,z:Math.sin(Math.PI/4),w:Math.cos(Math.PI/4)});

    this.leftWheelRigidBodyDesc = RAPIER.RigidBodyDesc.dynamic();
    this.leftWheelColliderDesc = RAPIER.ColliderDesc.cylinder(0.1, 0.5).setFriction(0.9);
    this.leftWheelColliderDesc.setRotation({x:0,y:0,z:Math.sin(Math.PI/4),w:Math.cos(Math.PI/4)});

    this.rightRevoluteJointData = RAPIER.JointData.revolute(
      { x:-0.6, y:0, z:0 },
      { x:0, y:0, z:0 },
      { x:1, y:0, z:0 });
    this.leftRevoluteJointData = RAPIER.JointData.revolute(
      { x:0.6, y:0, z:0 },
      { x:0, y:0, z:0 },
      { x:1, y:0, z:0 });
  }

  prepare3D(objectA3) {}
  cleanup3D(objectA3) {}
  addOneselfToPhysics(world) {
    this.chassisRigidBody = world.world.createRigidBody(this.chassisRigidBodyDesc);
    this.chassisCollider = world.world.createCollider(this.chassisColliderDesc,
        this.chassisRigidBody);
    a3.collisionMap.set(this.chassisCollider.handle,this.objectA3);
    this.rightWheelRigidBody = world.world.createRigidBody(this.rightWheelRigidBodyDesc);
    this.rightWheelCollider = world.world.createCollider(this.rightWheelColliderDesc,
        this.rightWheelRigidBody);
    a3.collisionMap.set(this.rightWheelCollider.handle,this.objectA3);
    this.leftWheelRigidBody = world.world.createRigidBody(this.leftWheelRigidBodyDesc);
    this.leftWheelCollider = world.world.createCollider(this.leftWheelColliderDesc,
        this.leftWheelRigidBody);
    a3.collisionMap.set(this.leftWheelCollider.handle,this.objectA3);

    this.rightRevoluteJoint = world.world.createImpulseJoint(
      this.rightRevoluteJointData,
      this.chassisRigidBody,
      this.rightWheelRigidBody,
      true);
    this.rightRevoluteJoint.setContactsEnabled(false);
    this.leftRevoluteJoint = world.world.createImpulseJoint(
      this.leftRevoluteJointData,
      this.chassisRigidBody,
      this.leftWheelRigidBody,
      true);
    this.leftRevoluteJoint.setContactsEnabled(false);
  }
  removeOneselfFromPhysics(world) {
    world.world.removeRigidBody(this.chassisRigidBody);
    world.world.removeRigidBody(this.rightWheelRigidBody);
    world.world.removeRigidBody(this.leftWheelRigidBody);
    world.world.removeCollider(this.chassisCollider,false);
    world.world.removeCollider(this.rightWheelCollider,false);
    world.world.removeCollider(this.leftWheelCollider,false);
    world.world.removeImpulseJoint(this.rightRevoluteJoint);
    world.world.removeImpulseJoint(this.leftRevoluteJoint);
    a3.collisionMap.delete(this.chassisCollider.handle);
    a3.collisionMap.delete(this.rightWheelCollider.handle);
    a3.collisionMap.delete(this.leftWheelCollider.handle);
  }
  setPause(p) {}
  setTime(time) {}
  t=0;
  update(dt) {
    this.t+=dt;
    return {
      'chassis': {
        loc: new a3.Vec3(this.chassisRigidBody.translation()),
        quat: new a3.Quat(this.chassisRigidBody.rotation())
      },
      'rightWheel': {
        loc: new a3.Vec3(this.rightWheelRigidBody.translation()),
        quat: new a3.Quat(this.rightWheelRigidBody.rotation())
      },
      'leftWheel': {
        loc: new a3.Vec3(this.leftWheelRigidBody.translation()),
        quat: new a3.Quat(this.leftWheelRigidBody.rotation())
      }
    }
  }

  rightWheelAngvel(av) {
    this.rightRevoluteJoint.configureMotorVelocity(av,1);
  }
  leftWheelAngvel(av) {
    this.leftRevoluteJoint.configureMotorVelocity(av,1);
  }
}

await a3.initPhysics();
const view = new a3.Window(600,300);
view.scene.rapierDebug(true);
const ground = new a3.Box(10,1,10);
ground.initSimplePhysics({rigidBody: 'fixed'});
ground.setLocationNow(0,-2,0);
view.scene.add(ground);
const obj = new JointTest();
view.scene.add(obj);
view.camera.setLocationNow(0,3,5);
view.camera.lookAtNow(0,-1,0);

let t=0;
while (true) {
  t += await view.waitForRender();
  if (Math.floor(t/5)%2===0) {
    obj.rightWheelAngvel(20.0);
    obj.leftWheelAngvel(-20.0);
  } else {
    obj.rightWheelAngvel(-20.0);
    obj.leftWheelAngvel(20.0);
  }
}

