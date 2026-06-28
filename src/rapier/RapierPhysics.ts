//import RAPIER from '@dimforge/rapier3d-compat';
import type * as Rapier from '@dimforge/rapier3d-compat';
import * as THREE from 'three';
import * as TG from '../utils/TypeGuard';

import { ObjectA3 } from '../core/ObjectA3';
import type { Transformer } from '../core/ObjectA3';
import { Vec3, Quat, Transform } from '../core/LinearMath';
import { defaultSimplePhysicsOptions } from '../core/Physics';
import type { PhysicsEngine, PhysicsWorld, PhysicsWorldOptions,
              SimplePhysicsOptions, Collision } from '../core/Physics';
import type { Motion } from '../core/ActionObject';

export let RAPIER: typeof import('@dimforge/rapier3d-compat');

/** @internal コライダーの ID と ObjectA3 の対応を保持する内部マップです。 */
export const collisionMap: Map<number,ObjectA3> = new Map();

/**
 * Rapier3D 物理エンジンを管理するクラスです。
 * `PhysicsEngine` インターフェースの Rapier3D 実装です。
 *
 * 通常はこのクラスを直接使用せず、`initPhysics()` 関数を呼び出してください。
 */
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
  createWorld(options: RapierPhysicsWorldOptions): PhysicsWorld {
    let timestep = 1/60;
    if (this.isRapierWorldOptions(options))
      timestep = options.timestep;
    const world = new RAPIER.World(options.gravity);
    return new RapierPhysicsWorld(world,timestep);
  }

  private isRapierWorldOptions(options: PhysicsWorldOptions): options is RapierPhysicsWorldOptions {
    return ( /* "enableCCD" in options && */ "timestep" in options );
  }
}

/**
 * Rapier3D 物理ワールドの生成オプションです。
 * `PhysicsWorldOptions` を拡張し、Rapier3D 固有の設定を追加します。
 */
export interface RapierPhysicsWorldOptions extends PhysicsWorldOptions {
  //enableCCD: boolean;
  /** 物理シミュレーションの1ステップあたりの時間（秒）。デフォルトは `1/60`。 */
  timestep: number;
}

/**
 * Rapier3D の物理演算空間を管理するクラスです。
 * `PhysicsWorld` インターフェースの Rapier3D 実装です。
 * `Scene` が内部で自動的に生成・管理するため、通常は直接使用しません。
 */
export class RapierPhysicsWorld implements PhysicsWorld {
  world: Rapier.World;
  timestep: number;
  collisionEventQueue: Rapier.EventQueue;
  kinematicCharacterCollisionEventQueue: Collision[];

  constructor(world:Rapier.World, timestep:number) {
    this.world = world;
    this.timestep = timestep;
    this.collisionEventQueue = new RAPIER.EventQueue(true);
    this.world.integrationParameters.dt = this.timestep;
    this.kinematicCharacterCollisionEventQueue = [];
  }

  add(motion: Transformer | Motion) {
    motion.addOneselfToPhysics(this);
  }

  remove(motion: Transformer | Motion) {
    motion.removeOneselfFromPhysics(this);
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
      const objA = collisionMap.get(handle1);
      const objB = collisionMap.get(handle2);
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
    collisions.push(...this.kinematicCharacterCollisionEventQueue);
    this.kinematicCharacterCollisionEventQueue.length=0;
    return collisions;
  }
}

/**
 * `"SimplePhysics"` モードで使用される Transformer の Rapier3D 実装です。
 * `setMode("SimplePhysics", options)` を呼び出すと、内部的にこのクラスが使用されます。
 *
 * オブジェクトのメッシュ形状から自動的にコライダーを生成し、
 * Rapier3D の剛体シミュレーションに従ってオブジェクトを動かします。
 *
 * @remarks
 * 直接インスタンスを生成するのではなく、`setMode("SimplePhysics", options)` を通じて使用してください。
 */
export class SimplePhysicsTransformer implements Transformer {
  transform: Transform;
  objectA3?: ObjectA3;
  bodyDesc?: Rapier.RigidBodyDesc;
  body?: Rapier.RigidBody;
  colliderDescs: Rapier.ColliderDesc[];
  colliders: Rapier.Collider[];
  completeOptions: SimplePhysicsOptions;

  // 最低限の初期化。
  constructor(options: Partial<SimplePhysicsOptions> = {}) {
    this.completeOptions = {
      ...defaultSimplePhysicsOptions,
      ...options
    };
    this.transform = new Transform();
    this.colliderDescs = [];
    this.colliders = [];
  }

  private makeBodyDesc(): Rapier.RigidBodyDesc {
    let bodyDesc: Rapier.RigidBodyDesc;
    switch(this.completeOptions.rigidBody) {
      case "dynamic":
        bodyDesc = RAPIER.RigidBodyDesc.dynamic();
        break;
      case "kinematic":
        bodyDesc = RAPIER.RigidBodyDesc.kinematicPositionBased();
        //this.bodyDesc = RAPIER.RigidBodyDesc.kinematicVelocityBased(); // GAHAこれあったか！
        break;
      case "fixed":
        bodyDesc = RAPIER.RigidBodyDesc.fixed();
        break;
    }
    bodyDesc.setTranslation(
      this.transform.loc.x,
      this.transform.loc.y,
      this.transform.loc.z
    );
    bodyDesc.setRotation({
      x: this.transform.quat.x,
      y: this.transform.quat.y,
      z: this.transform.quat.z,
      w: this.transform.quat.w
    });

    return bodyDesc;
  }

  private configColliderDescs() {
    if (!this.objectA3) return; // あっちゃいけない
    const opt = this.completeOptions;
    const volumes: number[] = [];
    const collisionGroups = (opt.membership << 16) | opt.filter;
    const scale = this.transform.scale;
    this.objectA3.object3D.traverse((obj: any)=>{
      if (TG.isMesh(obj)) {
        const cv = getShapeAndVolumeFromPrimitive(obj.geometry,scale);
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
            c.setRestitution(opt.restitution).setFriction(opt.friction);
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

  init(trans: Transform, objectA3: ObjectA3) {
    this.transform.set(trans);
    this.objectA3 = objectA3;
    this.colliderDescs = [];
    this.colliders = [];
    // colliderDescを作る前にthis.objectA3.object3Dに
    // scaleを反映させることで最初だけ拡大縮小に対応！
    this.objectA3.object3D.scale.set(trans.scale.x,trans.scale.y,trans.scale.z);
    this.bodyDesc = this.makeBodyDesc();
    this.configColliderDescs();
    this.bodyDesc.setTranslation(trans.loc.x,trans.loc.y,trans.loc.z);
    this.bodyDesc.setRotation(trans.quat);
    //this.bodyDesc.setScale(???); // 上の方で対応
  }

  addOneselfToPhysics(world: RapierPhysicsWorld): void {
    if (!this.bodyDesc) return; // GAHA
    this.body = world.world.createRigidBody(this.bodyDesc);
    this.colliderDescs.forEach((colliderDesc)=>{
      const collider = world.world.createCollider(colliderDesc,this.body);
      this.colliders.push(collider);
      if (this.objectA3) // GAHA
        collisionMap.set(collider.handle,this.objectA3);
    });
    this.body.setTranslation(this.transform.loc,true);
    this.body.setRotation(this.transform.quat,true);
    //this.body.setScale(???); // 保留
  }
  removeOneselfFromPhysics(world: RapierPhysicsWorld): void {
    this.colliders.forEach((collider) => {
      world.world.removeCollider(collider,true); // trueで子も消す
      collisionMap.delete(collider.handle);
    });
    this.colliders.length = 0;
    if (this.body) {
      world.world.removeRigidBody(this.body);
      this.body = undefined;
    }
  }
  // ここはなんとかできそうな気もするけど、とりあえず。
  isGrounded(): boolean { return this.transform.loc.y <= 0; }

  setPosition(_: Vec3): void {
    // これはできない物とする
  }
  setPositionNow(v: Vec3): void {
    if (this.body)
      this.body.setTranslation(v,true);
    else
      this.bodyDesc?.setTranslation(v.x,v.y,v.z);
    this.transform.loc.set(v);
  }

  setQuat(_: Quat): void {
    // これはできない物とする
  }
  setQuatNow(q: Quat): void {
    if (this.body)
      this.body.setRotation(q,true);
    else
      this.bodyDesc?.setRotation(q);
    this.transform.quat.set(q);
  }

  setScale(_: Vec3): void {
    // これはできない物とする
  }
  setScaleNow(_: Vec3): void {
    // 簡単ではないのでとりあえず保留
  }

  setLinearVelocity(vel: Vec3): void {
    if (this.body)
      this.body.setLinvel({x:vel.x, y:vel.y, z:vel.z},true);
    else
      this.bodyDesc?.setLinvel(vel.x, vel.y, vel.z);
  }

  getLinearVelocity(v?: Vec3) {
    if (!v)
      v = new Vec3();
    if (this.body)
      v.set(this.body.linvel());
    else if (this.bodyDesc)
      v.set(this.bodyDesc.linvel);
    return v;
  }

  setAngularVelocity(av: Vec3): void {
    if (this.body)
      this.body.setAngvel({x:av.x, y:av.y, z:av.z},true);
    else
      this.bodyDesc?.setAngvel({x:av.x, y:av.y, z:av.z});
  }

  getAngularVelocity(v?: Vec3) {
    if (!v)
      v = new Vec3();
    if (this.body)
      v.set(this.body.angvel());
    else if (this.bodyDesc)
      v.set(this.bodyDesc.angvel);
    return v;
  }

  resetForce(): void {
    this.body?.resetForces(true);
  }

  addForce(f: Vec3): void {
    this.body?.addForce({x:f.x, y:f.y, z:f.z},true);
  }

  addForceAtPoint(f: Vec3, p: Vec3) {
    this.body?.addForceAtPoint({x:f.x, y:f.y, z:f.z},{x:p.x, y:p.y, z:p.z},true);
  }

  resetTorque(): void {
    this.body?.resetTorques(true);
  }

  addTorque(t: Vec3): void {
    this.body?.addTorque({x:t.x, y:t.y, z:t.z},true);
  }

  applyImpulse(i: Vec3): void {
    this.body?.applyImpulse({x:i.x, y:i.y, z:i.z},true);
  }

  applyImpulseAtPoint(i: Vec3, p: Vec3): void {
    this.body?.applyImpulseAtPoint({x:i.x, y:i.y, z:i.z},{x:p.x, y:p.y, z:p.z},true);
  }

  applyTorqueImpulse(ti: Vec3): void {
    this.body?.applyTorqueImpulse({x:ti.x, y:ti.y, z:ti.z},true);
  }

  update(_dt: number): void {
    if (this.body) {
      const t = this.body.translation();
      this.transform.loc.set(t.x, t.y, t.z);
      const r = this.body.rotation();
      this.transform.quat.set(r.x, r.y, r.z, r.w);
    }
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
 * かかれていたgetShapeをベースにしている。引数でX,Y,Zのscaleを
 * Vec3で受け付けるけど、Sphereとかを楕円にするのはむずいので、
 * X,Y,Zの相乗平均でごまかしている。
 */
export function getShapeAndVolumeFromPrimitive( geometry: THREE.BufferGeometry, scale: Vec3 = new Vec3(1,1,1) ): {colliderDesc: Rapier.ColliderDesc, volume: number} | null {
  if (TG.isRoundedBoxGeometry(geometry)) {
    const ps = geometry.parameters;
    const sx = (typeof ps?.width === "number" ? ps.width / 2 : 0.5) * scale.x;
    const sy = (typeof ps?.height === "number" ? ps.height / 2 : 0.5) * scale.y;
    const sz = (typeof ps?.depth === "number" ? ps.depth / 2 : 0.5) * scale.z;
    //const radius = typeof ps?.radius === "number" ? ps.radius : 0.1; // GAHAなぜ???
    const radius = 0.1 * Math.cbrt(scale.x * scale.y * scale.z);
    return {
      colliderDesc: RAPIER.ColliderDesc.roundCuboid( sx - radius, sy - radius, sz - radius, radius ),
      volume: 2*sx * 2*sy * 2*sz // GAHA radiusも取れないし、不正確な体積
    };
  } else if (TG.isBoxGeometry(geometry)) {
    const ps = geometry.parameters;
    const sx = (typeof ps?.width === "number" ? ps.width / 2 : 0.5) * scale.x;
    const sy = (typeof ps?.height === "number" ? ps.height / 2 : 0.5) * scale.y;
    const sz = (typeof ps?.depth === "number" ? ps.depth / 2 : 0.5) * scale.z;
    return {
      colliderDesc: RAPIER.ColliderDesc.cuboid( sx, sy, sz ),
      volume: 2*sx * 2*sy * 2*sz
    };
  } else if (TG.isSphereGeometry(geometry)) {
    const ps = geometry.parameters;
    const xyz = Math.cbrt(scale.x * scale.y * scale.z);
    const radius = (typeof ps?.radius === "number" ? ps.radius : 1) * xyz;
    return {
      colliderDesc: RAPIER.ColliderDesc.ball( radius ),
      volume: 4/3*Math.PI*radius*radius*radius
    };
  } else if (TG.isIcosahedronGeometry(geometry)) {
    const ps = geometry.parameters;
    const xyz = Math.cbrt(scale.x * scale.y * scale.z);
    const radius = (typeof ps?.radius === "number" ? ps.radius : 1) * xyz;
    return {
      colliderDesc: RAPIER.ColliderDesc.ball( radius ),
      volume: 4/3*Math.PI*radius*radius*radius
    };
  } else if (TG.isCylinderGeometry(geometry)) {
    const ps = geometry.parameters;
    const xz = Math.sqrt(scale.x * scale.z);
    const radius = (typeof ps?.radiusBottom === "number" ? ps.radiusBottom : 0.5) * xz;
    const length = (typeof ps?.height === "number" ? ps.height : 0.5) * scale.y;
    return {
      colliderDesc: RAPIER.ColliderDesc.cylinder( length / 2, radius ),
      volume: (Math.PI*radius*radius)*length
    };
  } else if (TG.isCapsuleGeometry(geometry)) {
    const ps = geometry.parameters;
    const xz = Math.sqrt(scale.x * scale.z);
    const radius = (typeof ps?.radius === "number" ? ps.radius : 0.5) * xz;
    const length = (typeof ps?.height === "number" ? ps.height : 0.5) * scale.y;
    return {
      colliderDesc: RAPIER.ColliderDesc.capsule( length / 2, radius ),
      volume: 4/3*Math.PI*radius*radius*radius + (Math.PI*radius*radius)*length
    };
  }
  return null;
}

/** @internal a3js 全体で共有する Rapier3D 物理エンジンのインスタンスです。 */
export const physicsEngineInstance: RapierPhysicsEngine = new RapierPhysicsEngine();

/**
 * Rapier3D 物理エンジンを初期化します。
 * 物理演算（`"SimplePhysics"` / `"KinematicCharacter"` / `"DynamicCharacter"` モード）を使用する場合は、
 * `Scene` を生成する前に `await initPhysics()` を呼び出してください。
 *
 * @remarks
 * Rapier3D は WebAssembly モジュールであるため、初回呼び出し時に非同期でロードされます。
 * 2回目以降の呼び出しは即座に返ります。
 *
 * @example
 * ```ts
 * await initPhysics();
 * const scene = new Scene({ physics: { gravity: { x: 0, y: -9.81, z: 0 } } });
 * ```
 */
export async function initPhysics(): Promise<void> {
  await physicsEngineInstance.init();
}

