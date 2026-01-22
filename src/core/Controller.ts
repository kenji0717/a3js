import * as THREE from 'three';
import type { View } from './View';

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
  keyDown(event: KeyboardEvent): void {event;}
  keyUp(event: KeyboardEvent): void {event;}
  keyPress(event: KeyboardEvent): void {event;}
  mouseDown(event: MouseEvent): void {event;}
  mouseUp(event: MouseEvent): void {event;}
  mouseMove(event: MouseEvent): void {event;}
  mouseClick(event: MouseEvent): void {event;}
  mouseEnter(event: MouseEvent): void {event;}
  mouseLeave(event: MouseEvent): void {event;}
  mouseWheel(event: WheelEvent): void {event;}
  touchStart(event: TouchEvent): void {event;}
  touchEnd(event: TouchEvent): void {event;}
  touchMove(event: TouchEvent): void {event;}
  touchCancel(event: TouchEvent): void {event;}
}

/**
  * とりあえず適当
  */
export class OrbitController extends ControllerBase {
  preMouse: {x:number,y:number};
  leftClick: boolean = false;
  myLoc: THREE.Vector3 = new THREE.Vector3(0,0,3);
  myQuat: THREE.Quaternion = new THREE.Quaternion(0,0,0,1);

  constructor(view: View) {
    super(view);
    this.preMouse = {x:0,y:0};
  }

  update(dt: number): void {
    dt;
    this.view.camera.setLocation(this.myLoc);
    this.view.camera.setQuat(this.myQuat);
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
    const epsilon = 0.0001;
    const dx = epsilon*(e.clientX - this.preMouse.x);
    const dy = epsilon*(e.clientY - this.preMouse.y);
    const quatX = new THREE.Quaternion(Math.sin(dy),0,0,Math.cos(dy));
    const quatY = new THREE.Quaternion(0,Math.sin(-dx),0,Math.cos(-dx));
    this.myLoc.applyQuaternion(quatX);
    this.myLoc.applyQuaternion(quatY);
    this.myQuat.multiply(quatX);
    this.myQuat.multiply(quatY);
  }
  mouseUp(e: MouseEvent): void {
    if (e.button === 0) {
      this.leftClick = false;
    }
  }
  mouseWheel(e: WheelEvent): void {
    if (e.deltaY > 0)
      this.myLoc.multiplyScalar(0.95);
    else if (e.deltaY < 0)
      this.myLoc.multiplyScalar(1.05);
  }
/*
  touchStart(e: TouchEvent): void {
console.log(`GAHA: touchStart()`,event);
    const loc = new Vec3(this.view.camera.location);
    loc.add(new Vec3(0.1,0,0));
    this.view.camera.setLocation(loc);
  }
*/
}


