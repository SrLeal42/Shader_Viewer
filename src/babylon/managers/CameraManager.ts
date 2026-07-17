import * as B from '@babylonjs/core';

import type { FrustumLimits } from '../../types/Camera';

import { EnvironmentConfigs } from '../../configs/EnviromentConfigs';

export class CameraManager {

    private canvas: HTMLCanvasElement;

    public camera: B.ArcRotateCamera;

    constructor(scene: B.Scene, canvas: HTMLCanvasElement) {

        this.canvas = canvas;

        const target = EnvironmentConfigs.camera.targetPosition;

        this.camera = new B.ArcRotateCamera(
            'camera', Math.PI / 2, Math.PI / 3, 5, target, scene
        );

        this.camera.position = EnvironmentConfigs.camera.initialPosition;
        // this.camera.attachControl(canvas, true);
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

    public calculateFrustumLimits(): FrustumLimits | null {
        if (!(this.camera instanceof B.ArcRotateCamera)) return null;

        const distance = this.camera.radius;
        const aspect = this.canvas.width / this.canvas.height;

        const screenHeight = 2 * distance * Math.tan(this.camera.fov / 2);
        const screenWidth = screenHeight * aspect;

        const boxW = screenWidth * EnvironmentConfigs.physicsSpring.failsafeMargin;
        const boxH = screenHeight * EnvironmentConfigs.physicsSpring.failsafeMargin;

        return {
            minX: -boxW / 2, maxX: boxW / 2,
            minY: -boxH / 2, maxY: boxH / 2,
            minZ: -(distance * 1.5), maxZ: distance - 2.0
        };

    }

}
