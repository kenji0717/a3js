import { unzip, strFromU8 } from 'fflate'; // 'three/addons/libs/fflate.module.js';
import type { Unzipped } from 'fflate'; // 'three/addons/libs/fflate.module.js';
import { Vec3, Quat, Transform } from '../core/LinearMath';

// new を避けるための共同利用用インスタンス
// コピペ用import文
// import { tmp } from '../utils/math';
export const tmp = {
  v0: new Vec3(),
  v1: new Vec3(),
  v2: new Vec3(),
  v3: new Vec3(),
  v4: new Vec3(),
  q0: new Quat(),
  q1: new Quat(),
  q2: new Quat(),
  q3: new Quat(),
  q4: new Quat(),
  t0: new Transform(),
  t1: new Transform(),
  t2: new Transform(),
  t3: new Transform(),
  t4: new Transform()
};




export function asyncSleep(time: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(()=>{resolve();},time);
  });
}

/**
 * ZIPファイルを解凍した情報の型。
 * 中にfflateのUnzippedが入ってるラッパーだが、
 * ZIPファイル自体のURLも含められるようになっている。
 */
export interface UnzippedA3 {
  zipUrl: string;
  unzipped: Unzipped;
}

export async function unzipAsync(url: string): Promise<UnzippedA3> {
  const res = await fetch(url);
  const arrayBuffer = await res.arrayBuffer();
  const ret = await new Promise<Unzipped>((resolve, reject) => {
    unzip(new Uint8Array(arrayBuffer),(err,data) => {
      if (!err)
        resolve(data);
      else
        reject(err)
    });
  });
  return {zipUrl: url, unzipped: ret};
}

export function readStringFromUnzippedA3(unzippedA3: UnzippedA3, path: string): string {
  path = path.replace(/^\.\//,'').replace(/^\//,'');
  if (unzippedA3.unzipped[path]) {
    return strFromU8(unzippedA3.unzipped[path]);
  } else {
    throw new Error(`readStringFromUnzippedA3(): no file at ${path}`);
  }
}

export function readBlobFromUnzippedA3(unzippedA3: UnzippedA3, path: string): Blob {
  path = path.replace(/^\.\//,'').replace(/^\//,'');
  if (unzippedA3.unzipped[path]) {
    const mime_type = mimeTypeFromPath(path);
    return new Blob([new Uint8Array(unzippedA3.unzipped[path])],{type: mime_type});
  } else {
    throw new Error(`readBlobFromUnzippedA3(): no file at ${path}`);
  }
}


const mime_type = {
  'image/png': /\.png$/i,
  'image/jpeg': /\.(jpg|jpeg)$/i,
  'image/gif': /\.gif$/i,
  'model/vrml': /\.wrl$/i,
  'application/xml': /\.xml$/i,
  'application/octet-stream': /\.bvh/i, // まあ。
  'audio/x-wav': /\.wav/i,
  'audio/mpeg': /\.mp3/i,
  'audio/ogg': /\.ogg/i,
  'text/plain': /\.(txt|text)$/i,
  'model/gltf+json': /\.gltf$/i,
  'model/gltf-binary': /\.glb$/i,
};

export function mimeTypeFromPath(path: string): string {
  for (const [mt, re] of Object.entries(mime_type))
    if (re.test(path))
      return mt;
  return 'application/octet-stream';
}

// ChatGPTに教えてもらったマージできる設定の型とマージ関数。
// 抜けのない完璧な設定の型(例えばXOption)を定義した後、
// 完璧なデフォルトの設定を用意(例えばdefaultXOption)。
// ユーザにはその型のDeepPartial<XOption>を要求することで
// 全ての設定を指定しなくて良くなって、
// deepMarge<XOption>(defaultXOption,userOption);で完璧な
// 設定が用意できるという仕組み。

export type DeepPartial<T> = {
  [K in keyof T]?: T[K] extends object
    ? DeepPartial<T[K]>
    : T[K];
};

export function deepMerge<T>(base: T, override?: DeepPartial<T>): T {
  if (!override) return base;

  const result = { ...base } as any;
  for (const key in override) {
    if (
      typeof base[key] === "object" &&
      typeof override[key] === "object"
    ) {
      result[key] = deepMerge(base[key], override[key]!);
    } else {
      result[key] = override[key];
    }
  }
  return result;
}

