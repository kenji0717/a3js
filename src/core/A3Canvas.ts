import * as THREE from 'three';
//import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { A3Scene } from './A3Scene';
import { A3Camera } from './A3Camera';
import type { A3View } from './A3View';
import { A3ViewBase } from './A3ViewBase';
import { GeneralCamera } from './GeneralCamera';

export interface A3CanvasOpt {
  camera?: THREE.Camera;
  antialias?: boolean;
  transparent?: boolean;
}

/**
 * HTMLのエレメント(a3-canvas)として使えるA3View。
 */
export class A3Canvas extends HTMLElement implements A3View {
  private ro?: ResizeObserver;
  base: A3ViewBase;
  renderer;
  scene: A3Scene;
  camera: A3Camera;
  camera3js: THREE.Camera;
  clock: THREE.Clock;
  
  constructor(opt?: A3CanvasOpt) {
    super();
    if (!opt) opt = {};
    if (!opt.camera) opt.camera = new THREE.PerspectiveCamera(75, 300/150, 0.1, 1000);
    this.camera3js = opt.camera;
    const camera = new GeneralCamera(opt.camera);
    this.base = new A3ViewBase(camera);
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

  replaceScene(newScene: A3Scene): A3Scene {
    return this.base.replaceScene(newScene);
  }

  animationFrameId: number = -1;
  renderingLoop = () => {
    this.animationFrameId = requestAnimationFrame(this.renderingLoop);
    const dt = this.clock.getDelta();
    this.base.updateScene(dt);
    this.renderer.render(this.scene.scene, this.camera3js);
  };
}

customElements.define("a3-canvas", A3Canvas);

// TypeScriptにobjがPerspectiveCameraであることを教えてあげる関数。
function isPerspectiveCamera(obj: THREE.Camera): obj is THREE.PerspectiveCamera {
  return (obj as any).isPerspectiveCamera === true;
}
