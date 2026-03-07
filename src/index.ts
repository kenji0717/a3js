export { Canvas, defaultCanvasOption } from './core/Canvas';
export type { CanvasOption } from './core/Canvas';
export { Window, defaultWindowOption } from './core/Window';
export type { WindowOption } from './core/Window';
export { Scene } from './core/Scene';
export { Camera } from './core/Camera';
export { ObjectA3 } from './core/ObjectA3';
export type { Dir, Transforer, TransformMode } from './core/ObjectA3';
export { ActionObject } from './core/ActionObject';
export type { Action, Shape, Motion, Pose, Morph } from './core/ActionObject';
export { DefaultTransformer, FixedTransformer } from './core/Transformers';
export { ClipMotion } from './three/ClipMotion';
export { ControllerBase, OrbitController, FollowAvatarController, AvatarController } from './core/Controller';
export type { Controller } from './core/Controller';
export { Test } from './core/Test';
export type { TestOption } from './core/Test';
export { Text3D , initFont } from './core/Text3D';
export { GLTF } from './core/GLTF';
export { Acerola3D } from './core/Acerola3D';
export { Sound, initSound } from './three/Sound';
export type { SoundOptions, PositionalOptions, SoundType, SoundOptionInput } from './three/Sound';
export { ThreeJS } from './three/ThreeJS';
export { Box } from './three/Box';
export { Sphere } from './three/Sphere';
export { StandardLights } from './three/StandardLights';
export { Image } from './three/Image';
export { HTML } from './three/HTML';
export { GameCanvas, defaultGameCanvasOption } from './core/GameCanvas';
export type { GameCanvasOption } from './core/GameCanvas';
export type { View, ViewBase } from './core/View';
export type { PhysicsEngine,
              PhysicsWorld,
              PhysicsWorldOption,
              PhysicsMotionOption,
              ColliderKind,
              MeshColliderKind,
              RigidBodyType,
              Collision } from './core/Physics';
export { initPhysics, RapierPhysicsEngine, collisionMap, RapierPhysicsWorld } from './rapier/RapierPhysics';
export type { RapierPhysicsWorldOption } from './rapier/RapierPhysics';
export { CharactorTransformer, defaultCharactorTransOption } from './rapier/CharactorTransformer';
export type { CharactorTransOption } from './rapier/CharactorTransformer';
export { CarControl, CarTransformer, CarMotion, defaultCarControlOption } from './rapier/CarControl';
export type { CarControlOption } from './rapier/CarControl';
export { Vec3, Quat, Transform, getQuatOfLookAt, vec3EulerToQuat } from './core/LinearMath';
export type { RotationOrder, MutableVec3, MutableQuat } from './core/LinearMath';
export { GeneralCamera } from './core/GeneralCamera';
export type { AsyncInitRequired } from './core/AsyncInitRequired';
export { asyncSleep, deepMerge } from './utils/math';
export type { DeepPartial  } from './utils/math';
//export { getShape, loadVrmlInUnzipped } from './three/getShape';
