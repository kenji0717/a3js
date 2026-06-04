import * as THREE from 'three';
import { ObjectA3 } from '../core/ObjectA3';
import type { MutableVec3 } from '../core/LinearMath';

/**
 * StandardLightsのコンストラクタに指定してStandardLightsの設定を行うためのオプションの型です。
 */
export interface StandardLightsOptions {
  /** DirectionalLightの光の方向を表すベクトルです。デフォルトは{x:-1,y:-1,z:-1}です。 */
  direction: MutableVec3;
  /** DirectionalLightの色です。デフォルトは0xffffffです。 */
  colorDL: number;
  /** AmbientLightの色です。デフォルトは0xffffffです。 */
  colorAL: number;
  /** DirectionalLightの光の強さです。デフォルトは1.0です。 */
  intensityDL: number;
  /** AmbientLightの光の強さです。デフォルトは0.4です。 */
  intensityAL: number;
}

export const defaultStandardLightsOptions: StandardLightsOptions = {
  direction: { x:-1, y:-1, z:-1 },
  colorDL: 0xffffff,
  colorAL: 0xffffff,
  intensityDL: 1,
  intensityAL: 0.4
};

function isMutableVec3(obj: unknown) {
    let ret = true;
    ret &&= typeof (obj as MutableVec3).x === 'number';
    ret &&= typeof (obj as MutableVec3).y === 'number';
    ret &&= typeof (obj as MutableVec3).z === 'number';
    return ret;
}

function isStandardLightsOptions(obj: unknown): obj is StandardLightsOptions {
    let ret = true;
    ret &&= isMutableVec3((obj as StandardLightsOptions).direction);
    ret &&= typeof (obj as StandardLightsOptions).colorDL === 'number';
    ret &&= typeof (obj as StandardLightsOptions).colorAL === 'number';
    ret &&= typeof (obj as StandardLightsOptions).intensityDL === 'number';
    ret &&= typeof (obj as StandardLightsOptions).intensityAL === 'number';
    return ret;
}

/**
 * 標準的なライティングを提供する光源オブジェクトです。
 * 太陽光に相当する `THREE.DirectionalLight`（指向性ライト）と、
 * 全体を均一に照らす `THREE.AmbientLight`（環境光）の組み合わせです。
 *
 * `MeshStandardMaterial` を使ったオブジェクトを正しく表示するには光源が必要です。
 *
 * @example
 * ```ts
 * const lights = new StandardLights();
 * scene.add(lights);
 * ```
 */
export class StandardLights extends ObjectA3 {
    completeOptions: StandardLightsOptions;
    declare directionalLight?: THREE.DirectionalLight;
    declare ambientLight?: THREE.AmbientLight;
    declare cameraHelper?: THREE.CameraHelper;

    /**
     * StandardLightsを生成します。optionsについてはStandardLightsOptionsを参照してください。
     * 
     * @param options 光に関するパラメータを設定するためのオプション情報です。
     */
    constructor(options: Partial<StandardLightsOptions> = defaultStandardLightsOptions) {
        const opt = {
            ...defaultStandardLightsOptions,
            ...options
        };
        super(opt);
        this.completeOptions = opt;
    }

    initObject(options: unknown) {
        let opt = defaultStandardLightsOptions;
        if (isStandardLightsOptions(options)) {
            opt = options;
        }
        const o = new THREE.Object3D();
        // 光源を作る1(太陽)
        this.directionalLight = new THREE.DirectionalLight(opt.colorDL,opt.intensityDL);
        this.directionalLight.target.position.set(opt.direction.x,opt.direction.y,opt.direction.z);
        o.add(this.directionalLight);
        o.add(this.directionalLight.target);
        // 光源を作る2(環境光)
        this.ambientLight = new THREE.AmbientLight(opt.colorAL,opt.intensityAL);
        o.add(this.ambientLight);
        return o;
    }

    /**
     * DirectionalLightが作る影はこのデバッグ表示で表示される直方体の中でしか表示されない。
     * その直方体の表示のON、OFFを切り替える。
     * 
     * @param debug `true`の時デバッグ表示をON。`false`の時デバッグ表示をOFF。
     * @returns 
     */
    setDebugMode(debug: boolean) {
console.log(`GAHA: jjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjj0`,this.directionalLight);
        if (!this.directionalLight)
            return;
        if (debug) {
            if (!this.cameraHelper)
                this.cameraHelper = new THREE.CameraHelper(this.directionalLight.shadow.camera);
            this.object3D.add(this.cameraHelper);
        } else {
            if (this.cameraHelper)
                this.object3D.remove(this.cameraHelper);
        }
    }
}
