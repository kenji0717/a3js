//import RAPIER from '@dimforge/rapier3d-compat';
import type * as Rapier from '@dimforge/rapier3d-compat';

import { A3Object } from '../core/A3Object';
import { A3Test } from '../core/A3Test';
import type { MutableVec3 } from '../core/Vec3';
import type { MutableQuat } from '../core/Quat';
import type { A3Physics, A3PhysicsWorld, A3PhysicsEntity, A3PhysicsOption } from '../core/A3Physics';
//import { getShape } from '../three/getShape.js';

let RAPIER: typeof import('@dimforge/rapier3d-compat');

export class RapierPhysics implements A3Physics {
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
  async createWorld<T extends A3PhysicsOption>(option: T): Promise<A3PhysicsWorld> {
    if (!RapierPhysics.RAPIER) {
      const R = await import('@dimforge/rapier3d-compat');
      await R.init();
      RapierPhysics.RAPIER = R;
      RAPIER = R;
      this.isInitialized = true;
    }
    const world = new RapierPhysics.RAPIER.World(option.gravity);
    return new RapierWorld(world,option.timestep);
  }
}

export class RapierWorld implements A3PhysicsWorld {
  world: Rapier.World;
  timestep: number;

  constructor(world:Rapier.World, timestep:number) {
    this.world = world;
    this.timestep = timestep;
    this.world.integrationParameters.dt = this.timestep;
  }

  createPhysicsEntity(obj: A3Object) {
    const entity = new A3TestPhysicsEntity(obj);
    entity.body = this.world.createRigidBody(entity.bodyDesc);
    entity.collider = this.world.createCollider(entity.colliderDesc,entity.body);
    return entity;
  }

  update(dt: number) {
    // ここの実装は良く考えた方が良い。今は適当
    const n = Math.ceil(dt / this.timestep);
    for (let i=0;i<n;i++)
      this.world.step()
  }
}

export interface RapierPhysicsEntity {
  bodyDesc: Rapier.RigidBodyDesc;
  body: Rapier.RigidBody | null;
  colliderDesc: Rapier.ColliderDesc;
  collider: Rapier.Collider | null;
}

export class A3TestPhysicsEntity implements A3PhysicsEntity, RapierPhysicsEntity {
  object: A3Object;
  bodyDesc: Rapier.RigidBodyDesc;
  body: Rapier.RigidBody | null = null;
  colliderDesc: Rapier.ColliderDesc;
  collider: Rapier.Collider | null = null;

  constructor(obj: A3Object) {
    this.object = obj;
    this.bodyDesc = RAPIER.RigidBodyDesc.dynamic();
    this.bodyDesc.setTranslation(obj.loc.x, obj.loc.y, obj.loc.z);
    this.colliderDesc = RAPIER.ColliderDesc.cuboid(1,1,1);
    this.colliderDesc.setRestitution(0.3).setFriction(0.6);
  }

  synchronize(obj: A3Test) {
    if (this.body) {
      const t = this.body.translation();
      obj.setLoc(t.x, t.y, t.z);
      const r = this.body.rotation();
      obj.setQuat(r.x, r.y, r.z, r.w);
    }
  }

  setLoc(v: MutableVec3): void {
    if (this.body)
      this.body.setTranslation(v,true); // true? false?
  }

  setQuat(q: MutableQuat): void {
    if (this.body)
      this.body.setRotation(q,true); // true? false?
  }
}
