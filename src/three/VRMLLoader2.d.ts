import { Loader, LoadingManager, Scene, CubeTexture, Fog, FogExp2 } from "three";

export class VRMLLoader2 extends Loader<Scene> {
    constructor(manager?: LoadingManager);

    parse(data: string, path: string): Scene;
}

export const vrmlLoaderBackgroundTexture: CubeTexture | undefined;
export const vrmlLoaderFog: Fog | FogExp2 | undefined;
