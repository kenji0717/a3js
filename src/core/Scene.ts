import * as THREE from 'three';
import { ObjectA3 } from './ObjectA3';
import { physicsEngineInstance } from '../rapier/RapierPhysics';
import type { PhysicsWorld, Collision } from './Physics';

/**
  * 3D仮想空間を表すクラス。THREE.Sceneを内包していて
  * アップデート処理とかも、ここで行う。
  */
export class Scene {
  scene: THREE.Scene;
  objects: ObjectA3[];
  physicsWorld: PhysicsWorld | null = null;
  physicsDt = 1/60;
  collisionListener?: (cs: Collision[]) => void;

  constructor() {
    this.scene = new THREE.Scene();
    this.objects = [];
    if (physicsEngineInstance.isInitialized) {
      this.physicsWorld = physicsEngineInstance.createWorld({
        gravity: {x:0.0, y: -9.81, z:0.0},
        timestep: this.physicsDt
      });
    }
  }

  add(object: ObjectA3) {
    this.scene.add(object.object);
    this.objects.push(object);
    object.scene = this;
    if (this.physicsWorld)
      object.motion.addOneselfToPhysics(this.physicsWorld);
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
    if (this.physicsWorld)
      object.motion.removeOneselfFromPhysics(this.physicsWorld);
  }

  setCollisionListener(func: (cs: Collision[]) => void) {
    this.collisionListener = func;
  }

  update(dt: number) {
    if (this.physicsWorld) {
      this.physicsWorld.update(dt);
      const collisions = this.physicsWorld.getCollisions();
      collisions.forEach((c)=>{
        c.objectA.handleCollision(c.objectB, c.started, c.partOfA, c.partOfB);
        c.objectB.handleCollision(c.objectA, c.started, c.partOfB, c.partOfA);
      });
      if (this.collisionListener && collisions.length>0)
        this.collisionListener(collisions);
    }
    for (const obj of this.objects) {
      obj.update(dt);
    }
  }
}
