import * as THREE from 'three';
import { ObjectA3 } from './ObjectA3';
import { DefaultRootMotion } from './Motion';
import type { Motion } from './Motion';
import { CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';
import { deepMerge } from '../utils/math';
import type { DeepPartial } from '../utils/math';

const labelCSS = `
  color: white;
  padding: 5px 10px;
  background: rgba(0, 0, 0, 0.6);
  border: 1px solid #fff;
  border-radius: 5px;
  font-family: sans-serif;
  font-size: 14px;
  pointer-events: none; /* マウスイベントを透過させて背後の操作を邪魔しない */
`;

export interface TestOption {
  testMode: boolean;
}

export const defaultTestOption: TestOption = {
  testMode: true,
}

export class Test extends ObjectA3 {
  constructor(opt: DeepPartial<TestOption>) {
    super(opt);
  }

  initObject() {
    const geo = new THREE.BoxGeometry();
    const mat = new THREE.MeshStandardMaterial({ color: 0x00ff00 });
    const mesh = new THREE.Mesh(geo, mat);
    const div = document.createElement('div');
    div.textContent = 'Hello Box!';
    div.style.cssText = labelCSS;
    const label = new CSS2DObject(div);
    label.position.set(0, 0.8, 0); // 少し上に配置
    mesh.add(label);
    return mesh;
  }

  initMotion(option: DeepPartial<TestOption>): Motion {
    const opt = deepMerge<TestOption>(defaultTestOption,option);
    return new TestMotion(this,opt);
  }
}

class TestMotion extends DefaultRootMotion {
  testMode: boolean = true;
  constructor(obj: ObjectA3,opt: TestOption) {
    super(obj);
    this.testMode = opt.testMode;
  }

  update(dt: number) {
    if (this.testMode) {
      this.object3D.rotation.x += dt;
      this.object3D.rotation.y += dt;
      this.object3D.rotation.z += dt;
    } else {
      super.update(dt);
    }
  }
}
