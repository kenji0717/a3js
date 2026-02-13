import * as THREE from 'three';
import { ObjectA3 } from './ObjectA3';
import type { AsyncInitRequired } from './AsyncInitRequired';
import { Vec3 } from './LinearMath';
import { unzipAsync, readStringFromUnzippedA3 } from '../utils/math';
import { loadVrmlInUnzippedA3,
         loadBvhInUnzippedA3,
         cloneBVH } from '../three/threeUtils';
import type { PoseMotion } from './Motion';
import { ClipPoseMotion } from '../three/ClipPoseMotion';
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

interface Action {
  name: string;
  root: THREE.Object3D;
  bones: Record<string,THREE.Object3D>;

  bvh: BVH;
  scale: number;
  offset: Vec3;
  parts: Record<string,THREE.Object3D>;
}

/**
 * まだ適当。
 */
export class Acerola3D extends ObjectA3 implements AsyncInitRequired<Acerola3D> {
  bvhs: Record<string,BVH> = {}; // 同じ物、2度読まないように
  vrmls: Record<string,THREE.Object3D> = {}; // 同じ物、2度読まないように

  readonly ready: Promise<Acerola3D>;
  actions: Record<string,Action>;
  currentAction?: Action;
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
    const clipPoseMotions: Record<string,PoseMotion> = {};
    for (const a of Array.from(as)) {
      const actionName = a.getAttribute('an');
      if (actionName) {
        let bvh: BVH | undefined;
        const actionBVH = a.getAttribute('bvh'); // 確か無いときもあった
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
        const root = bvh.skeleton.bones[0];
        appendPartToBone(root,parts);
        // クリックなどへの対応
        root.traverse((o)=>{
          o.userData['a3js']={objectA3:this};
        });
        actions[actionName] = {
          name: actionName,
          root,
          bones,
          bvh,
          scale,
          offset,
          parts
        };
        clipPoseMotions[actionName] = new ClipPoseMotion(bvh.clip);
      }
    }
    this.actions = actions;
    this.setPoseMotions(clipPoseMotions);
    return this;
  }

  changeAction(actionName: string) {
    if (this.currentAction)
      this.object.remove(this.currentAction.root);
    const vAct = this.actions[actionName];
    this.object.add(vAct.root);
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
