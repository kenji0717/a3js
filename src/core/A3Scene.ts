import * as THREE from 'three';
import { A3Object } from './A3Object';
import type { A3Physics, A3PhysicsWorld, A3PhysicsOption } from './A3Physics';
import { RapierPhysics } from '../rapier/RapierPhysics';



/**
  * 3D仮想空間を表すクラス。THREE.Sceneを内包していて
  * アップデート処理とかも、ここで行う。
  */
export class A3Scene {
  scene: THREE.Scene;
  objects: A3Object[];
  static physics: A3Physics;
  physicsWorld: A3PhysicsWorld | null = null;
  physicsDt = 1/60;

  constructor() {
    this.scene = new THREE.Scene();
    this.objects = [];
    if (!A3Scene.physics) {
      // 以下、オブジェクトは用意されるけど、
      // 重い初期化処理などは実行されない
      A3Scene.physics = new RapierPhysics();
    }
  }

  add(object: A3Object) {
    this.scene.add(object.object);
    this.objects.push(object);
    object.scene = this;
    if (object.needsPhysics) {
      if (this.physicsWorld && !object.physics) {
        object.physics = this.physicsWorld.createPhysicsEntity(object);
        object.needsUpdate = true;
      }
    }
  }

  async initPhysics() {
    // ここで初めて物理エンジンが初期化されるかも
    // しれないのでasyncが付いてる。
    const opt: A3PhysicsOption = {
      gravity: {x:0.0, y: -9.81, z:0.0},
      timestep: this.physicsDt
    };
    this.physicsWorld = await A3Scene.physics.createWorld(opt);
  }

  update(dt: number) {
    if (this.physicsWorld)
      this.physicsWorld.update(dt);
    for (const obj of this.objects) {
      if (obj.needsUpdate) {
        obj.update(dt);
      }
    }
  }
}
