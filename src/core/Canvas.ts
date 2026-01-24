import * as THREE from 'three';
import { ObjectA3 } from './ObjectA3';
import { Scene } from './Scene';
import { Camera } from './Camera';
import type { View } from './View';
import { ViewBase } from './ViewBase';
import { GeneralCamera } from './GeneralCamera';
import type { Controller } from './Controller';
import type { MutableVec3 } from './Vec3';
import type { Label, Balloon } from './ObjectA3';

export interface CanvasOption {
  camera?: THREE.Camera;
  antialias?: boolean;
  transparent?: boolean;
}

/**
 * HTMLのエレメント(a3-canvas)として使えるView。
 */
export class Canvas extends HTMLElement implements View {
  private ro?: ResizeObserver;
  base: ViewBase;
  renderer;
  scene: Scene;
  camera: Camera;
  controller: Controller;
  camera3js: THREE.Camera;
  clock: THREE.Clock;
  
  constructor(opt?: CanvasOption) {
    super();

    // ########## WebComponent関係のセットアップ ##########
    this.attachShadow({ mode: "open" });
    this.shadowRoot!.innerHTML = `
  <style>
    :host {
      width: 100%;
      height: 100%;
    }

    :host canvas {
      width: 100%;
      height: 100%;
      display: block;
    }
  </style>
  <slot></slog>
`;

    if (!opt) opt = {};
    if (!opt.camera) opt.camera = new THREE.PerspectiveCamera(75, 300/150, 0.1, 1000);
    this.camera3js = opt.camera;
    const camera = new GeneralCamera(opt.camera);
    this.base = new ViewBase(camera);
    this.scene = this.base.scene;
    this.camera = this.base.camera;
    this.controller = this.base.controller;
    const o = {
      antialias: (opt.antialias?opt.antialias:false),
      alpha: (opt.transparent?opt.transparent:false)
    };
    this.renderer = new THREE.WebGLRenderer(o);
    if ('opaque' in opt) this.renderer.setClearAlpha(0);
    this.clock = new THREE.Clock();
    this.style = 'display: block; padding: 0; margin: 0; position: relative; background: rgba(0,0,0,0);box-sizing: border-box;';
    this.renderer.domElement.style = 'display: block; width: 100%; height: 100%; margin: 0; padding: 0;';
    this.appendChild(this.renderer.domElement);
    this.animationFrameId = requestAnimationFrame(this.renderingLoop);

    this.renderer.domElement.addEventListener('click',this.myMouseClickedListener);

    window.addEventListener('keydown',(e)=>{this.controller?.keyDown(e);});
    window.addEventListener('keyup',(e)=>{this.controller?.keyUp(e);});
    window.addEventListener('keypress',(e)=>{this.controller?.keyPress(e);});
    this.renderer.domElement.addEventListener('mousedown',(e)=>{this.controller?.mouseDown(e);});
    this.renderer.domElement.addEventListener('mouseup',(e)=>{this.controller?.mouseUp(e);});
    this.renderer.domElement.addEventListener('mousemove',(e)=>{this.controller?.mouseMove(e);});
    this.renderer.domElement.addEventListener('click',(e:MouseEvent)=>{this.controller?.mouseClick(e);});
    this.renderer.domElement.addEventListener('mouseenter',(e)=>{this.controller?.mouseEnter(e);});
    this.renderer.domElement.addEventListener('mouseleave',(e)=>{this.controller?.mouseLeave(e);});
    this.renderer.domElement.addEventListener('wheel',(e)=>{this.controller?.mouseWheel(e);});
    this.renderer.domElement.addEventListener('touchstart',(e)=>{this.controller?.touchStart(e);});
    this.renderer.domElement.addEventListener('touchmove',(e)=>{this.controller?.touchMove(e);});
    this.renderer.domElement.addEventListener('touchend',(e)=>{this.controller?.touchEnd(e);});
    this.renderer.domElement.addEventListener('touchcancel',(e)=>{this.controller?.touchCancel(e);});
  }

  connectedCallback() {
    this.ro = new ResizeObserver(() => {
      const dpr = window.devicePixelRatio || 1;
      const w = Math.floor(this.clientWidth * dpr);
      const h = Math.floor(this.clientHeight * dpr);
      if (this.renderer.domElement.width !== w
          || this.renderer.domElement.height !== h) {
        this.renderer.domElement.width = w;
        this.renderer.domElement.height = h;
        if (isPerspectiveCamera(this.camera3js)) {
          this.camera3js.aspect = w / h;
          this.camera3js.updateProjectionMatrix();
        }
        this.renderer.setSize(w, h);
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
    const dt = this.clock.getDelta();
    this.base.updateScene(dt);
    this.renderer.render(this.scene.scene, this.camera3js);
    // gaha this.renderer2D.render(this.scene.scene, this.camera3js);
  };

  worldToScreen(loc: MutableVec3) {
    const v = new THREE.Vector3(loc.x, loc.y, loc.z);
    v.project(this.camera3js);
    const size = new THREE.Vector2();
    this.renderer.getSize(size);
    const x = (v.x + 1) / 2 * size.x;
    const y = (1 - v.y) / 2 * size.y;
    return { x, y };
  }

  addLabel(label: Label) { this.base.addLabel(label); }
  removeLabel(label: Label) { this.base.removeLabel(label); }
  addBalloon(balloon: Balloon) { this.base.addBalloon(balloon); }
  removeBalloon(balloon: Balloon) { this.base.removeBalloon(balloon); }
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
      const objs: {o1:THREE.Object3D,o2:ObjectA3}[] = [];
      intersects.forEach((o1)=>{
        for (const o2 of this.scene.objects) {
          if (o2.contains(o1.object)) {
            objs.push({o1:o1.object,o2:o2});
            break;
          }
        }
      });
      this.dispatchEvent(new CustomEvent('click3d',{detail: { value: objs }}));
    }
  }
}

customElements.define("canvas-a3", Canvas);

// TypeScriptにobjがPerspectiveCameraであることを教えてあげる関数。
function isPerspectiveCamera(obj: THREE.Camera): obj is THREE.PerspectiveCamera {
  return (obj as any).isPerspectiveCamera === true;
}
