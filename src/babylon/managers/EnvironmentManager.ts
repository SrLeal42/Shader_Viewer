import * as B from '@babylonjs/core';

import { EnvironmentConfigs } from '../../configs/EnviromentConfigs';

import type { FrustumLimits } from '../../types/Camera';

export class EnvironmentManager {

    private scene: B.Scene;

    public light: B.HemisphericLight;

    private boundaries: B.Mesh[] = [];

    // Guardamos essas medidas dinâmicas para o UIManager ler
    public frustumLimits = {
        minX: -1, maxX: 1, minY: -1, maxY: 1, minZ: -1, maxZ: 1
    };

    constructor(scene: B.Scene) {
        this.scene = scene;

        this.scene.clearColor = EnvironmentConfigs.background.color;

        this.light = new B.HemisphericLight('Hemispheric_Light', EnvironmentConfigs.light.direction, this.scene);
        this.light.intensity = EnvironmentConfigs.light.intensity;
    }

    public resizeBoundaries(limits: FrustumLimits) {

        this.boundaries.forEach(b => {
            b.physicsBody?.dispose();
            b.dispose();
        });
        this.boundaries = [];

        const boxW = limits.maxX - limits.minX;
        const boxH = limits.maxY - limits.minY;
        const maxZ = limits.maxZ;
        const minZ = limits.minZ;

        const thickness = EnvironmentConfigs.physicsSpring.thickness;
        const halfT = thickness / 2;
        const walls = [
            { name: 'floor', w: boxW, h: thickness, d: maxZ - minZ, x: 0, y: -boxH / 2 - halfT, z: (maxZ + minZ) / 2 },
            { name: 'ceil', w: boxW, h: thickness, d: maxZ - minZ, x: 0, y: boxH / 2 + halfT, z: (maxZ + minZ) / 2 },
            { name: 'left', w: thickness, h: boxH, d: maxZ - minZ, x: -boxW / 2 - halfT, y: 0, z: (maxZ + minZ) / 2 },
            { name: 'right', w: thickness, h: boxH, d: maxZ - minZ, x: boxW / 2 + halfT, y: 0, z: (maxZ + minZ) / 2 },
            { name: 'front', w: boxW, h: boxH, d: thickness, x: 0, y: 0, z: minZ - halfT },
            { name: 'back', w: boxW, h: boxH, d: thickness, x: 0, y: 0, z: maxZ + halfT },
        ];

        for (const w of walls) {
            const mesh = B.MeshBuilder.CreateBox(w.name, { width: w.w, height: w.h, depth: w.d }, this.scene);

            mesh.position = new B.Vector3(w.x, w.y, w.z);
            mesh.visibility = 0;
            mesh.isPickable = false;

            new B.PhysicsAggregate(mesh, B.PhysicsShapeType.BOX, { mass: 0, restitution: 0.5 }, this.scene);

            this.boundaries.push(mesh);
        }
    }

    public dispose() {
        this.light.dispose();
        this.boundaries.forEach(b => {
            b.physicsBody?.dispose();
            b.dispose();
        });
    }

}
