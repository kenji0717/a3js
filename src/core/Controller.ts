import type { View } from './View';
import { Vec3, Quat, Transform, getQuatOfLookAt, vec3EulerToQuat } from './LinearMath';
import { tmp } from '../utils/math';

/**
 * キーやマウスなどの様々なイベントを受け取り
 * ナビゲーションなどを行うコントローラのインターフェース。
 * 必ずコンストラクタでViewを受け取りプロパティに保存する。
 * コンストラクタで自分自身を受け取ったViewに登録する処理が
 * 必要。
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

  setCameraLocation(loc: Vec3): void;
  setCameraLocationNow(loc: Vec3): void;
  setCameraQuat(quat: Quat): void;
  setCameraQuatNow(quat: Quat): void;
  setCameraScale(scale: Vec3): void;
  setCameraScaleNow(scale: Vec3): void;
}

/**
  * まったく何もしないController。不要なメソッドを
  * 実装しなくて良いように、これを継承して実用的な
  * Controllerを作ると良い。
  */
export class ControllerBase implements Controller {
  view?: View;
  constructor() {}
  setView(view: View) { this.view = view; }
  update(dt: number): void {dt;}
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
  setCameraLocation(_loc: Vec3): void {}
  setCameraLocationNow(_loc: Vec3): void {}
  setCameraQuat(_quat: Quat): void {}
  setCameraQuatNow(_quat: Quat): void {}
  setCameraScale(_scale: Vec3): void {}
  setCameraScaleNow(_scale: Vec3): void {}
}

/**
  * とりあえず適当
  */
export class OrbitController extends ControllerBase {
  preMouse: {x:number,y:number};
  leftClick: boolean = false;
  rightClick: boolean = false;
  target: Vec3;
  cameraLoc: Vec3 = new Vec3(0,0,3);
  cameraQuat: Quat = new Quat(0,0,0,1);

  constructor(target: Vec3);
  constructor(tx: number, ty: number, tz: number);
  constructor(xOrV: number | Vec3, y?: number, z?: number) {
    super();
    this.preMouse = {x:0,y:0};
    if (typeof xOrV === "number") {
      this.target = new Vec3(xOrV,y!,z!);
    } else {
      this.target = new Vec3(xOrV);
    }
  }

  update(_dt: number): void {
    if (!this.view) return;
    this.view.camera.setLocation(this.cameraLoc);
    this.view.camera.setQuat(this.cameraQuat);
  }

  mouseDown(e: MouseEvent): void {
    if (e.button === 0) {
      this.leftClick = true;
      this.preMouse.x = e.clientX;
      this.preMouse.y = e.clientY;
    } else if (e.button === 2) {
      this.rightClick = true;
      this.preMouse.x = e.clientX;
      this.preMouse.y = e.clientY;
    }
  }
  mouseMove(e: MouseEvent): void {
    if (!this.view) return;
    if (this.leftClick) {
      const epsilon = 0.01;
      const dx = epsilon*(e.clientX - this.preMouse.x);
      const dy = epsilon*(e.clientY - this.preMouse.y);
      const sinX = Math.sin(-dx); const cosX = Math.cos(-dx);
      const sinY = Math.sin(-dy); const cosY = Math.cos(-dy);
      const vecX = new Vec3(1,0,0).apply(this.cameraQuat);
      const vecY = new Vec3(0,1,0).apply(this.cameraQuat);
      const quatX = new Quat(vecX.x*sinY,vecX.y*sinY,vecX.z*sinY,cosY);
      const quatY = new Quat(vecY.x*sinX,vecY.y*sinX,vecY.z*sinX,cosX);
      const newCameraLoc = new Vec3(this.cameraLoc);
      newCameraLoc.sub(this.target);
      newCameraLoc.apply(quatX);
      newCameraLoc.apply(quatY);
      newCameraLoc.add(this.target);
      this.cameraLoc.set(newCameraLoc);
      const newCameraQuat = getQuatOfLookAt(this.cameraLoc,this.target,new Vec3(0,1,0));
      this.cameraQuat.set(newCameraQuat);
      this.preMouse.x = e.clientX;
      this.preMouse.y = e.clientY;
    } else if (this.rightClick) {
      tmp.v0.set(this.target);
      tmp.v0.sub(this.view.camera.loc);
      const dist = tmp.v0.length();
      const epsilon = 0.005*dist;
      const dx = epsilon*(e.clientX - this.preMouse.x);
      const dy = epsilon*(e.clientY - this.preMouse.y);
      this.view.camera.moveRight(dx);
      this.view.camera.moveUp(dy);
      const left = this.view.camera.getUnitVecX();
      const up = this.view.camera.getUnitVecY();
      left.scale(-dx);
      up.scale(dy);
      this.target.add(left);
      this.target.add(up);
      this.preMouse.x = e.clientX;
      this.preMouse.y = e.clientY;
    }
  }
  mouseUp(e: MouseEvent): void {
    if (e.button === 0) {
      this.leftClick = false;
    } else if (e.button === 2) {
      this.rightClick = false;
    }
  }
  mouseWheel(e: WheelEvent): void {
    const f = new Vec3(this.target).sub(this.cameraLoc)

    if (e.deltaY > 0)
      f.scale(0.05);
    else if (e.deltaY < 0)
      f.scale(-0.05);

    this.cameraLoc.add(f);
  }
/*
  touchStart(e: TouchEvent): void {
console.log(`GAHA: touchStart()`,event);
    const loc = new Vec3(this.view.camera.location);
    loc.add(new Vec3(0.1,0,0));
    this.view.camera.setLocation(loc);
  }
*/
  setCameraLocation(loc: Vec3): void {
    this.cameraLoc.set(loc);
  }
  setCameraLocationNow(loc: Vec3): void {
    this.cameraLoc.set(loc);
  }
  //setCameraQuat(quat: Quat): void {}
  //setCameraQuatNow(quat: Quat): void {}
}


/**
  * 適当。
  */
export class FollowAvatarController extends ControllerBase {
  private _offset: Vec3;

  constructor() {
    super();
    this._offset = new Vec3(0,5,-10);
  }

  update(_dt: number): void {
    if (!this.view) return;
    if (!this.view.scene.avatar) return;
    const aTrans = new Transform();
    aTrans.set(this.view.scene.avatar);
    tmp.v0.set(this._offset);
    tmp.v0.apply(aTrans.quat);
    tmp.v0.add(aTrans.loc);
    this.view.camera.setLocationNow(tmp.v0);
    this.view.camera.lookAt(this.view.scene.avatar);
  }

  //setCameraLocation(loc: Vec3): void {}
  //setCameraLocationNow(loc: Vec3): void {}
  //setCameraQuat(quat: Quat): void {}
  //setCameraQuatNow(quat: Quat): void {}
}


/**
  * 適当。
  */
export class AvatarController extends ControllerBase {
  private _keyW: boolean;
  private _keyA: boolean;
  private _keyS: boolean;
  private _keyD: boolean;
  private _keyLeft: boolean;
  private _keyRight: boolean;
  private _keySpace: boolean;
  private _offset: Vec3;
  private _avatarNextLoc: Vec3;
  private _avatarNextQuat: Quat;
  private _velY: number;

  constructor() {
    super();
    this._keyW = this._keyA = this._keyS = this._keyD = false;
    this._keyLeft = this._keyRight = false;
    this._keySpace = false;
    this._offset = new Vec3(0,5,-10);
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
    if (!this.view) return;
    if (!this.view.scene.avatar) return;
    const avatar = this.view.scene.avatar;
    const aTrans = new Transform();
    aTrans.set(avatar);
    const forward = avatar.getUnitVecZ().scale(0.1);
    const left = avatar.getUnitVecX().scale(0.1);

    tmp.v0.set(this._offset);
    tmp.v0.apply(aTrans.quat);
    tmp.v0.add(aTrans.loc);
    this.view.camera.setLocationNow(tmp.v0);
    this.view.camera.lookAt(aTrans.loc);

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
    if (this._keyLeft) this._avatarNextQuat.mul(vec3EulerToQuat(new Vec3(0,0.01,0)));
    if (this._keyRight) this._avatarNextQuat.mul(vec3EulerToQuat(new Vec3(0,-0.01,0)));
    avatar.setLocationNow(this._avatarNextLoc);
    avatar.setQuat(this._avatarNextQuat);
  }

  //setCameraLocation(loc: Vec3): void {}
  //setCameraLocationNow(loc: Vec3): void {}
  //setCameraQuat(quat: Quat): void {}
  //setCameraQuatNow(quat: Quat): void {}
}

