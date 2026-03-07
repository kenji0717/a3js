import * as THREE from 'three';
import { ObjectA3 } from './ObjectA3';
import { Scene } from './Scene';
import { Camera } from './Camera';
import type { View } from './View';
import { ViewBase } from './View';
import { GeneralCamera } from './GeneralCamera';
import type { Controller } from './Controller';
import { Vec3 } from './LinearMath';
import { CSS2DRenderer } from 'three/addons/renderers/CSS2DRenderer.js';
import { tmp } from '../utils/math';
import { regenerateGLTFLoader } from './GLTF';

export interface CanvasOption {
  camera: GeneralCamera | undefined;
  antialias: boolean;
  transparent: boolean;
}

export const defaultCanvasOption: CanvasOption = {
  camera: undefined,
  antialias: false,
  transparent: false
};

/**
 * HTMLのエレメント(a3-canvas)として使えるView。
 */
export class Canvas extends HTMLElement implements View {
  option: CanvasOption;
  private ro?: ResizeObserver;
  base: ViewBase;
  renderer;
  css2DRenderer: CSS2DRenderer;
  scene: Scene;
  camera: Camera;
  controller: Controller;
  camera3js: THREE.Camera;
  timer: THREE.Timer;
  private _canvas: HTMLCanvasElement;
  private _css2DCanvas: HTMLElement;
  
  constructor(option?: Partial<CanvasOption>) {
    super();

    // ########## WebComponent関係のセットアップ ##########
    this.attachShadow({ mode: "open" });
    this.shadowRoot!.innerHTML = `
  <style>
    :host {
      width: 100%;
      height: 100%;
      display: block;
      padding: 0;
      margin: 0;
      position: relative;
      background: rgba(0,0,0,0);
      box-sizing:
      border-box;
    }

    :host canvas {
      width: 100%;
      height: 100%;
      display: block;
      margin: 0;
      padding: 0;
    }
  </style>
  <slot></slog>
`;

    this.option = {
      ...defaultCanvasOption,
      ...option
    };
    if (this.option.camera) {
      this.camera3js = this.option.camera.camera;
      this.camera = this.option.camera;
    } else {
      const camera3js = new THREE.PerspectiveCamera(75, 300/150, 0.1, 1000);
      camera3js.aspect = 300 / 150;
      this.camera3js = camera3js;
      this.camera = new GeneralCamera(this.camera3js);
    }
    this.base = new ViewBase(this.camera);
    this.scene = this.base.scene;
    this.camera = this.base.camera;
    this.controller = this.base.controller;
    this.timer = new THREE.Timer();
    this.timer.connect(document);
    const o = {
      antialias: this.option.antialias,
      alpha: this.option.transparent
    };
    this.renderer = new THREE.WebGLRenderer(o);
    regenerateGLTFLoader({renderer: this.renderer});
    this.renderer.setSize(600,300);
    //if ('opaque' in opt) this.renderer.setClearAlpha(0);
    this._canvas = this.renderer.domElement;
    this._canvas.width = 600;
    this._canvas.height = 300;
    this.appendChild(this._canvas);
    this.css2DRenderer = new CSS2DRenderer();
    this._css2DCanvas = this.css2DRenderer.domElement;
    this._css2DCanvas.style.position='absolute';
    this._css2DCanvas.style.top='0px';
    this.appendChild(this._css2DCanvas);
    this.animationFrameId = requestAnimationFrame(this.renderingLoop);

    this._css2DCanvas.addEventListener('click',this.myMouseClickedListener);

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
  }

  connectedCallback() {
    this.ro = new ResizeObserver(() => {
      const dpr = window.devicePixelRatio || 1;
      const w = Math.floor(this.clientWidth * dpr);
      const h = Math.floor(this.clientHeight * dpr);
      if (this._canvas.width !== w
          || this._canvas.height !== h) {
        this._canvas.width = w;
        this._canvas.height = h;
        if (isPerspectiveCamera(this.camera3js)) {
          this.camera3js.aspect = w / h;
          this.camera3js.updateProjectionMatrix();
        } else if (isOrthographicCamera(this.camera3js)) {
          this.camera3js.updateProjectionMatrix();
        }
        this.renderer.setSize(w, h);
        this.css2DRenderer.setSize(w, h);
      }
    });
    this.ro.observe(this);
  }
  disconnectedCallback() {
    this.ro?.disconnect();
  }

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
    return new Promise((resolve)=>{
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
        await objs[0].a3js.clicked();
      this.dispatchEvent(new CustomEvent('click3d',{detail: { value: objs }}));
    }
  }

  alert(message: string, func?: ()=>void): Promise<void> {
    return new Promise((resolve) => {
      const div = document.createElement('div');
      div.style.cssText = 'position: absolute; top: 0px; width: 100%; height: 100%; display: flex; flex-direction: column;';
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

customElements.define("canvas-a3", Canvas);

// TypeScriptにobjがPerspectiveCameraであることを教えてあげる関数。
function isPerspectiveCamera(obj: THREE.Camera): obj is THREE.PerspectiveCamera {
  return (obj as any).isPerspectiveCamera === true;
}
// TypeScriptにobjがOrthographicCameraであることを教えてあげる関数。
function isOrthographicCamera(obj: THREE.Camera): obj is THREE.OrthographicCamera {
  return (obj as any).isOrthographicCamera === true;
}
