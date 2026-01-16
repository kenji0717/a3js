//import RAPIER from '@dimforge/rapier3d-compat';
import type * as Rapier from '@dimforge/rapier3d-compat';

import type { A3Physics, A3PhysicsWorld, A3PhysicsEntity, A3PhysicsOption } from '../core/A3Physics';
//import { getShape } from '../three/getShape.js';

interface RapierPhysicsOption extends A3PhysicsOption {
  enableCCD: boolean;
  timestep: number;
}

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
      this.isInitialized = true;
    }
    let timestep = 1/60;
    if (this.isRapierOption(option))
      timestep = option.timestep;
    const world = new RapierPhysics.RAPIER.World(option.gravity);
    return new RapierPhysicsWorld(world,timestep);
  }

  private isRapierOption(option: A3PhysicsOption): option is RapierPhysicsOption {
    return ( "enableCCD" in option && "timestep" in option );
  }
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

export interface RapierPhysicsEntity extends A3PhysicsEntity {
  addOneself(world: RapierPhysicsWorld): void;
  removeOneself(world: RapierPhysicsWorld): void;
}

function isRapierPhysicsEntity(obj: A3PhysicsEntity): obj is RapierPhysicsEntity {
  return "addOneself" in obj && "removeOneself" in obj;
}