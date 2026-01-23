import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

export function isString(value: any): value is string {
  return typeof value === "string";
}

export function isMesh(value: any): value is THREE.Mesh {
  return (value as any).isMesh === true;
}

// このisBufferGeometryはBufferGeometryだけでなくBoxGeometryなどの
// サブクラスもOKと判定するっぽい。
export function isBufferGeometry(value: any): value is THREE.BufferGeometry {
  return (value as any).isBufferGeometry === true;
}

// なぜか色々なGeometryが普通の方法(isXXX === "true")で
// 上手く判定できない？まだ全部調べてないから他のGeometryが
// どう判定されるか不安。今のところthree.jsのRapierPhysicsの
// 中の判定方法と同じ方法で書いておく。(BufferGeometryは例外！？）

export function isRoundedBoxGeometry(value: any): value is RoundedBoxGeometry {
  return (value as any).type === "RoundedBoxGeometry";
  //return (value as any).isRoundedBoxGeometry === true;
}

export function isBoxGeometry(value: any): value is THREE.BoxGeometry {
  return (value as any).type === "BoxGeometry";
  //return (value as any).isBoxGeometry === true;
}

export function isSphereGeometry(value: any): value is THREE.SphereGeometry {
  return (value as any).type === "SphereGeometry";
  //return (value as any).isSphereGeometry === true;
}

export function isIcosahedronGeometry(value: any): value is THREE.IcosahedronGeometry {
  return (value as any).type === "IcosahedronGeometry";
  //return (value as any).isIcosahedronGeometry === true;
}

export function isCylinderGeometry(value: any): value is THREE.CylinderGeometry {
  return (value as any).type === "CylinderGeometry";
  //return (value as any).isCylinderGeometry === true;
}

export function isCapsuleGeometry(value: any): value is THREE.CapsuleGeometry {
  return (value as any).type === "CapsuleGeometry";
  //return (value as any).isCapsuleGeometry === true;
}

// ほね
export function isBone(value: any): value is THREE.Bone {
  return (value as any).isBone === true;
}

// TypeScriptにobjがSpotLightであることを教えてあげる関数。
/* function isSpotLight(obj: THREE.Object3D): obj is THREE.SpotLight {
  return (obj as any).isSpotLight === true;
} */
// TypeScriptにobjがCameraであることを教えてあげる関数。
/* function isCamera(obj: any): obj is THREE.Camera {
  return obj.isCamera === true;
} */
// TypeScriptにobjがPerspectiveCameraであることを教えてあげる関数。
export function isPerspectiveCamera(obj: THREE.Camera): obj is THREE.PerspectiveCamera {
  return (obj as any).isPerspectiveCamera === true;
}
