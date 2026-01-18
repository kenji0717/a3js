import { unzip, strFromU8 } from 'fflate'; // 'three/addons/libs/fflate.module.js';
import type { Unzipped } from 'fflate'; // 'three/addons/libs/fflate.module.js';

export function times2(x: number): number {
  return 2*x;
}

export function asyncSleep(time: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(()=>{resolve();},time);
  });
}

export async function unzipAsync(url: string): Promise<Unzipped> {
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
  return ret;
}

export function readStringFromUnzipped(unzipped: Unzipped, path: string): string {
  path = path.replace(/^\.\//,'').replace(/^\//,'');
  if (unzipped[path]) {
    return strFromU8(unzipped[path]);
  } else {
    throw new Error(`readStringFromUnzipped(): no file at ${path}`);
  }
}

export function readBlobFromUnzipped(unzipped: Unzipped, path: string): Blob {
  path = path.replace(/^\.\//,'').replace(/^\//,'');
  if (unzipped[path]) {
    const mime_type = mimeTypeFromPath(path);
    return new Blob([new Uint8Array(unzipped[path])],{type: mime_type});
  } else {
    throw new Error(`readBlobFromUnzipped(): no file at ${path}`);
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
