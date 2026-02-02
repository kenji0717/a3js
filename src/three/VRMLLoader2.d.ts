import { Loader, LoadingManager, Scene } from "three";

export class VRMLLoader2 extends Loader<Scene> {
    constructor(manager?: LoadingManager);

    parse(data: string, path: string): Scene;
}
