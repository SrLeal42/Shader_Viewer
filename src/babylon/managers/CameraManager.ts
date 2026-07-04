import * as B from '@babylonjs/core';

export class CameraManager {
    public camera: B.ArcRotateCamera;

    constructor(scene: B.Scene, canvas: HTMLCanvasElement) {
        this.camera = new B.ArcRotateCamera('camera', Math.PI / 2, Math.PI / 3, 5, B.Vector3.Zero(), scene);
        this.camera.attachControl(canvas, true);
        this.camera.wheelPrecision = 50;
        this.camera.minZ = 0.1;
    }
}
