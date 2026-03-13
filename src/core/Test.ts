import * as THREE from 'three';
import { ObjectA3 } from './ObjectA3';
import type { Transforer } from './ObjectA3';
import { Vec3, vec3EulerToQuat } from './LinearMath';
import { DefaultTransformer } from './Transformers';
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

export interface TestOptions {
  testMode: boolean;
}

export const defaultTestOptions: TestOptions = {
  testMode: true,
}

export class Test extends ObjectA3 {
  constructor(options: DeepPartial<TestOptions> = {}) {
    super(options);
    const opt = {
      ...defaultTestOptions,
      ...options
    };
    this.setTransformer(new TestMotion(opt));
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

  initTransformer(option: DeepPartial<TestOptions>): Transforer {
    const opt = deepMerge<TestOptions>(defaultTestOptions,option);
    return new TestMotion(opt);
  }
}

class TestMotion extends DefaultTransformer {
  testMode: boolean = true;
  rot: Vec3 = new Vec3();

  constructor(options: TestOptions) {
    super();
    this.testMode = options.testMode;
  }

  update(dt: number) {
    super.update(dt);
    if (this.testMode) {
      this.rot.add(dt,dt,dt);
      const q = vec3EulerToQuat(this.rot);
      this.trans.quat.set(q);
    }
  }
}
