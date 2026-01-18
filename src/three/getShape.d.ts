import * as THREE from 'three';
import type { ColliderDesc } from '@dimforge/rapier3d-compat';
import type { Unzipped } from 'fflate'; // 'three/addons/libs/fflate.module.js';

export function getShape(
  geometry: THREE.BufferGeometry
): ColliderDesk;

export function loadVrmlInUnzipped(unzipped: Unzipped, path: string): Promise<THREE.Object3D>;

export function isMesh(obj: THREE.Object3D): obj is THREE.Mesh;
