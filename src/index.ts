export { Canvas } from './core/Canvas';
export type { CanvasOption } from './core/Canvas';
export { Window } from './core/Window';
export { Scene } from './core/Scene';
export { Camera } from './core/Camera';
export { ObjectA3 } from './core/ObjectA3';
export type { Dir } from './core/ObjectA3';
export { ControllerBase, OrbitController } from './core/Controller';
export type { Controller } from './core/Controller';
export { Test } from './core/Test';
export type { TestOption } from './core/Test';
export { Text3D , initFont } from './core/Text3D';
export { GLTFA3 } from './core/GLTFA3';
export { Acerola3D } from './core/Acerola3D';
export { Sound, initSound } from './three/Sound';
export type { SoundOptions, PositionalOptions, SoundType, SoundOptionInput } from './three/Sound';
export { ThreeJS } from './three/ThreeJS';
export { Box } from './three/Box';
export { Sphere } from './three/Sphere';
export { HTML } from './three/HTML';
export type { View } from './core/View';
export type { PhysicsEngine,
              PhysicsWorld,
              PhysicsEntity,
              PhysicsWorldOption,
              PhysicsEntityOption,
              ColliderKind,
              MeshColliderKind,
              RigidBodyType,
              Collision } from './core/Physics';
export { initPhysics, RapierPhysicsEngine } from './rapier/RapierPhysics';
export type { RapierPhysicsWorldOption } from './rapier/RapierPhysics';
export { Vec3 } from './core/Vec3';
export type { MutableVec3 } from './core/Vec3';
export { Quat, getQuatOfLookAt, vec3EulerToQuat } from './core/Quat';
export type { MutableQuat, RotationOrder } from './core/Quat';
export { ViewBase } from './core/ViewBase';
export { GeneralCamera } from './core/GeneralCamera';
export type { AsyncInitRequired } from './core/AsyncInitRequired';
export { times2, asyncSleep, deepMerge } from './utils/math';
export type { DeepPartial  } from './utils/math';
//export { getShape, loadVrmlInUnzipped } from './three/getShape';
