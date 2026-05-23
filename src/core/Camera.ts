import * as THREE from 'three';
import { ObjectA3 } from './ObjectA3';
import type { View } from './View';
import { Vec3, getLookAtQuaternion } from './LinearMath';

/**
 * a3js のカメラの基底となる抽象クラスです。
 *
 * a3js のカメラはデフォルトでヘッドライト（スポットライト）を持っており、
 * カメラと一緒に移動します。
 *
 * 通常は `ThreeCamera` をインスタンス化して使用します。
 * `Canvas` や `Window` は生成時にデフォルトカメラを自動的に作成します。
 */
export abstract class Camera extends ObjectA3 {
  /** このカメラが属する `View`。`View.camera` として設定されるまでは `undefined` です。 */
  view?: View;

  /**
   * このカメラを指定した `View` に関連付けます。通常は自動的に呼ばれます。
   * @param view 関連付ける `View`
   */
  setView(view: View) {
    this.view = view;
  }

  /**
   * 3D 音声（ポジショナルオーディオ）のリスナーをカメラに取り付けます。
   * リスナーをカメラに取り付けることで、カメラ位置を基準に音の方向・距離が計算されます。
   * @param listener Three.js の `THREE.AudioListener`
   */
  abstract setAudioListener(listener: THREE.AudioListener): void;

  /**
   * ワールド座標を正規化デバイス座標（NDC: -1 〜 1 の範囲）に変換します。
   * 画面上の位置計算に使用します。
   * @param loc ワールド座標
   * @returns 正規化デバイス座標 `{ x, y }` （中央が `0,0`、右上が `1,1`）
   */
  abstract calcNDC(loc: Vec3): {x: number, y: number};

  /**
   * カメラのヘッドライトの有効・無効を切り替えます。
   * @param b `true` で有効、`false` で無効
   */
  abstract setHeadLightEnable(b: boolean): void;

  /**
   * カメラが指定した位置の方を向くように回転します。
   *
   * @remarks
   * 通常の `ObjectA3.lookAt()` と異なり、カメラは Z 軸の**負**方向が正面になるため、
   * 内部で 180° 補正されています。
   *
   * @param v 向く先の位置
   */
  lookAt(v: Vec3): void;
  /**
   * カメラが指定したオブジェクトの方を向くように回転します。
   *
   * @remarks
   * 通常の `ObjectA3.lookAt()` と異なり、カメラは Z 軸の**負**方向が正面になるため、
   * 内部で 180° 補正されています。
   *
   * @param o 向く先のオブジェクト
   */
  lookAt(o: ObjectA3): void;
  /**
   * カメラが指定した座標の方を向くように回転します。
   *
   * @remarks
   * 通常の `ObjectA3.lookAt()` と異なり、カメラは Z 軸の**負**方向が正面になるため、
   * 内部で 180° 補正されています。
   *
   * @param x 向く先の x 座標
   * @param y 向く先の y 座標
   * @param z 向く先の z 座標
   */
  lookAt(x: number, y: number, z: number): void;
  lookAt(xVO: number | Vec3 | ObjectA3, y?: number, z?: number) {
    const target = new Vec3();
    if (typeof xVO === "number") {
      target.set(xVO,y!,z!);
    } else if (xVO instanceof ObjectA3) {
      xVO.getPosition(target);
    } else {
      target.set(xVO);
    }
    const up = this.upVector ? this.upVector : ObjectA3.defaultUpVector;
    const newQuat = getLookAtQuaternion(this.getPosition(),target,up);
    newQuat.mul(up.x,up.y,up.z,0); // up軸まわりで180度回転！
    this.setQuat(newQuat);
  }

  /**
   * カメラが指定した位置の方を即座に向くように回転します。
   *
   * @remarks
   * 通常の `ObjectA3.lookAtNow()` と異なり、カメラは Z 軸の**負**方向が正面になるため、
   * 内部で 180° 補正されています。
   *
   * @param v 向く先の位置
   */
  lookAtNow(v: Vec3): void;
  /**
   * カメラが指定したオブジェクトの方を即座に向くように回転します。
   *
   * @remarks
   * 通常の `ObjectA3.lookAtNow()` と異なり、カメラは Z 軸の**負**方向が正面になるため、
   * 内部で 180° 補正されています。
   *
   * @param o 向く先のオブジェクト
   */
  lookAtNow(o: ObjectA3): void;
  /**
   * カメラが指定した座標の方を即座に向くように回転します。
   *
   * @remarks
   * 通常の `ObjectA3.lookAtNow()` と異なり、カメラは Z 軸の**負**方向が正面になるため、
   * 内部で 180° 補正されています。
   *
   * @param x 向く先の x 座標
   * @param y 向く先の y 座標
   * @param z 向く先の z 座標
   */
  lookAtNow(x: number, y: number, z: number): void;
  lookAtNow(xVO: number | Vec3 | ObjectA3, y?: number, z?: number) {
    const target = new Vec3();
    if (typeof xVO === "number") {
      target.set(xVO,y!,z!);
    } else if (xVO instanceof ObjectA3) {
      xVO.getPosition(target);
    } else {
      target.set(xVO);
    }
    const up = this.upVector ? this.upVector : ObjectA3.defaultUpVector;
    const newQuat = getLookAtQuaternion(this.getPosition(),target,up);
    newQuat.mul(up.x,up.y,up.z,0); // up軸まわりで180度回転！
    this.setQuatNow(newQuat);
  }
}
