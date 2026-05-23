import * as THREE from 'three';
import { Font, FontLoader } from 'three/examples/jsm/loaders/FontLoader.js';
import { TextGeometry } from 'three/examples/jsm/geometries/TextGeometry.js';
import { ObjectA3 } from './ObjectA3';
import { isString } from '../utils/TypeGuard';
import { unzipAsync, readStringFromUnzippedA3 } from '../utils/math';

let font: Font | null = null;
/**
 * `Text3D` を使う前に、このメソッドでフォントを初期化してください。
 *
 * フォントは TTF ファイルを TypeFace.js（https://gero3.github.io/facetype.js/）で変換した JSON ファイルを使います。
 * 日本語フォントのようにファイルが大きくなる場合は、JSON を ZIP 圧縮したファイル（`.json.zip`）も使用できます。
 * （例: `abcdefg.json` → `zip abcdefg.json.zip abcdefg.json`）
 *
 * @param path フォントファイルのパス（`.json` または `.json.zip`）
 *
 * @example
 * ```ts
 * await initFont('fonts/helvetiker_regular.typeface.json');
 * const text = new Text3D('Hello!');
 * scene.add(text);
 * ```
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

/**
 * 3D テキストを表示するオブジェクトです。
 * 事前に `initFont()` でフォントを読み込んでから使ってください。
 * フォントが初期化されていない場合は赤いボックスが表示されます。
 *
 * @example
 * ```ts
 * await initFont('fonts/helvetiker_regular.typeface.json');
 * const text = new Text3D('Score: 100');
 * scene.add(text);
 * ```
 */
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
