import { Loader, LoadingManager, Scene, CubeTexture, Fog, FogExp2 } from "three";

export class VRMLLoader2 extends Loader<Scene> {
    backgroundTexture: CubeTexture | undefined;
    fog: Fog | FogExp2 | undefined;

    constructor(manager?: LoadingManager);

    parse(data: string, path: string): Scene;
}
