import { ObjectA3 } from './ObjectA3';
import type { View } from './View';
import { Vec3, Quat, Transform, getLookAtQuat, eulerToQuat } from './LinearMath';
import { tmp } from '../utils/math';

/**
 * キーボードやマウスなどの入力を受け取り、カメラやオブジェクトを操作するコントローラのインターフェースです。
 *
 * `Canvas`・`Window`・`GameCanvas` などの `View` に `setController()` でセットして使います。
 * `View` 側でキーやマウスのイベントが発生すると、このインターフェースの各メソッドが自動的に呼び出されます。
 *
 * 独自のコントローラを作る場合は `BaseController` を継承し、
 * 必要なメソッドだけオーバーライドしてください。
 */
export interface Controller {
  /** このコントローラが操作する `View`。`setView()` で設定されます。 */
  view?: View;
  /**
   * このコントローラを操作する `View` を設定します。
   * @param view 関連付ける `View`
   */
  setView(view: View): void;
  /**
   * 毎フレーム呼び出されます。ここでカメラやオブジェクトへの実際の操作を行います。
   * @param dt 前フレームからの経過時間（秒）
   */
  update(dt: number): void;
  /** このコントローラを有効化します。 */
  activate(): void;
  /** このコントローラを無効化します。 */
  deactivate(): void;
  /** キーが押されたときに呼び出されます。 */
  keyDown(event: KeyboardEvent): void;
  /** キーが離されたときに呼び出されます。 */
  keyUp(event: KeyboardEvent): void;
  /** キーが押されたときに呼び出されます（文字入力向け）。 */
  keyPress(event: KeyboardEvent): void;
  /** マウスボタンが押されたときに呼び出されます。 */
  mouseDown(event: MouseEvent): void;
  /** マウスボタンが離されたときに呼び出されます。 */
  mouseUp(event: MouseEvent): void;
  /** マウスが移動したときに呼び出されます。 */
  mouseMove(event: MouseEvent): void;
  /** マウスがクリックされたときに呼び出されます。 */
  mouseClick(event: MouseEvent): void;
  /** マウスが要素に入ったときに呼び出されます。 */
  mouseEnter(event: MouseEvent): void;
  /** マウスが要素から出たときに呼び出されます。 */
  mouseLeave(event: MouseEvent): void;
  /** マウスホイールが操作されたときに呼び出されます。 */
  mouseWheel(event: WheelEvent): void;
  /** タッチ開始時に呼び出されます。 */
  touchStart(event: TouchEvent): void;
  /** タッチ終了時に呼び出されます。 */
  touchEnd(event: TouchEvent): void;
  /** タッチ移動時に呼び出されます。 */
  touchMove(event: TouchEvent): void;
  /** タッチがキャンセルされたときに呼び出されます。 */
  touchCancel(event: TouchEvent): void;
}

/**
 * `Controller` インターフェースのデフォルト実装です。すべてのメソッドが空実装になっています。
 * 独自のコントローラを作る場合は、このクラスを継承して必要なメソッドだけオーバーライドしてください。
 */
export class BaseController implements Controller {
  view?: View;

  setView(view: View) { this.view = view; }
  update(_dt: number): void {}
  activate(): void {}
  deactivate(): void {}
  keyDown(_event: KeyboardEvent): void {}
  keyUp(_event: KeyboardEvent): void {}
  keyPress(_event: KeyboardEvent): void {}
  mouseDown(_event: MouseEvent): void {}
  mouseUp(_event: MouseEvent): void {}
  mouseMove(_event: MouseEvent): void {}
  mouseClick(_event: MouseEvent): void {}
  mouseEnter(_event: MouseEvent): void {}
  mouseLeave(_event: MouseEvent): void {}
  mouseWheel(_event: WheelEvent): void {}
  touchStart(_event: TouchEvent): void {}
  touchEnd(_event: TouchEvent): void {}
  touchMove(_event: TouchEvent): void {}
  touchCancel(_event: TouchEvent): void {}
}

/**
 * Three.js の OrbitControls と同様の操作ができるコントローラです。
 * デフォルトで `Canvas`・`Window`・`GameCanvas` に設定されています。
 *
 * - **左ドラッグ**: 指定した注視点を中心にカメラを回転させます。
 * - **左ドラッグ + Ctrl キー**: カメラを平行移動させます。
 * - **マウスホイール**: カメラを前後にズームします。
 *
 * @example
 * ```ts
 * // 注視点を (0, 1, 0) に設定して OrbitController を使用する
 * view.setController(new OrbitController(0, 1, 0));
 * ```
 */
export class OrbitController extends BaseController {
  /** 前フレームのマウス位置。 */
  lastMousePosition: {x:number,y:number};
  /** 今フレームのマウスの x 方向の移動量。 */
  dx: number = 0;
  /** 今フレームのマウスの y 方向の移動量。 */
  dy: number = 0;
  /** 左マウスボタンが押されているか。 */
  isLeftDown: boolean = false;
  /** 右マウスボタンが押されているか。 */
  isRightDown: boolean = false;
  /** Ctrl キーが押されているか。 */
  ctrlKey: boolean = false;
  /** マウスホイールの移動量。 */
  deltaY: number = 0;
  /** カメラが注視する対象の位置（ワールド座標）。 */
  target: Vec3;

  constructor(target: Vec3);
  constructor(tx: number, ty: number, tz: number);
  constructor(xOrV: number | Vec3, y?: number, z?: number) {
    super();
    this.lastMousePosition = {x:0,y:0};
    if (typeof xOrV === "number") {
      this.target = new Vec3(xOrV,y!,z!);
    } else {
      this.target = new Vec3(xOrV);
    }
  }

  update(_dt: number): void {
    if (!this.view) return;
    const cameraLoc = this.view.camera.getPosition();
    const cameraQuat = this.view.camera.getQuat();

    if (this.isLeftDown && !this.ctrlKey) {
      const epsilon = 0.01;
      const sinX = Math.sin(-this.dx*epsilon); const cosX = Math.cos(-this.dx*epsilon);
      const sinY = Math.sin(-this.dy*epsilon); const cosY = Math.cos(-this.dy*epsilon);
      const vecX = new Vec3(1,0,0).apply(cameraQuat);
      const vecY = new Vec3(0,1,0).apply(cameraQuat);
      const quatX = new Quat(vecX.x*sinY,vecX.y*sinY,vecX.z*sinY,cosY);
      const quatY = new Quat(vecY.x*sinX,vecY.y*sinX,vecY.z*sinX,cosX);
      const newCameraLoc = new Vec3(cameraLoc);
      newCameraLoc.sub(this.target);
      newCameraLoc.apply(quatX);
      newCameraLoc.apply(quatY);
      newCameraLoc.add(this.target);
      cameraLoc.set(newCameraLoc);
      const newCameraQuat = getLookAtQuat(cameraLoc,this.target,new Vec3(0,1,0));
      newCameraQuat.mul(new Quat(0,1,0,0)); // カメラは-Zが前なのでY軸まわりに180度回転！
      cameraQuat.set(newCameraQuat);
    } else if (this.isLeftDown) {
      tmp.v0.set(this.target);
      tmp.v0.sub(cameraLoc);
      const dist = tmp.v0.length();
      const epsilon = 0.005*dist;
      const left = new Vec3(1,0,0).apply(cameraQuat).scale(-this.dx*epsilon);
      const up = new Vec3(0,1,0).apply(cameraQuat).scale(this.dy*epsilon);
      cameraLoc.add(left);
      cameraLoc.add(up);
      this.target.add(left);
      this.target.add(up);
    }

    if (this.deltaY !== 0) {
      const f = new Vec3(this.target).sub(cameraLoc)
      if (this.deltaY > 0)
        f.scale(0.05);
      else if (this.deltaY < 0)
        f.scale(-0.05);
      cameraLoc.add(f);
    }

    this.view.camera.setPosition(cameraLoc);
    this.view.camera.setQuat(cameraQuat);

    this.dx = 0;
    this.dy = 0;
    this.deltaY = 0;
  }

  mouseDown(e: MouseEvent): void {
    if (e.button === 0) {
      this.isLeftDown = true;
      this.lastMousePosition.x = e.clientX;
      this.lastMousePosition.y = e.clientY;
    } else if (e.button === 2) {
      this.isRightDown = true;
      this.lastMousePosition.x = e.clientX;
      this.lastMousePosition.y = e.clientY;
    }
  }
  mouseMove(e: MouseEvent): void {
    this.dx += e.clientX - this.lastMousePosition.x;
    this.dy += e.clientY - this.lastMousePosition.y;
    this.ctrlKey = e.ctrlKey;
    this.lastMousePosition.x = e.clientX;
    this.lastMousePosition.y = e.clientY;
  }
  mouseUp(e: MouseEvent): void {
    if (e.button === 0) {
      this.isLeftDown = false;
    } else if (e.button === 2) {
      this.isRightDown = false;
    }
  }
  mouseWheel(e: WheelEvent): void {
    this.deltaY = e.deltaY;
  }
/*
  touchStart(e: TouchEvent): void {
console.log(`GAHA: touchStart()`,event);
    const loc = new Vec3(this.view.camera.location);
    loc.add(new Vec3(0.1,0,0));
    this.view.camera.setPosition(loc);
  }
*/
}

/**
 * `AvatarPositionController` の設定オプションです。
 */
export interface AvatarPositionControllerOptions {
  /** 移動速度（1フレームあたりの移動距離）。デフォルトは `0.1`。 */
  speed: number;
  /** 回転速度（1フレームあたりのラジアン）。デフォルトは `0.01`。 */
  angSpeed: number;
}

/** `AvatarPositionControllerOptions` のデフォルト値。 */
export const defaultAvatarPositionControllerOptions: AvatarPositionControllerOptions = {
  speed: 0.1,
  angSpeed: 0.01
};

/**
 * キーボードでアバターを操作するコントローラです。
 * `setPosition()` で位置を指定する方式のため、接地判定が正確で安定しています。
 *
 * - **W/A/S/D**: 前後左右に移動します。
 * - **←→ 矢印キー**: 左右に回転します。
 * - **Space**: ジャンプします。
 *
 * @remarks
 * `"KinematicCharacter"` または `"DynamicCharacter"` モードのアバターと組み合わせて使います。
 * 周囲の剛体から押されたり押したりする相互作用が必要な場合は `AvatarVelocityController` を使ってください。
 */
export class AvatarPositionController extends BaseController {
  options: AvatarPositionControllerOptions;
  private _avatar: ObjectA3;
  private _keyW: boolean;
  private _keyA: boolean;
  private _keyS: boolean;
  private _keyD: boolean;
  private _keyLeft: boolean;
  private _keyRight: boolean;
  private _keySpace: boolean;
  private _avatarNextLoc: Vec3;
  private _avatarNextQuat: Quat;
  private _velY: number;

  constructor(avatar: ObjectA3, options: Partial<AvatarPositionControllerOptions>) {
    super();
    this.options = {
      ...defaultAvatarPositionControllerOptions,
      ...options
    };
    this._avatar = avatar;
    this._keyW = this._keyA = this._keyS = this._keyD = false;
    this._keyLeft = this._keyRight = false;
    this._keySpace = false;
    this._avatarNextLoc = new Vec3();
    this._avatarNextQuat = new Quat();
    this._velY = 0.0;
  }

  keyDown(event: KeyboardEvent): void {
    if (event.code === 'KeyW') this._keyW = true;
    else if (event.code === 'KeyA') this._keyA = true;
    else if (event.code === 'KeyS') this._keyS = true;
    else if (event.code === 'KeyD') this._keyD = true;
    else if (event.code === 'ArrowLeft') this._keyLeft = true;
    else if (event.code === 'ArrowRight') this._keyRight = true;
    else if (event.code === 'Space') this._keySpace = true;
  }

  keyUp(event: KeyboardEvent): void {
    if (event.code === 'KeyW') this._keyW = false;
    else if (event.code === 'KeyA') this._keyA = false;
    else if (event.code === 'KeyS') this._keyS = false;
    else if (event.code === 'KeyD') this._keyD = false;
    else if (event.code === 'ArrowLeft') this._keyLeft = false;
    else if (event.code === 'ArrowRight') this._keyRight = false;
    else if (event.code === 'Space') this._keySpace = false;
  }

  update(dt: number): void {
    const avatar = this._avatar;
    const aTrans = new Transform();
    aTrans.set(avatar);
    const forward = avatar.getUnitVecZ().scale(this.options.speed);
    const left = avatar.getUnitVecX().scale(this.options.speed);

    this._avatarNextLoc.set(aTrans.loc);
    this._avatarNextQuat.set(aTrans.quat);
    if (this._keyW) this._avatarNextLoc.add(forward);
    if (this._keyA) this._avatarNextLoc.add(left);
    if (this._keyS) this._avatarNextLoc.sub(forward);
    if (this._keyD) this._avatarNextLoc.sub(left);

    this._velY += (-9.8*dt)*0.1;
    if (avatar.isGrounded()) {
      this._velY = 0.0;
      if (this._keySpace) this._velY = 0.5;
    }
    this._avatarNextLoc.add(0.0, this._velY, 0.0);
    if (this._keyLeft) {
      tmp.v0.set(0, this.options.angSpeed, 0);
      this._avatarNextQuat.mul(eulerToQuat(tmp.v0, 'ZXY', tmp.q0));
    }
    if (this._keyRight) {
      tmp.v0.set(0, -this.options.angSpeed, 0);
      this._avatarNextQuat.mul(eulerToQuat(tmp.v0, 'ZXY', tmp.q0));
    }
    avatar.setPosition(this._avatarNextLoc);
    avatar.setQuat(this._avatarNextQuat);
  }
}

/**
 * `AvatarVelocityController` の設定オプションです。
 */
export interface AvatarVelocityControllerOptions {
  /** 移動速度（m/秒）。デフォルトは `5.0`。 */
  speed: number;
  /** 回転速度（ラジアン/フレーム）。デフォルトは `0.3`。 */
  angSpeed: number;
  /** ジャンプ速度（m/秒）。デフォルトは `15.0`。 */
  jumpSpeed: number;
}

/** `AvatarVelocityControllerOptions` のデフォルト値。 */
export const defaultAvatarVelocityControllerOptions: AvatarVelocityControllerOptions = {
  speed: 5.0,
  angSpeed: 0.3,
  jumpSpeed: 15.0
};

/**
 * キーボードでアバターを操作するコントローラです。
 * `setLinearVelocity()` で速度を指定する方式のため、周囲の剛体と物理的に相互作用できます。
 *
 * - **W/A/S/D**: 前後左右に移動します。
 * - **←→ 矢印キー**: 左右に回転します。
 * - **Space**: ジャンプします。
 *
 * @remarks
 * `"DynamicCharacter"` モードのアバターと組み合わせて使います。
 * 接地判定が `AvatarPositionController` より不正確です。
 * より安定した接地判定が必要な場合は `AvatarPositionController` を使ってください。
 */
export class AvatarVelocityController extends BaseController {
  options: AvatarVelocityControllerOptions;
  private _avatar: ObjectA3;
  private _keyW: boolean;
  private _keyA: boolean;
  private _keyS: boolean;
  private _keyD: boolean;
  private _keyLeft: boolean;
  private _keyRight: boolean;
  private _keySpace: boolean;
  private _avatarNextVel: Vec3;
  private _avatarNextAngVel: Vec3;
  private _velY: number;

  constructor(avatar: ObjectA3, options: Partial<AvatarVelocityControllerOptions>) {
    super();
    this.options = {
      ...defaultAvatarVelocityControllerOptions,
      ...options
    };
    this._avatar = avatar;
    this._keyW = this._keyA = this._keyS = this._keyD = false;
    this._keyLeft = this._keyRight = false;
    this._keySpace = false;
    this._avatarNextVel = new Vec3();
    this._avatarNextAngVel = new Vec3();
    this._velY = 0.0;
  }

  keyDown(event: KeyboardEvent): void {
    if (event.code === 'KeyW') this._keyW = true;
    else if (event.code === 'KeyA') this._keyA = true;
    else if (event.code === 'KeyS') this._keyS = true;
    else if (event.code === 'KeyD') this._keyD = true;
    else if (event.code === 'ArrowLeft') this._keyLeft = true;
    else if (event.code === 'ArrowRight') this._keyRight = true;
    else if (event.code === 'Space') this._keySpace = true;
  }

  keyUp(event: KeyboardEvent): void {
    if (event.code === 'KeyW') this._keyW = false;
    else if (event.code === 'KeyA') this._keyA = false;
    else if (event.code === 'KeyS') this._keyS = false;
    else if (event.code === 'KeyD') this._keyD = false;
    else if (event.code === 'ArrowLeft') this._keyLeft = false;
    else if (event.code === 'ArrowRight') this._keyRight = false;
    else if (event.code === 'Space') this._keySpace = false;
  }

  update(dt: number): void {
    const avatar = this._avatar;
    const aTrans = new Transform();
    aTrans.set(avatar);
    const forward = avatar.getUnitVecZ().scale(this.options.speed);
    const left = avatar.getUnitVecX().scale(this.options.speed);

    this._avatarNextVel.set(0,0,0);
    this._avatarNextAngVel.set(0,0,0);
    if (this._keyW) this._avatarNextVel.add(forward);
    if (this._keyA) this._avatarNextVel.add(left);
    if (this._keyS) this._avatarNextVel.sub(forward);
    if (this._keyD) this._avatarNextVel.sub(left);

    this._velY += (-9.8*dt);
    if (avatar.isGrounded()) {
      this._velY = 0.0;
      if (this._keySpace) this._velY = this.options.jumpSpeed;
    }
    this._avatarNextVel.add(0,this._velY,0);

    if (this._keyLeft) this._avatarNextAngVel.add(0, this.options.angSpeed, 0);
    if (this._keyRight) this._avatarNextAngVel.add(0, -this.options.angSpeed, 0);
    avatar.setLinearVelocity(this._avatarNextVel);
    avatar.setAngularVelocity(this._avatarNextAngVel);
  }
}
