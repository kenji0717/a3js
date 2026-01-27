import * as THREE from 'three';
import { ObjectA3 } from './ObjectA3';
import { Scene } from './Scene';
import { Camera } from './Camera';
import type { View } from './View';
import { ViewBase } from './ViewBase';
import { GeneralCamera } from './GeneralCamera';
import type { Controller } from './Controller';
import type { MutableVec3 } from './Vec3';
import { CSS2DRenderer } from 'three/addons/renderers/CSS2DRenderer.js';

export interface WindowOption {
  width: number;
  height: number;
  top: number;
  left: number;
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

  base: ViewBase;
  renderer;
  css2DRenderer: CSS2DRenderer;
  scene: Scene;
  camera: Camera;
  controller: Controller;
  camera3js: THREE.PerspectiveCamera;
  clock: THREE.Clock;

  constructor(width=600, height=300) {
    super();

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
    <slot></slot>
  </div>
`;
    // ########## WebComponent関係のセットアップ終り ##########

    // ここからようやく3D関係
    this.camera3js = new THREE.PerspectiveCamera(75, width/height, 0.1, 1000);
    this.camera3js.aspect = width / height;
    const camera = new GeneralCamera(this.camera3js);
    this.base = new ViewBase(camera);
    this.scene = this.base.scene;
    this.camera = this.base.camera;
    this.controller = this.base.controller;
    this.clock = new THREE.Clock();
    this.renderer = new THREE.WebGLRenderer();
    this.renderer.setSize(width, height);
    this._canvas = this.renderer.domElement;
    this._canvas.width = width;
    this._canvas.width = height;
    this.appendChild(this._canvas);
    this.css2DRenderer = new CSS2DRenderer();
    this.css2DRenderer.setSize(width, height);
    this._css2DCanvas = this.css2DRenderer.domElement;
    this._css2DCanvas.style.position='absolute';
    this._css2DCanvas.style.top='28px';
    this.appendChild(this._css2DCanvas);

    this._css2DCanvas.addEventListener('click',this.myMouseClickedListener);

    // コントローラに対するイベントの登録
    window.addEventListener('keydown',(e)=>{this.controller?.keyDown(e);});
    window.addEventListener('keyup',(e)=>{this.controller?.keyUp(e);});
    window.addEventListener('keypress',(e)=>{this.controller?.keyPress(e);});
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

    const dpr = window.devicePixelRatio || 1;
    const w = Math.floor(cssWidth * dpr);
    const h = Math.floor(cssHeight * dpr);

    if (this._canvas.width !== w || this._canvas.height !== h) {
      this._canvas.width  = w;
      this._canvas.height = h;
      this.camera3js.aspect = w / h;
      this.camera3js.updateProjectionMatrix();
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
    const dt = this.clock.getDelta();
    this.base.updateScene(dt);
    this.renderer.render(this.scene.scene, this.camera3js);
    this.css2DRenderer.render(this.scene.scene, this.camera3js);
  };

  worldToScreen(loc: MutableVec3): { x: number, y: number } {
    const v = new THREE.Vector3(loc.x, loc.y, loc.z);
    v.project(this.camera3js);
    const size = new THREE.Vector2();
    this.renderer.getSize(size);
    const x = (v.x + 1) / 2 * size.x;
    const y = (1 - v.y) / 2 * size.y;
    return { x, y };
  }

  screenToWorld(x: number, y: number, depth: number): MutableVec3 {
    const ndc = new THREE.Vector3(
      (x / this._canvas.clientWidth) * 2 -1,
      -(y / this._canvas.clientHeight) * 2 + 1,
      0.5
    );
    ndc.unproject(this.camera3js);
    const dir = ndc.sub(this.camera3js.position).normalize();
    return this.camera3js.position.clone().add(dir.multiplyScalar(depth));
  }

  cameraToScreen(loc: MutableVec3): { x: number, y: number } {
    const v = new THREE.Vector3(loc.x,loc.y,loc.z);
    const worldPos = v.applyMatrix4(this.camera3js.matrixWorld);
    return this.worldToScreen(worldPos);
  }

  screenToCamera(x: number, y: number, depth: number): MutableVec3 {
    const vec = this.screenToWorld(x,y,depth);
    const worldPos = new THREE.Vector3(vec.x,vec.y,vec.z);
    return worldPos.applyMatrix4(this.camera3js.matrixWorldInverse);
  }

//----------------------------------

  // このクラスはHTMLElementのスーパークラスだから
  // EventTargetを継承してるので、this.dispatchEvent()で
  // イベントを発生させられる。addEventListener()とか、
  // 自分で作らなくてOK。
  myMouseClickedListener = (e: any) => {
    if (this.camera instanceof GeneralCamera) {
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
        objs[0].a3js.clicked();
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
      this.appendChild(div);
      
      btn.addEventListener('click',async ()=>{
        if (func)
          await func();
        this.removeChild(div);
        resolve();
      });
    });
  }
}

customElements.define("window-a3", Window);
