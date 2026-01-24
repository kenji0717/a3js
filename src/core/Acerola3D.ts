import * as THREE from 'three';
import { ObjectA3 } from './ObjectA3';
import type { AsyncInitRequired } from './AsyncInitRequired';
import { Vec3 } from './Vec3';
import { unzipAsync, readStringFromUnzipped } from '../utils/math';
import { loadVrmlInUnzipped,
         loadBvhInUnzipped} from '../three/threeUtils';
import type { BVH } from 'three/addons/loaders/BVHLoader.js';
import * as TG from '../utils/TypeGuard';

interface Part {
  wrl: THREE.Object3D;
}

interface Action {
  bvh: BVH | null;
  mixer: THREE.AnimationMixer | null;
  clipAction:  THREE.AnimationAction | null;
  parts: Record<string,Part>;
  root: THREE.Object3D | null;
  scale: number;
  offset: Vec3;
}

/**
 * まだ適当。
 */
export class Acerola3D extends ObjectA3 implements AsyncInitRequired<Acerola3D> {
  readonly ready: Promise<Acerola3D>;
  actions: Record<string,Action>;
  currentAction: Action | null = null;
  comment: string | null = null; // CATALOG.XMLの<c>の中
  bvhs: Record<string,BVH> = {}; // 同じ物、2度読まないように
  vrmls: Record<string,THREE.Object3D> = {}; // 同じ物、2度読まないように

  constructor(url: string) {
    super();
    this.ready = this.asyncInit(url);
    this.actions = {};
  }

  initObject() {
    // ルートとなるObject3Dだけ用意して後でその中に
    // ロードしたモデルをaddする。
    return new THREE.Object3D();
  }

  async asyncInit(url: string) {
    const unzipped = await unzipAsync(url);
    const xmlParser = new DOMParser();
    const xmlStr = readStringFromUnzipped(unzipped,'CATALOG.XML');
    const xmlDoc = xmlParser.parseFromString(xmlStr, "application/xml");
    if (xmlDoc.querySelector('parsererror')) {
      console.error(`Acerola3D.asyncInit(): CATALOG.XML parse error.`);
      return this;
    }
    const ns = 'http://acerola3d.sourceforge.jp/a3/catalog';
    const cs = xmlDoc.getElementsByTagNameNS(ns,'c');
    if (cs[0]) this.comment = cs[0].textContent;
    const as = xmlDoc.getElementsByTagNameNS(ns,'a');
    const promises: Promise<any>[] = [];
    Array.from(as).forEach((a) => {
      const actionName = a.getAttribute('an');
      const actionBVH = a.getAttribute('bvh'); // 確か無いときもあった
      const actionScale = a.getAttribute('scale');
      const actionOffset = a.getAttribute('offset');
      if (actionName) {
        const action: Action = {
          bvh: null,
          mixer: null,
          clipAction: null,
          parts: {},
          root: null,
          scale: 1.0,
          offset: new Vec3()
        };
        this.actions[actionName] = action;
        if (actionBVH) {
          if (this.bvhs[actionBVH]) {
            action.bvh = this.bvhs[actionBVH];
          } else {
            const p = loadBvhInUnzipped(unzipped, actionBVH);
            promises.push(p);
            p.then((bvh)=>{action.bvh = bvh;});
          }
        }
        action.scale = actionScale ? Number(actionScale) : 1.0;
        if (actionOffset) {
          const as = actionOffset.split(" ");
          action.offset.set(Number(as[0]),Number(as[1]),Number(as[2]));
        }
        const parts = a.getElementsByTagNameNS(ns,'p');
        Array.from(parts).forEach((p) => {
          const partName = p.getAttribute('name');
          const wrl = p.getAttribute('wrl');
          if (partName && wrl) {
            if (this.vrmls[wrl]) {
              action.parts[partName] = { wrl: this.vrmls[wrl] };
            } else {
              const p = loadVrmlInUnzipped(unzipped,wrl);
              promises.push(p)
              p.then((wrl)=>{action.parts[partName] = { wrl };});
            }
          }
        });
      }
    });
    await Promise.all(promises);
    for (const action of Object.values(this.actions)) {
      if (action.bvh) {
        action.root = action.bvh.skeleton.bones[0];
        action.root.scale.set(action.scale,action.scale,action.scale);
        action.root.position.set(action.offset.x,action.offset.y,action.offset.z);
        appendPartToBone(action.root,action.parts);
        action.mixer = new THREE.AnimationMixer(action.root);
        action.clipAction = action.mixer.clipAction(action.bvh.clip);
      }
    }

    for (const action of Object.values(this.actions)) {
      if (action.root) {
        this.object.add(action.root);
        action.clipAction?.play();
        this.currentAction = action;
        break;
      }
    }
    return this;
  }

  action(actionName: string) {
    const a = this.actions[actionName];
    if (a) {
      this.currentAction?.clipAction?.stop();
      if (this.currentAction?.root)
        this.object.remove(this.currentAction?.root);
      this.currentAction = a;
      if (this.currentAction?.root)
        this.object.add(this.currentAction.root);
      this.currentAction?.clipAction?.play();
    }
  }

  update(dt: number) {
    super.update(dt);
    if (this.currentAction?.mixer) {
      this.currentAction?.mixer.update(dt);
    }
  }
}

function appendPartToBone(obj: THREE.Object3D, parts: Record<string,Part>) {
  if (TG.isBone(obj)) {
    const part = parts[obj.name];
    if (part)
      obj.add(part.wrl);
  }
  if (obj.children) {
    obj.children.forEach( o => {
      appendPartToBone(o,parts);
    });
  }
}

