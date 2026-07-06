import * as B from '@babylonjs/core';

export class CameraManager {
    public camera: B.ArcRotateCamera;

    constructor(scene: B.Scene, canvas: HTMLCanvasElement) {

        const target = new B.Vector3(0, .5, 0);

        this.camera = new B.ArcRotateCamera(
            'camera', Math.PI / 2, Math.PI / 3, 5, target, scene
        );

        this.camera.position = new B.Vector3(0, .5, -4);
        this.camera.attachControl(canvas, true);
        // this.camera.wheelPrecision = 50;
        // this.camera.minZ = 0.1;

        // // Limites de zoom para não perder o modelo de vista
        // this.camera.lowerRadiusLimit = 1;
        // this.camera.upperRadiusLimit = 20;
    }

    /** Enquadra a câmera automaticamente ao redor de um mesh */
    public frameMesh(mesh: B.AbstractMesh) {
        const bounds = mesh.getBoundingInfo();
        this.camera.setTarget(bounds.boundingBox.centerWorld);

        const radius = bounds.boundingSphere.radiusWorld * 2.5;
        this.camera.radius = Math.max(radius, this.camera.lowerRadiusLimit ?? 1);
    }
}
