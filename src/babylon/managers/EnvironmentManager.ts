import * as B from '@babylonjs/core';

import { EnvironmentConfigs } from '../../configs/EnvironmentConfigs';
import { SkyboxConfigs, type SkyboxConfig, type SkyboxId } from '../../configs/SkyboxConfigs';

import type { FrustumLimits } from '../../types/Camera';

export class EnvironmentManager {

    private scene: B.Scene;

    public light: B.HemisphericLight;

    private boundaries: { mesh: B.Mesh; aggregate: B.PhysicsAggregate }[] = [];

    // ─── Skybox ───

    private skyboxMesh: B.Mesh;
    private skyboxMaterial: B.StandardMaterial;
    private currentSkyboxId: SkyboxId | 'color' = 'color';
    private textureCache = new Map<SkyboxId, B.CubeTexture>();

    constructor(scene: B.Scene) {
        this.scene = scene;

        this.scene.clearColor = EnvironmentConfigs.background.color;

        this.light = new B.HemisphericLight('Hemispheric_Light', EnvironmentConfigs.light.direction, this.scene);
        this.light.intensity = EnvironmentConfigs.light.intensity;

        this.initSkybox();

    }

    // ─── Skybox / Cor ───

    public get activeSkyboxId(): SkyboxId | 'color' {
        return this.currentSkyboxId;
    }


    private initSkybox(): void {

        // Skybox mesh (criado uma vez, reutilizado para todos os skyboxes)
        this.skyboxMesh = B.MeshBuilder.CreateBox('skybox', { size: 1000 }, this.scene);

        this.skyboxMaterial = new B.StandardMaterial('skyboxMat', this.scene);
        this.skyboxMaterial.backFaceCulling = false;
        this.skyboxMaterial.disableLighting = true;
        this.skyboxMaterial.diffuseColor = B.Color3.Black();
        this.skyboxMaterial.specularColor = B.Color3.Black();

        this.skyboxMesh.material = this.skyboxMaterial;
        this.skyboxMesh.infiniteDistance = true;
        this.skyboxMesh.isPickable = false;

        this.skyboxMesh.visibility = 0; // Começa invisível (modo "Cor" por padrão)

    }



    /**
     * Troca para um skybox pré-definido.
     * Carrega a textura (com cache) e faz fade-in.
     */
    public async setSkybox(id: SkyboxId): Promise<void> {
        const config: SkyboxConfig = SkyboxConfigs[id];
        if (!config) return;

        // Carrega ou busca do cache
        let envTexture = this.textureCache.get(id);

        if (!envTexture) {
            envTexture = B.CubeTexture.CreateFromPrefilteredData(config.path, this.scene);

            // Espera a textura carregar antes de exibir
            await new Promise<void>((resolve, reject) => {
                envTexture!.onLoadObservable.addOnce(() => resolve());
                // Timeout de segurança para não travar se o arquivo não existir
                setTimeout(() => reject(new Error(`Timeout ao carregar skybox: ${config.path}`)), 10000);
            });

            this.textureCache.set(id, envTexture);
        }

        // Seta como environment texture para reflexões PBR
        this.scene.environmentTexture = envTexture;
        this.scene.environmentIntensity = config.intensity ?? 1.0;

        // Aplica rotação se configurada
        envTexture.rotationY = config.rotationY ?? 0;

        // Cria textura de skybox visual (clone com SKYBOX_MODE)
        // Dispose da reflection texture anterior se existir
        if (this.skyboxMaterial.reflectionTexture) {
            this.skyboxMaterial.reflectionTexture.dispose();
        }

        const skyTexture = B.CubeTexture.CreateFromPrefilteredData(config.path, this.scene);
        skyTexture.coordinatesMode = B.Texture.SKYBOX_MODE;
        skyTexture.rotationY = config.rotationY ?? 0;
        this.skyboxMaterial.reflectionTexture = skyTexture;

        // Fade-in do skybox
        this.currentSkyboxId = id;
        this.fadeVisibility(1);
    }

    /**
     * Troca para modo "Cor sólida".
     * Faz fade-out do skybox e aplica a cor de fundo.
     */
    public setBackgroundColor(color: B.Color3): void {
        this.scene.clearColor = new B.Color4(color.r, color.g, color.b, 1);
        this.currentSkyboxId = 'color';

        // Limpa environment texture (sem reflexões PBR no modo cor)
        this.scene.environmentTexture = null;

        // Fade-out do skybox
        this.fadeVisibility(0);
    }

    /**
     * Anima a visibilidade do skybox mesh.
     */
    private fadeVisibility(target: number): void {
        const fps = 60;
        const totalFrames = 15; // ~250ms a 60fps

        B.Animation.CreateAndStartAnimation(
            'skyboxFade',
            this.skyboxMesh,
            'visibility',
            fps,
            totalFrames,
            this.skyboxMesh.visibility,
            target,
            B.Animation.ANIMATIONLOOPMODE_CONSTANT
        );
    }

    // ─── Boundaries ───

    public resizeBoundaries(limits: FrustumLimits) {

        this.boundaries.forEach(({ mesh, aggregate }) => {
            aggregate.dispose();
            mesh.dispose();
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

            const aggregate = new B.PhysicsAggregate(mesh, B.PhysicsShapeType.BOX, { mass: 0, restitution: 0.5 }, this.scene);

            this.boundaries.push({ mesh, aggregate });
        }
    }

    // ─── Cleanup ───

    public dispose() {
        this.light.dispose();

        // Skybox
        if (this.skyboxMaterial.reflectionTexture) {
            this.skyboxMaterial.reflectionTexture.dispose();
        }
        this.skyboxMaterial.dispose();
        this.skyboxMesh.dispose();

        // Cache de texturas
        for (const texture of this.textureCache.values()) {
            texture.dispose();
        }
        this.textureCache.clear();

        // Boundaries
        this.boundaries.forEach(({ mesh, aggregate }) => {
            aggregate.dispose();
            mesh.dispose();
        });
        this.boundaries = [];
    }
}
