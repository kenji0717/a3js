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
//import * as TG from '../utils/TypeGuard';
//import * as SkeletonUtils from 'three/examples/jsm/utils/SkeletonUtils.js';

interface Part {
  wrl: THREE.Object3D;
}

interface ViewAction {
  name: string;
  parts: Record<string,Part>;
  root: THREE.Object3D;
  scale: number;
  offset: Vec3;
  bvh: BVH | null; //これだけ残しておく
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
      const actionBVH = a.getAttribute('bvh'); // 確か無いときもあった
      const actionScale = a.getAttribute('scale');
      const actionOffset = a.getAttribute('offset');
      if (actionName) {
        const action: ViewAction = {
          name: actionName,
          parts: {},
          root: new THREE.Object3D(),
          scale: 1.0,
          offset: new Vec3(),
          bvh: null
        };
        action.root.visible = false;
        this.object.add(action.root);
        this.actions[actionName] = action;
        if (actionBVH) {
          //if (this.bvhs[actionBVH]) {
          //  const bvh = this.bvhs[actionBVH];
          //  const clone = {
          //    clip: bvh.clip.clone(),
          //    skeleton: SkeletonUtils.clone(bvh.skeleton)
          //  };
          //  action.bvh = clone;
          //} else {
            const bvh = await loadBvhInUnzipped(unzipped, actionBVH);
            //以下の1行はBVHの動きの補間をOFFにする。Acerola3DのBVHの使い方では必要だけど・・・
            bvh.clip.tracks.forEach(track=>{track.setInterpolation(THREE.InterpolateDiscrete);});
            action.bvh = bvh;
            //this.bvhs[actionBVH] = bvh;
          //}
        }
        action.scale = actionScale ? Number(actionScale) : 1.0;
        if (actionOffset) {
          const as = actionOffset.split(" ");
          action.offset.set(Number(as[0]),Number(as[1]),Number(as[2]));
        }
        const parts = a.getElementsByTagNameNS(ns,'p');
        for (const p of Array.from(parts)) {
          const partName = p.getAttribute('name');
          const wrl = p.getAttribute('wrl');
          if (partName && wrl) {
            let vrml;
            if (this.vrmls[wrl]) {
              vrml = this.vrmls[wrl].clone();
              action.parts[partName] = { wrl: vrml };
            } else {
              vrml = await loadVrmlInUnzipped(unzipped,wrl);
              action.parts[partName] = { wrl:vrml };
              this.vrmls[wrl] = vrml;
            }
            action.root.add(vrml); // ここは後で修正必要
          }
        }
      }
    }
    // クリックなどへの対応
    this.object.traverse((o)=>{
      o.userData['a3js']={object3D:this};
    });

    this.motion.setObject(this);
    return this;
  }
}
/* GAHA
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
*/
interface MotionAction {
  name: string;
  bvh: BVH | null;
  mixer?: THREE.AnimationMixer;
  clipAction?:  THREE.AnimationAction;
  vAction: ViewAction;
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
      let mAction = this.actions[vAction.name];
      if (!mAction)
        mAction = {
          name:vAction.name,
          bvh:vAction.bvh,
          vAction
        };
      if (vAction.bvh) {
        vAction.root.add(vAction.bvh.skeleton.bones[0]);
        vAction.root.scale.set(vAction.scale,vAction.scale,vAction.scale);
        vAction.root.position.set(vAction.offset.x,vAction.offset.y,vAction.offset.z);
        //appendPartToBone(vAction.root,vAction.parts); // GAHA
        mAction.mixer = new THREE.AnimationMixer(vAction.root);
        mAction.clipAction = mAction.mixer.clipAction(vAction.bvh.clip);
        this.actions[mAction.name] = mAction;
      }
    }
    for (const mAction of Object.values(this.actions)) {
      mAction.clipAction?.play();
      this.currentAction = mAction;
      mAction.vAction.root.visible = true;
      break;
    }
  }

  detachObject(_objectA3: ObjectA3) {
    // GAHA;
  }
  
  ttt?: string;
  update(dt: number) {
    super.update(dt);
    if (!this.isPaused && this.currentAction?.mixer) {
      let s = '';
      this.currentAction?.mixer.update(dt);
      this.currentAction.bvh?.skeleton.bones.forEach(b=>{
        const p = this.currentAction?.vAction.parts[b.name];
        p?.wrl.position.copy(b.position);
        p?.wrl.rotation.copy(b.rotation);
        p?.wrl.scale.copy(b.scale);
        s += b.name + '\n';
      });
      if (!this.ttt) {
        this.ttt = s;console.log(`GAHA: `,this.ttt);
      }
    }
  }

  controlMotion(actionName: string) {
    if (!this.actions) return;
    const a = this.actions[actionName];
    if (a) {
      if (this.currentAction) {
        this.currentAction.clipAction?.stop();
        if (this.currentAction.vAction.root)
          this.currentAction.vAction.root.visible=false;
      }
      if (a.vAction.root)
        a.vAction.root.visible=true;
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
