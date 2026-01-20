import * as THREE from 'three';
import { Font } from 'three/examples/jsm/loaders/FontLoader.js';
import { TextGeometry } from 'three/examples/jsm/geometries/TextGeometry.js';
import { ObjectA3 } from './ObjectA3';
import { isString } from '../utils/TypeGuard';
import { unzipSync, strFromU8 } from 'three/addons/libs/fflate.module.js';

let font: Font | null = null;
/**
 * Text3Dを使う前にフォントを初期化しなければならないので、
 * この関数で初期化する。フォントはttfファイルから
 * TypeFace.js (https://gero3.github.io/facetype.js/) を
 * 使ってJSONファイルにする。そのフォントファイルが
 * abcdefg.jsonだとすると、`zip abcdefg.json.zip abcdefg.json`と
 * して圧縮ファイルを作り、`abcdefg.json.zip`を引数のpathに
 * 渡して初期化して下さい。(つまり、ZIPファイルのファイル名を
 * 書き換えると読み込めなくなります。)
 */ 
export async function initFont(path: string) {
  const path2 = path.substring(0,path.length-4); // '.zip'を削る
  const loader = new THREE.FileLoader();
  loader.setResponseType('arraybuffer');
  const data = await loader.loadAsync(path) as ArrayBuffer;
  const zip = unzipSync(new Uint8Array(data));
  const strArray = strFromU8(new Uint8Array(zip[path2].buffer));

  font = new Font(JSON.parse(strArray));
  
  //font = await fontLoader.loadAsync(path);
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
