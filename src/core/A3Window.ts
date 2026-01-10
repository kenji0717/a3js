import * as THREE from 'three';
//import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { A3Scene } from './A3Scene';
import { A3Camera } from './A3Camera';
import type { A3View } from './A3View';
import { A3ViewBase } from './A3ViewBase';
import { GeneralCamera } from './GeneralCamera';

// Windowのスタイル
const wStyle = `
  position: absolute;
  top: 100px;
  left: 100px;
  /* width: 300px; */
  border: 1px solid #555;
  background: white;
  box-shadow: 4px 4px 10px rgba(0, 0, 0, 0.3);
`;
// タイトルバーのスタイル
const tStyle = `
  background: #444;
  color: white;
  padding: 8px;
  cursor: move;
  user-select: none; /* 文字選択を防ぐ */
`;


export class A3Window extends HTMLElement implements A3View {
  private ro?: ResizeObserver;
  base: A3ViewBase;
  renderer;
  scene: A3Scene;
  camera: A3Camera;
  camera3js: THREE.PerspectiveCamera;
  clock: THREE.Clock;
  isDragging: boolean = false;
  offsetX = 0;
  offsetY = 0;
  
  constructor(width: number, height: number) {
    super();
    this.camera3js = new THREE.PerspectiveCamera(75, width/height, 0.1, 1000);
    const camera = new GeneralCamera(this.camera3js);
    this.base = new A3ViewBase(camera);
    this.scene = this.base.scene;
    this.camera = this.base.camera;
    this.renderer = new THREE.WebGLRenderer();
    this.clock = new THREE.Clock();
    this.camera3js.aspect = width / height;
    this.renderer.setSize(width, height);

    this.style = wStyle;
    if (document.body) {
      document.body.appendChild(this);
    } else {
      document.addEventListener("DOMContentLoaded",()=>{
        document.body.append(this);
      },{once: true});
    }

    const title = document.createElement('div');
    title.textContent = 'A3Window';
    title.style = tStyle;
    this.appendChild(title);
    title.addEventListener("mousedown",this.mouseDownListener);
    document.addEventListener("mousemove",this.mouseMoveListener);
    document.addEventListener("mouseup",this.mouseUpListener);

    this.renderer.domElement.style = `display: block; width: ${width}px; height: ${height}px; margin: 0; padding: 0;`;
    this.renderer.domElement.width = width;
    this.renderer.domElement.width = height;
    this.appendChild(this.renderer.domElement);
    this.animationFrameId = requestAnimationFrame(this.renderingLoop);
  }

  connectedCallback() {
    this.ro = new ResizeObserver(() => {
      const { width, height } = this.renderer.domElement.getBoundingClientRect();
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

  mouseDownListener = (e: MouseEvent) => {
    this.isDragging = true;
    this.offsetX = e.clientX - this.offsetLeft;
    this.offsetY = e.clientY - this.offsetTop;
  };

  mouseMoveListener = (e: MouseEvent) => {
    if (!this.isDragging) return;
    this.style.left = e.clientX - this.offsetX + 'px';
    this.style.top = e.clientY - this.offsetY + 'px';
  };

  mouseUpListener = () => {
    this.isDragging = false;
  };

  replaceScene(newScene: A3Scene): A3Scene {
    return this.base.replaceScene(newScene);
  }

  animationFrameId: number = -1;
  renderingLoop = () => {
    this.animationFrameId = requestAnimationFrame(this.renderingLoop);
    const dt = this.clock.getDelta();
    if (this.scene) {
      this.scene.update(dt);
      this.renderer.render(this.scene.scene, this.camera3js);
    }
  };
}

customElements.define("a3-window", A3Window);
