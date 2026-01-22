import * as THREE from 'three';
import { ObjectA3 } from './ObjectA3';
import { Scene } from './Scene';
import { Camera } from './Camera';
import type { View } from './View';
import { ViewBase } from './ViewBase';
import { GeneralCamera } from './GeneralCamera';
import type { Controller } from './Controller';

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


export class Window extends HTMLElement implements View {
  private ro?: ResizeObserver;
  base: ViewBase;
  renderer;
  scene: Scene;
  camera: Camera;
  controller: Controller | null;
  camera3js: THREE.PerspectiveCamera;
  clock: THREE.Clock;
  isDragging: boolean = false;
  offsetX = 0;
  offsetY = 0;
  
  constructor(width: number, height: number) {
    super();
    this.camera3js = new THREE.PerspectiveCamera(75, width/height, 0.1, 1000);
    const camera = new GeneralCamera(this.camera3js);
    this.base = new ViewBase(camera);
    this.scene = this.base.scene;
    this.camera = this.base.camera;
    this.controller = this.base.controller;
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

    this.addEventListener('click',this.myMouseClickedListener);

    window.addEventListener('keydown',(e)=>{this.controller?.keyDown(e);});
    window.addEventListener('keyup',(e)=>{this.controller?.keyUp(e);});
    window.addEventListener('keypress',(e)=>{this.controller?.keyPress(e);});
    this.addEventListener('mousedown',(e)=>{this.controller?.mouseDown(e);});
    this.addEventListener('mouseup',(e)=>{this.controller?.mouseUp(e);});
    this.addEventListener('mousemove',(e)=>{this.controller?.mouseMove(e);});
    this.addEventListener('click',(e:MouseEvent)=>{this.controller?.mouseClick(e);});
    this.addEventListener('mouseenter',(e)=>{this.controller?.mouseEnter(e);});
    this.addEventListener('mouseleave',(e)=>{this.controller?.mouseLeave(e);});
    this.addEventListener('wheel',(e)=>{this.controller?.mouseWheel(e);});
    this.addEventListener('touchstart',(e)=>{this.controller?.touchStart(e);});
    this.addEventListener('touchmove',(e)=>{this.controller?.touchMove(e);});
    this.addEventListener('touchend',(e)=>{this.controller?.touchEnd(e);});
    this.addEventListener('touchcancel',(e)=>{this.controller?.touchCancel(e);});
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

  replaceScene(newScene: Scene): Scene {
    this.scene = newScene; // baseのとは別だから
    return this.base.replaceScene(newScene);
  }

  setController(controller: Controller) {
    this.controller = controller; // baseのとは別だから
    this.base.setController(controller);
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

customElements.define("a3-window", Window);
