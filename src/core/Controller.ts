import type { View } from './View';
import { Vec3 } from './Vec3';
import type { MutableVec3 } from './Vec3';
import { Quat, getQuatOfLookAt } from './Quat';
import type { MutableQuat } from './Quat';

/**
 * キーやマウスなどの様々なイベントを受け取り
 * ナビゲーションなどを行うコントローラのインターフェース。
 * 必ずコンストラクタでViewを受け取りプロパティに保存する。
 * コンストラクタで自分自身を受け取ったViewに登録する処理が
 * 必要。
 */
export interface Controller {
  view: View;
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

  setCameraLocation(loc: MutableVec3): void;
  setCameraLocationNow(loc: MutableVec3): void;
  setCameraQuat(quat: MutableQuat): void;
  setCameraQuatNow(quat: MutableQuat): void;
  setCameraScale(scale: MutableVec3): void;
  setCameraScaleNow(scale: MutableVec3): void;
}

/**
  * まったく何もしないController。不要なメソッドを
  * 実装しなくて良いように、これを継承して実用的な
  * Controllerを作ると良い。
  */
export class ControllerBase implements Controller {
  view: View;
  constructor(view: View) {
    this.view = view;
    view.setController(this);
  }
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
  setCameraLocation(_loc: MutableVec3): void {}
  setCameraLocationNow(_loc: MutableVec3): void {}
  setCameraQuat(_quat: MutableQuat): void {}
  setCameraQuatNow(_quat: MutableQuat): void {}
  setCameraScale(_scale: MutableVec3): void {}
  setCameraScaleNow(_scale: MutableVec3): void {}
}

/**
  * とりあえず適当
  */
export class OrbitController extends ControllerBase {
  preMouse: {x:number,y:number};
  leftClick: boolean = false;
  target: Vec3;
  cameraLoc: Vec3 = new Vec3(0,0,3);
  cameraQuat: Quat = new Quat(0,0,0,1);

  constructor(view: View,target: MutableVec3);
  constructor(view: View,tx: number, ty: number, tz: number);
  constructor(view: View,xOrV: number | MutableVec3, y?: number, z?: number) {
    super(view);
    this.preMouse = {x:0,y:0};
    if (typeof xOrV === "number") {
      this.target = new Vec3(xOrV,y!,z!);
    } else {
      this.target = new Vec3(xOrV);
    }
  }

  update(dt: number): void {
    dt;
    this.view.camera.setLocation(this.cameraLoc);
    this.view.camera.setQuat(this.cameraQuat);
  }

  mouseDown(e: MouseEvent): void {
    if (e.button === 0) {
      this.leftClick = true;
      this.preMouse.x = e.clientX;
      this.preMouse.y = e.clientY;
    }
  }
  mouseMove(e: MouseEvent): void {
    if (this.leftClick === false)
      return;
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
  }
  mouseUp(e: MouseEvent): void {
    if (e.button === 0) {
      this.leftClick = false;
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
  setCameraLocation(loc: MutableVec3): void {
    this.cameraLoc.set(loc);
  }
  setCameraLocationNow(loc: MutableVec3): void {
    this.cameraLoc.set(loc);
  }
  //setCameraQuat(quat: MutableQuat): void {}
  //setCameraQuatNow(quat: MutableQuat): void {}
}


