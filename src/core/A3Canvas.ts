import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { A3Scene } from './A3Scene';

export class A3Canvas extends HTMLElement {
  private ro?: ResizeObserver;
  renderer;
  scene: A3Scene | null = null;
  camera;
  controls;
  
  constructor() {
    super();
    this.renderer = new THREE.WebGLRenderer();
    this.camera = new THREE.PerspectiveCamera(75, 300/150, 0.1, 1000);
    this.camera.position.set(0, 0, 3);
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.target.set(0, 0, 0);
    this.style = 'display: block;';
    this.renderer.domElement.style = 'display: block; width: 100%; height: 100%; margin: 0; padding: 0;';
    this.appendChild(this.renderer.domElement);
  }

  connectedCallback() {
    this.ro = new ResizeObserver(() => {
      const { width, height } = this.renderer.domElement.getBoundingClientRect();
      this.camera.aspect = width / height;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(width, height);
      console.log("GAHA: resize");
    });
    this.ro.observe(this);
  }
  disconnectedCallback() {
    this.ro?.disconnect();
  }

hemiLight = new THREE.AmbientLight(0xffffff, 0.6);
dirLight = new THREE.DirectionalLight(0xffffff, 1.0);
  setScene(scene: A3Scene) {
    this.scene = scene;
    this.scene.scene.add(this.camera);
//---------------------------
this.scene.scene.add(this.hemiLight);
this.dirLight.position.set(5, 10, 4);
this.scene.scene.add(this.dirLight);
//---------------------------
    this.animationFrameId = requestAnimationFrame(this.renderingLoop);
  }

  removeScene() {
    if (!this.scene) return;
    this.scene.scene.remove(this.camera);
//---------------------------
this.scene.scene.remove(this.hemiLight);
this.scene.scene.remove(this.dirLight);
//---------------------------
    this.scene = null;
    cancelAnimationFrame(this.animationFrameId);
  }

  animationFrameId: number = -1;
  previousTime: number = -1;
  renderingLoop = (time: number) => {
    const dt = this.previousTime===-1?0:time - this.previousTime;
    this.controls.update(dt);
    if (this.scene)
      this.renderer.render(this.scene.scene, this.camera);
    this.animationFrameId = requestAnimationFrame(this.renderingLoop);
  };
}

customElements.define("a3-canvas", A3Canvas);
