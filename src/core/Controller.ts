import { ObjectA3 } from './ObjectA3';
import type { View } from './View';
import { Vec3, Quat, Transform, getLookAtQuaternion, eulerToQuaternion } from './LinearMath';
import { tmp } from '../utils/math';

/**
 * キーやマウスなどの様々なイベントを受け取り
 * ナビゲーションなどを行うコントローラのインターフェース。
 *
 * a3.Windowやa3.Canvasなどのa3.Viewにセットして使う。
 * a3.Viewの方で発生した色々なイベントを受け取ることが
 * 可能でそれに応答して様々な処理を行わせるための基盤。
 *
 * このControllerインタフェースのupdate()以外の
 * メソッドでは基本的に外部(this.view.cameraとか
 * this.view.sceneとか)に影響を及ぼす処理は
 * 書かないようにしてください。つまり、キーイベントや
 * マウスイベントをキャッチした時は、その情報を
 * メンバ変数などに保存しておき、update()が呼ばれたら
 * 保存しておいた情報をもとにして外部に影響を及ぼす
 * プログラムを書くようにして下さい。
 */
export interface Controller {
  view?: View;
  setView(view: View): void;
  update(dt: number): void;
  activate(): void;
  deactivate(): void;
  keyDown(event: KeyboardEvent): void;
  keyUp(event: KeyboardEvent): void;
  keyPress(event: KeyboardEvent): void;
  mouseDown(event: MouseEvent): void;
  mouseUp(event: MouseEvent): void;
  mouseMove(event: MouseEvent): void;
  mouseClick(event: MouseEvent): void;
  mouseEnter(event: MouseEvent): void;
  mouseLeave(event: MouseEvent): void;
  mouseWheel(event: WheelEvent): void;
  touchStart(event: TouchEvent): void;
  touchEnd(event: TouchEvent): void;
  touchMove(event: TouchEvent): void;
  touchCancel(event: TouchEvent): void;
}

/**
  * ほとんど何もしないController。不要なメソッドを
  * 実装しなくて良いように、これを継承して実用的な
  * Controllerを作ると良い。
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
  * Three.jsのOrbitControlsと同様の処理をしてくれるコントローラ。
  * Ctrlキーを押してマウスドラッグすると、平行移動も可能。
  */
export class OrbitController extends BaseController {
  lastMousePosition: {x:number,y:number};
  dx: number = 0;
  dy: number = 0;
  isLeftDown: boolean = false;
  isRightDown: boolean = false;
  ctrlKey: boolean = false;
  deltaY: number = 0; // マウスホイールの値
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
    const cameraLoc = this.view.camera.position;
    const cameraQuat = this.view.camera.quat;

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
      const newCameraQuat = getLookAtQuaternion(cameraLoc,this.target,new Vec3(0,1,0));
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

export interface AvatarPositionControllerOptions {
  speed: number;
  angSpeed: number;
}

export const defaultAvatarPositionControllerOptions: AvatarPositionControllerOptions = {
  speed: 0.1,
  angSpeed: 0.01
};

/**
  * コンストラクタで指定されているアバターをキーボードで
  * コントロールするコントローラ。こちらはRAPIERのCharacter
  * controllerとavatar.transformer.setPosition()でコントロールする方。
  * 地面判定が性格で安定性が高いけれど、まわりのRigidBodyから
  * 押されたり押したりできない。
  *
  * RigidBodyとavatar.transformer.setLinearVelocity()でコントロールする方は
  * AvatarVelocityController。
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
      this._avatarNextQuat.mul(eulerToQuaternion(tmp.v0, 'ZXY', tmp.q0));
    }
    if (this._keyRight) {
      tmp.v0.set(0, -this.options.angSpeed, 0);
      this._avatarNextQuat.mul(eulerToQuaternion(tmp.v0, 'ZXY', tmp.q0));
    }
    avatar.setPosition(this._avatarNextLoc);
    avatar.setQuat(this._avatarNextQuat);
  }
}

export interface AvatarVelocityControllerOptions {
  speed: number;
  angSpeed: number;
  jumpSpeed: number;
}

export const defaultAvatarVelocityControllerOptions: AvatarVelocityControllerOptions = {
  speed: 5.0,
  angSpeed: 0.3,
  jumpSpeed: 15.0
};

/**
  * コンストラクタで指定されているアバターをキーボードで
  * コントロールするコントローラ。こちらはRigidBodyと
  * avatar.transformer.setLinearVelocity()でコントロールする方。
  * 地面判定が不正確だけど、まわりのRigidBodyから押されたり、
  * 押したりできる。
  *
  * RAPIERのCharacter controllerとavatar.transformer.setPosition()で
  * コントロールする方はAvatarPositionController。
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
