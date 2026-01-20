import * as THREE from 'three';
import { ObjectA3 } from './ObjectA3';
import type { PhysicsWorld } from './Physics';
import { RapierPhysicsEngine } from '../rapier/RapierPhysics';

/**
  * 3D仮想空間を表すクラス。THREE.Sceneを内包していて
  * アップデート処理とかも、ここで行う。
  */
export class Scene {
  scene: THREE.Scene;
  objects: ObjectA3[];
  static physics: RapierPhysicsEngine = new RapierPhysicsEngine();
  physicsWorld: PhysicsWorld | null = null;
  physicsDt = 1/60;

  static async initPhysics() {
    await Scene.physics.init();
  }

  constructor() {
    this.scene = new THREE.Scene();
    this.objects = [];
    if (Scene.physics.isInitialized) {
      this.physicsWorld = Scene.physics.createWorld({
        gravity: {x:0.0, y: -9.81, z:0.0},
        timestep: this.physicsDt
      });
    }
  }

  add(object: ObjectA3) {
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
        console.log('物理エンジンを初期化してない状態で、物理エンジンを必要とするObjectA3が追加されました。');
      }
    }
  }

  remove(object: ObjectA3) {
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
