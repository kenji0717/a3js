import * as THREE from 'three';
import { ObjectA3 } from './ObjectA3';
import { ActionObject } from './ActionObject';
import { physicsEngineInstance, RapierPhysicsWorld } from '../rapier/RapierPhysics';
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
  rapierLines?: THREE.LineSegments;

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
    if (this.physicsWorld) {
      object.transformer.addOneselfToPhysics(this.physicsWorld);
      if (object instanceof ActionObject) {
        for (const a of Object.values(object.actions)) {
          a.motion.addOneselfToPhysics(this.physicsWorld);
        }
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
    object.scene = undefined;
    if (this.physicsWorld) {
      object.transformer.removeOneselfFromPhysics(this.physicsWorld);
      if (object instanceof ActionObject) {
        for (const a of Object.values(object.actions)) {
          a.motion.removeOneselfFromPhysics(this.physicsWorld);
        }
      }
    }
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
      if (this.rapierLines) {
        if (this.physicsWorld instanceof RapierPhysicsWorld) {
          const { vertices, colors } = this.physicsWorld.world.debugRender();
          this.rapierLines.geometry.setAttribute(
            'position',
            new THREE.BufferAttribute(vertices, 3)
          );
          this.rapierLines.geometry.setAttribute(
            'color',
            new THREE.BufferAttribute(colors, 4)
          );
        }
      }
    }
    for (const obj of this.objects) {
      obj.update(dt);
    }
  }

  rapierDebug(debug: boolean) {
    if (debug) {
      this.rapierLines = new THREE.LineSegments(
        new THREE.BufferGeometry(),
        new THREE.LineBasicMaterial({vertexColors:true})
      );
      this.scene.add(this.rapierLines);
    } else {
      if (this.rapierLines) {
        this.scene.remove(this.rapierLines);
        this.rapierLines = undefined;
      }
    }
  }
}
