import { Vector3 } from 'three';

/**
 * この関数はThree.jsのexamples/jsm/physics/RapierPhysics.jsに
 * かかれていたものをそのままもってきて少し書き換えた物。
 */
export function getShape( geometry ) {

	const parameters = geometry.parameters;

	// TODO change type to is*

	if ( geometry.type === 'RoundedBoxGeometry' ) {

		const sx = parameters.width !== undefined ? parameters.width / 2 : 0.5;
		const sy = parameters.height !== undefined ? parameters.height / 2 : 0.5;
		const sz = parameters.depth !== undefined ? parameters.depth / 2 : 0.5;
		const radius = parameters.radius !== undefined ? parameters.radius : 0.1;

		return RAPIER.ColliderDesc.roundCuboid( sx - radius, sy - radius, sz - radius, radius );

	} else if ( geometry.type === 'BoxGeometry' ) {

		const sx = parameters.width !== undefined ? parameters.width / 2 : 0.5;
		const sy = parameters.height !== undefined ? parameters.height / 2 : 0.5;
		const sz = parameters.depth !== undefined ? parameters.depth / 2 : 0.5;

		return RAPIER.ColliderDesc.cuboid( sx, sy, sz );

	} else if ( geometry.type === 'SphereGeometry' || geometry.type === 'IcosahedronGeometry' ) {

		const radius = parameters.radius !== undefined ? parameters.radius : 1;
		return RAPIER.ColliderDesc.ball( radius );

	} else if ( geometry.type === 'CylinderGeometry' ) {

		const radius = parameters.radiusBottom !== undefined ? parameters.radiusBottom : 0.5;
		const length = parameters.height !== undefined ? parameters.height : 0.5;

		return RAPIER.ColliderDesc.cylinder( length / 2, radius );

	} else if ( geometry.type === 'CapsuleGeometry' ) {

		const radius = parameters.radius !== undefined ? parameters.radius : 0.5;
		const length = parameters.height !== undefined ? parameters.height : 0.5;

		return RAPIER.ColliderDesc.capsule( length / 2, radius );

	} else if ( geometry.type === 'BufferGeometry' ) {

		const vertices = [];
		const vertex = new Vector3();
		const position = geometry.getAttribute( 'position' );

		for ( let i = 0; i < position.count; i ++ ) {

			vertex.fromBufferAttribute( position, i );
			vertices.push( vertex.x, vertex.y, vertex.z );

		}

		// if the buffer is non-indexed, generate an index buffer
		const indices = geometry.getIndex() === null
			? Uint32Array.from( Array( parseInt( vertices.length / 3 ) ).keys() )
			: geometry.getIndex().array;

		return RAPIER.ColliderDesc.trimesh( vertices, indices );

	}

	console.error( 'RapierPhysics: Unsupported geometry type:', geometry.type );

	return null;

}


// ---------------------------------

/*
import JSZip from 'https://cdn.jsdelivr.net/npm/jszip@3.10.1/+esm';
// VRML
function dummy() {
  const zipBlobMap = new Map();
  const res = await fetch('./axis.a3'); // テクスチャ無し
  const arrayBuffer = await res.arrayBuffer();
  const zip = await JSZip.loadAsync(arrayBuffer);
  const promises = [];
  zip.forEach((relativePath, file) => {
    const p = file.async('arraybuffer').then(buffer => {
      let type = 'application/octet-stream';
      if (file.name.match(/\.(png|jpg|jpeg)$/i)) type = file.name.endsWith('.png') ? 'image/png' : 'image/jpeg';
      if (file.name.endsWith('.wrl')) type = 'model/vrml';
      const blob = new Blob([buffer], {type});
      const blobUrl = URL.createObjectURL(blob);
      zipBlobMap.set(relativePath, blobUrl);
    });
    promises.push(p);
  });
  await Promise.all(promises);
  console.log(zipBlobMap);
  const loader = new VRMLLoader();
  // URLModifierでVRML内のテクスチャ参照をBlob URLに置換
  loader.manager.setURLModifier((url) => {
  console.log(`GAHA: url=${url}`);
    if (url.startsWith('./'))
      url = url.substring(2);
    // VRMLで指定された相対パスをzipBlobMapから検索
    if (zipBlobMap.has(url)) return zipBlobMap.get(url);
    return url;
  });

  let file = "axis.wrl"; // テクスチャ無し
  const mesh = await loader.loadAsync(file);
  mesh.position.y = 1;
  mesh.castShadow = true;
  scene.add(mesh);
}
*/
