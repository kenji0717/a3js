//import RAPIER from '@dimforge/rapier3d-compat';
import type * as RapierModule from '@dimforge/rapier3d-compat';
type Rapier = typeof RapierModule.default;

import type { A3Physics, A3PhysicsWorld, A3RigidBody, A3PhysicsOption } from '../core/A3Physics';

export class RapierPhysics implements A3Physics {
  static RAPIER: Rapier;
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
      const RAPIER = await import('@dimforge/rapier3d-compat');
      await RAPIER.init();
      RapierPhysics.RAPIER = RAPIER;
    }
    const world = new RapierPhysics.RAPIER.World(option.gravity);
    return new RapierWorld(world,option.timestep);
  }
}

export class RapierWorld implements A3PhysicsWorld {
  world: RapierModule.default.World;
  timestep: number;

  constructor(world:RapierModule.default.World,timestep:number) {
    this.world = world;
    this.timestep = timestep;
    this.world.integrationParameters.dt = this.timestep;
  }

  update(dt: number) {
    // ここの実装は良く考えた方が良い。今は適当
    const n = Math.ceil(dt / this.timestep);
    for (let i=0;i<n;i++)
      this.world.step()
  }
}

export class RapierRigidBody implements A3RigidBody {
}
