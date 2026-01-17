import * as THREE from 'three';
import { A3Object } from './A3Object';
import type { A3PhysicsEngine, A3PhysicsWorld } from './A3Physics';
import { RapierPhysicsEngine } from '../rapier/RapierPhysics';

/**
  * 3D仮想空間を表すクラス。THREE.Sceneを内包していて
  * アップデート処理とかも、ここで行う。
  */
export class A3Scene {
  scene: THREE.Scene;
  objects: A3Object[];
  static physics: A3PhysicsEngine;
  physicsWorld: A3PhysicsWorld | null = null;
  physicsDt = 1/60;

  constructor() {
    this.scene = new THREE.Scene();
    this.objects = [];
    if (!A3Scene.physics) {
      // 以下、オブジェクトは用意されるけど、
      // 重い初期化処理などは実行されない
      A3Scene.physics = new RapierPhysicsEngine();
    }
  }

  add(object: A3Object) {
    this.scene.add(object.object);
    this.objects.push(object);
    object.scene = this;
    // 物理計算が必要になった時にはじめて初期化をする
    // という方針にしたので、以下のような感じにした。重い？
    if (object.controlMode === "physics") {
      if (!this.physicsWorld) {
        queueMicrotask(async () => { // こんなのあったのね
          if (!this.physicsWorld) { // ここでもチェックしておくべき
            this.physicsWorld = await A3Scene.physics.createWorld({
              gravity: {x:0.0, y: -9.81, z:0.0},
              timestep: this.physicsDt
            });
          }
          if (!object.physics)
            object.physics = object.initPhysics(A3Scene.physics,this.physicsWorld);
          if (object.physics) // 必ずtrueのはず
            this.physicsWorld.add(object.physics);
        });
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
