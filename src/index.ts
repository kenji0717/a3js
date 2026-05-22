export { Canvas, defaultCanvasOptions } from './core/Canvas';
export type { CanvasOptions } from './core/Canvas';
export { Window, defaultWindowOptions } from './core/Window';
export type { WindowOptions } from './core/Window';
export { Scene } from './core/Scene';
export { Camera } from './core/Camera';
export { ObjectA3 } from './core/ObjectA3';
export type { Dir, Transformer, TransformMode } from './core/ObjectA3';
export { ActionObject, Action } from './core/ActionObject';
export type { Figure, Motion, Pose, Morph } from './core/ActionObject';
export { DefaultTransformer, StaticTransformer, SmoothTransformer, SmoothBillboardTransformer, BillboardTransformer, FollowTransformer, defaultFollowTransformerOptions } from './core/Transformers';
export type { BillboardTransformerInputOptions, FollowTransformerOptions, FollowTransformerInputOptions, SmoothBillboardTransformerInputOptions } from './core/Transformers';
export { ClipMotion } from './three/ClipMotion';
export { BaseController, OrbitController, AvatarPositionController, AvatarVelocityController } from './core/Controller';
export type { Controller, AvatarPositionControllerOptions, AvatarVelocityControllerOptions } from './core/Controller';
export { SampleObject, defaultSampleObjectOptions } from './core/SampleObject';
export type { SampleObjectOptions } from './core/SampleObject';
export { Text3D , initFont } from './core/Text3D';
export { GLTF, recreateGLTFLoader } from './core/GLTF';
export type { GLTFOptions } from './core/GLTF';
export { Acerola3D } from './core/Acerola3D';
export { Sound, initSound } from './three/Sound';
export type { SoundOptions, PositionalOptions, SoundType, SoundOptionsInput } from './three/Sound';
export { ThreeObject } from './three/ThreeObject';
export { Box } from './three/Box';
export { Sphere } from './three/Sphere';
export { StandardLights } from './three/StandardLights';
export { ImagePlane } from './three/ImagePlane';
export { Html3D } from './three/Html3D';
export { GameCanvas, defaultGameCanvasOptions } from './core/GameCanvas';
export type { GameCanvasOptions } from './core/GameCanvas';
export type { View } from './core/View';
export { BaseView } from './core/View';
export type { PhysicsEngine,
              PhysicsWorld,
              PhysicsWorldOptions,
              PhysicsMotionOptions,
              ColliderType,
              MeshColliderType,
              RigidBodyType,
              Collision } from './core/Physics';
export { initPhysics, RapierPhysicsEngine, collisionMap, RapierPhysicsWorld } from './rapier/RapierPhysics';
export type { RapierPhysicsWorldOptions } from './rapier/RapierPhysics';
export { KinematicCharacterTransformer, defaultKinematicCharacterTransformerOptions } from './rapier/KinematicCharacterTransformer';
export type { KinematicCharacterTransformerOptions } from './rapier/KinematicCharacterTransformer';
export { DynamicCharacterTransformer, defaultDynamicCharacterTransformerOptions } from './rapier/DynamicCharacterTransformer';
export type { DynamicCharacterTransformerOptions } from './rapier/DynamicCharacterTransformer';
export { CarControl, CarTransformer, CarMotion, defaultCarControlOptions } from './rapier/CarControl';
export type { CarControlOptions } from './rapier/CarControl';
export { Vec3, Quat, Transform, getLookAtQuaternion, eulerToQuaternion } from './core/LinearMath';
export type { RotationOrder, MutableVec3, MutableQuat } from './core/LinearMath';
export { ThreeCamera } from './core/ThreeCamera';
export type { AsyncInitRequired } from './core/AsyncInitRequired';
export { asyncSleep, deepMerge } from './utils/math';
export type { DeepPartial  } from './utils/math';
//export { getShape, loadVrmlInUnzipped } from './three/getShape';
