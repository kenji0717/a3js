import * as THREE from 'three';
import { ObjectA3 } from './ObjectA3';
import type { AsyncInitRequired } from './AsyncInitRequired';
import { Motion } from './Motion';
import { Vec3 } from './Vec3';
import { unzipAsync, readStringFromUnzipped } from '../utils/math';
import { loadVrmlInUnzipped,
         loadBvhInUnzipped} from '../three/threeUtils';
import type { BVH } from 'three/addons/loaders/BVHLoader.js';
//import type { BVH } from '../three/BVHLoader2.js';
import * as TG from '../utils/TypeGuard';
//import * as SkeletonUtils from 'three/examples/jsm/utils/SkeletonUtils.js';

// BVHの情報だけからBoneのワールド座標系を得るために使用
//const evalScene: THREE.Scene = new THREE.Scene();

interface ViewAction {
  name: string;
  parts: Record<string,THREE.Object3D>;
  root: THREE.Object3D;
  scale: number;
  offset: Vec3;
  boneRoot: THREE.Bone | null;
  bvh: BVH | null; // Acerola3DMotionに受け渡すためだけに保存
}

/**
 * まだ適当。
 */
export class Acerola3D extends ObjectA3 implements AsyncInitRequired<Acerola3D> {
  readonly ready: Promise<Acerola3D>;
  actions: Record<string,ViewAction>;
  comment: string | null = null; // CATALOG.XMLの<c>の中
  // bvhs: Record<string,BVH> = {}; // 同じ物、2度読まないように(cloneが無理かも)
  vrmls: Record<string,THREE.Object3D>; // 同じ物、2度読まないように

  constructor(url: string) {
    super();
    this.actions = {};
    this.vrmls = {};
    this.ready = this.asyncInit(url);
  }

  initObject() {
    // ルートとなるObject3Dだけ用意して後でその中に
    // ロードしたモデルをaddする。
    return new THREE.Object3D();
  }

  initMotion() {
    return new Acerola3DMotion(this);
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
    for (const a of Array.from(as)) {
      const actionName = a.getAttribute('an');
      if (actionName) {
        const actionBVH = a.getAttribute('bvh'); // 確か無いときもあった
        let bvh: BVH | null = null;
        if (actionBVH) {
          //if (this.bvhs[actionBVH]) {
          //  bvh = this.bvhs[actionBVH];
          //  const clone = {
          //    clip: bvh.clip.clone(),
          //    skeleton: SkeletonUtils.clone(bvh.skeleton)
          //  };
          //  action.bvh = clone;
          //} else {
            bvh = await loadBvhInUnzipped(unzipped, actionBVH);
            //以下の1行はBVHの動きの補間をOFFにする。Acerola3DのBVHの使い方では必要だけど・・・
            bvh.clip.tracks.forEach(track=>{track.setInterpolation(THREE.InterpolateDiscrete);});
            //this.bvhs[actionBVH] = bvh;
          //}
        }
        const root = new THREE.Object3D();
        const actionScale = a.getAttribute('scale');
        const scale = actionScale ? Number(actionScale) : 1.0;
        root.scale.set(scale,scale,scale);
        const actionOffset = a.getAttribute('offset');
        const offset = new Vec3();
        if (actionOffset) {
          const as = actionOffset.split(" ");
          offset.set(Number(as[0]),Number(as[1]),Number(as[2]));
        }
        root.position.copy(offset);
        const parts: Record<string,THREE.Object3D> = {};
        const ps = a.getElementsByTagNameNS(ns,'p');
        for (const p of Array.from(ps)) {
          const partName = p.getAttribute('name');
          const wrl = p.getAttribute('wrl');
          if (partName && wrl) {
            let vrml;
            if (this.vrmls[wrl]) {
              vrml = this.vrmls[wrl].clone();
              parts[partName] = vrml;
            } else {
              vrml = await loadVrmlInUnzipped(unzipped,wrl);
              this.vrmls[wrl] = vrml;
              parts[partName] = vrml;
            }
          }
        }
        const action: ViewAction = {
          name: actionName,
          parts,
          root,
          boneRoot: null, // あとで
          scale,
          offset,
          bvh
        };
        this.actions[actionName] = action;
      }
    }
    for (const action of Object.values(this.actions)) {
      if (action.bvh) {
        action.boneRoot = action.bvh.skeleton.bones[0].clone();
        action.root.add(action.boneRoot);
        appendPartToBone(action.boneRoot,action.parts);
      } else {
        for (const part of Object.values(action.parts))
          action.root.add(part);
      }
      // クリックなどへの対応
      action.root.traverse((o)=>{
        o.userData['a3js']={object3D:this};
      });
    }

    this.motion.setObject(this);
    return this;
  }
}

function appendPartToBone(obj: THREE.Object3D, parts: Record<string,THREE.Object3D>) {
  if (TG.isBone(obj)) {
    const part = parts[obj.name]; 
    if (part)
      obj.add(part);
  }
  if (obj.children) {
    obj.children.forEach( o => {
      appendPartToBone(o,parts);
    });
  }
}

interface MotionAction {
  name: string;
  root: THREE.Object3D;
  bvh: BVH | null;
  boneRoot: THREE.Bone | null;
  mixer: THREE.AnimationMixer | null;
  clipAction:  THREE.AnimationAction | null;
}

export class Acerola3DMotion extends Motion {
  actions: Record<string,MotionAction>;
  currentAction?: MotionAction;
  isPaused: boolean;

  constructor(objectA3: ObjectA3) {
    super(objectA3);
    this.isPaused = false;
    this.actions = {};
  }

  setObject(objectA3: ObjectA3) {
    this.isPaused = false;
    if (objectA3 instanceof Acerola3D) {
      if (!objectA3.actions) // GAHA: 今のところ、初期化前にムダに呼ばれるので
        return;
      super.setObject(objectA3);
      this.myInitialize(objectA3);
    } else {
      console.warn('Acerola3DMotion can set only Acerola3D object.');
    }
  }

  myInitialize(a3: Acerola3D) {
    for (const vAction of Object.values(a3.actions)) {
      const name = vAction.name;
      const root = vAction.root;
      const bvh = vAction.bvh;
      const boneRoot = vAction.boneRoot;
      let mixer: THREE.AnimationMixer | null = null;
      let clipAction: THREE.AnimationAction | null = null;
      if (bvh && boneRoot) {
        mixer = new THREE.AnimationMixer(boneRoot);
        clipAction = mixer.clipAction(bvh.clip);
      }
      const mAction = {
        name,
        root,
        bvh,
        boneRoot,
        mixer,
        clipAction
      };
      this.actions[mAction.name] = mAction;
    }
    for (const mAction of Object.values(this.actions)) {
      mAction.clipAction?.play();
      this.currentAction = mAction;
      if (mAction.root)
        this.object3D?.add(mAction.root);
      break;
    }
  }

  detachObject(_objectA3: ObjectA3) {
    // GAHA;
  }
  
  //static loc = new THREE.Vector3(); // 毎回生成しなくて良いように
  //static quat = new THREE.Quaternion(); // 毎回生成しなくて良いように
  //static scale = new THREE.Vector3(); // 毎回生成しなくて良いように
  update(dt: number) {
    super.update(dt);
    if (!this.currentAction)
      return;
    if (!this.isPaused && this.currentAction.mixer) {
      this.currentAction.mixer.update(dt);
      /*
      for (const part of Object.values(this.currentAction.parts)) {
        part.bone.updateWorldMatrix(true,false);
        part.bone.getWorldPosition(Acerola3DMotion.loc);
        part.bone.getWorldQuaternion(Acerola3DMotion.quat);
        part.bone.getWorldScale(Acerola3DMotion.scale);
        part.wrl.position.copy(Acerola3DMotion.loc);
        part.wrl.quaternion.copy(Acerola3DMotion.quat);
        part.wrl.scale.copy(Acerola3DMotion.scale);
      }
      */
    }
  }

  controlMotion(actionName: string) {
    if (!this.actions) return;
    const a = this.actions[actionName];
    if (a) {
      if (this.currentAction) {
        this.currentAction.clipAction?.stop();
        if (this.currentAction.root)
          this.object3D?.remove(this.currentAction.root);
      }
      if (a.root)
        this.object3D?.add(a.root);
      a.clipAction?.play();
      this.currentAction = a;
    }
  }

  setPause(p: boolean) {
    this.isPaused = p;
  }

  setTime(time: number) {
    this.currentAction?.mixer?.setTime(time);
  }
}
