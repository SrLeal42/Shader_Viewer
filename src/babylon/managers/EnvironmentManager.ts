import * as B from '@babylonjs/core';

import { EnvironmentConfigs } from '../../configs/EnvironmentConfigs';
import { SkyboxConfigs, type SkyboxConfig, type SkyboxId } from '../../configs/SkyboxConfigs';

import { createSkyboxFadeMaterial } from '../../shaders/skybox/SkyboxFadeMaterial';

import type { FrustumLimits } from '../../types/Camera';

import { easeInOutQuad } from '../../utils/math';
import { ENVIRONMENT_WALLS, SKYBOX_UNIFORMS } from '../../configs/Constants';

export class EnvironmentManager {

    private scene: B.Scene;

    private boundaries: { mesh: B.Mesh; aggregate: B.PhysicsAggregate }[] = [];

    // ─── Skybox ───

    private skyboxMesh!: B.Mesh;
    private skyboxMaterial!: B.ShaderMaterial;
    private currentSkyboxId: SkyboxId | 'color' = 'color';
    private textureCache = new Map<SkyboxId, B.CubeTexture>();

    private currentVisualTexture: B.CubeTexture | null = null;
    private nextVisualTexture: B.CubeTexture | null = null;

    private mixObserver: B.Observer<B.Scene> | null = null;
    private visibilityObserver: B.Observer<B.Scene> | null = null;
    private currentVisibility: number = 0;

    private pendingMixCleanup: (() => void) | null = null;


    constructor(scene: B.Scene) {
        this.scene = scene;

        this.scene.clearColor = EnvironmentConfigs.background.color;

        this.initSkybox();

    }

    // ─── Skybox / Cor ───

    public get activeSkyboxId(): SkyboxId | 'color' {
        return this.currentSkyboxId;
    }

    public get activeSkyboxMaterial(): B.ShaderMaterial {
        return this.skyboxMaterial;
    }

    /** Retorna o CubeTexture do ambiente ativo (skybox), ou null se estiver no modo Cor */
    public getCurrentCubemap(): B.BaseTexture | null {
        return this.scene.environmentTexture;
    }

    private initSkybox(): void {
        this.skyboxMesh = B.MeshBuilder.CreateBox('skybox', { size: 1000 }, this.scene);
        this.skyboxMaterial = createSkyboxFadeMaterial('skyboxFadeMat', this.scene);
        this.skyboxMesh.material = this.skyboxMaterial;
        this.skyboxMesh.infiniteDistance = true;
        this.skyboxMesh.isPickable = false;

        // Cria uma CubeTexture 1×1 preta com dados REAIS para satisfazer os samplers.
        // Diferente de null, isso faz upload de pixels para a GPU → textura "completa".
        const black = new Uint8Array([0, 0, 0, 255]);
        const fallback = new B.RawCubeTexture(
            this.scene,
            [black, black, black, black, black, black],
            1
        );

        this.skyboxMaterial.setTexture("texture1", fallback);
        this.skyboxMaterial.setTexture("texture2", fallback);
        this.skyboxMesh.visibility = 1;
        this.skyboxMaterial.setColor3(SKYBOX_UNIFORMS.BG_COLOR, EnvironmentConfigs.background.color);
        this.currentVisibility = 0;
    }



    /**
     * Troca para um skybox pré-definido.
     * Carrega a textura (com cache) e faz fade-in.
     */
    public async setSkybox(id: SkyboxId): Promise<void> {

        const config: SkyboxConfig = SkyboxConfigs[id];

        if (!config) return;

        let envTexture = this.textureCache.get(id);

        if (!envTexture) {
            envTexture = B.CubeTexture.CreateFromPrefilteredData(config.path!, this.scene);

            await new Promise<void>((resolve, reject) => {

                let timeoutId: number;
                const observer = envTexture!.onLoadObservable.addOnce(() => {
                    clearTimeout(timeoutId);
                    resolve();
                });

                timeoutId = setTimeout(() => {
                    envTexture!.onLoadObservable.remove(observer);
                    reject(new Error(`Timeout ao carregar skybox: ${config.path}`));
                }, 10000);

            });

            this.textureCache.set(id, envTexture);
        }

        // Troca de iluminação PBR (instantânea por performance)
        this.scene.environmentTexture = envTexture;
        this.scene.environmentIntensity = config.intensity ?? 1.0;
        envTexture.rotationY = config.rotationY ?? 0;

        // --- Início da lógica de transição visual em GLSL ---
        // A textura "nova" da chamada passada agora é a nossa "antiga" (Textura 1)
        this.currentVisualTexture = this.nextVisualTexture;
        if (this.currentVisualTexture) {
            this.skyboxMaterial.setTexture("texture1", this.currentVisualTexture);
        }

        let oldYRotation = 0;
        let oldXRotation = 0;

        if (this.currentSkyboxId !== 'color') {
            const oldConfig = SkyboxConfigs[this.currentSkyboxId];
            oldYRotation = oldConfig?.rotationY ?? 0;
            oldXRotation = oldConfig?.rotationX ?? 0;

            this.skyboxMaterial.setFloat(SKYBOX_UNIFORMS.BLUR_1, oldConfig?.blur ?? 0.0);
        } else {
            this.skyboxMaterial.setFloat(SKYBOX_UNIFORMS.BLUR_1, 0.0);
        }

        // Blur da textura que está entrando (texture2) = blur do skybox novo
        this.skyboxMaterial.setFloat(SKYBOX_UNIFORMS.BLUR_2, config.blur ?? 0.0);

        this.skyboxMaterial.setFloat(SKYBOX_UNIFORMS.ROTATION_Y_1, oldYRotation);
        this.skyboxMaterial.setFloat(SKYBOX_UNIFORMS.ROTATION_X_1, oldXRotation);

        // Clonamos a textura que realmente queremos mostrar (Textura 2)
        const skyTexture = envTexture!.clone();
        skyTexture.name = `skyboxVisual_${id}`;
        skyTexture.coordinatesMode = B.Texture.SKYBOX_MODE;
        this.nextVisualTexture = skyTexture;

        this.skyboxMaterial.setTexture("texture2", this.nextVisualTexture);

        this.skyboxMaterial.setFloat(SKYBOX_UNIFORMS.ROTATION_Y_2, config.rotationY ?? 0);
        this.skyboxMaterial.setFloat(SKYBOX_UNIFORMS.ROTATION_X_2, config.rotationX ?? 0);

        this.skyboxMaterial.setFloat(SKYBOX_UNIFORMS.TONEMAP_STRENGTH, config.tonemapStrength ?? 0.0);

        this.skyboxMaterial.setFloat(SKYBOX_UNIFORMS.EXPOSURE, config.exposure ?? 1.0);
        this.skyboxMaterial.setFloat(SKYBOX_UNIFORMS.SATURATION, config.saturation ?? 1.0);

        // Dispara a animação dependendo do estado atual
        if (this.currentVisualTexture) {
            // Se já estávamos vendo um skybox, inicia o crossfade em GLSL
            this.skyboxMaterial.setFloat(SKYBOX_UNIFORMS.MIX, 0.0);

            this.fadeShaderMix(() => {
                if (this.currentVisualTexture) {
                    this.skyboxMaterial.setTexture("texture1", this.nextVisualTexture!);

                    this.currentVisualTexture.dispose();
                    this.currentVisualTexture = null;
                }
            });

            // Previne falhas se o mesh estiver invisível por algum motivo
            if (this.currentVisibility < 1) {
                this.fadeSkyboxVisibility(1);
            }

        } else {
            this.skyboxMaterial.setTexture("texture1", skyTexture);
            this.skyboxMaterial.setFloat(SKYBOX_UNIFORMS.MIX, 1.0);
            this.fadeSkyboxVisibility(1);
        }

        this.currentSkyboxId = id;
    }


    /**
     * Troca para modo "Cor sólida".
     * Faz fade-out do skybox e aplica a cor de fundo.
     */
    public setBackgroundColor(color: B.Color3): void {
        this.scene.clearColor = new B.Color4(color.r, color.g, color.b, 1);
        this.currentSkyboxId = 'color';
        this.scene.environmentTexture = null;

        // Aplica os parâmetros base para quando estivermos no modo Cor
        const config = SkyboxConfigs.color;
        if (config) {
            this.skyboxMaterial.setFloat(SKYBOX_UNIFORMS.TONEMAP_STRENGTH, config.tonemapStrength ?? 0.0);
            this.skyboxMaterial.setFloat(SKYBOX_UNIFORMS.EXPOSURE, config.exposure ?? 1.0);
            this.skyboxMaterial.setFloat(SKYBOX_UNIFORMS.SATURATION, config.saturation ?? 1.0);
        }

        // Avisa nosso ShaderGLSL qual é a cor do fundo para o fade ficar perfeito
        this.skyboxMaterial.setColor3(SKYBOX_UNIFORMS.BG_COLOR, color);

        this.fadeSkyboxVisibility(0);
    }

    /**
     * Anima a visibilidade do skybox mesh.
     */
    private fadeSkyboxVisibility(target: number): void {

        if (this.visibilityObserver) {
            this.scene.onBeforeRenderObservable.remove(this.visibilityObserver);
            this.visibilityObserver = null;
        }

        const durationMs = EnvironmentConfigs.background.fadeDurationMs;
        const startTime = performance.now();
        const startValue = this.currentVisibility;

        this.visibilityObserver = this.scene.onBeforeRenderObservable.add(() => {
            const elapsed = performance.now() - startTime;

            let progress = Math.min(elapsed / durationMs, 1.0);

            // Aplica easing para consistência com o crossfade
            const eased = easeInOutQuad(progress);
            const val = startValue + (target - startValue) * eased;

            this.currentVisibility = val;
            this.skyboxMaterial.setFloat(SKYBOX_UNIFORMS.VISIBILITY, val);

            if (progress >= 1.0) {
                this.scene.onBeforeRenderObservable.remove(this.visibilityObserver!);
                this.visibilityObserver = null;
            }

        });

    }


    private fadeShaderMix(onEnd?: () => void): void {

        // Se já houver um crossfade acontecendo, executamos o cleanup imediatamente
        if (this.mixObserver) {
            this.scene.onBeforeRenderObservable.remove(this.mixObserver);
            this.mixObserver = null;
            // Executa o cleanup da transição anterior para não vazar textura
            if (this.pendingMixCleanup) {
                this.pendingMixCleanup();
                this.pendingMixCleanup = null;
            }
        }

        // Guarda o callback de cleanup para caso seja interrompido
        this.pendingMixCleanup = onEnd ?? null;
        const durationMs = EnvironmentConfigs.background.fadeDurationMs;
        const startTime = performance.now();

        this.mixObserver = this.scene.onBeforeRenderObservable.add(() => {

            const elapsed = performance.now() - startTime;
            let progress = elapsed / durationMs;

            if (progress >= 1.0) {

                progress = 1.0;

                this.scene.onBeforeRenderObservable.remove(this.mixObserver!);
                this.mixObserver = null;
                this.skyboxMaterial.setFloat(SKYBOX_UNIFORMS.MIX, 1.0);

                if (this.pendingMixCleanup) {
                    this.pendingMixCleanup();
                    this.pendingMixCleanup = null;
                }

            } else {
                this.skyboxMaterial.setFloat(SKYBOX_UNIFORMS.MIX, easeInOutQuad(progress));
            }

        });

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

        // Se alterar o nome das paredes vai afetar o EdgeDetector;
        const walls = [
            { name: ENVIRONMENT_WALLS[0], w: boxW, h: thickness, d: maxZ - minZ, x: 0, y: -boxH / 2 - halfT, z: (maxZ + minZ) / 2 },
            { name: ENVIRONMENT_WALLS[1], w: boxW, h: thickness, d: maxZ - minZ, x: 0, y: boxH / 2 + halfT, z: (maxZ + minZ) / 2 },
            { name: ENVIRONMENT_WALLS[2], w: thickness, h: boxH, d: maxZ - minZ, x: -boxW / 2 - halfT, y: 0, z: (maxZ + minZ) / 2 },
            { name: ENVIRONMENT_WALLS[3], w: thickness, h: boxH, d: maxZ - minZ, x: boxW / 2 + halfT, y: 0, z: (maxZ + minZ) / 2 },
            { name: ENVIRONMENT_WALLS[4], w: boxW, h: boxH, d: thickness, x: 0, y: 0, z: minZ - halfT },
            { name: ENVIRONMENT_WALLS[5], w: boxW, h: boxH, d: thickness, x: 0, y: 0, z: maxZ + halfT },
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

        // Cancela animações em andamento
        if (this.mixObserver) {
            this.scene.onBeforeRenderObservable.remove(this.mixObserver);
            this.mixObserver = null;
        }

        if (this.visibilityObserver) {
            this.scene.onBeforeRenderObservable.remove(this.visibilityObserver);
            this.visibilityObserver = null;
        }

        this.pendingMixCleanup = null;

        if (this.currentVisualTexture) this.currentVisualTexture.dispose();

        if (this.nextVisualTexture) this.nextVisualTexture.dispose();

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
