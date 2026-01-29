//import RAPIER from '@dimforge/rapier3d-compat';
import type * as Rapier from '@dimforge/rapier3d-compat';
import * as THREE from 'three';
import * as TG from '../utils/TypeGuard';

import { ObjectA3 } from '../core/ObjectA3';
import type { MutableVec3 } from '../core/Vec3';
import type { MutableQuat } from '../core/Quat';
import { PhysicsEntity, defaultPhysicsEntityOption } from '../core/Physics';
import type { PhysicsEngine, PhysicsWorld, PhysicsWorldOption,
              PhysicsEntityOption, Collision } from '../core/Physics';
import type { Motion } from '../core/Motion';

let RAPIER: typeof import('@dimforge/rapier3d-compat');


export class RapierPhysicsEngine implements PhysicsEngine {
  static RAPIER: typeof import('@dimforge/rapier3d-compat');
  isInitialized: boolean = false;
  constructor() {
    // 物理エンジンを使用しない場合もあることを考えて、
    // コンストラクタでは初期化処理をしないでおくこと。
  }

  /**
    * RAPIER物理エンジンの初期化が済んでない時に初期化する
    * 動的インポート使う。
    */
  async init(): Promise<void> {
    if (!RapierPhysicsEngine.RAPIER) {
      const R = await import('@dimforge/rapier3d-compat');
      await R.init(); // using deprecated parameters for the initialization function; pass a single object instead
      RapierPhysicsEngine.RAPIER = R;
      RAPIER = R;
      this.isInitialized = true;
    }
  }

  /**
    * RapierWorldを作って返す。
    */
  createWorld(option: RapierPhysicsWorldOption): PhysicsWorld {
    let timestep = 1/60;
    if (this.isRapierWorldOption(option))
      timestep = option.timestep;
    const world = new RAPIER.World(option.gravity);
    return new RapierPhysicsWorld(world,timestep);
  }

  private isRapierWorldOption(option: PhysicsWorldOption): option is RapierPhysicsWorldOption {
    return ( /* "enableCCD" in option && */ "timestep" in option );
  }
}

export interface RapierPhysicsWorldOption extends PhysicsWorldOption {
  //enableCCD: boolean;
  timestep: number;
}

export class RapierPhysicsWorld implements PhysicsWorld {
  world: Rapier.World;
  timestep: number;
  collisionEventQueue: Rapier.EventQueue;

  constructor(world:Rapier.World, timestep:number) {
    this.world = world;
    this.timestep = timestep;
    this.collisionEventQueue = new RAPIER.EventQueue(true);
    this.world.integrationParameters.dt = this.timestep;
  }

  add(entity: PhysicsEntity) {
    if (isRapierPhysicsEntity(entity)) {
      entity.addOneself(this);
    } else {
      ; // 何もしない
    }
  }

  remove(entity: PhysicsEntity) {
    if (isRapierPhysicsEntity(entity)) {
      entity.removeOneself(this);
    } else {
      ; // 何もしない
    }
  }

  update(dt: number) {
    // ここの実装は良く考えた方が良い。今は適当
    const n = Math.ceil(dt / this.timestep);
    for (let i=0;i<n;i++)
      this.world.step(this.collisionEventQueue);
  }

  getCollisions(): Collision[] {
    const collisions: Collision[] = [];
    this.collisionEventQueue.drainCollisionEvents((handle1, handle2, started) => {
      const objA = RapierPhysicsEntity.collisionMap.get(handle1);
      const objB = RapierPhysicsEntity.collisionMap.get(handle2);
      if ( objA && objB) {
        collisions.push({
          objectA: objA,
          partOfA: handle1,
          objectB: objB,
          partOfB: handle2,
          started
        });
      }
    });
    return collisions;
  }
}

export abstract class RapierPhysicsEntity extends PhysicsEntity {
  static collisionMap: Map<number,ObjectA3> = new Map();
  abstract addOneself(world: RapierPhysicsWorld): void;
  abstract removeOneself(world: RapierPhysicsWorld): void;
}

function isRapierPhysicsEntity(obj: PhysicsEntity): obj is RapierPhysicsEntity {
  return "addOneself" in obj && "removeOneself" in obj;
}

export class RapierDefaultMotion implements Motion {
  objectA3: ObjectA3;
  object3D: THREE.Object3D;
  bodyDesc: Rapier.RigidBodyDesc;
  body?: Rapier.RigidBody;
  colliderDescs: Rapier.ColliderDesc[] = [];
  colliders: Rapier.Collider[] = [];

  constructor(objectA3: ObjectA3,option: Partial<PhysicsEntityOption>) {
    this.objectA3 = objectA3;
    this.object3D = objectA3.object;
    const opt: PhysicsEntityOption = {
      ...defaultPhysicsEntityOption,
      ...option
    };
    switch(opt.rigidBody) {
      case "dynamic":
        this.bodyDesc = RAPIER.RigidBodyDesc.dynamic();
        break;
      case "kinematic":
        this.bodyDesc = RAPIER.RigidBodyDesc.kinematicPositionBased();
        //this.bodyDesc = RAPIER.RigidBodyDesc.kinematicVelocityBased(); // GAHAこれあったか！
        break;
      case "fixed":
        this.bodyDesc = RAPIER.RigidBodyDesc.fixed();
        break;
    }
    this.bodyDesc.setTranslation(
      this.object3D.position.x,
      this.object3D.position.y,
      this.object3D.position.z
    );
    this.bodyDesc.setRotation({
      x: this.object3D.quaternion.x,
      y: this.object3D.quaternion.y,
      z: this.object3D.quaternion.z,
      w: this.object3D.quaternion.w
    });
    const volumes: number[] = [];
    this.object3D.traverse((obj)=>{
      if (TG.isMesh(obj)) {
        const cv = getShapeAndVolumeFromPrimitive(obj.geometry);
        const collisionGroups = (opt.membership << 16) | opt.filter;
        if (cv) {
          cv.colliderDesc.setCollisionGroups(collisionGroups);
          if (opt.collisionDetection)
            cv.colliderDesc.setActiveEvents(RAPIER.ActiveEvents.COLLISION_EVENTS);
          this.colliderDescs.push(cv.colliderDesc);
          cv.colliderDesc.setRestitution(opt.restitution).setFriction(opt.friction);
          volumes.push(cv.volume);
        } else {
          let c: Rapier.ColliderDesc | null, v: number;
          switch(opt.meshCollider) {
            case "tri_mesh":
              c = createTriMeshColliderDesc(obj);
              v = computeGeometryVolume(obj.geometry);
              break;
            case "convex_hull":
              c = createConvexHullColliderDesc(obj);
              v = computeGeometryVolume(obj.geometry);
              break;
          }
          if (c) {
            c.setCollisionGroups(collisionGroups);
            if (opt.collisionDetection)
              c.setActiveEvents(RAPIER.ActiveEvents.COLLISION_EVENTS);
            this.colliderDescs.push(c);
            volumes.push(v);
          }
        }
      }
    });
    let volumeSum = volumes.reduce((sum,vol)=>sum+vol,0);
    for (let i=0;i<this.colliderDescs.length;i++) {
      this.colliderDescs[i].setRestitution(opt.restitution);
      this.colliderDescs[i].setFriction(opt.friction);
      this.colliderDescs[i].setMass(opt.mass*(volumes[i]/volumeSum));
    }
  }
  setObject(objectA3: ObjectA3): void {
    this.objectA3 = objectA3;
    this.object3D = objectA3.object;
  }

  update(_: number) {
    if (this.body) {
      const t = this.body.translation();
      this.object3D.position.set(t.x, t.y, t.z);
      const r = this.body.rotation();
      this.object3D.quaternion.set(r.x, r.y, r.z, r.w);
    }
  }

  enableInterpolation(_: boolean) {}
  changeMotion(_: string) {}
  setPause(_: boolean): void {}
  setTime(_: number): void {}

  setLocation(_: MutableVec3): void {
    // これはできない物とする
  }
  setLocationNow(v: MutableVec3): void {
    if (this.body)
      this.body.setTranslation(v,true); // true? false?
  }

  setQuat(_: MutableQuat): void {
    // これはできない物とする
  }
  setQuatNow(q: MutableQuat): void {
    if (this.body)
      this.body.setRotation(q,true); // true? false?
  }

  setScale(_: MutableVec3): void {
    // これはできない物とする
  }
  setScaleNow(_: MutableVec3): void {
    // 簡単ではないのでとりあえず保留
  }

  addOnselfToPhysics(world: RapierPhysicsWorld): void {
    this.body = world.world.createRigidBody(this.bodyDesc);
    this.colliderDescs.forEach((colliderDesc)=>{
      const collider = world.world.createCollider(colliderDesc,this.body);
      this.colliders.push(collider);
      RapierPhysicsEntity.collisionMap.set(collider.handle,this.objectA3);
    });
  }
  removeOnselfFromPhysics(world: RapierPhysicsWorld): void {
    if (this.body)
      world.world.removeRigidBody(this.body);
    this.colliders.forEach((collider) => {
      world.world.removeCollider(collider,false); // true? false?
    });
  }
}

// ------------------------------------

export function createTriMeshColliderDesc(obj: THREE.Object3D): Rapier.ColliderDesc | null {
  let colliderDesc = null;
  if (TG.isMesh(obj)) {
    const mesh = obj;

    // ワールド変換を頂点に焼き込み（スケール/回転/位置を反映）
    mesh.updateWorldMatrix(true, true);
    const geom = mesh.geometry.clone();
    geom.applyMatrix4(mesh.matrixWorld);

    // 頂点（Float32Array）とインデックス（Uint32Array）を用意
    const pos = geom.attributes.position.array;
    let idx = geom.index ? geom.index.array : null;
    if (!idx) {
      // 非インデックスの場合は 0..N-1 を生成
      const count = geom.attributes.position.count;
      idx = new Uint32Array(count);
      for (let i = 0; i < count; i++) idx[i] = i;
    } else if (!(idx instanceof Uint32Array)) {
      idx = new Uint32Array(idx); // Rapier 側の型に合わせる
    }

    if (pos instanceof Float32Array)
      colliderDesc = RAPIER.ColliderDesc.trimesh(pos, idx);
  }
  return colliderDesc;
}

export function createConvexHullColliderDesc(obj: THREE.Object3D): Rapier.ColliderDesc | null {
  let colliderDesc = null;
  if (TG.isMesh(obj)) {
    const mesh = obj;

    // ワールド変換を頂点に焼き込み（スケール/回転/位置を反映）
    mesh.updateWorldMatrix(true, true);
    const geom = mesh.geometry.clone();
    geom.applyMatrix4(mesh.matrixWorld);

    // 頂点（Float32Array）とインデックス（Uint32Array）を用意
    const pos = geom.attributes.position.array; // Float32Array
    if (pos instanceof Float32Array) {
      // 凸包を Rapier に自動生成させる
      colliderDesc = RAPIER.ColliderDesc.convexHull(pos);
    }
  }
  return colliderDesc;
}

// -------------------

/**
 * BufferGeometry の体積を計算する
 * - インデックス付き / 非インデックス両対応
 * - 閉じたメッシュ前提
 * made by チャッピー
 */
export function computeGeometryVolume(
  geometry: THREE.BufferGeometry
): number {
  const position = geometry.attributes.position;
  if (!position) {
    throw new Error("position attribute not found");
  }

  const index = geometry.index;
  const array = position.array;
  let volume = 0;

  const p0 = new THREE.Vector3();
  const p1 = new THREE.Vector3();
  const p2 = new THREE.Vector3();

  if (index) {
    // --- インデックス付きジオメトリ ---
    const indices = index.array;

    for (let i = 0; i < indices.length; i += 3) {
      const i0 = indices[i] * 3;
      const i1 = indices[i + 1] * 3;
      const i2 = indices[i + 2] * 3;

      p0.set(array[i0], array[i0 + 1], array[i0 + 2]);
      p1.set(array[i1], array[i1 + 1], array[i1 + 2]);
      p2.set(array[i2], array[i2 + 1], array[i2 + 2]);

      volume += p0.dot(p1.clone().cross(p2));
    }
  } else {
    // --- 非インデックスジオメトリ ---
    for (let i = 0; i < array.length; i += 9) {
      p0.set(array[i], array[i + 1], array[i + 2]);
      p1.set(array[i + 3], array[i + 4], array[i + 5]);
      p2.set(array[i + 6], array[i + 7], array[i + 8]);

      volume += p0.dot(p1.clone().cross(p2));
    }
  }

  return Math.abs(volume) / 6;
}

//----------------------------------

/**
 * BufferGeometryからColliderDescを生成する関数。
 * この関数はThree.jsのexamples/jsm/physics/RapierPhysics.jsに
 * かかれていたgetShapeをベースにしている。
 */
export function getShapeAndVolumeFromPrimitive( geometry: THREE.BufferGeometry ): {colliderDesc: Rapier.ColliderDesc, volume: number} | null {
  if (TG.isRoundedBoxGeometry(geometry)) {
    const ps = geometry.parameters;
    const sx = typeof ps?.width === "number" ? ps.width / 2 : 0.5;
    const sy = typeof ps?.height === "number" ? ps.height / 2 : 0.5;
    const sz = typeof ps?.depth === "number" ? ps.depth / 2 : 0.5;
    //const radius = typeof ps?.radius === "number" ? ps.radius : 0.1; // GAHAなぜ???
    const radius = 0.1;
    return {
      colliderDesc: RAPIER.ColliderDesc.roundCuboid( sx - radius, sy - radius, sz - radius, radius ),
      volume: 2*sx * 2*sy * 2*sz // GAHA radiusも取れないし、不正確な体積
    };
  } else if (TG.isBoxGeometry(geometry)) {
    const ps = geometry.parameters;
    const sx = typeof ps?.width === "number" ? ps.width / 2 : 0.5;
    const sy = typeof ps?.height === "number" ? ps.height / 2 : 0.5;
    const sz = typeof ps?.depth === "number" ? ps.depth / 2 : 0.5;
    return {
      colliderDesc: RAPIER.ColliderDesc.cuboid( sx, sy, sz ),
      volume: 2*sx * 2*sy * 2*sz
    };
  } else if (TG.isSphereGeometry(geometry)) {
    const ps = geometry.parameters;
    const radius = typeof ps?.radius === "number" ? ps.radius : 1;
    return {
      colliderDesc: RAPIER.ColliderDesc.ball( radius ),
      volume: 4/3*Math.PI*radius*radius*radius
    };
  } else if (TG.isIcosahedronGeometry(geometry)) {
    const ps = geometry.parameters;
    const radius = typeof ps?.radius === "number" ? ps.radius : 1;
    return {
      colliderDesc: RAPIER.ColliderDesc.ball( radius ),
      volume: 4/3*Math.PI*radius*radius*radius
    };
  } else if (TG.isCylinderGeometry(geometry)) {
    const ps = geometry.parameters;
    const radius = typeof ps?.radiusBottom === "number" ? ps.radiusBottom : 0.5;
    const length = typeof ps?.height === "number" ? ps.height : 0.5;
    return {
      colliderDesc: RAPIER.ColliderDesc.cylinder( length / 2, radius ),
      volume: (Math.PI*radius*radius)*length
    };
  } else if (TG.isCapsuleGeometry(geometry)) {
    const ps = geometry.parameters;
    const radius = typeof ps?.radius === "number" ? ps.radius : 0.5;
    const length = typeof ps?.height === "number" ? ps.height : 0.5;
    return {
      colliderDesc: RAPIER.ColliderDesc.capsule( length / 2, radius ),
      volume: 4/3*Math.PI*radius*radius*radius + (Math.PI*radius*radius)*length
    };
  }
  return null;
}

export const physicsEngineInstance: RapierPhysicsEngine = new RapierPhysicsEngine();

export async function initPhysics(): Promise<void> {
  await physicsEngineInstance.init();
}

