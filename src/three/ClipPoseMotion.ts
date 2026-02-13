import * as THREE from 'three';
import type { Pose, PoseMotion } from '../core/Motion';
import { ObjectA3 } from '../core/ObjectA3';
import { Transform } from '../core/LinearMath';
import type { PhysicsWorld } from '../core/Physics';

/**
 * BVHやglTFファイルから読み込まれるモーションキャプチャ
 * データなどから生成されるTHREE.AnimationClipに含まれる
 * 1つのアニメーションを表すクラス。
  */
export class ClipPoseMotion implements PoseMotion {
  name: string;
  time: number;
  isPaused: boolean;
  interpolants: Record<string,THREE.Interpolant>;

  constructor(clip: THREE.AnimationClip) {
    this.name = clip.name; // this.clip.nameに名前ある
    this.time = 0;
    this.isPaused = false;
    this.interpolants = {};
    for (const track of clip.tracks) {
      const valueSize = track.getValueSize();
      let interpolant;
      if (track.ValueTypeName === 'quaternion') {
        interpolant = new THREE.QuaternionLinearInterpolant(
          track.times,
          track.values,
          valueSize
        );
      } else {
        interpolant = new THREE.LinearInterpolant(
          track.times,
          track.values,
          valueSize
        )
      }
      this.interpolants[track.name] = interpolant;
    }
  }

  init(_objectA3: ObjectA3) {
    // nothing to do
  }

  addOneselfToPhysics(_world: PhysicsWorld) {}
  removeOneselfFromPhysics(_world: PhysicsWorld) {}

  controlMotion(..._args: string[]) {}

  setPause(p: boolean) {
    this.isPaused = p;
  }

  setTime(time: number) {
    this.time = time;
  }

  update(dt: number): Pose {
    this.time += dt;
    const pose: Pose = {};
    for (const [name,interpolant] of Object.entries(this.interpolants)) {
      const [nodeName,property] = name.split('.');
      let trans = pose[nodeName];
      if (!trans) {
        trans = new Transform();
        pose[name] = trans;
      }
      const res = interpolant.evaluate(this.time);
      if (property === 'position') {
        trans.loc.set(res[0],res[1],res[2]);
      } else if (property === 'quaternion') {
        trans.quat.set(res[0],res[1],res[2],res[3]);
      } else if (property === 'scale') {
        trans.scale.set(res[0],res[1],res[2]);
      } else {
        console.warn(`ClipPoseMotion: update. unknown property(${property})`);
      }
      pose[name] = interpolant.evaluate(this.time);
    }
    return pose;
  }
}
