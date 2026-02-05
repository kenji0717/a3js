import * as THREE from 'three';
import { Font, FontLoader } from 'three/examples/jsm/loaders/FontLoader.js';
import { TextGeometry } from 'three/examples/jsm/geometries/TextGeometry.js';
import { ObjectA3 } from './ObjectA3';
import { isString } from '../utils/TypeGuard';
import { unzipAsync, readStringFromUnzippedA3 } from '../utils/math';

let font: Font | null = null;
/**
 * Text3Dを使う前にフォントを初期化しなければならないので、
 * この関数で初期化する。フォントはttfファイルから
 * TypeFace.js (https://gero3.github.io/facetype.js/) を
 * 使ってJSONファイルにする。日本語フォントとかだとサイズが
 * 大きくなるので、そのZIP圧縮ファイルにも対応させた。もと
 * もとのフォントファイルのファイル名がabcdefg.jsonの時は、
 * `zip abcdefg.json.zip abcdefg.json`として圧縮ファイルを
 * 作って下さい。(つまりその圧縮ファイルの中に含まれている
 * もとのファイルのファイル名が圧縮ファイルのファイル名から
 * 予測できるようにする。)
 */ 
export async function initFont(path: string) {
  if (path.match(/.zip$/i)) {
    let path2 = path.substring(path.lastIndexOf('/')); // zipファイル前のpathを削る
    path2 = path2.substring(0,path2.length-4); // '.zip'を削る
    const zip = await unzipAsync(path)
    const jsonStr = readStringFromUnzippedA3(zip, path2);

    font = new Font(JSON.parse(jsonStr));
  } else {
    const fontLoader = new FontLoader();
    font = await fontLoader.loadAsync(path);
  }
}

export class Text3D extends ObjectA3 {
  initObject(data: any) {
    let str;
    if (isString(data)) {
      str = data;
    } else {
      str = "ERROR";
    }
    if (font == null) {
      const geo = new THREE.BoxGeometry();
      const mat = new THREE.MeshStandardMaterial({ color: 0xff0000 });
      const mesh = new THREE.Mesh(geo, mat);
      return mesh;
    } else {
      const opt = {font: font,size: 1,depth: 0.5,curveSegments: 12};
      const geo = new TextGeometry(str,opt);
      geo.center();
      const mat = new THREE.MeshStandardMaterial({ color: 0x00ff00 });
      const mesh = new THREE.Mesh(geo, mat);
      return mesh;
    }
  }
}
