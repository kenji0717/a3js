import * as THREE from 'three';
import { A3Object } from './A3Object';
import type { A3PhysicsWorld } from './A3Physics';
import { RapierPhysicsEngine } from '../rapier/RapierPhysics';

/**
  * 3D仮想空間を表すクラス。THREE.Sceneを内包していて
  * アップデート処理とかも、ここで行う。
  */
export class A3Scene {
  scene: THREE.Scene;
  objects: A3Object[];
  static physics: RapierPhysicsEngine = new RapierPhysicsEngine();
  physicsWorld: A3PhysicsWorld | null = null;
  physicsDt = 1/60;

  static async initPhysics() {
    await A3Scene.physics.init();
  }

  constructor() {
    this.scene = new THREE.Scene();
    this.objects = [];
    if (A3Scene.physics.isInitialized) {
      this.physicsWorld = A3Scene.physics.createWorld({
        gravity: {x:0.0, y: -9.81, z:0.0},
        timestep: this.physicsDt
      });
    }
  }

  add(object: A3Object) {
    this.scene.add(object.object);
    this.objects.push(object);
    object.scene = this;
    if (object.controlMode === "physics") {
      if (this.physicsWorld) {
        if (!object.physics) {
          const opt = object.getPhysicsOption();
          object.initPhysics(opt);
        }
        if (object.physics) // 必ずtrueのはず
          this.physicsWorld.add(object.physics);
      } else {
        console.log('物理エンジンを初期化してない状態で、物理エンジンを必要とするA3Objectが追加されました。');
      }
    }
  }

  remove(object: A3Object) {
    this.scene.remove(object.object);
    {
      // やりたいのはthis.objects.remove(object);なんだけど無い
      // そして順番は変になるけど以下の方法はゲーム系では速くて
      // 良いらしい。
      const i = this.objects.indexOf(object);
      this.objects[i] = this.objects[this.objects.length-1];
      this.objects.pop();
    }
    object.scene = null;
    if (object.controlMode === "physics")
      if (this.physicsWorld)
        if (object.physics)
          this.physicsWorld.remove(object.physics);
  }

  update(dt: number) {
    if (this.physicsWorld)
      this.physicsWorld.update(dt);
    for (const obj of this.objects) {
      if (obj.controlMode !== "manual" ) {
        obj.update(dt);
      }
    }
  }
}
