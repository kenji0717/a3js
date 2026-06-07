import * as THREE from 'three';
import { Font, FontLoader } from 'three/examples/jsm/loaders/FontLoader.js';
import { TextGeometry } from 'three/examples/jsm/geometries/TextGeometry.js';
import { ObjectA3 } from './ObjectA3';
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

/** Text3D生成時に指定可能な設定項目。 */
export interface Text3DOptions {
  /** 色。数値で `0xff0000` のように指定する。 */
  color: number;
}

/** Text3Dの設定項目のデフォルト値。 */
export const defaultText3DOptions: Text3DOptions = {
  color: 0xff0000
};

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
  options: Text3DOptions;

  constructor(text: string, options: Partial<Text3DOptions>) {
    const opt = {
      ...defaultText3DOptions,
      ...options
    };
    const args = {
      text,
      color: opt.color
    };
    super(args);
    this.options = opt;
  }

  initObject(args: {text: string, color: number}) {
    let str = args.text;
    if (font == null) {
      const geo = new THREE.BoxGeometry();
      const mat = new THREE.MeshStandardMaterial({ color: 0xff0000 });
      const mesh = new THREE.Mesh(geo, mat);
      return mesh;
    } else {
      const opt = {font: font,size: 1,depth: 0.5,curveSegments: 12};
      const geo = new TextGeometry(str,opt);
      geo.center();
      const mat = new THREE.MeshStandardMaterial({ color: args.color });
      const mesh = new THREE.Mesh(geo, mat);
      return mesh;
    }
  }
}
