import * as THREE from 'three';
import { ObjectA3 } from './ObjectA3';
import type { AsyncInitRequired } from './AsyncInitRequired';
import { Motion } from './Motion';
import { Vec3 } from './Vec3';
import { unzipAsync, readStringFromUnzippedA3 } from '../utils/math';
import { loadVrmlInUnzippedA3,
         loadBvhInUnzippedA3,
         cloneBVH } from '../three/threeUtils';
import type { BVH } from '../three/BVHLoader2.js';
import * as TG from '../utils/TypeGuard';
//import * as SkeletonUtils from 'three/examples/jsm/utils/SkeletonUtils.js';

// BVHの情報だけからBoneのワールド座標系を得るために使用
//const evalScene: THREE.Scene = new THREE.Scene(); // と思ったけど中止

class DummyBVH implements BVH {
  isDummy = true;
  skeleton = new THREE.Skeleton([new THREE.Bone()]);
  clip = new THREE.AnimationClip('dummy');
};

interface ActionSeed {
  name: string;
  bvh: BVH;
  scale: number;
  offset: Vec3;
  parts: Record<string,THREE.Object3D>;
}

interface ViewAction {
  actionRoot: THREE.Object3D;
  boneRoot: THREE.Bone;
}

/**
 * まだ適当。
 */
export class Acerola3D extends ObjectA3 implements AsyncInitRequired<Acerola3D> {
  bvhs: Record<string,BVH> = {}; // 同じ物、2度読まないように
  vrmls: Record<string,THREE.Object3D> = {}; // 同じ物、2度読まないように

  readonly ready: Promise<Acerola3D>;
  viewActions: Record<string,ViewAction>;
  currentAction: ViewAction;
  comment: string | null = null; // CATALOG.XMLの<c>の中

  constructor(url: string) {
    super();
    this.viewActions = {};
    this.currentAction = { // 本当にダミー
      actionRoot: new THREE.Object3D(),
      boneRoot: new THREE.Bone()
    };
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
    const unzippedA3 = await unzipAsync(url);
    const xmlParser = new DOMParser();
    const xmlStr = readStringFromUnzippedA3(unzippedA3,'CATALOG.XML');
    const xmlDoc = xmlParser.parseFromString(xmlStr, "application/xml");
    if (xmlDoc.querySelector('parsererror')) {
      console.error(`Acerola3D.asyncInit(): CATALOG.XML parse error.`);
      return this;
    }
    const ns = 'http://acerola3d.sourceforge.jp/a3/catalog';
    const cs = xmlDoc.getElementsByTagNameNS(ns,'c');
    if (cs[0]) this.comment = cs[0].textContent;
    const as = xmlDoc.getElementsByTagNameNS(ns,'a');
    const actionSeeds: ActionSeed[] = [];
    for (const a of Array.from(as)) {
      const actionName = a.getAttribute('an');
      if (actionName) {
        const actionBVH = a.getAttribute('bvh'); // 確か無いときもあった
        let bvh: BVH | null = null;
        if (actionBVH) {
          const bvhKey = unzippedA3.zipUrl + '!' + actionBVH;
          if (this.bvhs[bvhKey]) {
            bvh = cloneBVH(this.bvhs[bvhKey]);
          } else {
            bvh = await loadBvhInUnzippedA3(unzippedA3, actionBVH);
            this.bvhs[actionBVH] = bvh;
          }
          //以下の行はBVHの動きの補間をOFFにする。Acerola3DのBVHの使い方では必要だけど・・・
          if (bvh)
            bvh.clip.tracks.forEach(track=>{track.setInterpolation(THREE.InterpolateDiscrete);});
        } else {
          bvh = new DummyBVH();
        }
        const actionScale = a.getAttribute('scale');
        const scale = actionScale ? Number(actionScale) : 1.0;
        const actionOffset = a.getAttribute('offset');
        const offset = new Vec3();
        if (actionOffset) {
          const as = actionOffset.split(" ");
          offset.set(Number(as[0]),Number(as[1]),Number(as[2]));
        }
        const parts: Record<string,THREE.Object3D> = {};
        const ps = a.getElementsByTagNameNS(ns,'p');
        for (const p of Array.from(ps)) {
          const partName = p.getAttribute('name');
          const wrl = p.getAttribute('wrl');
          if (partName && wrl) {
            let vrml;
            const vrmlKey = unzippedA3.zipUrl + '!' + wrl;
            if (this.vrmls[vrmlKey]) {
              vrml = this.vrmls[vrmlKey].clone(true);
              parts[partName] = vrml;
            } else {
              vrml = await loadVrmlInUnzippedA3(unzippedA3,wrl);
              this.vrmls[vrmlKey] = vrml;
              parts[partName] = vrml;
            }
          }
        }
        actionSeeds.push({
          name: actionName,
          bvh,
          scale,
          offset,
          parts
        });
      }
    }
    this.generateViewActionsFromActionSeeds(actionSeeds);
    if (this.motion instanceof Acerola3DMotion)
      this.motion.myInitialize(actionSeeds);
    return this;
  }

  generateViewActionsFromActionSeeds(actionSeeds:ActionSeed[]) {
    this.viewActions = {};
    for (const seed of actionSeeds) {
      const actionRoot = new THREE.Object3D();
      actionRoot.position.set(seed.offset.x,seed.offset.y,seed.offset.z);
      actionRoot.scale.set(seed.scale,seed.scale,seed.scale);
      if (seed.bvh instanceof DummyBVH) { // 実質BVHが無い時
        for (const part of Object.values(seed.parts))
          actionRoot.add(part);
        this.viewActions[seed.name] = {
          actionRoot,
          boneRoot: seed.bvh.skeleton.bones[0].clone(true)
        }
      } else {
        const boneRoot = seed.bvh.skeleton.bones[0].clone(true);
        actionRoot.add(boneRoot);
        appendPartToBone(boneRoot,seed.parts);
        this.viewActions[seed.name] = {
          actionRoot,
          boneRoot
        }
      }
      // クリックなどへの対応
      actionRoot.traverse((o)=>{
        o.userData['a3js']={objectA3:this};
      });
    }
  }

  changeAction(actionName: string) {
    this.object.remove(this.currentAction.actionRoot);
    const vAct = this.viewActions[actionName];
    this.object.add(vAct.actionRoot);
    this.currentAction = vAct;
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
  bvh: BVH;
  mixer?: THREE.AnimationMixer;
  clipAction?:  THREE.AnimationAction;
}

export class Acerola3DMotion extends Motion {
  // objectA3?: ObjectA3; スーパークラスから
  // object3D?: THREE.Object3D; スーパークラスから
  actionSeeds: ActionSeed[];
  motionActions: Record<string,MotionAction>;
  currentAction?: MotionAction;
  isPaused: boolean;

  constructor(objectA3: ObjectA3) {
    super(objectA3);
    this.isPaused = false;
    this.actionSeeds = [];
    this.motionActions = {};
  }

  setObject(objectA3: ObjectA3) {
    this.isPaused = false;
    if (objectA3 instanceof Acerola3D) {
      super.setObject(objectA3);
      if (this.actionSeeds.length>0)
        this.myInitialize([]);
    } else {
      console.warn('Acerola3DMotion can set only Acerola3D object.');
    }
  }

  myInitialize(actionSeeds:ActionSeed[]) {
    if (!(this.objectA3 instanceof Acerola3D))
      return;
    const newActionSeeds: ActionSeed[] = []
    for (const actionSeed of this.actionSeeds) {
      newActionSeeds.push(actionSeed);
    }
    for (const actionSeed of actionSeeds) {
      if (newActionSeeds.filter(s=>s.name===actionSeed.name).length===0)
        newActionSeeds.push(actionSeed);
    }
    this.objectA3.generateViewActionsFromActionSeeds(newActionSeeds);
    this.actionSeeds = newActionSeeds;
    this.motionActions = {};
    for (const seed of this.actionSeeds) {
      if (seed.bvh instanceof DummyBVH) {
        this.motionActions[seed.name] = {
          bvh: seed.bvh
        }
        break;
      }
      const boneRoot = this.objectA3.viewActions[seed.name].boneRoot;
      const mixer = new THREE.AnimationMixer(boneRoot);
      const clipAction = mixer.clipAction(seed.bvh.clip);
      const mAction: MotionAction = {
        bvh: seed.bvh,
        mixer,
        clipAction
      };
      this.motionActions[seed.name] = mAction;
    }

    const name = this.actionSeeds[0].name;
    this.objectA3.changeAction(name);
    const action = this.motionActions[name];
    action.clipAction?.play();
    this.currentAction = action;
    }

  detachObject(objectA3: ObjectA3) {
    if (!(this.objectA3 instanceof Acerola3D))
      return;
    const firstName = this.actionSeeds[0].name;
    for (const seed of this.actionSeeds) {
      const action = this.motionActions[seed.name];
      action.mixer?.stopAllAction();
      const boneRoot = this.objectA3.viewActions[seed.name].boneRoot;
      if (boneRoot)
        action.mixer?.uncacheRoot(boneRoot);
      //action.mixer = null;
      //action.clipAction = null;
      delete this.motionActions[seed.name];
    }

    this.objectA3.changeAction(firstName);
    super.detachObject(objectA3);
  }
  
  //static loc = new THREE.Vector3(); // 毎回生成しなくて良いように
  //static quat = new THREE.Quaternion(); // 毎回生成しなくて良いように
  //static scale = new THREE.Vector3(); // 毎回生成しなくて良いように
  update(dt: number) {
    super.update(dt);
    if (!this.currentAction)
      return;
    if (!this.isPaused && this.currentAction.mixer) {
      this.currentAction.mixer?.update(dt);
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
    if (!(this.objectA3 instanceof Acerola3D))
      return;
    const a = this.motionActions[actionName];
    if (a) {
      if (this.currentAction)
        this.currentAction.clipAction?.stop();
      this.objectA3.changeAction(actionName);
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
