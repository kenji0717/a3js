
import * as THREE from 'three';
import type { Scene } from './Scene'; // ここをtypeにしないと循環参照になる。
import { DefaultTransformer, SmoothTransformer, FollowTransformer,
         BillboardTransformer, SmoothBillboardTransformer,
       } from './Transformers';
import type { PhysicsWorld } from './Physics';
import { SimplePhysicsTransformer } from '../rapier/RapierPhysics';
import { Vec3, Quat, Transform, getLookAtQuat, eulerToQuat } from './LinearMath';
import type { RotationOrder } from './LinearMath';
import { tmp } from '../utils/math';
import { KinematicCharacterTransformer } from '../rapier/KinematicCharacterTransformer';
import { DynamicCharacterTransformer } from '../rapier/DynamicCharacterTransformer';

/**
 * スクリーン上の方向を表す型です。
 * 吹き出しを出す方向の指定などに使用します。
 */
export type Dir =
  | "TOP"
  | "RIGHT"
  | "LEFT"
  | "BOTTOM";

/**
 * `ObjectA3` の位置・回転・拡大率の制御モードを表す型です。
 * `setMode()` の引数として使用します。
 *
 * - `"Default"` — 即座に位置・回転・拡大率を反映します。
 * - `"Smooth"` — 約1秒かけてなめらかに補間します。
 * - `"Follow"` — 別のオブジェクトを追従します。
 * - `"Billboard"` — 常にターゲットの方向を向きます。
 * - `"SmoothBillboard"` — なめらかにターゲット方向を向きます。
 * - `"SimplePhysics"` — Rapier3D の剛体物理演算を使います。
 * - `"KinematicCharacter"` — カプセルコライダーによるキネマティックキャラクター制御を使います。
 * - `"DynamicCharacter"` — カプセルコライダーによる動的キャラクター制御を使います。
 */
export type TransformMode =
  | "Default"
  | "Smooth"
  | "Follow"
  | "Billboard"
  | "SmoothBillboard"
  | "SimplePhysics"
  | "KinematicCharacter"
  | "DynamicCharacter";

const geo = new THREE.SphereGeometry();
const mat = new THREE.MeshStandardMaterial({ color: 0xff0000 });
/**
 * オブジェクトの読み込み中に表示される仮のメッシュです（赤い球体）。
 * 必要に応じて差し替えることができます。
 */
export let a3jsLoading = new THREE.Mesh(geo,mat);



/**
 * ObjectA3.setLightShadow(true,opt);のoptに与えるオプションの型です。
 */
export interface SetLightShadowOptions {
  /** DirectionalLightの場合のcamera.leftの値 */
  left: number;
  /** DirectionalLightの場合のcamera.rightの値 */
  right: number;
  /** DirectionalLightの場合のcamera.topの値 */
  top: number;
  /** DirectionalLightの場合のcamera.bottomの値 */
  bottom: number;
  /** SpotLightの場合のangleの値 */
  angle: number;
  /** 影を落すことができる一番近い距離。全ての光源タイプ共通 */
  near: number;
  /** 影を落すことができる一番遠い距離。全ての光源タイプ共通 */
  far: number;
  /** 影の計算で使用するシャドーマップの横の解像度。全ての光源タイプ共通 */
  shadowMapWidth: number;
  /** 影の計算で使用するシャドーマップの縦の解像度。全ての光源タイプ共通 */
  shadowMapHeight: number;
}

/**
 * ObjectA3.setLightShadow(true,opt);のoptに与えるオプションのデフォルト値です。
 */
export const defaultSetLightShadowOptions: SetLightShadowOptions = {
  left: -20,
  right: 20,
  top: 20,
  bottom: -20,
  angle: Math.PI / 6,
  near: 0.1,
  far: 100,
  shadowMapWidth: 1024,
  shadowMapHeight: 1024
};



/**
 * シーン内に配置される全てのオブジェクトの基底クラスです。
 *
 * 3D モデル・カメラ・ライト・サウンドなど、シーンに追加できる全てのオブジェクトは
 * このクラスを継承しています。
 * 位置・回転・拡大率の操作機能を提供します。
 * 物理演算・衝突検知などの機能は、物理モードを設定したオブジェクトでのみ有効です。
 *
 * @example
 * ```ts
 * // サブクラスを作って独自オブジェクトを定義する例
 * class MyObject extends ObjectA3 {
 *   initObject() {
 *     const geo = new THREE.BoxGeometry();
 *     const mat = new THREE.MeshStandardMaterial({ color: 0x0088ff });
 *     return new THREE.Mesh(geo, mat);
 *   }
 * }
 * const obj = new MyObject();
 * scene.add(obj);
 * obj.setPosition(1, 0, 0);
 * ```
 */
export class ObjectA3 {
  /** 全 `ObjectA3` に共通して使われるデフォルトの回転順番。初期値は `"ZXY"`。 */
  static defaultRotationOrder: RotationOrder = "ZXY";
  /** 全 `ObjectA3` に共通して使われるデフォルトの上方向ベクトル。初期値は `(0, 1, 0)`。 */
  static defaultUpVector: Vec3 = new Vec3(0,1,0);
  /** このオブジェクト固有の回転順番。`undefined` のとき `ObjectA3.defaultRotationOrder` が使われます。 */
  rotationOrder?: RotationOrder;
  /** このオブジェクト固有の上方向ベクトル。`undefined` のとき `ObjectA3.defaultUpVector` が使われます。 */
  upVector?: Vec3;
  /** Three.js の内部オブジェクト（`THREE.Object3D`）です。通常は直接操作しません。 */
  object3D: THREE.Object3D;
  /** このオブジェクトが追加されている `Scene`。追加前は `undefined`。 */
  scene?: Scene;
  private balloon?: BalloonInfo;
  private transformer: Transformer;
  /** 親オブジェクト。`ObjectA3.add()` で追加された場合に設定されます。 */
  parent?: ObjectA3;
  /** 子オブジェクトの配列。`ObjectA3.add()` で追加されたオブジェクトが格納されます。 */
  children: ObjectA3[] = [];
  /** `setClickListener()` で登録されたクリックリスナー関数。 */
  clickListener?: (o: ObjectA3)=>void;
  /** 自動向き調整機能のON、OFF。デフォルトOFF。 */
  autoDirection: boolean = false;

  constructor(data?: any) {
    this.autoDirection = false;
    this.transformer = this.initTransformer(data);
    this.object3D = new THREE.Object3D();
    const r = this.initObject(data);
    if (r)
      this.object3D.add(r);
    this.object3D.traverse((o)=>{
      o.userData['a3js'] = { objectA3: this };
    });
  }

  /**
   * このオブジェクトの Three.js メッシュなどを生成して返すメソッドです。
   * サブクラスでオーバーライドして、独自の形状を返してください。
   * 非同期処理が必要な場合はとりあえず `a3jsLoading.clone()` を返しておき、
   * 読み込み完了後に差し替えてください。
   * @param _data コンストラクタから渡されたデータ
   * @returns Three.js の `Object3D`（メッシュ・グループ等）
   */
  initObject(_data?: any): THREE.Object3D {
    return a3jsLoading.clone();
  };

  /**
   * コンストラクタから呼び出され、デフォルトで使用される `Transformer` を返すメソッドです。
   * サブクラスでオーバーライドすることでデフォルトの動作モードを変更できます。
   * @param _data コンストラクタから渡された情報
   * @returns このオブジェクトで使用する `Transformer`
   */
  initTransformer(_data?: any): Transformer {
    return new DefaultTransformer();
  }

  /**
   * このオブジェクトに使用する `Transformer` を変更します。
   * 現在の位置・回転・拡大率を引き継いで新しい `Transformer` に切り替えます。
   * @param transformer 新しい `Transformer`
   */
  setTransformer(transformer: Transformer): void {
    tmp.t0.set(this.transformer.transform);
    transformer.init(tmp.t0, this);
    this.transformer = transformer;
  }

  /**
   * このオブジェクトに現在設定されている `Transformer` を返します。
   * @returns 現在の `Transformer`
   */
  getTransformer(): Transformer {
    return this.transformer;
  }

  /**
   * このオブジェクトの制御モード（`TransformMode`）を設定します。
   * モードに応じた `Transformer` が自動的に適用されます。
   *
   * | モード | 使用される Transformer |
   * |---|---|
   * | `"Default"` | `DefaultTransformer` |
   * | `"Smooth"` | `SmoothTransformer` |
   * | `"Follow"` | `FollowTransformer` |
   * | `"Billboard"` | `BillboardTransformer` |
   * | `"SmoothBillboard"` | `SmoothBillboardTransformer` |
   * | `"SimplePhysics"` | `RapierTransformer` |
   * | `"KinematicCharacter"` | `KinematicCharacterTransformer` |
   * | `"DynamicCharacter"` | `DynamicCharacterTransformer` |
   *
   * `options` の詳細は各 Transformer クラスのオプション型を参照してください。
   *
   * @param mode 設定するモード
   * @param options モードによっては追加のオプションが必要です
   */
  setMode(mode: TransformMode, options?: any) {
    if (mode === "Default")
      this.setTransformer(new DefaultTransformer());
    else if (mode === "Smooth")
      this.setTransformer(new SmoothTransformer(options));
    else if (mode === "Follow") {
      this.setTransformer(new FollowTransformer(options));
    } else if (mode === "Billboard") {
      this.setTransformer(new BillboardTransformer(options));
    } else if (mode === "SmoothBillboard") {
      this.setTransformer(new SmoothBillboardTransformer(options));
    } else if (mode === "SimplePhysics") {
      this.setTransformer(new SimplePhysicsTransformer(options));
    } else if (mode === "KinematicCharacter") {
      this.setTransformer(new KinematicCharacterTransformer(options));
    } else if (mode === "DynamicCharacter") {
      this.setTransformer(new DynamicCharacterTransformer(options));
    }
  }
  
  update(dt: number) {
    // 以下、自動向き調整機能の実装
    const vel = this.getLinearVelocity();
    const speed = vel.length();
    if (this.autoDirection) {
      if (speed>0.0001) {
        vel.normalize();
        const up = this.upVector ? this.upVector : ObjectA3.defaultUpVector;
        tmp.v0.cross(vel,up)
        if (tmp.v0.length()>0.0001) {
          tmp.v0.set(0,0,0);
          getLookAtQuat(tmp.v0,vel,up,tmp.q0);
          this.setQuatNow(tmp.q0);
        }
      }
    }
//console.log(`GAHA:a `,this.transformer.trans.loc);
//console.log(`GAHA:f `,this.transformer.trans.quat);
//console.log(`GAHA:g `,(this.transformer instanceof DefaultTransformer));
    //TransformMosionを反映
    this.transformer.update(dt);
    this.transformer.transform.write(this);
    this.children.forEach((child)=>{
      child.update(dt);
    });
  }

  /**
   * このオブジェクトに子オブジェクトを追加します。
   * 追加したオブジェクトはこのオブジェクトの座標系に従って動きます。
   * @param obj 追加する子オブジェクト
   */
  add(obj: ObjectA3) {
    if (obj.scene) {console.warn('ObjectA3.add(obj) is ignored.');return;}
    if (obj.parent) {console.warn('ObjectA3.add(obj) is ignored.');return;}
    // if (this.children.includes(obj)) return; // ちゃんと管理されてれば必要ない
    this.children.push(obj);
    obj.parent = this;
    this.object3D.add(obj.object3D);
  }

  /**
   * このオブジェクトから子オブジェクトを取り除きます。
   * @param obj 取り除く子オブジェクト
   */
  remove(obj: ObjectA3) {
    if (obj.parent !== this) {console.warn('ObjectA3.remove(obj) is ignored.');return;}
    // if (!this.children.includes(obj)) return; // ちゃんと管理されてれば必要ない
    const idx = this.children.indexOf(obj);
    this.children.splice(idx,1);
    obj.parent = undefined;
    this.object3D.remove(obj.object3D);
  }

  /**
   * このオブジェクトに吹き出しを表示します。
   * @param message 吹き出しに表示するメッセージ
   * @remarks 現在未実装です。
   */
  setSpeechBubble(message: string) {
    if (!this.balloon)
      this.balloon = new BalloonInfo(message);
    else
      this.balloon.message = message;
  }

  /**
   * このオブジェクトがクリックされたときに呼ばれる関数を登録します。
   * 登録できるリスナーは1つだけです。2回目の呼び出しで上書きされます。
   * @param func クリック時に呼ばれる関数。引数にクリックされた `ObjectA3` が渡されます。
   */
  setClickListener(func: (o: ObjectA3)=>void) {
    this.clickListener = func;
  }

  /**
   * 物理エンジンにより衝突が検知されたときに呼び出されるコールバックメソッドです。
   * 衝突イベントを受け取るには、サブクラスでオーバーライドしてください。
   * また、`PhysicsMotionOptions.collisionDetection` を `true` に設定する必要があります。
   * @param obj 衝突相手の `ObjectA3`
   * @param started 衝突開始のとき `true`、衝突終了のとき `false`
   * @param myPartNo このオブジェクトの、ぶつかったパーツのコライダー番号
   * @param yourPartNo 相手オブジェクトの、ぶつかったパーツのコライダー番号
   */
  handleCollision(obj: ObjectA3, started: boolean, myPartNo: number, yourPartNo: number) {
    obj; started; myPartNo; yourPartNo;
  }

  async clicked() {
    if (this.clickListener)
      await this.clickListener(this);
  }

  /**
   * このオブジェクトが影を落すかどうかを設定します。
   * @param value `true`の時は影を落す。`false`の時は影を落さない。
   */
  setCastShadow(value: boolean) {
    this.object3D.traverse((o) => {
      if (o instanceof THREE.Mesh) {
        o.castShadow = value;
      }
    });
  }

  /**
   * このオブジェクトが影を描画するかどうかを設定します。
   * @param value `true`の時は描画する。`false`の時は描画しない。
   */
  setReceiveShadow(value: boolean) {
    this.object3D.traverse((o) => {
      if (o instanceof THREE.Mesh) {
        o.receiveShadow = value;
      }
    });
  }

  /**
   * このオブジェクトの中に含まれるLightが影を作るかどうかを設定します。
   * @param value `true`の時は作る。`false`の時は作らない。
   * @param options 影を作るために必要なカメラやシャドウマップの解像度の情報。
   */
  setLightShadow(value: boolean, options: Partial<SetLightShadowOptions>) {
    const opt = {
      ...defaultSetLightShadowOptions,
      ...options
    };
    this.object3D.traverse((o) => {
      if (o instanceof THREE.DirectionalLight) {
        o.castShadow = value;
        o.shadow.camera.left = opt.left;
        o.shadow.camera.right = opt.right;
        o.shadow.camera.top = opt.top;
        o.shadow.camera.bottom = opt.bottom;
        o.shadow.camera.near = opt.near;
        o.shadow.camera.far = opt.far;
        o.shadow.camera.updateProjectionMatrix();
        o.shadow.mapSize.width = opt.shadowMapWidth;
        o.shadow.mapSize.height = opt.shadowMapHeight;
      } else if (o instanceof THREE.SpotLight) {
        o.castShadow = value;
        o.angle = opt.angle;
        o.shadow.camera.near = opt.near;
        o.shadow.camera.far = opt.far;
        o.shadow.camera.updateProjectionMatrix();
        o.shadow.mapSize.width = opt.shadowMapWidth;
        o.shadow.mapSize.height = opt.shadowMapHeight;
      } else if (o instanceof THREE.PointLight) {
        o.castShadow = value;
        o.shadow.camera.near = opt.near;
        o.shadow.camera.far = opt.far;
        o.shadow.camera.updateProjectionMatrix();
        o.shadow.mapSize.width = opt.shadowMapWidth;
        o.shadow.mapSize.height = opt.shadowMapHeight;
      }
    });
  }

  /**
   * このオブジェクトの現在の位置を返します。
   * @param out 値を書き込む `Vec3`（省略時は新しい `Vec3` を返します）
   * @returns 現在の位置
   */
  getPosition(out?: Vec3): Vec3 {
    if (out) { out.set(this.transformer.transform.loc); return out; }
    return this.transformer.transform.loc.clone();
  }
  /**
   * このオブジェクトの目標位置を設定します。
   * `"Smooth"` モードの場合はなめらかに補間されます。
   * すぐに移動させたい場合は `setPositionNow()` を使ってください。
   *
   * @remarks
   * `"SimplePhysics"`・`"KinematicCharacter"`・`"DynamicCharacter"` など
   * 物理演算系のモードでは、このメソッドは機能しません。
   * 物理モードで位置を強制変更するには `setPositionNow()` を使ってください。
   *
   * @param x x 座標（または `Vec3`）
   * @param y y 座標
   * @param z z 座標
   */
  setPosition(x: number, y: number, z: number): void;
  setPosition(v: Vec3): void;
  setPosition(xOrV: number | Vec3, y?: number, z?: number): void {
    if (typeof xOrV === "number") {
      tmp.v0.set(xOrV, y!, z!);
    } else {
      tmp.v0.set(xOrV);
    }
    this.transformer.setPosition(tmp.v0);
  }

  /**
   * このオブジェクトの位置を即座に設定します。
   * `"Smooth"` モードのなめらかな補間を無視してすぐに移動します。
   * 物理演算系のモードでも位置を強制的に変更します。
   * @param x x 座標（または `Vec3`）
   * @param y y 座標
   * @param z z 座標
   */
  setPositionNow(x: number, y: number, z: number): void;
  setPositionNow(v: Vec3): void;
  setPositionNow(xOrV: number | Vec3, y?: number, z?: number): void {
    if (typeof xOrV === "number") {
      tmp.v0.set(xOrV, y!, z!);
    } else {
      tmp.v0.set(xOrV);
    }
    this.transformer.setPositionNow(tmp.v0);
  }

  /**
   * このオブジェクトの現在の回転をクォータニオンで返します。
   * @param out 値を書き込む `Quat`（省略時は新しい `Quat` を返します）
   * @returns 現在の回転（クォータニオン）
   */
  getQuat(out?: Quat): Quat {
    if (out) { out.set(this.transformer.transform.quat); return out; }
    return this.transformer.transform.quat.clone();
  }
  /**
   * このオブジェクトの目標回転をクォータニオンで設定します。
   * `"Smooth"` モードの場合はなめらかに補間されます。
   * すぐに反映させたい場合は `setQuatNow()` を使ってください。
   *
   * @remarks
   * 物理演算系のモードでは機能しません。物理モードで回転を強制変更するには `setQuatNow()` を使ってください。
   *
   * @param x x 成分（または `Quat`）
   * @param y y 成分
   * @param z z 成分
   * @param w w 成分
   */
  setQuat(x: number, y: number, z: number, w: number): void;
  setQuat(q: Quat): void;
  setQuat(xOrQ: number | Quat, y?: number, z?: number, w?: number): void {
    if (typeof xOrQ === "number") {
      tmp.q0.set(xOrQ, y!, z!, w!);
    } else {
      tmp.q0.set(xOrQ);
    }
    this.transformer.setQuat(tmp.q0);
  }

  /**
   * このオブジェクトの回転をクォータニオンで即座に設定します。
   * 物理演算系のモードでも強制的に反映されます。
   * @param x x 成分（または `Quat`）
   * @param y y 成分
   * @param z z 成分
   * @param w w 成分
   */
  setQuatNow(x: number, y: number, z: number, w: number): void;
  setQuatNow(q: Quat): void;
  setQuatNow(xOrQ: number | Quat, y?: number, z?: number, w?: number): void {
    if (typeof xOrQ === "number") {
      tmp.q0.set(xOrQ, y!, z!, w!);
    } else {
      tmp.q0.set(xOrQ);
    }
    this.transformer.setQuatNow(tmp.q0);
  }

  /**
   * このオブジェクトの現在の拡大率を返します。
   * @param out 値を書き込む `Vec3`（省略時は新しい `Vec3` を返します）
   * @returns 現在の拡大率（x, y, z 各軸）
   */
  getScale(out?: Vec3): Vec3 {
    if (out) { out.set(this.transformer.transform.scale); return out; }
    return this.transformer.transform.scale.clone();
  }
  /**
   * このオブジェクトの目標拡大率を設定します。
   * `"Smooth"` モードの場合はなめらかに補間されます。
   * すぐに反映させたい場合は `setScaleNow()` を使ってください。
   *
   * @remarks
   * `"SimplePhysics"`・`"KinematicCharacter"`・`"DynamicCharacter"` など
   * 物理演算系のモードでは、このメソッドは機能しません（`setScaleNow()` も同様）。
   * 物理モードでの拡大率の変更はサポートされていません。
   *
   * @param x x 軸の拡大率（または `Vec3`）
   * @param y y 軸の拡大率
   * @param z z 軸の拡大率
   */
  setScale(x: number, y: number, z: number): void;
  setScale(v: Vec3): void;
  setScale(xOrV: number | Vec3, y?: number, z?: number): void {
    if (typeof xOrV === "number") {
      tmp.v0.set(xOrV, y!, z!);
    } else {
      tmp.v0.set(xOrV);
    }
    this.transformer.setScale(tmp.v0);
  }

  /**
   * このオブジェクトの拡大率を即座に設定します。
   * `"Smooth"` モードのなめらかな補間を無視してすぐに反映します。
   *
   * @remarks
   * `"SimplePhysics"`・`"KinematicCharacter"`・`"DynamicCharacter"` など
   * 物理演算系のモードでは、このメソッドは機能しません。
   * 物理モードでの拡大率の変更はサポートされていません。
   *
   * @param x x 軸の拡大率（または `Vec3`）
   * @param y y 軸の拡大率
   * @param z z 軸の拡大率
   */
  setScaleNow(x: number, y: number, z: number): void;
  setScaleNow(v: Vec3): void;
  setScaleNow(xOrV: number | Vec3, y?: number, z?: number): void {
    if (typeof xOrV === "number") {
      tmp.v0.set(xOrV, y!, z!);
    } else {
      tmp.v0.set(xOrV);
    }
    this.transformer.setScaleNow(tmp.v0);
  }

  /**
   * このオブジェクトの目標回転をオイラー角（度数法）で設定します。
   * 単位はラジアンではなくデグリーです（360 で 1 回転）。
   * `"Smooth"` モードの場合はなめらかに補間されます。
   * すぐに反映させたい場合は `setRotationNow()` を使ってください。
   *
   * 回転の適用順は `rotationOrder` プロパティ（未設定時は `ObjectA3.defaultRotationOrder`）に従います。
   *
   * @remarks
   * 物理演算系のモードでは機能しません。
   * 物理モードで回転を強制変更するには `setRotationNow()` を使ってください。
   *
   * @param x x 軸の回転量（度）（または `Vec3`）
   * @param y y 軸の回転量（度）
   * @param z z 軸の回転量（度）
   */
  setRotation(x: number, y: number, z: number): void;
  setRotation(v: Vec3): void;
  setRotation(xOrV: number | Vec3, y?: number, z?: number): void {
    if (typeof xOrV === "number")
      tmp.v0.set(xOrV, y!, z!);
    else
      tmp.v0.set(xOrV);
    tmp.v0.scale(Math.PI/360); // デグリー to ラジアン & t to t/2
    const order = this.rotationOrder ? this.rotationOrder : ObjectA3.defaultRotationOrder;
    eulerToQuat(tmp.v0, order, tmp.q1);
    this.setQuat(tmp.q1);
  }

  /**
   * このオブジェクトの回転をオイラー角（度数法）で即座に設定します。
   * 単位はラジアンではなくデグリーです（360 で 1 回転）。
   * `"Smooth"` モードのなめらかな補間を無視してすぐに反映します。
   * 物理演算系のモードでも強制的に反映されます。
   *
   * 回転の適用順は `rotationOrder` プロパティ（未設定時は `ObjectA3.defaultRotationOrder`）に従います。
   *
   * @param x x 軸の回転量（度）（または `Vec3`）
   * @param y y 軸の回転量（度）
   * @param z z 軸の回転量（度）
   */
  setRotationNow(x: number, y: number, z: number): void;
  setRotationNow(v: Vec3): void;
  setRotationNow(xOrV: number | Vec3, y?: number, z?: number): void {
    if (typeof xOrV === "number")
      tmp.v0.set(xOrV, y!, z!);
    else
      tmp.v0.set(xOrV);
    tmp.v0.scale(Math.PI/360);
    const order = this.rotationOrder ? this.rotationOrder : ObjectA3.defaultRotationOrder;
    eulerToQuat(tmp.v0, order, tmp.q0);
    this.setQuatNow(tmp.q0);
  }

  /**
   * このオブジェクトを、指定した位置・オブジェクトの方向に向けます。
   * `"Smooth"` モードの場合はなめらかに補間されます。
   * すぐに反映させたい場合は `lookAtNow()` を使ってください。
   *
   * @remarks
   * 物理演算系のモードでは機能しません。
   *
   * @param x 向く先の x 座標（または `Vec3` / `ObjectA3`）
   * @param y 向く先の y 座標
   * @param z 向く先の z 座標
   */
  lookAt(x: number, y: number, z: number): void;
  lookAt(v: Vec3): void;
  lookAt(o: ObjectA3): void;
  lookAt(xVO: number | Vec3 | ObjectA3, y?: number, z?: number) {
    if (typeof xVO === "number") {
      tmp.v1.set(xVO,y!,z!);
    } else if (xVO instanceof ObjectA3) {
      tmp.v1.set(xVO.transformer.transform.loc);
    } else {
      tmp.v1.set(xVO);
    }
    const up = this.upVector ? this.upVector : ObjectA3.defaultUpVector;
    getLookAtQuat(this.transformer.transform.loc, tmp.v1, up, tmp.q1);
    this.setQuat(tmp.q1);
  }

  /**
   * このオブジェクトを、指定した位置・オブジェクトの方向に即座に向けます。
   * `"Smooth"` モードのなめらかな補間を無視してすぐに反映します。
   * 物理演算系のモードでも強制的に反映されます。
   *
   * @param x 向く先の x 座標（または `Vec3` / `ObjectA3`）
   * @param y 向く先の y 座標
   * @param z 向く先の z 座標
   */
  lookAtNow(x: number, y: number, z: number): void;
  lookAtNow(v: Vec3): void;
  lookAtNow(o: ObjectA3): void;
  lookAtNow(xVO: number | Vec3 | ObjectA3, y?: number, z?: number) {
    if (typeof xVO === "number") {
      tmp.v1.set(xVO,y!,z!);
    } else if (xVO instanceof ObjectA3) {
      tmp.v1.set(xVO.transformer.transform.loc);
    } else {
      tmp.v1.set(xVO);
    }
    const up = this.upVector ? this.upVector : ObjectA3.defaultUpVector;
    getLookAtQuat(this.transformer.transform.loc, tmp.v1, up, tmp.q1);
    this.setQuatNow(tmp.q1);
  }

  /**
   * このオブジェクトのローカル X 軸方向の単位ベクトルを返します。
   * @param out 値を書き込む `Vec3`（省略時は新しい `Vec3` を返します）
   * @returns ローカル X 軸の単位ベクトル（ワールド座標）
   */
  getUnitVecX(out?: Vec3): Vec3 {
    if (out) { out.set(1,0,0); return out.apply(this.object3D.quaternion); }
    return new Vec3(1,0,0).apply(this.object3D.quaternion);
  }
  /**
   * このオブジェクトのローカル Y 軸方向の単位ベクトルを返します。
   * @param out 値を書き込む `Vec3`（省略時は新しい `Vec3` を返します）
   * @returns ローカル Y 軸の単位ベクトル（ワールド座標）
   */
  getUnitVecY(out?: Vec3): Vec3 {
    if (out) { out.set(0,1,0); return out.apply(this.object3D.quaternion); }
    return new Vec3(0,1,0).apply(this.object3D.quaternion);
  }
  /**
   * このオブジェクトのローカル Z 軸方向の単位ベクトルを返します。
   * @param out 値を書き込む `Vec3`（省略時は新しい `Vec3` を返します）
   * @returns ローカル Z 軸の単位ベクトル（ワールド座標）
   */
  getUnitVecZ(out?: Vec3): Vec3 {
    if (out) { out.set(0,0,1); return out.apply(this.object3D.quaternion); }
    return new Vec3(0,0,1).apply(this.object3D.quaternion);
  }

  /**
   * このオブジェクトの位置を、指定した量だけ移動します（ワールド座標）。
   * 現在位置に加算されます。
   * `"Smooth"` モードの場合はなめらかに補間されます。
   *
   * @remarks
   * 物理演算系のモードでは機能しません。
   *
   * @param v 移動の方向を表すベクトル（`Vec3`）
   */
  translate(v: Vec3): void;
  /**
   * このオブジェクトの位置を、指定した量だけ移動します（ワールド座標）。
   * 現在位置に加算されます。
   * `"Smooth"` モードの場合はなめらかに補間されます。
   *
   * @remarks
   * 物理演算系のモードでは機能しません。
   *
   * @param x x 方向の移動量
   * @param y y 方向の移動量
   * @param z z 方向の移動量
   */
  translate(x: number, y: number, z: number): void;
  translate(xOrV: number | Vec3, y?: number, z?: number) {
    tmp.v1.set(this.transformer.transform.loc);
    if (typeof xOrV === 'number')
      tmp.v1.add(xOrV,y!,z!);
    else
      tmp.v1.add(xOrV);
    this.setPosition(tmp.v1);
  }

  /**
   * このオブジェクトの位置を、指定した量だけ即座に移動します（ワールド座標）。
   * `"Smooth"` モードのなめらかな補間を無視してすぐに反映します。
   * 物理演算系のモードでも強制的に反映されます。
   *
   * @param v 移動量を表すベクトル
   */
  translateNow(v: Vec3): void;
  /**
   * このオブジェクトの位置を、指定した量だけ即座に移動します（ワールド座標）。
   * `"Smooth"` モードのなめらかな補間を無視してすぐに反映します。
   * 物理演算系のモードでも強制的に反映されます。
   *
   * @param x x 方向の移動量
   * @param y y 方向の移動量
   * @param z z 方向の移動量
   */
  translateNow(x: number, y: number, z: number): void;
  translateNow(xOrV: number | Vec3, y?: number, z?: number) {
    tmp.v1.set(this.transformer.transform.loc);
    if (typeof xOrV === 'number')
      tmp.v1.add(xOrV,y!,z!);
    else
      tmp.v1.add(xOrV);
    this.setPositionNow(tmp.v1);
  }

  /**
   * このオブジェクトの回転に、指定したクォータニオンを右から掛け合わせます。
   * `"Smooth"` モードの場合はなめらかに補間されます。
   *
   * @remarks
   * 物理演算系のモードでは機能しません。
   *
   * @param q 掛け合わせるクォータニオン
   */
  mulQuat(q: Quat): void;
  /**
   * このオブジェクトの回転に、指定したクォータニオンを右から掛け合わせます。
   * `"Smooth"` モードの場合はなめらかに補間されます。
   *
   * @remarks
   * 物理演算系のモードでは機能しません。
   *
   * @param x x 成分
   * @param y y 成分
   * @param z z 成分
   * @param w w 成分
   */
  mulQuat(x: number, y: number, z: number, w: number): void;
  mulQuat(xOrQ: number | Quat, y?: number, z?: number, w?: number) {
    tmp.q1.set(this.transformer.transform.quat);
    if (typeof xOrQ === 'number')
      tmp.q1.mul(xOrQ,y!,z!,w!);
    else
      tmp.q1.mul(xOrQ);
    this.setQuat(tmp.q1);
  }

  /**
   * このオブジェクトの回転に、指定したクォータニオンを即座に右から掛け合わせます。
   * `"Smooth"` モードのなめらかな補間を無視してすぐに反映します。
   * 物理演算系のモードでも強制的に反映されます。
   *
   * @param q 掛け合わせるクォータニオン
   */
  mulQuatNow(q: Quat): void;
  /**
   * このオブジェクトの回転に、指定したクォータニオンを即座に右から掛け合わせます。
   * `"Smooth"` モードのなめらかな補間を無視してすぐに反映します。
   * 物理演算系のモードでも強制的に反映されます。
   *
   * @param x x 成分
   * @param y y 成分
   * @param z z 成分
   * @param w w 成分
   */
  mulQuatNow(x: number, y: number, z: number, w: number): void;
  mulQuatNow(xOrQ: number | Quat, y?: number, z?: number, w?: number) {
    tmp.q1.set(this.transformer.transform.quat);
    if (typeof xOrQ === 'number')
      tmp.q1.mul(xOrQ,y!,z!,w!);
    else
      tmp.q1.mul(xOrQ);
    this.setQuatNow(tmp.q1);
  }

  /**
   * このオブジェクトの現在の回転に、オイラー角（度数法）で回転を追加します。
   * 単位はラジアンではなくデグリーです（360 で 1 回転）。
   * `"Smooth"` モードの場合はなめらかに補間されます。
   *
   * @remarks
   * 物理演算系のモードでは機能しません。
   *
   * @param v 各軸の追加回転量（度）を表すベクトル
   */
  mulRotation(v: Vec3): void;
  /**
   * このオブジェクトの現在の回転に、オイラー角（度数法）で回転を追加します。
   * 単位はラジアンではなくデグリーです（360 で 1 回転）。
   * `"Smooth"` モードの場合はなめらかに補間されます。
   *
   * @remarks
   * 物理演算系のモードでは機能しません。
   *
   * @param x x 軸の追加回転量（度）
   * @param y y 軸の追加回転量（度）
   * @param z z 軸の追加回転量（度）
   */
  mulRotation(x: number, y: number, z: number): void;
  mulRotation(xOrV: number | Vec3, y?: number, z?: number) {
    if (typeof xOrV === 'number')
      tmp.v0.set(xOrV, y!, z!);
    else
      tmp.v0.set(xOrV);
    tmp.v0.scale(Math.PI/360); // デグリー to ラジアン & t to t/2
    const order = this.rotationOrder ? this.rotationOrder : ObjectA3.defaultRotationOrder;
    eulerToQuat(tmp.v0, order, tmp.q1);
    this.getQuat(tmp.q0);
    tmp.q0.mul(tmp.q1);
    this.setQuat(tmp.q0);
  }

  /**
   * このオブジェクトの現在の回転に、オイラー角（度数法）で回転を即座に追加します。
   * 単位はラジアンではなくデグリーです（360 で 1 回転）。
   * `"Smooth"` モードのなめらかな補間を無視してすぐに反映します。
   * 物理演算系のモードでも強制的に反映されます。
   *
   * @param v 各軸の追加回転量（度）を表すベクトル
   */
  mulRotationNow(v: Vec3): void;
  /**
   * このオブジェクトの現在の回転に、オイラー角（度数法）で回転を即座に追加します。
   * 単位はラジアンではなくデグリーです（360 で 1 回転）。
   * `"Smooth"` モードのなめらかな補間を無視してすぐに反映します。
   * 物理演算系のモードでも強制的に反映されます。
   *
   * @param x x 軸の追加回転量（度）
   * @param y y 軸の追加回転量（度）
   * @param z z 軸の追加回転量（度）
   */
  mulRotationNow(x: number, y: number, z: number): void;
  mulRotationNow(xOrV: number | Vec3, y?: number, z?: number) {
    if (typeof xOrV === 'number')
      tmp.v0.set(xOrV, y!, z!);
    else
      tmp.v0.set(xOrV);
    tmp.v0.scale(Math.PI/360); // デグリー to ラジアン & t to t/2
    const order = this.rotationOrder ? this.rotationOrder : ObjectA3.defaultRotationOrder;
    eulerToQuat(tmp.v0, order, tmp.q1);
    this.getQuat(tmp.q0);
    tmp.q0.mul(tmp.q1);
    this.setQuatNow(tmp.q0);
  }

  /**
   * このオブジェクトの現在の拡大率に、指定した値を乗算します。
   * `"Smooth"` モードの場合はなめらかに補間されます。
   *
   * @remarks
   * 物理演算系のモードでは機能しません（`mulScaleNow()` も同様）。
   *
   * @param v 各軸の乗数を表すベクトル
   */
  scaleBy(v: Vec3): void;
  /**
   * このオブジェクトの現在の拡大率に、指定した値を乗算します。
   * `"Smooth"` モードの場合はなめらかに補間されます。
   *
   * @remarks
   * 物理演算系のモードでは機能しません（`mulScaleNow()` も同様）。
   *
   * @param x x 軸の乗数
   * @param y y 軸の乗数
   * @param z z 軸の乗数
   */
  scaleBy(x: number, y: number, z: number): void;
  scaleBy(xOrV: number | Vec3, y?: number, z?: number) {
    this.getScale(tmp.v0);
    if (typeof xOrV === 'number')
      tmp.v0.set(tmp.v0.x*xOrV, tmp.v0.y*y!, tmp.v0.z*z!);
    else
      tmp.v0.set(tmp.v0.x*xOrV.x, tmp.v0.y*xOrV.y, tmp.v0.z*xOrV.z);
    this.setScale(tmp.v0);
  }

  /**
   * このオブジェクトの現在の拡大率に、指定した値を即座に乗算します。
   * `"Smooth"` モードのなめらかな補間を無視してすぐに反映します。
   *
   * @remarks
   * `"SimplePhysics"`・`"KinematicCharacter"`・`"DynamicCharacter"` など
   * 物理演算系のモードでは、このメソッドは機能しません。
   * 物理モードでの拡大率の変更はサポートされていません。
   *
   * @param v 各軸の乗数を表すベクトル
   */
  mulScaleNow(v: Vec3): void;
  /**
   * このオブジェクトの現在の拡大率に、指定した値を即座に乗算します。
   * `"Smooth"` モードのなめらかな補間を無視してすぐに反映します。
   *
   * @remarks
   * `"SimplePhysics"`・`"KinematicCharacter"`・`"DynamicCharacter"` など
   * 物理演算系のモードでは、このメソッドは機能しません。
   * 物理モードでの拡大率の変更はサポートされていません。
   *
   * @param x x 軸の乗数
   * @param y y 軸の乗数
   * @param z z 軸の乗数
   */
  mulScaleNow(x: number, y: number, z: number): void;
  mulScaleNow(xOrV: number | Vec3, y?: number, z?: number) {
    this.getScale(tmp.v0);
    if (typeof xOrV === 'number')
      tmp.v0.set(tmp.v0.x*xOrV, tmp.v0.y*y!, tmp.v0.z*z!);
    else
      tmp.v0.set(tmp.v0.x*xOrV.x, tmp.v0.y*xOrV.y, tmp.v0.z*xOrV.z);
    this.setScaleNow(tmp.v0);
  }

  /**
   * このオブジェクトをローカル Z 軸の正方向（前方）へ移動します。
   * `"Smooth"` モードの場合はなめらかに補間されます。
   * @param f 移動距離
   */
  moveForward(f: number) {
    this.getUnitVecZ(tmp.v0);
    tmp.v0.scale(f);
    this.translate(tmp.v0);
  }

  /**
   * このオブジェクトをローカル Z 軸の正方向（前方）へ即座に移動します。
   * @param f 移動距離
   */
  moveForwardNow(f: number) {
    this.getUnitVecZ(tmp.v0);
    tmp.v0.scale(f);
    this.translateNow(tmp.v0);
  }

  /**
   * このオブジェクトをローカル Z 軸の負方向（後方）へ移動します。
   * `"Smooth"` モードの場合はなめらかに補間されます。
   * @param b 移動距離
   */
  moveBackward(b: number) {
    this.getUnitVecZ(tmp.v0);
    tmp.v0.scale(-b);
    this.translate(tmp.v0);
  }

  /**
   * このオブジェクトをローカル Z 軸の負方向（後方）へ即座に移動します。
   * @param b 移動距離
   */
  moveBackwardNow(b: number) {
    this.getUnitVecZ(tmp.v0);
    tmp.v0.scale(-b);
    this.translateNow(tmp.v0);
  }

  /**
   * このオブジェクトをローカル X 軸の負方向（右方向）へ移動します。
   * `"Smooth"` モードの場合はなめらかに補間されます。
   * @param r 移動距離
   */
  moveRight(r: number) {
    this.getUnitVecX(tmp.v0);
    tmp.v0.scale(-r);
    this.translate(tmp.v0);
  }

  /**
   * このオブジェクトをローカル X 軸の負方向（右方向）へ即座に移動します。
   * @param r 移動距離
   */
  moveRightNow(r: number) {
    this.getUnitVecX(tmp.v0);
    tmp.v0.scale(-r);
    this.translateNow(tmp.v0);
  }

  /**
   * このオブジェクトをローカル X 軸の正方向（左方向）へ移動します。
   * `"Smooth"` モードの場合はなめらかに補間されます。
   * @param l 移動距離
   */
  moveLeft(l: number) {
    this.getUnitVecX(tmp.v0);
    tmp.v0.scale(l);
    this.translate(tmp.v0);
  }

  /**
   * このオブジェクトをローカル X 軸の正方向（左方向）へ即座に移動します。
   * @param l 移動距離
   */
  moveLeftNow(l: number) {
    this.getUnitVecX(tmp.v0);
    tmp.v0.scale(l);
    this.translateNow(tmp.v0);
  }

  /**
   * このオブジェクトをローカル Y 軸の正方向（上方向）へ移動します。
   * `"Smooth"` モードの場合はなめらかに補間されます。
   * @param u 移動距離
   */
  moveUp(u: number) {
    this.getUnitVecY(tmp.v0);
    tmp.v0.scale(u);
    this.translate(tmp.v0);
  }

  /**
   * このオブジェクトをローカル Y 軸の正方向（上方向）へ即座に移動します。
   * @param u 移動距離
   */
  moveUpNow(u: number) {
    this.getUnitVecY(tmp.v0);
    tmp.v0.scale(u);
    this.translateNow(tmp.v0);
  }

  /**
   * このオブジェクトをローカル Y 軸の負方向（下方向）へ移動します。
   * `"Smooth"` モードの場合はなめらかに補間されます。
   * @param d 移動距離
   */
  moveDown(d: number) {
    this.getUnitVecY(tmp.v0);
    tmp.v0.scale(-d);
    this.translate(tmp.v0);
  }

  /**
   * このオブジェクトをローカル Y 軸の負方向（下方向）へ即座に移動します。
   * @param d 移動距離
   */
  moveDownNow(d: number) {
    this.getUnitVecY(tmp.v0);
    tmp.v0.scale(-d);
    this.translateNow(tmp.v0);
  }

  /**
   * このオブジェクトを上向きに回転させます（X 軸回りに仰角方向）。
   * `"Smooth"` モードの場合はなめらかに補間されます。
   * @param u 回転量（度）
   */
  turnUp(u: number) {
    this.mulRotation(-u,0,0);
  }

  /**
   * このオブジェクトを上向きに即座に回転させます（X 軸回りに仰角方向）。
   * @param u 回転量（度）
   */
  turnUpNow(u: number) {
    this.mulRotationNow(-u,0,0);
  }

  /**
   * このオブジェクトを下向きに回転させます（X 軸回りに俯角方向）。
   * `"Smooth"` モードの場合はなめらかに補間されます。
   * @param d 回転量（度）
   */
  turnDown(d: number) {
    this.mulRotation(d,0,0);
  }

  /**
   * このオブジェクトを下向きに即座に回転させます（X 軸回りに俯角方向）。
   * @param d 回転量（度）
   */
  turnDownNow(d: number) {
    this.mulRotationNow(d,0,0);
  }

  /**
   * このオブジェクトを右向きに回転させます（Y 軸回りに右旋回）。
   * `"Smooth"` モードの場合はなめらかに補間されます。
   * @param r 回転量（度）
   */
  turnRight(r: number) {
    this.mulRotation(0,-r,0);
  }

  /**
   * このオブジェクトを右向きに即座に回転させます（Y 軸回りに右旋回）。
   * @param r 回転量（度）
   */
  turnRightNow(r: number) {
    this.mulRotationNow(0,-r,0);
  }

  /**
   * このオブジェクトを左向きに回転させます（Y 軸回りに左旋回）。
   * `"Smooth"` モードの場合はなめらかに補間されます。
   * @param l 回転量（度）
   */
  turnLeft(l: number) {
    this.mulRotation(0,l,0);
  }

  /**
   * このオブジェクトを左向きに即座に回転させます（Y 軸回りに左旋回）。
   * @param l 回転量（度）
   */
  turnLeftNow(l: number) {
    this.mulRotationNow(0,l,0);
  }

  /**
   * このオブジェクトを右方向にロール回転させます（Z 軸回りに時計回り）。
   * `"Smooth"` モードの場合はなめらかに補間されます。
   * @param r 回転量（度）
   */
  rollRight(r: number) {
    this.mulRotation(0,0,r);
  }

  /**
   * このオブジェクトを右方向に即座にロール回転させます（Z 軸回りに時計回り）。
   * @param r 回転量（度）
   */
  rollRightNow(r: number) {
    this.mulRotationNow(0,0,r);
  }

  /**
   * このオブジェクトを左方向にロール回転させます（Z 軸回りに反時計回り）。
   * `"Smooth"` モードの場合はなめらかに補間されます。
   * @param l 回転量（度）
   */
  rollLeft(l: number) {
    this.mulRotation(0,0,-l);
  }

  /**
   * このオブジェクトを左方向に即座にロール回転させます（Z 軸回りに反時計回り）。
   * @param l 回転量（度）
   */
  rollLeftNow(l: number) {
    this.mulRotationNow(0,0,-l);
  }

  /**
   * このオブジェクトの線速度を設定します。
   * 物理演算系のモードでのみ有効です。
   * @param v 設定する線速度
   */
  setLinearVelocity(v: Vec3): void;
  /**
   * このオブジェクトの線速度を設定します。
   * 物理演算系のモードでのみ有効です。
   * @param x x 成分
   * @param y y 成分
   * @param z z 成分
   */
  setLinearVelocity(x: number, y: number, z: number): void;
  setLinearVelocity(xOrV: number | Vec3, y?: number, z?: number) {
    if (typeof xOrV === "number") {
      tmp.v0.set(xOrV, y!, z!);
    } else {
      tmp.v0.set(xOrV);
    }
    this.transformer.setLinearVelocity(tmp.v0);
  }
  /**
   * このオブジェクトの線速度を返します。
   * 物理演算系のモードでのみ有効な値が返ります。
   * @param v 値を書き込む `Vec3`（省略時は新しい `Vec3` を返します）
   * @returns 線速度
   */
  getLinearVelocity(v?: Vec3): Vec3 {
    return this.transformer.getLinearVelocity(v);
  }

  /**
   * このオブジェクトの角速度を設定します（単位：ラジアン/秒）。
   * 物理演算系のモードでのみ有効です。
   * @param v 設定する角速度
   */
  setAngularVelocity(v: Vec3): void;
  /**
   * このオブジェクトの角速度を設定します（単位：ラジアン/秒）。
   * 物理演算系のモードでのみ有効です。
   * @param x x 成分
   * @param y y 成分
   * @param z z 成分
   */
  setAngularVelocity(x: number, y: number, z: number): void;
  setAngularVelocity(xOrV: number | Vec3, y?: number, z?: number) {
    if (typeof xOrV === "number") {
      tmp.v0.set(xOrV, y!, z!);
    } else {
      tmp.v0.set(xOrV);
    }
    this.transformer.setAngularVelocity(tmp.v0);
  }
  /**
   * このオブジェクトの角速度を返します（単位：ラジアン/秒）。
   * 物理演算系のモードでのみ有効な値が返ります。
   * @param v 値を書き込む `Vec3`（省略時は新しい `Vec3` を返します）
   * @returns 角速度
   */
  getAngularVelocity(v?: Vec3): Vec3 {
    return this.transformer.getAngularVelocity(v);
  }

  /**
   * このオブジェクトに加えられている力をリセットします。
   * 物理演算系のモードでのみ有効です。
   */
  resetForce(): void {
    this.transformer.resetForce();
  }
  /**
   * このオブジェクトに力を加えます。
   * 物理演算系のモードでのみ有効です。
   * @param v 加える力
   */
  addForce(v: Vec3): void;
  /**
   * このオブジェクトに力を加えます。
   * 物理演算系のモードでのみ有効です。
   * @param x x 成分
   * @param y y 成分
   * @param z z 成分
   */
  addForce(x: number, y: number, z: number): void;
  addForce(xOrV: number | Vec3, y?: number, z?: number) {
    if (typeof xOrV === "number") {
      tmp.v0.set(xOrV, y!, z!);
    } else {
      tmp.v0.set(xOrV);
    }
    this.transformer.addForce(tmp.v0);
  }

  /**
   * 力点を指定してこのオブジェクトに力を加えます。力点はワールド座標で指定します。
   * 物理演算系のモードでのみ有効です。
   * @param f 力（または力の x 成分）
   * @param p 力点（または力の y 成分）
   */
  addForceAtPoint(f: Vec3, p: Vec3): void;
  addForceAtPoint(fx: number, fy: number, fz: number, px: number, py: number, pz: number): void;
  addForceAtPoint(fOrFx: Vec3 | number, pOrFy: Vec3 | number, fz?: number, px?: number, py?: number, pz?: number): void {
    if (typeof fOrFx === "number") {
      if (typeof pOrFy === "number") {
        tmp.v0.set(fOrFx,pOrFy,fz!);
        tmp.v1.set(px!,py!,pz!);
      } else {
        console.warn('ObjectA3.addForceAtPoint(): type of arguments mismatch.');
        return;
      }
    } else {
      if (typeof pOrFy === "number") {
        console.warn('ObjectA3.addForceAtPoint(): type of arguments mismatch.');
        return;
      } else {
        tmp.v0.set(fOrFx);
        tmp.v1.set(pOrFy);
      }
    }
    this.transformer.addForceAtPoint(tmp.v0,tmp.v1);
  }

  /**
   * このオブジェクトに加えられているトルクをリセットします。
   * 物理演算系のモードでのみ有効です。
   */
  resetTorque(): void {
    this.transformer.resetTorque();
  }
  /**
   * このオブジェクトにトルク（回転力）を加えます。
   * 物理演算系のモードでのみ有効です。
   * @param v 加えるトルク
   */
  addTorque(v: Vec3): void;
  /**
   * このオブジェクトにトルク（回転力）を加えます。
   * 物理演算系のモードでのみ有効です。
   * @param x x 成分
   * @param y y 成分
   * @param z z 成分
   */
  addTorque(x: number, y: number, z: number): void;
  addTorque(xOrV: number | Vec3, y?: number, z?: number) {
    if (typeof xOrV === "number") {
      tmp.v0.set(xOrV, y!, z!);
    } else {
      tmp.v0.set(xOrV);
    }
    this.transformer.addTorque(tmp.v0);
  }

  /**
   * このオブジェクトにインパルス（瞬間的な力）を加えます。
   * 物理演算系のモードでのみ有効です。
   * @param v 加えるインパルス
   */
  applyImpulse(v: Vec3): void;
  /**
   * このオブジェクトにインパルス（瞬間的な力）を加えます。
   * 物理演算系のモードでのみ有効です。
   * @param x x 成分
   * @param y y 成分
   * @param z z 成分
   */
  applyImpulse(x: number, y: number, z: number): void;
  applyImpulse(xOrV: number | Vec3, y?: number, z?: number) {
    if (typeof xOrV === "number") {
      tmp.v0.set(xOrV, y!, z!);
    } else {
      tmp.v0.set(xOrV);
    }
    this.transformer.applyImpulse(tmp.v0);
  }

  /**
   * 力点を指定してこのオブジェクトにインパルスを加えます。力点はワールド座標で指定します。
   * 物理演算系のモードでのみ有効です。
   * @param i インパルス（または x 成分）
   * @param p 力点（または y 成分）
   */
  applyImpulseAtPoint(i: Vec3, p: Vec3): void;
  applyImpulseAtPoint(ix: number, iy: number, iz: number, px: number, py: number, pz: number): void;
  applyImpulseAtPoint(iOrFx: Vec3 | number, pOrFy: Vec3 | number, iz?: number, px?: number, py?: number, pz?: number): void {
    if (typeof iOrFx === "number") {
      if (typeof pOrFy === "number") {
        tmp.v0.set(iOrFx,pOrFy,iz!);
        tmp.v1.set(px!,py!,pz!);
      } else {
        console.warn('ObjectA3.addForceAtPoint(): type of arguments mismatch.');
        return;
      }
    } else {
      if (typeof pOrFy === "number") {
        console.warn('ObjectA3.addForceAtPoint(): type of arguments mismatch.');
        return;
      } else {
        tmp.v0.set(iOrFx);
        tmp.v1.set(pOrFy);
      }
    }
    this.transformer.applyImpulseAtPoint(tmp.v0,tmp.v1);
  }

  /**
   * このオブジェクトにトルクインパルス（瞬間的なトルク）を加えます。
   * 物理演算系のモードでのみ有効です。
   * @param v 加えるトルクインパルス
   */
  applyTorqueImpulse(v: Vec3): void;
  /**
   * このオブジェクトにトルクインパルス（瞬間的なトルク）を加えます。
   * 物理演算系のモードでのみ有効です。
   * @param x x 成分
   * @param y y 成分
   * @param z z 成分
   */
  applyTorqueImpulse(x: number, y: number, z: number): void;
  applyTorqueImpulse(xOrV: number | Vec3, y?: number, z?: number) {
    if (typeof xOrV === "number") {
      tmp.v0.set(xOrV, y!, z!);
    } else {
      tmp.v0.set(xOrV);
    }
    this.transformer.applyTorqueImpulse(tmp.v0);
  }

  addOneselfToPhysics(world: PhysicsWorld): void {
    this.transformer.addOneselfToPhysics(world);
  }

  removeOneselfFromPhysics(world: PhysicsWorld): void {
    this.transformer.removeOneselfFromPhysics(world);
  }

  /**
   * このオブジェクトが地面に接地しているかどうかを返します。
   * `"KinematicCharacter"` や `"DynamicCharacter"` モードでは
   * 他のオブジェクトとの衝突を考慮した正確な判定を行います。
   * それ以外のモードでは、Y 座標が 0 以下のとき接地していると判定します。
   * @returns 接地しているとき `true`
   */
  isGrounded(): boolean {
    return this.transformer.isGrounded();
  }
}

/*
 * 吹き出しの情報。必要な時だけObjectA3に
 * 吹き出しの情報を入れるために使用。
 */
class BalloonInfo {
  message: string;
  dir: Dir;
  offsetTop:    {x: number, y: number};
  offsetRight:  {x: number, y: number};
  offsetLeft:   {x: number, y: number};
  offsetBottom: {x: number, y: number};

  constructor(message: string) {
    this.message = message;
    this.dir = "RIGHT";
    this.offsetTop = {x:0,y:2};
    this.offsetRight = {x:1,y:1};
    this.offsetLeft = {x:-1,y:1};
    this.offsetBottom = {x:0,y:0};
  }
}


/**
 * `ObjectA3` の位置・回転・拡大率を制御するストラテジーインターフェースです。
 *
 * `ObjectA3` は常に 1 つの `Transformer` を持ち、毎フレーム `update()` が呼ばれます。
 * `Transformer` が `ObjectA3` の位置・回転・拡大率の正式な情報を管理しており、
 * `THREE.Object3D` の `position` / `quaternion` / `scale` は表示用として書き込まれます。
 *
 * `setPosition()` などの要求メソッドは、実装によって即座に反映しないことがあります
 * （`SmoothTransformer` はなめらかに補間し、物理系 Transformer は物理演算を優先します）。
 * `Now` 付きのメソッド（`setPositionNow()` など）は可能な限り即座に反映しなければなりません。
 *
 * 独自の Transformer を実装することで、`DefaultTransformer`・`BillboardTransformer`・
 * `DynamicCharacterTransformer` などと同様のカスタム制御が可能です。
 */
export interface Transformer {
  /**
   * このTransformerが管理する位置・回転・拡大率。
   * `update()` の後、常に最新の状態が反映されていなければなりません。
   */
  transform: Transform;

  /**
   * このTransformerの初期化処理です。
   * `ObjectA3` に登録される際に呼び出されます。
   * 初期位置・回転・拡大率は `trans` から取得してください。
   * @param trans 引き継ぐ位置・回転・拡大率
   * @param objectA3 制御対象の `ObjectA3`
   */
  init(trans: Transform, objectA3: ObjectA3): void;

  /**
   * 物理エンジンに剛体やコライダーを登録する処理です。
   * 物理演算が不要な Transformer は何もしない実装で構いません。
   * @param world 登録先の物理ワールド
   */
  addOneselfToPhysics(world: PhysicsWorld): void;

  /**
   * 物理エンジンから剛体やコライダーを登録解除する処理です。
   * 物理演算が不要な Transformer は何もしない実装で構いません。
   * @param world 解除対象の物理ワールド
   */
  removeOneselfFromPhysics(world: PhysicsWorld): void;

  /**
   * このオブジェクトが地面に接地しているかどうかを返します。
   * キャラクター系 Transformer 以外では `this.transform.loc.y <= 0` で判定して構いません。
   * @returns 接地しているとき `true`
   */
  isGrounded(): boolean;

  /**
   * 目標位置を設定します。次の `update()` 以降に反映されます。
   * @param loc 目標位置
   */
  setPosition(loc: Vec3): void;

  /**
   * 位置を即座に設定します。
   * @param loc 目標位置
   */
  setPositionNow(loc: Vec3): void;

  /**
   * 目標回転をクォータニオンで設定します。次の `update()` 以降に反映されます。
   * @param quat 目標回転
   */
  setQuat(quat: Quat): void;

  /**
   * 回転をクォータニオンで即座に設定します。
   * @param quat 目標回転
   */
  setQuatNow(quat: Quat): void;

  /**
   * 目標拡大率を設定します。次の `update()` 以降に反映されます。
   * @param scale 目標拡大率
   */
  setScale(scale: Vec3): void;

  /**
   * 拡大率を即座に設定します。
   * @param scale 目標拡大率
   */
  setScaleNow(scale: Vec3): void;

  /**
   * 線速度を設定します。物理系の Transformer のみ実装が必要です。
   * @param vel 線速度
   */
  setLinearVelocity(vel: Vec3): void;

  /**
   * 線速度を返します。物理系の Transformer のみ有効な値を返します。
   * @param v 書き込み先の `Vec3`（省略可）
   * @returns 線速度
   */
  getLinearVelocity(v?: Vec3): Vec3;

  /**
   * 角速度を設定します（単位：ラジアン/秒）。物理系の Transformer のみ実装が必要です。
   * @param angvel 角速度
   */
  setAngularVelocity(angvel: Vec3): void;

  /**
   * 角速度を返します（単位：ラジアン/秒）。物理系の Transformer のみ有効な値を返します。
   * @param v 書き込み先の `Vec3`（省略可）
   * @returns 角速度
   */
  getAngularVelocity(v?: Vec3): Vec3;

  /**
   * 加えられている力をリセットします。物理系の Transformer のみ実装が必要です。
   */
  resetForce(): void;

  /**
   * 力を加えます。物理系の Transformer のみ実装が必要です。
   * @param f 力
   */
  addForce(f: Vec3): void;

  /**
   * 力点を指定して力を加えます（力点はワールド座標）。物理系の Transformer のみ実装が必要です。
   * @param f 力
   * @param p 力点（ワールド座標）
   */
  addForceAtPoint(f: Vec3, p: Vec3): void;

  /**
   * 加えられているトルクをリセットします。物理系の Transformer のみ実装が必要です。
   */
  resetTorque(): void;

  /**
   * トルク（回転力）を加えます。物理系の Transformer のみ実装が必要です。
   * @param t トルク
   */
  addTorque(t: Vec3): void;

  /**
   * インパルス（瞬間的な力）を加えます。物理系の Transformer のみ実装が必要です。
   * @param i インパルス
   */
  applyImpulse(i: Vec3): void;

  /**
   * 力点を指定してインパルスを加えます（力点はワールド座標）。物理系の Transformer のみ実装が必要です。
   * @param i インパルス
   * @param p 力点（ワールド座標）
   */
  applyImpulseAtPoint(i: Vec3, p: Vec3): void;

  /**
   * トルクインパルス（瞬間的なトルク）を加えます。物理系の Transformer のみ実装が必要です。
   * @param ti トルクインパルス
   */
  applyTorqueImpulse(ti: Vec3): void;

  /**
   * 毎フレーム呼び出され、位置・回転・拡大率を更新します。
   * 更新後の状態は必ず `this.transform` に反映してください。
   * @param dt 経過時間（秒）
   */
  update(dt: number): void;
}
