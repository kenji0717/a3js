import * as THREE from 'three';
import { ObjectA3 } from '../core/ObjectA3';
import type { AsyncInitRequired } from '../core/AsyncInitRequired';
import type { DeepPartial } from '../utils/math';
import { deepMerge } from '../utils/math';

export type SoundType = "audio" | "positional";

export interface SoundOptions {
  type: SoundType;          // audio / positional
  autoplay: boolean;
  loop: boolean;
  volume: number;

  positional: PositionalOptions;
}

export interface PositionalOptions {
  refDistance: number;
  maxDistance: number;
  rolloffFactor: number;

  directional: {
    coneInnerAngle: number;
    coneOuterAngle: number;
    coneOuterGain: number;
  };
}

const defaultSoundOptions: SoundOptions = {
  type: "audio",
  autoplay: false,
  loop: false,
  volume: 1.0,

  positional: {
    refDistance: 1,
    maxDistance: 1000,
    rolloffFactor: 1,
    directional: {
      coneInnerAngle: 360,
      coneOuterAngle: 360,
      coneOuterGain: 0,
    },
  },
};

export type SoundOptionInput = DeepPartial<SoundOptions>;

/**
 * サウンドの初期化を行います。必ずユーザジェスチャを起点とする
 * スレッドから呼び出される必要があります。この初期化が完了しな
 * なければ音声が再生されない可能性が高いです。
 */
export async function initSound() {
  try {
    if (Sound.listener.context.state !== "running")
      await Sound.listener.context.resume();
  } catch(e) {
    console.warn("AudioContext resume failed. Did you call on user gesture?");
  }
}

export class Sound extends ObjectA3 implements AsyncInitRequired<Sound> {
  static listener: THREE.AudioListener = new THREE.AudioListener();
  static audioLoader: THREE.AudioLoader = new THREE.AudioLoader();

  readonly ready: Promise<Sound>;
  private option: SoundOptions;
  private sound?: THREE.PositionalAudio | THREE.Audio<GainNode | PannerNode>;
  constructor(soundFile: string, options: SoundOptionInput = {}) {
    super();
    this.option = deepMerge(defaultSoundOptions, options);
    this.ready = this.asyncInit(soundFile);
  }

  initObject() {
    return new THREE.Object3D();
  }

  async asyncInit(soundFile: string): Promise<Sound> {
    if (this.option.type === "positional") {
      const sound = new THREE.PositionalAudio(Sound.listener);
      sound.setRefDistance(this.option.positional.refDistance);
      sound.setMaxDistance(this.option.positional.maxDistance);
      sound.setRolloffFactor(this.option.positional.rolloffFactor);
      const d = this.option.positional.directional;
      sound.setDirectionalCone(
        d.coneInnerAngle,
        d.coneOuterAngle,
        d.coneOuterGain
      );
      sound.setVolume(this.option.volume);
      sound.setLoop(this.option.loop);
      this.sound = sound;
    } else {
      const sound = new THREE.Audio(Sound.listener);
      sound.setVolume(this.option.volume);
      sound.setLoop(this.option.loop);
      this.sound = sound;
    }
    this.object.add(this.sound);
    return new Promise((resolve)=>{
      Sound.audioLoader.load(soundFile, (buffer) => {
        if (this.sound)
          this.sound.setBuffer(buffer);
        resolve(this);
      });
    });
  }

  play() {
    this.sound?.stop();
    this.sound?.play();
  }

  stop() {
    this.sound?.stop();
  }
}
