import { ObjectA3 } from './ObjectA3';
import type { View } from './View';
import { Vec3, Quat, Transform, getQuatOfLookAt, vec3EulerToQuat } from './LinearMath';
import { tmp } from '../utils/math';

/**
 * キーやマウスなどの様々なイベントを受け取り
 * ナビゲーションなどを行うコントローラのインターフェース。
 * 
 * a3.Windowやa3.Canvasなどのa3.Viewにセットして使う。
 * a3.Viewの方で発生した色々なイベントを受け取ることが
 * 可能でそれに応答して様々な処理を行わせるための基盤。
 * 
 * update()メソッド内のプログラムでは様々な処理を書いて
 * 良いのだが、カメラの位置、回転、拡大縮小をする
 * 時には注意が必要。例えばカメラの位置を変更する
 * 場合はthis.view.camera.object.position.set()や
 * this.view.camera.setLocation()ではなく、
 * this.view.camera.transformer.setLocation()を
 * 
 * このControllerインタフェースのupdate()以外の
 * メソッドでは基本的に外部に影響を及ぼす処理は
 * 書かないようにしておき、update()の中で外部に
 * 影響を及ぼすプログラムを書くようにして下さい。
 * 特に、位置、回転、拡大縮小をセットするメソッド
 * (例: setCameraLoc)があるが、これはCameraの
 * インタンスのメソッド(例:camera.setLocation())
 * から呼び出される。このメソッド内ではtransformer
 * 同様に、直接カメラに操作を加えてはならず、
 * 一旦このController内の情報として要求を
 * 保存しておき、update()メソッドが呼ばれた時に、
 * this.view.camera.transformer.setLocation()など
 * で反映させる必要がある。(GAHA: もう少しわかり
 * やすい仕様に改善したいけど・・・)
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
  * ほとんど何もしないController。不要なメソッドを
  * 実装しなくて良いように、これを継承して実用的な
  * Controllerを作ると良い。ここでやっている処理は、
  * カメラの方から呼び出されるsetCameraLocation()など
  * に対して自然に応答するだけの処理。
  */
export class ControllerBase implements Controller {
  view?: View;
  trans: Transform;

  constructor() {
    this.trans = new Transform();
  }
  setView(view: View) { this.view = view; }
  update(_dt: number): void {
    if (!this.view) return;
    this.view.camera.transformer.setLocation(this.trans.loc);
    this.view.camera.transformer.setQuat(this.trans.quat);
    this.view.camera.transformer.setScale(this.trans.scale);
  }
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
  setCameraLocation(loc: Vec3): void {this.trans.loc.set(loc);}
  setCameraLocationNow(loc: Vec3): void {this.trans.loc.set(loc);}
  setCameraQuat(quat: Quat): void {this.trans.quat.set(quat);}
  setCameraQuatNow(quat: Quat): void {this.trans.quat.set(quat);}
  setCameraScale(scale: Vec3): void {this.trans.scale.set(scale);}
  setCameraScaleNow(scale: Vec3): void {this.trans.scale.set(scale);}
}

/**
  * Three.jsのOrbitControlsと同様の処理をしてくれるコントローラ。
  * Ctrl || Shift || Metaキーを押してマウスドラッグすると、
  * 平行移動も可能。
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
    this.view.camera.transformer.setLocation(this.cameraLoc);
    this.view.camera.transformer.setQuat(this.cameraQuat);
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
    if (this.leftClick && !e.ctrlKey && !e.metaKey && !e.shiftKey) {
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
      newCameraQuat.mul(new Quat(0,1,0,0)); // カメラは-Zが前なのでY軸まわりに180度回転！
      this.cameraQuat.set(newCameraQuat);
      this.preMouse.x = e.clientX;
      this.preMouse.y = e.clientY;
    } else if (this.leftClick) {
      tmp.v0.set(this.target);
      tmp.v0.sub(this.cameraLoc);
      const dist = tmp.v0.length();
      const epsilon = 0.005*dist;
      const dx = epsilon*(e.clientX - this.preMouse.x);
      const dy = epsilon*(e.clientY - this.preMouse.y);
      const left = new Vec3(1,0,0).apply(this.cameraQuat).scale(-dx);
      const up = new Vec3(0,1,0).apply(this.cameraQuat).scale(dy);
      this.cameraLoc.add(left);
      this.cameraLoc.add(up);
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
  setCameraQuat(quat: Quat): void {
    quat.normalize(); //念のため
    this.cameraQuat.normalize(); //念のため
    const qt = new Quat(this.cameraQuat);
    qt.conjugate();
    const t = new Vec3(this.target);
    t.sub(this.cameraLoc);
    t.apply(qt);
    t.add(this.cameraLoc);
    this.target.set(t);
    this.cameraQuat.set(quat);
  }
  setCameraQuatNow(quat: Quat): void {
    this.setCameraQuat(quat);
  }
}


export interface FACOption {
  offset: {x:number, y:number, z:number}
}

export const defaultFACOption: FACOption = {
  offset: {x:0, y:5, z:-10}
};

/**
  * view.sceneに設定されているアバターを追従するように
  * カメラをコントロールするコントローラ。
  */
export class FollowAvatarController extends ControllerBase {
  option: FACOption;
  private _offset: Vec3;

  constructor(option: Partial<FACOption>) {
    super();
    this.option = {
      ...defaultFACOption,
      ...option
    };
    const o = this.option.offset;
    this._offset = new Vec3(o.x, o.y, o.z);
  }

  update(_dt: number): void {
    if (!this.view) return;
    if (!this.view.scene.avatar) return;
    const aTrans = new Transform();
    aTrans.set(this.view.scene.avatar);
    tmp.v0.set(this._offset);
    tmp.v0.apply(aTrans.quat);
    tmp.v0.add(aTrans.loc);
    this.view.camera.transformer.setLocationNow(tmp.v0);
    const up = this.view.camera.upVector ? this.view.camera.upVector : ObjectA3.defaultUpVector;
    up.normalize();
    const q = getQuatOfLookAt(tmp.v0,this.view.scene.avatar.loc,up);
    q.mul(new Quat(up.x,up.y,up.z,0));
    this.view.camera.transformer.setQuat(q);
  }

  //setCameraLocation(loc: Vec3): void {}
  //setCameraLocationNow(loc: Vec3): void {}
  //setCameraQuat(quat: Quat): void {}
  //setCameraQuatNow(quat: Quat): void {}
}


export interface ACOption {
  offset: {x:number, y:number, z:number}
}

export const defaultACOption: ACOption = {
  offset: {x:0, y:5, z:-10}
};

/**
  * view.sceneに設定されているアバターをキーボードで
  * コントロールして、さらにカメラもコントロールする
  * コントローラ。
  */
export class AvatarController extends ControllerBase {
  option: ACOption;
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

  constructor(option: Partial<ACOption>) {
    super();
    this.option = {
      ...defaultACOption,
      ...option
    };
    this._keyW = this._keyA = this._keyS = this._keyD = false;
    this._keyLeft = this._keyRight = false;
    this._keySpace = false;
    const o = this.option.offset;
    this._offset = new Vec3(o.x,o.y,o.z);
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
    this.view.camera.transformer.setLocation(tmp.v0);
    const up = this.view.camera.upVector ? this.view.camera.upVector : ObjectA3.defaultUpVector;
    up.normalize();
    const q = getQuatOfLookAt(tmp.v0,this.view.scene.avatar.loc,up);
    q.mul(new Quat(up.x,up.y,up.z,0));
    this.view.camera.transformer.setQuat(q);

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
    avatar.setLocation(this._avatarNextLoc);
    avatar.setQuat(this._avatarNextQuat);
  }

  //setCameraLocation(loc: Vec3): void {}
  //setCameraLocationNow(loc: Vec3): void {}
  //setCameraQuat(quat: Quat): void {}
  //setCameraQuatNow(quat: Quat): void {}
}

