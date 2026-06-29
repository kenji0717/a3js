import * as THREE from 'three';
import { ObjectA3 } from './ObjectA3';
import { ActionObject } from './ActionObject';
import { physicsEngineInstance, RapierPhysicsWorld } from '../rapier/RapierPhysics';
import type { PhysicsWorld, Collision } from './Physics';
import { Acerola3D, A3Action } from './Acerola3D';

/**
 * 3D 仮想空間を管理するクラスです。
 *
 * `ObjectA3` を追加・削除してシーンを構築します。
 * 毎フレームの更新処理（位置計算・物理シミュレーション・衝突検知）もこのクラスが行います。
 *
 * @example
 * ```ts
 * const scene = new Scene();
 *
 * const box = new Box();
 * scene.add(box);
 *
 * // 毎フレーム呼び出す
 * function animate(dt: number) {
 *   scene.update(dt);
 * }
 * ```
 */
export class Scene {
  /** 内部で使用している Three.js の `THREE.Scene`。直接操作するよりも `Scene` のメソッドを使うことを推奨します。 */
  scene: THREE.Scene;
  /** このシーンに追加されているすべての `ObjectA3` の配列です。 */
  objects: ObjectA3[];
  /** 物理ワールドのインスタンス。`initPhysics()` が呼ばれていない場合は `null` です。 */
  physicsWorld: PhysicsWorld | null = null;
  /** 物理シミュレーションの時間刻み（秒）。初期値は `1/60` 秒です。 */
  physicsDt = 1/60;
  /** 衝突が検知されたときに呼び出されるリスナー。`setCollisionListener()` で登録します。 */
  collisionListener?: (cs: Collision[]) => void;
  /** 物理デバッグモード時に表示するコライダーの輪郭線。`setPhysicsDebugMode(true)` で有効になります。 */
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

  /**
   * `ObjectA3` をこのシーンに追加します。
   * 追加されたオブジェクトは毎フレームの `update()` で更新されるようになります。
   * 物理エンジンが有効な場合は物理ワールドへの登録も自動的に行われます。
   * @param object 追加する `ObjectA3`
   */
  add(object: ObjectA3) {
    this.scene.add(object.object3D);
    this.objects.push(object);
    object.scene = this;
    if (this.physicsWorld) {
      object.addOneselfToPhysics(this.physicsWorld);
      if (object instanceof ActionObject) {
        for (const a of Object.values(object.actions)) {
          a.motion.addOneselfToPhysics(this.physicsWorld);
        }
      }
    }
    // backgroundTextureやfogがあれば適用
    // GAHA この方法が適切？
    if (object instanceof Acerola3D) {
      if (object.currentAction instanceof A3Action) {
        if (object.currentAction.backgroundTexture) {
          this.scene.background = object.currentAction.backgroundTexture;
          this.scene.environment = object.currentAction.backgroundTexture;
        }
        if (object.currentAction.fog)
          this.scene.fog = object.currentAction.fog;
      }
    }
  }

  /**
   * `ObjectA3` をこのシーンから取り除きます。
   * 物理エンジンが有効な場合は物理ワールドからの登録解除も自動的に行われます。
   * @param object 取り除く `ObjectA3`
   */
  remove(object: ObjectA3) {
    this.scene.remove(object.object3D);
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
      object.removeOneselfFromPhysics(this.physicsWorld);
      if (object instanceof ActionObject) {
        for (const a of Object.values(object.actions)) {
          a.motion.removeOneselfFromPhysics(this.physicsWorld);
        }
      }
    }
    // backgroundTextureやfogがあれば削除
    // GAHA この方法が適切？
    if (object instanceof ActionObject) {
      if (object.currentAction instanceof A3Action) {
        if (object.currentAction.backgroundTexture) {
          this.scene.background = null;
          this.scene.environment = null;
        }
        if (object.currentAction.fog)
          this.scene.fog = null;
      }
    }
  }

  /**
   * このシーンに追加されているすべての `ObjectA3` を取り除きます。
   */
  removeAll() {
    const tmpObjects = [...this.objects];
    tmpObjects.forEach((o)=>{this.remove(o);});
  }

  /**
   * 物理エンジンが衝突を検知したときに呼び出されるリスナーを登録します。
   * 個別のオブジェクトの衝突を処理したい場合は `ObjectA3.handleCollision()` のオーバーライドを使ってください。
   * @param func 衝突情報の配列 `Collision[]` を受け取る関数
   */
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
          this.rapierLines.geometry.computeBoundingSphere();
        }
      }
    }
    for (const obj of this.objects) {
      obj.update(dt);
    }
  }

  /**
   * 物理エンジンのデバッグ表示を切り替えます。
   * `true` にすると、コライダー（衝突判定の形状）の輪郭線が 3D 空間に表示されます。
   * @param debug `true` でデバッグ表示を有効化、`false` で無効化
   */
  setPhysicsDebugMode(debug: boolean) {
    if (debug) {
      this.rapierLines = new THREE.LineSegments(
        new THREE.BufferGeometry(),
        new THREE.LineBasicMaterial({vertexColors:true})
      );
      //this.rapierLines.frustumCulled = false;
      this.scene.add(this.rapierLines);
    } else {
      if (this.rapierLines) {
        this.scene.remove(this.rapierLines);
        this.rapierLines = undefined;
      }
    }
  }
}
