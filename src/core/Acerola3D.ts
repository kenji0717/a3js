import * as THREE from 'three';
import { ObjectA3 } from './ObjectA3';
import type { AsyncInitRequired } from './AsyncInitRequired';
import { Vec3 } from './LinearMath';
import { unzipAsync, readStringFromUnzippedA3 } from '../utils/math';
import { loadVrmlInUnzippedA3,
         loadBvhInUnzippedA3,
         cloneBVH } from '../three/threeUtils';
import { ClipPoseMotion } from '../three/ClipPoseMotion';
import type { BVH } from '../three/BVHLoader2.js';
import * as TG from '../utils/TypeGuard';
//import * as SkeletonUtils from 'three/examples/jsm/utils/SkeletonUtils.js';

class DummyBVH implements BVH {
  isDummy = true;
  skeleton = new THREE.Skeleton([new THREE.Bone()]);
  clip = new THREE.AnimationClip('dummy');
};

interface Action {
  name: string;
  root: THREE.Object3D;
  bones: Record<string,THREE.Object3D>;
  skeleton: THREE.Skeleton;

  bvh: BVH;
  scale: number;
  offset: Vec3;
  parts: Record<string,THREE.Object3D>;
}

const bvhs: Record<string,BVH> = {}; // 同じ物、2度読まないように
const vrmls: Record<string,THREE.Object3D> = {}; // 同じ物、2度読まないように

/**
 * まだ適当。
 */
export class Acerola3D extends ObjectA3 implements AsyncInitRequired<Acerola3D> {
  readonly ready: Promise<Acerola3D>;
  actions: Record<string,Action>;
  comment: string | null = null; // CATALOG.XMLの<c>の中

  constructor(url: string) {
    super();
    this.actions = {};
    this.ready = this.asyncInit(url);
  }

  initObject() {
    // ルートとなるObject3Dだけ用意して後でその中に
    // ロードしたモデルをaddする。
    return new THREE.Object3D();
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
    const actions: Record<string,Action> = {};
    const a3PoseMotions: Record<string,Acerola3DPoseMotion> = {};
    let firstActionName;
    for (const a of Array.from(as)) {
      const actionName = a.getAttribute('an');
      if (actionName) {
        if (!firstActionName) firstActionName = actionName;
        let bvh: BVH | undefined;
        const actionBVH = a.getAttribute('bvh'); // 確か無いときもあった
        if (actionBVH) {
          const bvhKey = unzippedA3.zipUrl + '!' + actionBVH;
          if (!bvhs[bvhKey])
            bvhs[bvhKey] = await loadBvhInUnzippedA3(unzippedA3, actionBVH);
          bvh = cloneBVH(bvhs[bvhKey]);
          //以下の行はBVHの動きの補間をOFFにする。Acerola3DのBVHの使い方では必要だけど・・・
          if (bvh)
            bvh.clip.tracks.forEach(track=>{track.setInterpolation(THREE.InterpolateDiscrete);});
        } else {
          bvh = new DummyBVH();
        }
        const bones: Record<string,THREE.Object3D> = {};
        bvh.skeleton.bones.forEach((bone)=>{
          bones[bone.name] = bone;
        });
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
            const vrmlKey = unzippedA3.zipUrl + '!' + wrl;
            if (!vrmls[vrmlKey])
              vrmls[vrmlKey] = await loadVrmlInUnzippedA3(unzippedA3,wrl);
            parts[partName] = vrmls[vrmlKey].clone(true);
          }
        }
        const root = new THREE.Object3D();
        root.add(bvh.skeleton.bones[0]);
        appendPartToBone(root,parts);
        root.position.add(offset);
        root.scale.set(scale,scale,scale);
        // クリックなどへの対応
        root.traverse((o)=>{
          o.userData['a3js']={objectA3:this};
        });
//root.add(new THREE.SkeletonHelper(bvh.skeleton.bones[0])); // GAHA!
        actions[actionName] = {
          name: actionName,
          root,
          bones,
          skeleton: bvh.skeleton,
          bvh,
          scale,
          offset,
          parts
        };
console.log(`actionName=${actionName}`);
        a3PoseMotions[actionName] = new Acerola3DPoseMotion(bvh.clip,actionName);
      }
    }
    this.actions = actions;
    this.setPoseMotions(a3PoseMotions);
    if (firstActionName)
      this.setState(firstActionName);
    return this;
  }

  addAction(action: Action) {
    this.actions[action.name] = action;
  }

  removeAction(name: string): Action {
    const a = this.actions[name];
    delete this.actions[name];
    return a;
  }

  addActionRoot(name: string) {
    const action = this.actions[name];
    if (action) {
      this.object.add(action.root);
      this.bones = action.bones;
      this.skeletons = [action.skeleton];
    }
  }

  removeActionRoot(name: string) {
    const action = this.actions[name];
    if (action) {
      this.object.remove(action.root);
      this.bones = {};
      this.skeletons = [];
    }
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

class Acerola3DPoseMotion extends ClipPoseMotion {
  prepare3D(objectA3: ObjectA3) {
    if (objectA3 instanceof Acerola3D) {
      objectA3.addActionRoot(this.name);
    }
  }
  cleanup3D(objectA3: ObjectA3) {
    if (objectA3 instanceof Acerola3D) {
      objectA3.removeActionRoot(this.name);
    }
  }
}