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

export interface CanvasOptions {
  camera: GeneralCamera | undefined;
  antialias: boolean;
  transparent: boolean;
}

export const defaultCanvasOptions: CanvasOptions = {
  camera: undefined,
  antialias: false,
  transparent: false
};

/**
 * HTMLのエレメント(a3-canvas)として使えるView。
 */
export class Canvas extends HTMLElement implements View {
  options: CanvasOptions;
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
  
  constructor(options?: Partial<CanvasOptions>) {
    super();

    // ########## WebComponent関係のセットアップ ##########
    this.attachShadow({ mode: "open" });
    this.shadowRoot!.innerHTML = `
  <style>
    :host {
      display: block;
      position: relative;
    }

    canvas, .css2d-layer {
      position: absolute;
      inset: 0;
    }
  </style>
  <slot></slot>
`;

    this.options = {
      ...defaultCanvasOptions,
      ...options
    };
    if (this.options.camera) {
      this.camera3js = this.options.camera.camera;
      this.camera = this.options.camera;
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
    //this.timer.connect(document); // 複数Canvas生成したらダメなのでコメントアウト

    const o = {
      antialias: this.options.antialias,
      alpha: this.options.transparent
    };
    this.renderer = new THREE.WebGLRenderer(o);
    regenerateGLTFLoader({renderer: this.renderer});
    this.renderer.setSize(600,300);
    this.shadowRoot!.appendChild(this.renderer.domElement);
    this._canvas = this.shadowRoot!.querySelector('canvas')!;
    this._canvas.width = 600;
    this._canvas.height = 300;

    this.css2DRenderer = new CSS2DRenderer();
    this.css2DRenderer.domElement.classList.add('css2d-layer');
    this.shadowRoot!.appendChild(this.css2DRenderer.domElement);
    this._css2DCanvas = this.shadowRoot!.querySelector('.css2d-layer')!;

    this.animationFrameId = requestAnimationFrame(this.renderingLoop);

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
  }

  keyDownListener = (e: KeyboardEvent)=>{this.controller?.keyDown(e);};
  keyUpListener = (e: KeyboardEvent)=>{this.controller?.keyUp(e);};
  keyPressListener = (e: KeyboardEvent)=>{this.controller?.keyPress(e);};

  connectedCallback() {
    this.ro = new ResizeObserver((entries) => {
      const entry = entries[0];
      const w = entry.contentRect.width;
      const h = entry.contentRect.height;
      if (w === 0 || h === 0) return;
      this.renderer.setSize(w, h, true); // trueで内部解像度に加え要素の表示の大きさも変更
      this.css2DRenderer.setSize(w, h); // こっちは最初からそう？
      if (isPerspectiveCamera(this.camera3js)) {
        this.camera3js.aspect = w / h;
        this.camera3js.updateProjectionMatrix();
      } else if (isOrthographicCamera(this.camera3js)) {
        this.camera3js.updateProjectionMatrix();
      }
    });
    this.ro.observe(this);
  }
  disconnectedCallback() {
    this.ro?.disconnect();
    window.removeEventListener('keydown',this.keyDownListener);
    window.removeEventListener('keyup',this.keyUpListener);
    window.removeEventListener('keypress',this.keyPressListener);
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
      div.style.cssText = 'position: absolute; top: 0px; width: 100%; height: 100%; display: flex; flex-direction: column; z-index: 3;';
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
      div.style.cssText = 'position: absolute; top: 0px; width: 100%; height: 100%; display: flex; flex-direction: column; z-index: 3;';
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

customElements.define("canvas-a3", Canvas);

// TypeScriptにobjがPerspectiveCameraであることを教えてあげる関数。
function isPerspectiveCamera(obj: THREE.Camera): obj is THREE.PerspectiveCamera {
  return (obj as any).isPerspectiveCamera === true;
}
// TypeScriptにobjがOrthographicCameraであることを教えてあげる関数。
function isOrthographicCamera(obj: THREE.Camera): obj is THREE.OrthographicCamera {
  return (obj as any).isOrthographicCamera === true;
}
