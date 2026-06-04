import type { View } from './View';
import { Canvas } from './Canvas';
import type { Camera } from './Camera';
import type { Controller } from './Controller';
import type { Vec3 } from './LinearMath';
import type { Scene } from './Scene';

/**
 * `GameCanvas` の生成オプションです。
 */
export interface GameCanvasOptions {
  /** タッチデバイス用UIを表示するかどうか。`true` でジョイスティックとボタンを表示します。省略時はタッチ対応デバイスか自動判定します。 */
  touchDevice: boolean;
}

/** `GameCanvasOptions` のデフォルト値です。タッチポイント数でスマホかPCかを自動判定します。 */
export const defaultGameCanvasOptions: GameCanvasOptions = {
  touchDevice: (navigator.maxTouchPoints > 0)
};

/**
 * スマートフォン向けのジョイスティック UI 付き 3D 表示クラスです。
 * HTML カスタム要素 `<game-canvas-a3>` として使用できます。
 *
 * 画面左下に左ジョイスティック、右下に右ジョイスティックと L/R ボタンが表示されます。
 * PC 環境（タッチ非対応）ではジョイスティックとボタンは非表示になります。
 * PC では W/A/S/D キーが左ジョイスティック、矢印キーが右ジョイスティック、
 * Space が左ボタン、Enter が右ボタンに対応します。
 *
 * @example
 * ```ts
 * const view = new GameCanvas();
 * document.body.appendChild(view);
 *
 * // 毎フレーム左ジョイスティックの値を参照して移動
 * function animate() {
 *   const { x, y } = view.leftJoystick; // -1 〜 1 の値
 *   avatar.moveForward(y * 0.1);
 *   avatar.turnLeft(x * 2);
 * }
 * ```
 */
export class GameCanvas extends HTMLElement implements View {
  /** 生成オプション。 */
  options: GameCanvasOptions;
  /** 内部で使用している `Canvas`。 */
  canvas: Canvas;
  /** このビューが表示している `Scene`。 */
  scene: Scene;
  /** このビューのカメラ。 */
  camera: Camera;
  /** このビューの入力コントローラー。 */
  controller: Controller;
  _maxDistance: number;
  _leftActive: boolean;
  _leftCenter: {x:number, y:number};
  /**
   * 左ジョイスティックの現在の入力値です。
   * `x`・`y` ともに -1 〜 1 の範囲で、中央が `0`、最大傾きが `±1` です。
   */
  leftJoystick: {x: number, y: number};
  _rightActive: boolean;
  _rightCenter: {x:number, y:number};
  /**
   * 右ジョイスティックの現在の入力値です。
   * `x`・`y` ともに -1 〜 1 の範囲で、中央が `0`、最大傾きが `±1` です。
   */
  rightJoystick: {x: number, y: number};
  /** 左ボタンが押されているとき `true`（PC では Space キーに対応）。 */
  leftButton: boolean;
  /** 右ボタンが押されているとき `true`（PC では Enter キーに対応）。 */
  rightButton: boolean;
  _leftButtonCount: number;
  _rightButtonCount: number;
  /** 現在押下中のキーコードの集合。 */
  keys: Set<string>;
  private _ro?: ResizeObserver;

  constructor(options: Partial<GameCanvasOptions> = {}) {
    super();
    this.options = {
      ...defaultGameCanvasOptions,
      ...options
    };
    this.attachShadow({mode:"open"});
    this.shadowRoot!.innerHTML = `
  <style>
    :host {
      display: block;
      position: relative;
      width: 600px;
      height: 300px;

      canvas-a3 {
        position: absolute;
        inset: 0;
        width: 100%;
        height: 100%;
      }
      .game-ui {
        position: absolute;
        inset: 0;
        width: 100%;
        height: 100%;

        .joystick {
          position: absolute;
          width: 120px;
          height: 120px;
          border-radius: 50%;
          background: rgba(255,255,255,0.08);
          border: 2px solid rgba(255,255,255,0.2);
          backdrop-filter: blur(4px);
        }
        .stick {
          position: absolute;
          width: 60px;
          height: 60px;
          border-radius: 50%;
          background: rgba(255,255,255,0.4);
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
        }
        .joystick.left {
          bottom: 40px;
          left: 30px;
        }
        .joystick.right {
          bottom: 40px;
          right: 30px;
        }
        .btn {
          position: absolute;
          border-radius: 50%;
          border: none;
          color: white;
          font-size: 14px;
          background: rgba(255,255,255,0.15);
          border: 2px solid rgba(255,255,255,0.3);
          backdrop-filter: blur(4px);
          cursor: pointer;
        }
        .btn.left {
          width: 90px;
          height: 90px;
          bottom: 50px;
          left: 200px;
        }
        .btn.right {
          width: 90px;
          height: 90px;
          bottom: 50px;
          right: 200px;
        }
        .btn:active {
          transform: scale(0.9);
        }
      }
    }
  </style>
  <canvas-a3></canvas-a3>
  <div class="game-ui">
    <div class="joystick left"><div class="stick"></div></div>
    <div class="joystick right"><div class="stick"></div></div>
    <button class="btn left">L</button>
    <button class="btn right">R</button>
  </div>
`;
    //this.canvas = new Canvas();
    //this.append(this.canvas);
    this.canvas = this.shadowRoot!.querySelector('canvas-a3')!;
    this.scene = this.canvas.scene;
    this.camera = this.canvas.camera;
    this.controller = this.canvas.controller;
    this._maxDistance = 40; // デザイン変えたら要チェック
    this._leftActive = false;
    this._leftCenter = {x:0,y:0};
    this.leftJoystick = {x:0,y:0};
    this._rightActive = false;
    this._rightCenter = {x:0,y:0};
    this.rightJoystick = {x:0,y:0};
    this.leftButton = false;
    this.rightButton = false;
    this.keys = new Set<string>();
    this._leftButtonCount = 0;
    this._rightButtonCount = 0;
    const leftStick = this.shadowRoot!.querySelector<HTMLDivElement>('.joystick.left .stick');
    if (!leftStick) return; // ありえん
    leftStick.addEventListener('pointerdown',(e)=>{
      this._leftActive = true;
      const rect = leftStick.getBoundingClientRect();
      this._leftCenter.x = rect.left + rect.width / 2;
      this._leftCenter.y = rect.top + rect.height / 2;
      leftStick.setPointerCapture(e.pointerId);
    });
    leftStick.addEventListener('pointermove',(e)=>{
      if (!this._leftActive) return;
      const dx = e.clientX - this._leftCenter.x;
      const dy = e.clientY - this._leftCenter.y;
      const distance = Math.sqrt(dx*dx + dy*dy);
      let limitedX = dx;
      let limitedY = dy;
      if (distance > 40) {
        const angle = Math.atan2(dy,dx);
        limitedX = Math.cos(angle) * this._maxDistance;
        limitedY = Math.sin(angle) * this._maxDistance;
      }
      leftStick.style.transform = `translate(calc(-50% + ${limitedX}px), calc(-50% + ${limitedY}px))`;
      this.leftJoystick.x = limitedX / this._maxDistance;
      this.leftJoystick.y = -(limitedY / this._maxDistance);
    });
    leftStick.addEventListener('pointerup', ()=>{
      this._leftActive = false;
      leftStick.style.transform = 'translate(-50%, -50%)';
      this.leftJoystick.x = 0;
      this.leftJoystick.y = 0;
    });
    const rightStick = this.shadowRoot!.querySelector<HTMLDivElement>('.joystick.right .stick');
    if (!rightStick) return; // ありえん
    rightStick.addEventListener('pointerdown',(e)=>{
      this._rightActive = true;
      const rect = rightStick.getBoundingClientRect();
      this._rightCenter.x = rect.left + rect.width / 2;
      this._rightCenter.y = rect.top + rect.height / 2;
      rightStick.setPointerCapture(e.pointerId);
    });
    rightStick.addEventListener('pointermove',(e)=>{
      if (!this._rightActive) return;
      const dx = e.clientX - this._rightCenter.x;
      const dy = e.clientY - this._rightCenter.y;
      const distance = Math.sqrt(dx*dx + dy*dy);
      let limitedX = dx;
      let limitedY = dy;
      if (distance > 40) {
        const angle = Math.atan2(dy,dx);
        limitedX = Math.cos(angle) * this._maxDistance;
        limitedY = Math.sin(angle) * this._maxDistance;
      }
      rightStick.style.transform = `translate(calc(-50% + ${limitedX}px), calc(-50% + ${limitedY}px))`;
      this.rightJoystick.x = limitedX / this._maxDistance;
      this.rightJoystick.y = -(limitedY / this._maxDistance);
    });
    rightStick.addEventListener('pointerup', ()=>{
      this._rightActive = false;
      rightStick.style.transform = 'translate(-50%, -50%)';
      this.rightJoystick.x = 0;
      this.rightJoystick.y = 0;
    });
    const leftButton = this.shadowRoot!.querySelector<HTMLButtonElement>('.btn.left');
    if (!leftButton) return; // ありえん
    leftButton.addEventListener('pointerdown',()=>{
      this.leftButton = true;
      this._leftButtonCount++;
    });
    leftButton.addEventListener('pointerup',()=>{
      this.leftButton = false;
    });
    const rightButton = this.shadowRoot!.querySelector<HTMLButtonElement>('.btn.right');
    if (!rightButton) return; // ありえん
    rightButton.addEventListener('pointerdown',()=>{
      this.rightButton = true;
      this._rightButtonCount++;
    });
    rightButton.addEventListener('pointerup',()=>{
      this.rightButton = false;
    });
    window.addEventListener('keydown',this.keyDownListener);
    window.addEventListener('keyup',this.keyUpListener);
    // PCの場合タッチデバイス用UIを非表示
    if (!this.options.touchDevice) {
      this.shadowRoot!.querySelectorAll<HTMLDivElement>('.joystick').forEach((js)=>{
        js.style.display = 'none';
      });
      this.shadowRoot!.querySelectorAll<HTMLButtonElement>('.btn').forEach((js)=>{
        js.style.display = 'none';
      });
    }
  }

  keyDownListener = (e: KeyboardEvent)=>{this.keys.add(e.code);this.updateUIFromKeyInfo();}
  keyUpListener = (e: KeyboardEvent)=>{this.keys.delete(e.code);this.updateUIFromKeyInfo();}

  connectedCallback() {
    this._ro = new ResizeObserver((entries) => {
      const entry = entries[0];
      const w = entry.contentRect.width;
      const h = entry.contentRect.height;
      if (w === 0 || h === 0) return;
      if (w > h) {
        const btnL = this.shadowRoot!.querySelector<HTMLButtonElement>('.btn.left')!;
        btnL.style.bottom = '50px';btnL.style.left = '200px';
        const btnR = this.shadowRoot!.querySelector<HTMLButtonElement>('.btn.right')!;
        btnR.style.bottom = '50px';btnR.style.right = '200px';
      } else {
        const btnL = this.shadowRoot!.querySelector<HTMLButtonElement>('.btn.left')!;
        btnL.style.bottom = '200px';btnL.style.left = '50px';
        const btnR = this.shadowRoot!.querySelector<HTMLButtonElement>('.btn.right')!;
        btnR.style.bottom = '200px';btnR.style.right = '50px';
      }
    });
    this._ro.observe(this);
  }
  disconnectedCallback() {
    this._ro?.disconnect();
    window.removeEventListener('keydown',this.keyDownListener);
    window.removeEventListener('keyup',this.keyUpListener);
  }

  updateUIFromKeyInfo() {
    const tmpL = {x:0,y:0};
    const tmpR = {x:0,y:0};
    if (this.keys.has('KeyW')) tmpL.y += 1;
    if (this.keys.has('KeyA')) tmpL.x -= 1;
    if (this.keys.has('KeyS')) tmpL.y -= 1;
    if (this.keys.has('KeyD')) tmpL.x += 1;
    if (this.keys.has('ArrowUp')) tmpR.y += 1;
    if (this.keys.has('ArrowLeft')) tmpR.x -= 1;
    if (this.keys.has('ArrowDown')) tmpR.y -= 1;
    if (this.keys.has('ArrowRight')) tmpR.x += 1;
    const dl = Math.sqrt(tmpL.x*tmpL.x + tmpL.y*tmpL.y);
    if (dl>0) { tmpL.x /= dl; tmpL.y /= dl; }
    this.leftJoystick = tmpL;
    const dr = Math.sqrt(tmpR.x*tmpR.x + tmpR.y*tmpR.y);
    if (dr>0) { tmpR.x /= dr; tmpR.y /= dr; }
    this.rightJoystick = tmpR;
    if (this.keys.has('Space')) {
      this.leftButton = true;
      this._leftButtonCount++;
    } else
      this.leftButton = false;
    if (this.keys.has('Enter')) {
      this.rightButton = true;
      this._rightButtonCount++;
    } else
      this.rightButton = false;
  }

  /** 左ボタンを押した回数を読み出して内部変数を0にリセット。 */
  getLeftButtonCount() {
    const c = this._leftButtonCount;
    this._leftButtonCount = 0;
    return c;
  }

  /** 右ボタンを押した回数を読み出して内部変数を0にリセット。 */
  getRightButtonCount() {
    const c = this._rightButtonCount;
    this._rightButtonCount = 0;
    return c;
  }

  replaceScene(newScene: Scene): Scene {
    return this.canvas.replaceScene(newScene);
  }
  setController(controller: Controller): void {
    this.canvas.setController(controller);
  }
  worldToScreen(loc: Vec3): { x: number; y: number; } {
    return this.canvas.worldToScreen(loc);
  }
  screenToWorld(x: number, y: number, depth: number): Vec3 {
    return this.canvas.screenToWorld(x,y,depth);
  }
  cameraToScreen(loc: Vec3): { x: number; y: number; } {
    return this.canvas.cameraToScreen(loc);
  }
  screenToCamera(x: number, y: number, depth: number): Vec3 {
    return this.canvas.screenToCamera(x,y,depth);
  }
  waitForRender(): Promise<number> {
    return this.canvas.waitForRender();
  }

  alert(msg: string, func?: ()=>void): Promise<void> {
    return this.canvas.alert(msg,func);
  }

  prompt(msg: string, func?: ()=>void): Promise<string> {
    return this.canvas.prompt(msg,func);
  }
}

customElements.define("game-canvas-a3", GameCanvas);
