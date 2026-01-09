import * as THREE from 'three';
//import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { A3Scene } from './A3Scene';
import type { A3View } from './A3View';
import { GeneralCamera } from './GeneralCamera';

export class A3Canvas extends HTMLElement implements A3View {
  private ro?: ResizeObserver;
  renderer;
  scene: A3Scene;
  camera: GeneralCamera;
  clock: THREE.Clock;
  
  constructor() {
    super();
    this.renderer = new THREE.WebGLRenderer();
    const pc = new THREE.PerspectiveCamera(75, 300/150, 0.1, 1000);
    this.clock = new THREE.Clock();
    this.scene = new A3Scene();
    this.camera = new GeneralCamera(pc);
    this.scene.scene.add(this.camera.camera);
    this.scene.scene.add(this.camera.headLight);
    this.camera.setLoc(0, 0, 3);
    this.style = 'display: block;';
    this.renderer.domElement.style = 'display: block; width: 100%; height: 100%; margin: 0; padding: 0;';
    this.appendChild(this.renderer.domElement);
    this.animationFrameId = requestAnimationFrame(this.renderingLoop);
  }

  connectedCallback() {
    this.ro = new ResizeObserver(() => {
      const { width, height } = this.renderer.domElement.getBoundingClientRect();
      this.camera.setAspect(width / height);
      this.renderer.setSize(width, height);
    });
    this.ro.observe(this);
  }
  disconnectedCallback() {
    this.ro?.disconnect();
  }

  replaceScene(newScene: A3Scene): A3Scene {
    this.scene.scene.remove(this.camera.camera);
    this.scene.scene.remove(this.camera.headLight);
    newScene.scene.add(this.camera.camera);
    newScene.scene.add(this.camera.headLight);
    const oldScene = this.scene;
    this.scene = newScene;
    return oldScene;
  }

  animationFrameId: number = -1;
  renderingLoop = () => {
    this.animationFrameId = requestAnimationFrame(this.renderingLoop);
    const dt = this.clock.getDelta();
    if (this.scene) {
      this.scene.update(dt);
      this.renderer.render(this.scene.scene, this.camera.camera);
    }
  };
}

customElements.define("a3-canvas", A3Canvas);
