import * as THREE from 'three';
import { ActionObject } from './ActionObject';
import type { Action } from './ActionObject';
import { Vec3 } from './LinearMath';
import { unzipAsync, readStringFromUnzippedA3 } from '../utils/math';
import { loadVrmlInUnzippedA3, vrmlBackgroundTexture,
         vrmlFog, loadBvhInUnzippedA3,
         cloneBVH } from '../three/threeUtils';
import { ClipMotion } from '../three/ClipMotion.js';
import type { BVH } from '../three/BVHLoader2.js';
import * as TG from '../utils/TypeGuard';
import { Sound } from '../three/Sound';
import type { SoundOptionsInput } from '../three/Sound';
import { readBlobFromUnzippedA3 } from '../utils/math';
//import * as SkeletonUtils from 'three/examples/jsm/utils/SkeletonUtils.js';

class DummyBVH implements BVH {
  isDummy = true;
  skeleton = new THREE.Skeleton([new THREE.Bone()]);
  clip = new THREE.AnimationClip('dummy');
};

const bvhs: Record<string,BVH> = {}; // 同じ物、2度読まないように
const vrmls: Record<string,THREE.Object3D> = {}; // 同じ物、2度読まないように

/**
 * まだ適当。
 */
export class Acerola3D extends ActionObject<Acerola3D> {
  haltActionNo: number = 0; // 未実装 GAHA
  walkActionNo: number = 0; // 未実装 GAHA
  runActionNo: number = 0; // 未実装 GAHA
  minWalkSpeed: number = 0.1; // 未実装 GAHA
  minRunSpeed: number = 1.0; // 未実装 GAHA
  billboard: boolean = false; // 未実装 GAHA
  comment: string | null = null; // CATALOG.XMLの<c>の中
  tags: string[] = []; // 未実装 GAHA
  profiles: string[] = []; // 未実装 GAHA
  thumbnails: Blob[] = []; // 未実装 GAHA
  rdf: Element | null = null; // 未実装 GAHA
  htmlfile: string = ''; // 未実装 GAHA

  constructor(url: string) {
    super(url);
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
    const a3Elms = xmlDoc.getElementsByTagNameNS(ns,'a3');
    if (a3Elms[0]) {
      this.haltActionNo = Number(a3Elms[0].getAttribute('haltActionN0'));
      this.walkActionNo = Number(a3Elms[0].getAttribute('walkActionN0'));
      this.runActionNo = Number(a3Elms[0].getAttribute('runActionN0'));
      this.minWalkSpeed = Number(a3Elms[0].getAttribute('minWalkSpeed'));
      this.minRunSpeed = Number(a3Elms[0].getAttribute('minRunSpeed'));
      this.billboard = Boolean(a3Elms[0].getAttribute('billboard'));
    }
    const cs = xmlDoc.getElementsByTagNameNS(ns,'c');
    if (cs[0]) this.comment = cs[0].textContent;
    const ts = xmlDoc.getElementsByTagNameNS(ns,'tag');
    Array.from(ts).forEach((t)=>{const n=t.getAttribute('name'); if(n) this.tags.push(n);});
    const ps = xmlDoc.getElementsByTagNameNS(ns,'profile');
    Array.from(ps).forEach((p)=>{const n=p.getAttribute('uri'); if(n) this.profiles.push(n);});
    const tns = xmlDoc.getElementsByTagNameNS(ns,'thumbnail');
    Array.from(tns).forEach((tn)=>{
      const n=tn.getAttribute('src');
      if(n) {
        const img = readBlobFromUnzippedA3(unzippedA3,n);
        this.thumbnails.push(img);
      }
    });
    const rdfs = xmlDoc.getElementsByTagNameNS('http://www.w3.org/1999/02/22-rdf-syntax-ns#','RDF');
    if (rdfs[0]) this.rdf = rdfs[0];
    const hs = xmlDoc.getElementsByTagNameNS(ns,'htmlfile');
    if (hs[0]) {
      const n = hs[0].getAttribute('src');
      if (n)
        this.htmlfile = readStringFromUnzippedA3(unzippedA3,n);
    }

    const as = xmlDoc.getElementsByTagNameNS(ns,'a');
    const actions: Record<string,Action> = {};
    let firstActionName;
    for (const a of Array.from(as)) {
      const actionName = a.getAttribute('an');
      if (actionName) {
        if (!firstActionName) firstActionName = actionName;
        let bvh: BVH | undefined;
        const actionBVH = a.getAttribute('bvh'); // 確か無いときもあった
        if (actionBVH && actionBVH!=='none') {
          const bvhKey = unzippedA3.zipUrl + '!' + actionBVH;
          if (!bvhs[bvhKey])
            bvhs[bvhKey] = await loadBvhInUnzippedA3(unzippedA3, actionBVH);
          bvh = cloneBVH(bvhs[bvhKey]);
          //以下の行はBVHの動きの補間をOFFにする。Acerola3DのBVHでは必須。
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
        const actionRot = a.getAttribute('rot');
        const rot = new Vec3();
        if (actionRot) {
          const ar = actionRot.split(" ");
          rot.set(Number(ar[0]),Number(ar[1]),Number(ar[2]));
        }
        /*
        GAHA!!! <a>の未実装属性
        loop
        rightBalloonOffset
        leftBalloonOffset
        topBalloonOffset
        bottomBalloonOffset
        labelOffset
        segno
        dalsegno
        */
        let backgroundTexture: THREE.Texture | undefined;
        let fog: THREE.Fog | THREE.FogExp2 | undefined;
        const parts: Record<string,THREE.Object3D> = {};
        const ps = a.getElementsByTagNameNS(ns,'p');
        for (const p of Array.from(ps)) {
          const partName = p.getAttribute('name');
          const wrl = p.getAttribute('wrl');
          if (partName && wrl) {
            const vrmlKey = unzippedA3.zipUrl + '!' + wrl;
            if (!vrmls[vrmlKey]) {
              vrmls[vrmlKey] = await loadVrmlInUnzippedA3(unzippedA3,wrl);
              if (vrmlBackgroundTexture) {
                backgroundTexture = vrmlBackgroundTexture;
              }
              if (vrmlFog) {
                fog = vrmlFog;
              }
            }
            const s = p.getAttribute('scale');
            if (s) {
              const ss = Number(s);
              vrmls[vrmlKey].scale.set(ss,ss,ss);
            }
            const r = p.getAttribute('rot');
            if (r) {
              const rs = r.split(' ');
              vrmls[vrmlKey].rotation.set(
                Number(rs[0])/180*Math.PI,
                Number(rs[1])/180*Math.PI,
                Number(rs[2])/180*Math.PI,'ZXY');
            }
            const o = p.getAttribute('offset');
            if (o) {
              const os = o.split(' ');
              vrmls[vrmlKey].position.set(
                Number(os[0]),
                Number(os[1]),
                Number(os[2]));
            }
            parts[partName] = vrmls[vrmlKey].clone(true);
          }
        }
        const root = new THREE.Object3D();
        root.add(bvh.skeleton.bones[0]);
        if (!(bvh instanceof DummyBVH)) {
          appendPartToBone(root,parts);
        }
        Object.values(parts).forEach((p)=>{
          root.add(p);
        });
        root.scale.set(scale,scale,scale);
        rot.scale(Math.PI/180);
        root.setRotationFromEuler(new THREE.Euler(rot.x,rot.y,rot.z,'ZXY')); // 'ZXY'は仕様で決まってる
        root.position.add(offset);
        // クリックなどへの対応
        root.traverse((o)=>{
          o.userData['a3js']={objectA3:this};
        });
//root.add(new THREE.SkeletonHelper(bvh.skeleton.bones[0])); // GAHA!
        let sound: Sound | undefined;
        let soundContinue: boolean = true;
        const ss = a.getElementsByTagNameNS(ns,'s');
        if (ss[0]) {
          const file = ss[0].getAttribute('file');
          const sType = ss[0].getAttribute('type') || 'PointSound';
          const loop = ss[0].getAttribute('loop') || 'false';
          const gain = ss[0].getAttribute('gain') || '1.0';
          const offset = ss[0].getAttribute('offset') || '0.0 0.0 0.0';
          const direction = ss[0].getAttribute('direction') || '0.0 0.0 1.0';
          const sContinue = ss[0].getAttribute('continue') || 'true';
          soundContinue = sContinue==='true';
          const os = offset.split(' ').map((s)=>Number(s));
          const offsetVec3 = new Vec3(os[0],os[1],os[2]);
          const ds = direction.split(' ').map((s)=>Number(s));
          const directionVec3 = new Vec3(ds[0],ds[1],ds[2]);
          const ssType = sType==='PointSound'?'positional':(sType==='ConeSound'?'positional':'audio');
          const pDir = {coneInnerAngle:360,coneOuterAngle:360,coneOuterGain:0};
          const cDir = {coneInnerAngle:30,coneOuterAngle:90,coneOuterGain:0.1};
          const directional = sType==='PointSound'?pDir:cDir;
          if (file) {
            const blob = readBlobFromUnzippedA3(unzippedA3,file);
            const url = URL.createObjectURL(blob);
            const opt: SoundOptionsInput = {
              type: ssType,
              //autoplay: false,
              loop: loop==='true',
              volume: Number(gain),
              positional: {
                //refDistance: 1,
                //maxDistance: 1000,
                //rolloffFactor: 1,
                directional
              }
            };
            sound = await new Sound(url,opt).ready;
            sound.setLocation(offsetVec3);
            sound.lookAt(directionVec3);
            URL.revokeObjectURL(url);
            root.add(sound.object); // この処理が強引 GAHA
            //this.add(sound); // この処理が強引 GAHA
          }
        }

        actions[actionName] = {
          shape: { root, bones, skeleton: bvh.skeleton },
          motion: new ClipMotion(bvh.clip,actionName),
          sound,
          soundContinue,
          backgroundTexture,
          fog
        };
      }
    }
    if (firstActionName)
      this.syncInit(firstActionName,actions);
    return this;
  }
}

function appendPartToBone(obj: THREE.Object3D, parts: Record<string,THREE.Object3D>) {
  if (TG.isBone(obj)) {
    const part = parts[obj.name]; 
    if (part) {
      obj.add(part);
      delete parts[obj.name];
    }
  }
  if (obj.children) {
    obj.children.forEach( o => {
      appendPartToBone(o,parts);
    });
  }
}
