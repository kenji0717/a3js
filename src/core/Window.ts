import * as THREE from 'three';
import { ObjectA3 } from './ObjectA3';
import { Scene } from './Scene';
import { Camera } from './Camera';
import type { View } from './View';
import { BaseView } from './View';
import { ThreeCamera } from './ThreeCamera';
import type { Controller } from './Controller';
import { Vec3 } from './LinearMath';
import { CSS2DRenderer } from 'three/addons/renderers/CSS2DRenderer.js';
import { tmp } from '../utils/math';
import { recreateGLTFLoader } from './GLTF';

export interface WindowOptions {
  width: number;
  height: number;
  camera: ThreeCamera | undefined;
}

export const defaultWindowOptions: WindowOptions = {
  width: 600,
  height: 300,
  camera: undefined
}

//type ResizeDir = "" | "n" | "s" | "e" | "w" | "ne" | "sw" | "nw" | "se";

export class Window extends HTMLElement implements View {
  // ########## WebComponent関係のセットアップ ##########
  private _resizeObserver?: ResizeObserver;
  private _dragging = false;
  private _resizing = false;
  private _resizeDir = "";
  private _startMouseX = 0;
  private _startMouseY = 0;
  private _startLeft = 0;
  private _startTop = 0;
  private _startWidth = 0;
  private _startHeight = 0;
  private _borderSize = 5;
  private _canvas: HTMLCanvasElement;
  private _css2DCanvas: HTMLElement;
  private _titleEl: HTMLElement | null = null;
  private _titleBar: HTMLElement | null = null;
  private _closeBtn: HTMLElement | null = null;
  // ########## WebComponent関係のセットアップ終り ##########

  options: WindowOptions;
  base: BaseView;
  renderer;
  css2DRenderer: CSS2DRenderer;
  scene: Scene;
  camera: Camera;
  controller: Controller;
  camera3js: THREE.Camera;
  timer: THREE.Timer;

  constructor(width=600, height=300, options: Partial<WindowOptions> = {}) {
    super();
    this.options = {
      ...defaultWindowOptions,
      ...options,
      ...{width,height}
    };
    // ########## WebComponent関係のセットアップ ##########
    this.attachShadow({ mode: "open" });
    this.shadowRoot!.innerHTML = `
  <style>
    :host {
      position: absolute;
      display: flex;
      flex-direction: column;
      background: #fff;
      border: 1px solid #444;
      box-shadow: 2px 2px 8px rgba(0, 0, 0, 0.3);
      font-family: sans-serif;
      user-select: none;
    }

    .titlebar {
      flex: 0 0 28px;
      background: #444;
      color: #fff;
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 6px;
      cursor: move;
    }

    .content {
      flex: 1 1 auto;
      min-height: 0;
      padding: 0;
      box-sizing: border-box;
      overflow: auto;
      user-select: text;
    }

    .close {
      cursor: pointer;
      font-weight: bold;
    }
  </style>
  <div class="titlebar">
    <span class="title"></span>
    <span class="close">✕</span>
  </div>
  <div class="content">
  </div>
`;
    // ########## WebComponent関係のセットアップ終り ##########

    // ここからようやく3D関係
    if (this.options.camera) {
      this.camera3js = this.options.camera.camera;
      this.camera = this.options.camera;
    } else {
      const camera3js = new THREE.PerspectiveCamera(75, width/height, 0.01, 1000);
      camera3js.aspect = width / height;
      this.camera3js = camera3js;
      this.camera = new ThreeCamera(this.camera3js);
    }
    this.base = new BaseView(this.camera);
    this.scene = this.base.scene;
    this.camera = this.base.camera;
    this.controller = this.base.controller;
    this.timer = new THREE.Timer();
    //this.timer.connect(document); // 複数Window生成したらダメなのでコメントアウト

    this.renderer = new THREE.WebGLRenderer();
    recreateGLTFLoader({renderer: this.renderer});
    this.renderer.setSize(width, height);
    this.renderer.domElement.width = width;
    this.renderer.domElement.height = height;
    const content = this.shadowRoot!.querySelector('.content')!;
    content.appendChild(this.renderer.domElement);
    this._canvas = this.shadowRoot!.querySelector('canvas')!;
    this.css2DRenderer = new CSS2DRenderer();
    this.css2DRenderer.setSize(width, height);
    this.css2DRenderer.domElement.classList.add('css2d-layer');
    this.css2DRenderer.domElement.style.position='absolute';
    this.css2DRenderer.domElement.style.top='28px';
    content.appendChild(this.css2DRenderer.domElement);
    this._css2DCanvas = this.shadowRoot!.querySelector('.css2d-layer')!;

    this._css2DCanvas.addEventListener('click',this.myMouseClickedListener);

    // コントローラに対するイベントの登録
    // 本当は複数a3.Windowを生成したらwindow.addEventListener();はダメかも
    // しれないけど、今はそのままで。GAHA
    window.addEventListener('keydown',this.keyDownListener);
    window.addEventListener('keyup',this.keyUpListener);
    window.addEventListener('keypress',this.keyPressListener);
    this._css2DCanvas.addEventListener('mousedown',(e)=>{this.controller?.mouseDown(e);});
    this._css2DCanvas.addEventListener('mouseup',(e)=>{this.controller?.mouseUp(e);});
    this._css2DCanvas.addEventListener('mousemove',(e)=>{this.controller?.mouseMove(e);});
    this._css2DCanvas.addEventListener('click',(e:MouseEvent)=>{this.controller?.mouseClick(e);});
    this._css2DCanvas.addEventListener('mouseenter',(e)=>{this.controller?.mouseEnter(e);});
    this._css2DCanvas.addEventListener('mouseleave',(e)=>{this.controller?.mouseLeave(e);});
    this._css2DCanvas.addEventListener('wheel',(e)=>{this.controller?.mouseWheel(e);});
    this._css2DCanvas.addEventListener('touchstart',(e)=>{this.controller?.touchStart(e);});
    this._css2DCanvas.addEventListener('touchmove',(e)=>{this.controller?.touchMove(e);});
    this._css2DCanvas.addEventListener('touchend',(e)=>{this.controller?.touchEnd(e);});
    this._css2DCanvas.addEventListener('touchcancel',(e)=>{this.controller?.touchCancel(e);});

    // 生成されたら、かってにdocument.bodyにappendChildする！
    if (document.body) {
      document.body.appendChild(this);
    } else {
      document.addEventListener("DOMContentLoaded",()=>{
        document.body.append(this);
      },{once: true});
    }
    // アニメーション開始させちゃう
    this.animationFrameId = requestAnimationFrame(this.renderingLoop);
  }
  // コンストラクタ終り

  keyDownListener = (e: KeyboardEvent)=>{this.controller?.keyDown(e);}
  keyUpListener = (e: KeyboardEvent)=>{this.controller?.keyUp(e);}
  keyPressListener = (e: KeyboardEvent)=>{this.controller?.keyPress(e);}

  // ########## まずはWebComponent関係のメソッドを用意する ##########


  _resizeCanvasToContent() {
    // <div class="content">のpaddingは0という前提
    // そうでなかったら以下のコメントをはずすべし。
    const content = this.shadowRoot!.querySelector(".content");
    //const style = getComputedStyle(content!);

    let cssWidth = content!.clientWidth;
    //cssWidth -= parseFloat(style.paddingLeft);
    //cssWidth -= parseFloat(style.paddingRight);

    let cssHeight = content!.clientHeight;
    //cssHeight -= parseFloat(style.paddingTop);
    //cssHeight -= parseFloat(style.paddingBottom);

    //const dpr = window.devicePixelRatio || 1;
    const w = Math.floor(cssWidth); // * dpr);
    const h = Math.floor(cssHeight); // * dpr);

    if (this._canvas.width !== w || this._canvas.height !== h) {
      this._canvas.width  = w;
      this._canvas.height = h;
      if (isPerspectiveCamera(this.camera3js)) {
        this.camera3js.aspect = w / h;
        this.camera3js.updateProjectionMatrix();
      } else if (isOrthographicCamera(this.camera3js)) {
        this.camera3js.updateProjectionMatrix();
      }
      this.renderer.setSize(w, h);
      //-----
      this.css2DRenderer.setSize(w, h);
    }
  }

  connectedCallback() {
    this._titleEl = this.shadowRoot!.querySelector(".title");
    this._titleEl!.textContent = this.getAttribute("title") ?? "Window";

    this._titleBar = this.shadowRoot!.querySelector(".titlebar");
    this._closeBtn = this.shadowRoot!.querySelector(".close");

    this._titleBar!.addEventListener("mousedown", this._onDragStart);
    this._closeBtn!.addEventListener("click", () => this.remove());

    this.addEventListener("mousemove", this._onHover);
    this.addEventListener("mousedown", this._onResizeStart);

    document.addEventListener("mousemove", this._onMouseMove);
    document.addEventListener("mouseup", this._onMouseUp);

    this._resizeObserver = new ResizeObserver(() => {
      if (this._canvas) {
        this._resizeCanvasToContent();
      }
    });

    const content = this.shadowRoot!.querySelector(".content");
    this._resizeObserver.observe(content!);
    this._resizeCanvasToContent();
  }
  disconnectedCallback() {
    document.removeEventListener("mousemove", this._onMouseMove);
    document.removeEventListener("mouseup", this._onMouseUp);
    this._resizeObserver?.disconnect();
    window.addEventListener('keydown',this.keyDownListener);
    window.addEventListener('keyup',this.keyUpListener);
    window.addEventListener('keypress',this.keyPressListener);
  }
  // Drag ------------------------------------
  _onDragStart = (e: MouseEvent) => {
    if (this._resizeDir) return;

    this._dragging = true;
    this._startMouseX = e.clientX;
    this._startMouseY = e.clientY;
    this._startLeft = this.offsetLeft;
    this._startTop = this.offsetTop;
  };
  // Resize detection ------------------------------------
  _onHover = (e: MouseEvent) => {
    if (this._dragging || this._resizing) return;

    const rect = this.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const b = this._borderSize;

    let dir = "";

    if (y < b) dir += "n";
    else if (y > rect.height - b) dir += "s";

    if (x < b) dir += "w";
    else if (x > rect.width - b) dir += "e";

    this._resizeDir = dir;
    this.style.cursor = this._cursorFromDir(dir);
  };

  _cursorFromDir(dir: string) {
    switch (dir) {
      case "n": return "ns-resize";
      case "s": return "ns-resize";
      case "e": return "ew-resize";
      case "w": return "ew-resize";
      case "ne": return "nesw-resize";
      case "sw": return "nesw-resize";
      case "nw": return "nwse-resize";
      case "se": return "nwse-resize";
      default: return "default";
    }
  }
  // Resize ------------------------------------
  _onResizeStart = (e: MouseEvent) => {
    if (!this._resizeDir) return;

    this._resizing = true;
    this._startMouseX = e.clientX;
    this._startMouseY = e.clientY;
    this._startLeft = this.offsetLeft;
    this._startTop = this.offsetTop;
    this._startWidth = this.offsetWidth;
    this._startHeight = this.offsetHeight;
  };

  _onMouseMove = (e: MouseEvent) => {
    if (this._dragging) {
      this.style.left = `${this._startLeft + (e.clientX - this._startMouseX)}px`;
      this.style.top  = `${this._startTop  + (e.clientY - this._startMouseY)}px`;
    }

    if (this._resizing) {
      const dx = e.clientX - this._startMouseX;
      const dy = e.clientY - this._startMouseY;

      if (this._resizeDir.includes("e"))
        this.style.width = `${this._startWidth + dx}px`;

      if (this._resizeDir.includes("s"))
        this.style.height = `${this._startHeight + dy}px`;

      if (this._resizeDir.includes("w")) {
        this.style.width = `${this._startWidth - dx}px`;
        this.style.left = `${this._startLeft + dx}px`;
      }

      if (this._resizeDir.includes("n")) {
        this.style.height = `${this._startHeight - dy}px`;
        this.style.top = `${this._startTop + dy}px`;
      }
    }
  };

  _onMouseUp = () => {
    this._dragging = false;
    this._resizing = false;
  };
  // ########## WebComponent関係のメソッドはここで終り ##########

  // 以下3D関係
  replaceScene(newScene: Scene): Scene {
    this.scene = newScene; // baseのとは別だから
    return this.base.replaceScene(newScene);
  }

  setController(controller: Controller) {
    this.controller = controller; // baseのとは別だから
    this.base.setController(controller);
  }

  animationFrameId: number = -1;
  renderingLoop = () => {
    this.animationFrameId = requestAnimationFrame(this.renderingLoop);
    this.timer.update();
    const dt = this.timer.getDelta();
    this.base.updateScene(dt);
    this.renderer.render(this.scene.scene, this.camera3js);
    this.css2DRenderer.render(this.scene.scene, this.camera3js);
    this.waitingRenderResolves.forEach((resolve)=>{resolve(dt);});
    this.waitingRenderResolves = [];
  };

  waitingRenderResolves: ((dt: number)=>void)[] = [];
  waitForRender(): Promise<number> {
    return new Promise<number>((resolve)=>{
      this.waitingRenderResolves.push(resolve);
    });
  }

  worldToScreen(loc: Vec3): { x: number, y: number } {
    const v = new THREE.Vector3(loc.x, loc.y, loc.z);
    v.project(this.camera3js);
    const size = new THREE.Vector2();
    this.renderer.getSize(size);
    const x = (v.x + 1) / 2 * size.x;
    const y = (1 - v.y) / 2 * size.y;
    return { x, y };
  }

  screenToWorld(x: number, y: number, depth: number): Vec3 {
    const ndc = new THREE.Vector3(
      (x / this._canvas.clientWidth) * 2 -1,
      -(y / this._canvas.clientHeight) * 2 + 1,
      0.5
    );
    ndc.unproject(this.camera3js);
    const dir = ndc.sub(this.camera3js.position).normalize();
    return new Vec3(this.camera3js.position.clone().add(dir.multiplyScalar(depth)));
  }

  cameraToScreen(loc: Vec3): { x: number, y: number } {
    const v = new THREE.Vector3(loc.x,loc.y,loc.z);
    const worldPos = v.applyMatrix4(this.camera3js.matrixWorld);
    tmp.v0.set(worldPos);
    return this.worldToScreen(tmp.v0);
  }

  screenToCamera(x: number, y: number, depth: number): Vec3 {
    const vec = this.screenToWorld(x,y,depth);
    const worldPos = new THREE.Vector3(vec.x,vec.y,vec.z);
    vec.set(worldPos.applyMatrix4(this.camera3js.matrixWorldInverse));
    return vec;
  }

//----------------------------------

  // このクラスはHTMLElementのスーパークラスだから
  // EventTargetを継承してるので、this.dispatchEvent()で
  // イベントを発生させられる。addEventListener()とか、
  // 自分で作らなくてOK。
  myMouseClickedListener = async (e: any) => {
    if (this.camera instanceof ThreeCamera) {
      const raycaster = new THREE.Raycaster();
      const mouse = new THREE.Vector2();
      const rect = e.target.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      mouse.x =  2*(x / rect.width) - 1;
      mouse.y = -2*(y / rect.height) + 1;
      raycaster.setFromCamera(mouse,this.camera.camera);
      const intersects = raycaster.intersectObjects(this.scene.scene.children);
      const objs: {three:THREE.Object3D,a3js:ObjectA3}[] = [];
      intersects.forEach((o1)=>{
        const a3js: ObjectA3 = o1.object.userData['a3js']?.objectA3;
        objs.push({three:o1.object,a3js});
      });
      if (objs.length>0)
        await objs[0].a3js.clicked();
      this.dispatchEvent(new CustomEvent('click3d',{detail: { value: objs }}));
    }
  }

  alert(message: string, func?: ()=>void): Promise<void> {
    return new Promise((resolve) => {
      const div = document.createElement('div');
      div.style.cssText = 'position: absolute; top: 28px; width: 100%; height: 100%; display: flex; flex-direction: column;';
      const p = document.createElement('p');
      p.style.cssText = 'width: 80%; margin: 0 auto; color: red; text-align: center; border: 3px solid red;';
      p.textContent = message;
      div.appendChild(p);
      const btn = document.createElement('button');
      btn.textContent = 'OK!';
      div.appendChild(btn);
      this.shadowRoot!.appendChild(div);
      
      btn.addEventListener('click',async ()=>{
        if (func)
          await func();
        this.shadowRoot!.removeChild(div);
        resolve();
      });
    });
  }

  prompt(message: string, func?: ()=>void): Promise<string> {
    return new Promise((resolve) => {
      const div = document.createElement('div');
      div.style.cssText = 'position: absolute; top: 28px; width: 100%; height: 100%; display: flex; flex-direction: column;';
      const p = document.createElement('p');
      p.style.cssText = 'width: 80%; margin: 0 auto; color: red; text-align: center; border: 3px solid red;';
      p.textContent = message;
      div.appendChild(p);
      const input = document.createElement('input');
      input.setAttribute('type','text');
      div.appendChild(input);
      const btn = document.createElement('button');
      btn.textContent = 'OK!';
      div.appendChild(btn);
      this.shadowRoot!.appendChild(div);
      
      btn.addEventListener('click',async ()=>{
        if (func)
          await func();
        this.shadowRoot!.removeChild(div);
        resolve(input.value);
      });
    });
  }
}

customElements.define("window-a3", Window);

// TypeScriptにobjがPerspectiveCameraであることを教えてあげる関数。
function isPerspectiveCamera(obj: THREE.Camera): obj is THREE.PerspectiveCamera {
  return (obj as any).isPerspectiveCamera === true;
}
// TypeScriptにobjがOrthographicCameraであることを教えてあげる関数。
function isOrthographicCamera(obj: THREE.Camera): obj is THREE.OrthographicCamera {
  return (obj as any).isOrthographicCamera === true;
}
