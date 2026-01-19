//import RAPIER from '@dimforge/rapier3d-compat';
import type * as Rapier from '@dimforge/rapier3d-compat';
import * as THREE from 'three';
import { getShape, isMesh } from '../three/getShape';

import { A3Object } from '../core/A3Object';
import type { MutableVec3 } from '../core/Vec3';
import type { MutableQuat } from '../core/Quat';
import { A3PhysicsEntity } from '../core/A3Physics';
import type { A3PhysicsEngine, A3PhysicsWorld, A3PhysicsWorldOption,
              A3PhysicsEntityOption } from '../core/A3Physics';
//import { getShape } from '../three/getShape.js';

let RAPIER: typeof import('@dimforge/rapier3d-compat');

export class RapierPhysicsEngine implements A3PhysicsEngine {
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
  createWorld(option: RapierPhysicsWorldOption): A3PhysicsWorld {
    let timestep = 1/60;
    if (this.isRapierWorldOption(option))
      timestep = option.timestep;
    const world = new RAPIER.World(option.gravity);
    return new RapierPhysicsWorld(world,timestep);
  }

  private isRapierWorldOption(option: A3PhysicsWorldOption): option is RapierPhysicsWorldOption {
    return ( "enableCCD" in option && "timestep" in option );
  }
}

interface RapierPhysicsWorldOption extends A3PhysicsWorldOption {
  //enableCCD: boolean;
  timestep: number;
}

export class RapierPhysicsWorld implements A3PhysicsWorld {
  world: Rapier.World;
  timestep: number;

  constructor(world:Rapier.World, timestep:number) {
    this.world = world;
    this.timestep = timestep;
    this.world.integrationParameters.dt = this.timestep;
  }

  add(entity: A3PhysicsEntity) {
    if (isRapierPhysicsEntity(entity)) {
      entity.addOneself(this);
    } else {
      ; // 何もしない
    }
  }

  remove(entity: A3PhysicsEntity) {
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
      this.world.step()
  }
}

export abstract class RapierPhysicsEntity extends A3PhysicsEntity {
  abstract addOneself(world: RapierPhysicsWorld): void;
  abstract removeOneself(world: RapierPhysicsWorld): void;
}

function isRapierPhysicsEntity(obj: A3PhysicsEntity): obj is RapierPhysicsEntity {
  return "addOneself" in obj && "removeOneself" in obj;
}

export class RapierDefaultPhysicsEntity extends RapierPhysicsEntity {
  bodyDesc: Rapier.RigidBodyDesc;
  body: Rapier.RigidBody | null = null;
  colliderDescs: Rapier.ColliderDesc[] = [];
  colliders: Rapier.Collider[] = [];

  constructor(obj: A3Object,opt: A3PhysicsEntityOption) {
    super(obj,opt);
    switch(opt.rigidBody) {
      case "dynamic":
        this.bodyDesc = RAPIER.RigidBodyDesc.dynamic();
        break;
      case "kinematic":
        this.bodyDesc = RAPIER.RigidBodyDesc.kinematicPositionBased();
        //this.bodyDesc = RAPIER.RigidBodyDesc.kinematicVelocityBased(); // これあったか！
        break;
      case "fixed":
        this.bodyDesc = RAPIER.RigidBodyDesc.fixed();
        break;
    }
    this.bodyDesc.setTranslation(obj.location.x,obj.location.y,obj.location.z);
    this.object.object.traverse((obj)=>{
      if (isMesh(obj)) {
        let c = getShape(obj.geometry);
        if (!c) {
          switch(opt.meshCollider) {
            case "tri_mesh":
              c = createTriMeshColliderDescs(obj,1); // あmass忘れてた
              break;
            case "convex_hull":
              c = createConvexHullColliderDescs(obj,1); // あmass忘れてた
              break;
          }
          if (c) {
            c.setRestitution(opt.restitution).setFriction(opt.friction);
            this.colliderDescs.push(c);
          }
        }
      }
    });
  }

  synchronize(obj: A3Object) {
    if (this.body) {
      const t = this.body.translation();
      obj.location.set(t.x, t.y, t.z);
      obj.object.position.set(t.x, t.y, t.z);
      const r = this.body.rotation();
      obj.rot.set(r.x, r.y, r.z, r.w);
      obj.object.quaternion.set(r.x, r.y, r.z, r.w);
    }
  }

  addOneself(world: RapierPhysicsWorld) {
    this.body = world.world.createRigidBody(this.bodyDesc);
    this.colliders[0] = world.world.createCollider(this.colliderDescs[0],this.body);
  }

  removeOneself(world: RapierPhysicsWorld) {
    if (this.body)
      world.world.removeRigidBody(this.body);
    if (this.colliders[0])
      world.world.removeCollider(this.colliders[0],false); // true? false?
  }

  forceSetLoc(v: MutableVec3): void {
    if (this.body)
      this.body.setTranslation(v,true); // true? false?
  }

  forceSetQuat(q: MutableQuat): void {
    if (this.body)
      this.body.setRotation(q,true); // true? false?
  }

  forceSetScale(v: MutableVec3): void {
    v;
    // 簡単ではないのでとりあえず保留
  }
}

// ------------------------------------

export function createTriMeshColliderDescs(rootObj: THREE.Object3D,mass: number): Rapier.ColliderDesc[] {
  const colliderDescs: Rapier.ColliderDesc[] = [];
  rootObj.traverse(obj => {
    if (isMesh(obj)) {
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

      if (pos instanceof Float32Array) {
        const colliderDesc = RAPIER.ColliderDesc.trimesh(pos, idx);
        colliderDesc.setMass(mass).setFriction(0.8).setRestitution(0.8); // 適当
        colliderDescs.push(colliderDesc);
      }
    }
  });
  return colliderDescs;
}


export function createConvexHullColliderDescs(rootObj: THREE.Object3D,mass: number): Rapier.ColliderDesc[] {
  const colliderDescs: Rapier.ColliderDesc[] = [];
  rootObj.traverse(obj => {
    if (isMesh(obj)) {
      const mesh = obj;

      // ワールド変換を頂点に焼き込み（スケール/回転/位置を反映）
      mesh.updateWorldMatrix(true, true);
      const geom = mesh.geometry.clone();
      geom.applyMatrix4(mesh.matrixWorld);

      // 頂点（Float32Array）とインデックス（Uint32Array）を用意
      const pos = geom.attributes.position.array; // Float32Array
      if (pos instanceof Float32Array) {
        // 凸包を Rapier に自動生成させる
        const colliderDesc = RAPIER.ColliderDesc.convexHull(pos);
        if (colliderDesc) {
          colliderDesc.setMass(mass).setFriction(0.8).setRestitution(0.8);// 適当
          colliderDescs.push(colliderDesc);
        }
      }
    }
  });
  return colliderDescs;
}
