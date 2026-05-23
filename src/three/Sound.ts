import * as THREE from 'three';
import { ObjectA3 } from '../core/ObjectA3';
import type { AsyncInitRequired } from '../core/AsyncInitRequired';
import type { DeepPartial } from '../utils/math';
import { deepMerge } from '../utils/math';

/**
 * サウンドの種類を表す型です。
 * - `"audio"` — 距離に関係なく一定音量で再生されます（BGM 等に適しています）。
 * - `"positional"` — 3D 空間内の位置に基づいて音量・定位が変化するポジショナルオーディオです。
 */
export type SoundType = "audio" | "positional";

/**
 * `Sound` の生成オプションです。
 */
export interface SoundOptions {
  /** サウンドの種類。`"audio"` または `"positional"`。デフォルトは `"audio"`。 */
  type: SoundType;
  /** `true` のとき、読み込み完了後に自動再生します。デフォルトは `false`。 */
  autoplay: boolean;
  /** `true` のとき、ループ再生します。デフォルトは `false`。 */
  loop: boolean;
  /** 音量。0.0 〜 1.0 の範囲で指定します。デフォルトは `1.0`。 */
  volume: number;
  /** `"positional"` モード時の詳細オプション。 */
  positional: PositionalOptions;
}

/**
 * ポジショナルオーディオのオプションです。
 */
export interface PositionalOptions {
  /** 音量が基準値になる距離（メートル）。この距離より近いと最大音量。デフォルトは `1`。 */
  refDistance: number;
  /** 音が聞こえなくなる最大距離（メートル）。デフォルトは `1000`。 */
  maxDistance: number;
  /** 距離による音量の減衰率。デフォルトは `1`。 */
  rolloffFactor: number;
  /** 指向性コーンの設定（音が出る方向を制限する場合に使用）。 */
  directional: {
    /** 内側コーン角度（度）。この範囲内では最大音量。デフォルトは `360`（全方向）。 */
    coneInnerAngle: number;
    /** 外側コーン角度（度）。デフォルトは `360`（全方向）。 */
    coneOuterAngle: number;
    /** 外側コーンでの音量係数（0 で無音）。デフォルトは `0`。 */
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

export type SoundOptionsInput = DeepPartial<SoundOptions>;

/**
 * 音声再生の初期化を行います。
 * ブラウザのポリシー上、**必ずユーザーの操作（クリック等）をきっかけとした処理から呼び出す必要があります。**
 * この初期化が完了しないと音声が再生されません。
 *
 * @example
 * ```ts
 * button.addEventListener('click', async () => {
 *   await initSound();
 * });
 * ```
 */
export async function initSound() {
  try {
    if (Sound.listener.context.state !== "running")
      await Sound.listener.context.resume();
  } catch(e) {
    console.warn("AudioContext resume failed. Did you call on user gesture?");
  }
}

/**
 * 3D 空間内でサウンドを再生するためのオブジェクトです。
 *
 * `"audio"` モードでは距離に関係なく一定音量で再生されます（BGM 向け）。
 * `"positional"` モードでは 3D 空間内での位置に基づいて音量・定位が変化します（効果音向け）。
 *
 * このクラスは `AsyncInitRequired` を実装しており、
 * `await sound.ready` で読み込み完了を待ってから `play()` を呼び出してください。
 *
 * @remarks
 * 音声を再生するには、事前に `initSound()` をユーザー操作のコールバック内で呼び出す必要があります。
 *
 * @example
 * ```ts
 * const bgm = new Sound('bgm.mp3', { loop: true });
 * await bgm.ready;
 * scene.add(bgm);
 * bgm.play();
 * ```
 */
export class Sound extends ObjectA3 implements AsyncInitRequired<Sound> {
  /** 音声のリスナー（耳の位置）。カメラに自動的に取り付けられます。 */
  static listener: THREE.AudioListener = new THREE.AudioListener();
  /** 音声ファイルのローダー。 */
  static audioLoader: THREE.AudioLoader = new THREE.AudioLoader();

  readonly ready: Promise<Sound>;
  private options: SoundOptions;
  private sound?: THREE.PositionalAudio | THREE.Audio<GainNode | PannerNode>;
  constructor(soundFile: string, options: SoundOptionsInput = {}) {
    super();
    this.options = deepMerge(defaultSoundOptions, options);
    this.ready = this.asyncInit(soundFile);
  }

  initObject() {
    return new THREE.Object3D();
  }

  async asyncInit(soundFile: string): Promise<Sound> {
    if (this.options.type === "positional") {
      const sound = new THREE.PositionalAudio(Sound.listener);
      sound.setRefDistance(this.options.positional.refDistance);
      sound.setMaxDistance(this.options.positional.maxDistance);
      sound.setRolloffFactor(this.options.positional.rolloffFactor);
      const d = this.options.positional.directional;
      sound.setDirectionalCone(
        d.coneInnerAngle,
        d.coneOuterAngle,
        d.coneOuterGain
      );
      sound.setVolume(this.options.volume);
      sound.setLoop(this.options.loop);
      this.sound = sound;
    } else {
      const sound = new THREE.Audio(Sound.listener);
      sound.setVolume(this.options.volume);
      sound.setLoop(this.options.loop);
      this.sound = sound;
    }
    this.object3D.add(this.sound);
    return new Promise((resolve)=>{
      Sound.audioLoader.load(soundFile, (buffer) => {
        if (this.sound)
          this.sound.setBuffer(buffer);
        resolve(this);
      });
    });
  }

  /**
   * サウンドを再生します。すでに再生中の場合は最初から再生し直します。
   */
  play() {
    this.sound?.stop();
    this.sound?.play();
  }

  /**
   * サウンドを停止します。
   */
  stop() {
    this.sound?.stop();
  }
}
