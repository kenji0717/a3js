import * as THREE from 'three';
//import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { ObjectA3 } from './ObjectA3';
import { Scene } from './Scene';
import { Camera } from './Camera';
import type { View } from './View';
import { ViewBase } from './ViewBase';
import { GeneralCamera } from './GeneralCamera';

export interface CanvasOpt {
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
  camera3js: THREE.Camera;
  clock: THREE.Clock;
  
  constructor(opt?: CanvasOpt) {
    super();
    if (!opt) opt = {};
    if (!opt.camera) opt.camera = new THREE.PerspectiveCamera(75, 300/150, 0.1, 1000);
    this.camera3js = opt.camera;
    const camera = new GeneralCamera(opt.camera);
    this.base = new ViewBase(camera);
    this.scene = this.base.scene;
    this.camera = this.base.camera;
    const o = {
      antialias: (opt.antialias?opt.antialias:false),
      alpha: (opt.transparent?opt.transparent:false)
    };
    this.renderer = new THREE.WebGLRenderer(o);
    if ('opaque' in opt) this.renderer.setClearAlpha(0);
    this.clock = new THREE.Clock();
    this.style = 'display: block; background: rgba(0,0,0,0);';
    this.renderer.domElement.style = 'display: block; width: 100%; height: 100%; margin: 0; padding: 0;';
    this.appendChild(this.renderer.domElement);
    this.animationFrameId = requestAnimationFrame(this.renderingLoop);

    this.addEventListener('click',this.myMouseClickedListener);
  }

  connectedCallback() {
    this.ro = new ResizeObserver(() => {
      const { width, height } = this.renderer.domElement.getBoundingClientRect();
      if (isPerspectiveCamera(this.camera3js))
        this.camera3js.aspect = width / height;
      this.renderer.setSize(width, height);
      //this.renderer.domElement.width = width; // ???
      //this.renderer.domElement.width = height; // ???
    });
    this.ro.observe(this);
  }
  disconnectedCallback() {
    this.ro?.disconnect();
  }

  replaceScene(newScene: Scene): Scene {
    return this.base.replaceScene(newScene);
  }

  animationFrameId: number = -1;
  renderingLoop = () => {
    this.animationFrameId = requestAnimationFrame(this.renderingLoop);
    const dt = this.clock.getDelta();
    this.base.updateScene(dt);
    this.renderer.render(this.scene.scene, this.camera3js);
  };

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

customElements.define("a3-canvas", Canvas);

// TypeScriptにobjがPerspectiveCameraであることを教えてあげる関数。
function isPerspectiveCamera(obj: THREE.Camera): obj is THREE.PerspectiveCamera {
  return (obj as any).isPerspectiveCamera === true;
}
