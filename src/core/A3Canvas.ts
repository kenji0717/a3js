import * as THREE from 'three';
//import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { A3Scene } from './A3Scene';
import { A3Camera } from './A3Camera';
import type { A3View } from './A3View';
import { A3ViewBase } from './A3ViewBase';
import { GeneralCamera } from './GeneralCamera';

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
  
  constructor(camera3js?: THREE.Camera) {
    super();
    if (!camera3js) camera3js = new THREE.PerspectiveCamera(75, 300/150, 0.1, 1000);
    this.camera3js = camera3js;
    const camera = new GeneralCamera(camera3js);
    this.base = new A3ViewBase(camera);
    this.scene = this.base.scene;
    this.camera = this.base.camera;
    this.renderer = new THREE.WebGLRenderer();
    this.clock = new THREE.Clock();
    this.style = 'display: block;';
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
