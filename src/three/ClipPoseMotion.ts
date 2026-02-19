import * as THREE from 'three';
import type { Pose, PoseMotion } from '../core/Motion';
import { ObjectA3 } from '../core/ObjectA3';
import { Quat, Vec3 } from '../core/LinearMath';
import type { PhysicsWorld } from '../core/Physics';

/**
 * BVHやglTFファイルから読み込まれるモーションキャプチャ
 * データなどから生成されるTHREE.AnimationClipに含まれる
 * 1つのアニメーションを表すクラス。
  */
export class ClipPoseMotion implements PoseMotion {
  name: string;
  time: number;
  duration: number;
  isPaused: boolean;
  playCount: number;
  interpolants: Record<string,THREE.Interpolant>;

  constructor(clip: THREE.AnimationClip, name?: string) {
    this.name = name?name:clip.name;
    this.time = 0;
    this.duration = clip.duration;
    this.isPaused = false;
    this.playCount = 0;
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
  prepare3D(_objectA3: ObjectA3) {}
  cleanup3D(_objectA3: ObjectA3) {}

  setPause(p: boolean) {
    this.isPaused = p;
  }

  setTime(time: number) {
    this.time = time;
  }

  update(dt: number): Pose {
    this.time += dt;
    if (this.time > this.duration) {
      this.time -= this.duration;
      this.playCount++;
    }
    const pose: Pose = {};
    for (const [name,interpolant] of Object.entries(this.interpolants)) {
      const [nodeName,property] = name.split('.');
      let data = pose[nodeName];
      if (!data) {
        data = {};
        pose[nodeName] = data;
      }
      const res = interpolant.evaluate(this.time);
      if (property === 'position') {
        data.loc = new Vec3(res[0],res[1],res[2]);
      } else if (property === 'quaternion') {
        data.quat = new Quat(res[0],res[1],res[2],res[3]);
      } else if (property === 'scale') {
        data.scale = new Vec3(res[0],res[1],res[2]);
      } else if (property === 'morphTargetInfluences') {
        if (!data.morphs) data.morphs = [];
        // いいのか？
        const vals:number[] = Array.from(res);
        data.morphs.push({name: nodeName,vals});
      } else {
        console.warn(`ClipPoseMotion: update. unknown property(${property})`);
      }
    }
    return pose;
  }
}
