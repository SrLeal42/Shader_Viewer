import * as B from '@babylonjs/core';

import { EnvironmentConfigs } from '../../configs/EnvironmentConfigs';
import { SkyboxConfigs, type SkyboxConfig, type SkyboxId } from '../../configs/SkyboxConfigs';

import { createSkyboxFadeMaterial } from '../../shaders/skybox/SkyboxFadeMaterial';

import type { FrustumLimits } from '../../types/Camera';

import { easeInOutQuad } from '../../utils/math';

export class EnvironmentManager {

    private scene: B.Scene;

    public light: B.HemisphericLight;

    private boundaries: { mesh: B.Mesh; aggregate: B.PhysicsAggregate }[] = [];

    // ─── Skybox ───

    private skyboxMesh: B.Mesh;
    private skyboxMaterial: B.ShaderMaterial;
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

        this.light = new B.HemisphericLight('Hemispheric_Light', EnvironmentConfigs.light.direction, this.scene);
        this.light.intensity = EnvironmentConfigs.light.intensity;

        this.initSkybox();

    }

    // ─── Skybox / Cor ───

    public get activeSkyboxId(): SkyboxId | 'color' {
        return this.currentSkyboxId;
    }


    private initSkybox(): void {
        this.skyboxMesh = B.MeshBuilder.CreateBox('skybox', { size: 1000 }, this.scene);

        // Usamos nosso shader customizado agora
        this.skyboxMaterial = createSkyboxFadeMaterial('skyboxFadeMat', this.scene);
        this.skyboxMesh.material = this.skyboxMaterial;
        this.skyboxMesh.infiniteDistance = true;
        this.skyboxMesh.isPickable = false;

        const initVisbility = 0; // Começa invisível (modo "Cor" por padrão)

        this.skyboxMesh.visibility = initVisbility;
        this.skyboxMaterial.setColor3("u_bgColor", EnvironmentConfigs.background.color);
        this.currentVisibility = initVisbility;

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
            envTexture = B.CubeTexture.CreateFromPrefilteredData(config.path, this.scene);

            await new Promise<void>((resolve, reject) => {
                envTexture!.onLoadObservable.addOnce(() => resolve());
                setTimeout(() => reject(new Error(`Timeout ao carregar skybox: ${config.path}`)), 10000);
            });

            this.textureCache.set(id, envTexture);
        }

        // Troca de iluminação PBR (instantânea por performance)
        this.scene.environmentTexture = envTexture;
        this.scene.environmentIntensity = config.intensity ?? 1.0;
        envTexture.rotationY = config.rotationY ?? 0;

        // --- Início da lógica de transição visual em GLSL ---
        // A textura "nova" da chamada passada agora é a nossa "antiga" (Textura 1)
        if (this.nextVisualTexture) {
            this.currentVisualTexture = this.nextVisualTexture;
            this.skyboxMaterial.setTexture("texture1", this.currentVisualTexture);

            let oldRotation = 0;
            if (this.currentSkyboxId !== 'color') {
                const oldConfig = SkyboxConfigs[this.currentSkyboxId];
                oldRotation = oldConfig?.rotationY ?? 0;

                this.skyboxMaterial.setFloat("u_blur1", oldConfig?.blur ?? 0.0);
            } else {
                this.skyboxMaterial.setFloat("u_blur1", 0.0);
            }

            // Blur da textura que está entrando (texture2) = blur do skybox novo
            this.skyboxMaterial.setFloat("u_blur2", config.blur ?? 0.0);

            this.skyboxMaterial.setFloat("u_rotation1", oldRotation);
        }

        // Carrega a textura que realmente queremos mostrar (Textura 2)
        const skyTexture = B.CubeTexture.CreateFromPrefilteredData(config.path, this.scene);
        skyTexture.coordinatesMode = B.Texture.SKYBOX_MODE;
        this.nextVisualTexture = skyTexture;

        this.skyboxMaterial.setTexture("texture2", this.nextVisualTexture);

        this.skyboxMaterial.setFloat("u_rotation2", config.rotationY ?? 0);

        this.skyboxMaterial.setFloat("u_tonemapStrength", config.tonemapStrength ?? 0.0);

        this.skyboxMaterial.setFloat("u_exposure", config.exposure ?? 1.0);
        this.skyboxMaterial.setFloat("u_saturation", config.saturation ?? 1.0);

        // Dispara a animação dependendo do estado atual
        if (this.currentVisualTexture) {

            // Se já estávamos vendo um skybox, inicia o crossfade em GLSL
            this.skyboxMaterial.setFloat("u_mix", 0.0);

            this.fadeShaderMix(() => {
                if (this.currentVisualTexture) {
                    this.skyboxMaterial.setTexture("texture1", this.nextVisualTexture!);

                    this.currentVisualTexture.dispose();
                    this.currentVisualTexture = null;
                }
            });

            // Previne falhas se o mesh estiver invisível por algum motivo
            if (this.skyboxMesh.visibility < 1) {
                this.fadeSkyboxVisibility(1);
            }

        } else {
            // Se estávamos no modo de "Cor Sólida" (invisível), não há textura antiga
            this.skyboxMaterial.setFloat("u_mix", 1.0);
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

        // Avisa nosso ShaderGLSL qual é a cor do fundo para o fade ficar perfeito
        this.skyboxMaterial.setColor3("u_bgColor", color);

        // Dispara a animação customizada
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

        // Se vamos exibir o skybox, reativamos o mesh na cena
        if (target > 0) {
            this.skyboxMesh.visibility = 1;
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
            this.skyboxMaterial.setFloat("u_visibility", val);

            if (progress >= 1.0) {
                this.scene.onBeforeRenderObservable.remove(this.visibilityObserver!);
                this.visibilityObserver = null;

                // Se fomos para a cor sólida, ocultamos o mesh para poupar GPU
                if (target === 0) {
                    this.skyboxMesh.visibility = 0;
                }
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
                this.skyboxMaterial.setFloat("u_mix", 1.0);

                if (this.pendingMixCleanup) {
                    this.pendingMixCleanup();
                    this.pendingMixCleanup = null;
                }

            } else {
                this.skyboxMaterial.setFloat("u_mix", easeInOutQuad(progress));
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

        this.light.dispose();

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
