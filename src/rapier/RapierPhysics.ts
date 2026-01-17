//import RAPIER from '@dimforge/rapier3d-compat';
import type * as Rapier from '@dimforge/rapier3d-compat';

import { A3Object } from '../core/A3Object';
import type { MutableVec3 } from '../core/Vec3';
import type { MutableQuat } from '../core/Quat';
import type { A3PhysicsEngine, A3PhysicsWorld, A3PhysicsEntity, A3PhysicsWorldOption, A3PhysicsEntityOption } from '../core/A3Physics';
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
    * RapierWorldを作って返す。RAPIERの初期化が済んでない時には
    * まずその初期化から。動的インポート使う。
    */
  async createWorld<T extends A3PhysicsWorldOption>(option: T): Promise<A3PhysicsWorld> {
    if (!RapierPhysicsEngine.RAPIER) {
      const R = await import('@dimforge/rapier3d-compat');
      await R.init();
      RapierPhysicsEngine.RAPIER = R;
      RAPIER = R;
      this.isInitialized = true;
    }
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
  enableCCD: boolean;
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

export interface RapierPhysicsEntityOption extends A3PhysicsEntityOption {
}

export interface RapierPhysicsEntity extends A3PhysicsEntity {
  addOneself(world: RapierPhysicsWorld): void;
  removeOneself(world: RapierPhysicsWorld): void;
}

function isRapierPhysicsEntity(obj: A3PhysicsEntity): obj is RapierPhysicsEntity {
  return "addOneself" in obj && "removeOneself" in obj;
}

export class RapierDefaultPhysicsEntity implements RapierPhysicsEntity {
  object: A3Object;
  bodyDesc: Rapier.RigidBodyDesc;
  body: Rapier.RigidBody | null = null;
  colliderDescs: Rapier.ColliderDesc[] = [];
  colliders: Rapier.Collider[] = [];

  constructor(obj: A3Object,opt: RapierPhysicsEntityOption) {
    opt; // これから使う。
    this.object = obj;
    this.bodyDesc = RAPIER.RigidBodyDesc.dynamic();
    this.bodyDesc.setTranslation(obj.location.x,obj.location.y,obj.location.z);
    this.colliderDescs[0] = RAPIER.ColliderDesc.cuboid(0.5,0.5,0.5);
    this.colliderDescs[0].setRestitution(0.3).setFriction(0.6);
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

/*
     // glTFの最初の Mesh から Rapier TriMesh を作って与えられたparentBodyに設定
     async function createTriMeshColliderFromGLTF(gltf, world, parentBody /* RigidBody */, RAPIER) {
       const colliders = [];
       gltf.scene.traverse(obj => {
         if (obj.isMesh && obj.geometry) {
           const mesh = obj;

           // ワールド変換を頂点に焼き込み（スケール/回転/位置を反映）
           mesh.updateWorldMatrix(true, true);
           const geom = mesh.geometry.clone();
           geom.applyMatrix4(mesh.matrixWorld);

           // 頂点（Float32Array）とインデックス（Uint32Array）を用意
           const pos = geom.attributes.position.array; // Float32Array
           let idx = geom.index ? geom.index.array : null;
           if (!idx) {
             // 非インデックスの場合は 0..N-1 を生成
             const count = geom.attributes.position.count;
             idx = new Uint32Array(count);
             for (let i = 0; i < count; i++) idx[i] = i;
           } else if (!(idx instanceof Uint32Array)) {
             idx = new Uint32Array(idx); // Rapier 側の型に合わせる
           }

           const colliderDesc = RAPIER.ColliderDesc.trimesh(pos, idx);
           colliderDesc.setMass(0).setFriction(0.8).setRestitution(0.8); // 適当
           
           const collider = world.createCollider(colliderDesc, parentBody); // body に付与
           colliders.push(collider);
         }
       });
       return colliders;
     }


     // glTFの最初の Mesh から Rapier ConvexHull を作って与えられたparentBodyに設定
     async function createConvexHullColliderFromGLTF(gltf, world, parentBody /* RigidBody */, RAPIER) {
       const colliders = [];
       gltf.scene.traverse(obj => {
         if (obj.isMesh && obj.geometry) {
           const mesh = obj;

           // ワールド変換を頂点に焼き込み（スケール/回転/位置を反映）
           mesh.updateWorldMatrix(true, true);
           const geom = mesh.geometry.clone();
           geom.applyMatrix4(mesh.matrixWorld);

           // 頂点（Float32Array）とインデックス（Uint32Array）を用意
           const pos = geom.attributes.position.array; // Float32Array
           // 凸包を Rapier に自動生成させる
           const colliderDesc = RAPIER.ColliderDesc.convexHull(pos);
           colliderDesc.setMass(0).setFriction(0.8).setRestitution(0.8);// 適当
           if (colliderDesc) {
             const collider = world.createCollider(colliderDesc, parentBody);
             colliders.push(collider);
           } else if (!(idx instanceof Uint32Array)) {
             console.warn("convexHull 生成に失敗（共線点のみ等のケース）");
           }
         }
       });
       return colliders;
     }
*/
