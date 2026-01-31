import { AnimationClip, Loader, LoadingManager, Skeleton } from "three";

export interface BVH {
    clip: AnimationClip;
    skeleton: Skeleton;
}

export class BVHLoader2 extends Loader<BVH> {
    constructor(manager?: LoadingManager);
    animateBonePositions: boolean;
    animateBoneRotations: boolean;

    parse(text: string): BVH;
}
