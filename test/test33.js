// RapierのJointのプログラム方法(3Dモデル使用)
// Acerola3Dのモデルを使ってリヤカー作る。
// 一つクラス作らなくて済むので少しだけ楽。
import * as a3 from 'a3js';
import * as THREE from 'three';
import RAPIER from "@dimforge/rapier3d-compat";

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

  prepare3D(objectA3) {
    if (objectA3 instanceof a3.Acerola3D) {
      objectA3.addActionRoot('JointTest');
    }
  }
  cleanup3D(objectA3) {
    if (objectA3 instanceof a3.Acerola3D) {
      objectA3.removeActionRoot('JointTest');
    }
  }
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
    };
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
const obj = await new a3.Acerola3D('./assets/handcart/handcart.a3').ready;
const jointTestTransformer = new JointTestTransformer(this);
obj.setTransformer(jointTestTransformer);
obj.getAction('JointTest').motion = jointTestTransformer.motion;
obj.setState('JointTest');
view.scene.add(obj);
view.camera.setLocationNow(0,10,20);
view.camera.lookAtNow(0,-3,0);

let t=0;
while (true) {
  t += await view.waitForRender();
  if (Math.floor(t/5)%2===0) {
    jointTestTransformer.motion.rightWheelAngvel(20.0);
    jointTestTransformer.motion.leftWheelAngvel(-20.0);
  } else {
    jointTestTransformer.motion.rightWheelAngvel(-20.0);
    jointTestTransformer.motion.leftWheelAngvel(20.0);
  }
}
