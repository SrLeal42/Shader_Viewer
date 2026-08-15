import * as B from '@babylonjs/core';

import { CameraManager } from './managers/CameraManager';
import { UIManager } from './managers/ui/UIManager';
import { PhysicsManager } from './managers/PhysicsManager';
import { ModelManager } from './managers/ModelManager';
import { ShaderManager } from './managers/ShaderManager';
import { EnvironmentManager } from './managers/EnvironmentManager';
import { SkyboxEffectManager } from './managers/SkyboxEffectManager';
import { InteractionManager } from './managers/InteractionManager';
import { LightManager } from './managers/LightManagers';
import { WeatherManager } from './managers/WeatherManager';


import { ModelConfigs, type ModelConfig, type ModelId } from '../configs/ModelConfigs';
import { PhysicsConfigs } from '../configs/PhysicsConfigs';
import type { SkyboxId } from '../configs/SkyboxConfigs';

import type { ModelEntity } from './entities/ModelEntity';

import { MaterialShaders, PostProcessShaders, type MaterialShaderId, type PostProcessShaderId, MAX_POST_PROCESSES } from '../shaders/Registry';

import { FingerInteraction } from './interactions/FingerInteraction';



export class SceneController {
    private engine: B.Engine;
    public scene: B.Scene;

    public cameraManager: CameraManager;
    private uiManager: UIManager;

    private physicsManager: PhysicsManager;

    private environmentManager: EnvironmentManager;
    private skyboxEffectManager: SkyboxEffectManager;
    private weatherManager: WeatherManager;
    private lightManager: LightManager;

    private modelManager: ModelManager;
    private currentParams: Record<string, unknown> = {};

    private shaderManager: ShaderManager;
    private ppParams = new Map<PostProcessShaderId, Record<string, unknown>>();
    private activeMaterialPostProcesses: PostProcessShaderId[] = [];

    private shaderParamsCache: Record<string, Record<string, unknown>> = {};

    private interactionManager: InteractionManager;

    private transformState = {
        pos: { x: 0, y: 0, z: 0 },
        rot: { x: 0, y: 0, z: 0 },
        physics: true
    };
    private transformUI: ReturnType<UIManager['setupTransformControls']> | null = null;

    private switchGeneration = 0;

    private resizeTimeout: ReturnType<typeof setTimeout> | null = null;

    // ─── Construtor privado (use SceneController.create) ───

    private constructor(
        canvas: HTMLCanvasElement,
        tweakpaneRightContainer: HTMLElement,
        tweakpaneLeftContainer: HTMLElement
    ) {
        this.engine = new B.Engine(canvas, true, {
            preserveDrawingBuffer: true,
            stencil: true
        });
        this.scene = new B.Scene(this.engine);


        this.cameraManager = new CameraManager(this.scene, canvas);
        const limits = this.cameraManager.calculateFrustumLimits();
        this.uiManager = new UIManager(tweakpaneRightContainer, tweakpaneLeftContainer);
        this.physicsManager = new PhysicsManager(this.scene);
        this.modelManager = new ModelManager(this.scene);
        this.environmentManager = new EnvironmentManager(this.scene);
        this.skyboxEffectManager = new SkyboxEffectManager(this.environmentManager.activeSkyboxMaterial);
        this.weatherManager = new WeatherManager(this.scene, this.cameraManager.camera);
        this.lightManager = new LightManager(this.scene);
        this.shaderManager = new ShaderManager(this.scene, this.cameraManager.camera, this.lightManager);
        this.interactionManager = new InteractionManager(
            this.scene,
            this.cameraManager.camera,
            () => this.modelManager.currentEntity
        );

        this.interactionManager.register(new FingerInteraction());
        this.interactionManager.setActive('finger');

        this.uiManager.setupGlobalControls((id) => {
            this.switchModel(id);
        });

        this.uiManager.setupShaderControls(
            (shaderId) => this.switchMaterialShader(shaderId),
            (shaderId, enabled) => this.togglePostProcess(shaderId, enabled)
        );

        this.uiManager.setupInteractionControls('finger', (id) => {
            this.interactionManager.setActive(id);
        });

        this.uiManager.setupSkyboxControls(
            (id) => this.switchSkybox(id),
            (color) => this.environmentManager.setBackgroundColor(
                new B.Color3(color.r, color.g, color.b)
            )
        );

        this.uiManager.setupSkyboxEffectsControls(
            (id, enabled) => this.skyboxEffectManager.setEffect(id, enabled),
            (callback) => { this.skyboxEffectManager.onEffectForcedOff = callback; }
        );

        this.uiManager.setupWeatherControls((presetId) => {
            if (presetId === 'none') {
                this.weatherManager.disable();
            } else {
                this.weatherManager.enable(presetId);
            }
        });

        this.uiManager.setupLightControls(
            this.lightManager.currentMode,
            (mode) => {
                this.lightManager.setMode(mode);
                this.shaderManager.reinjectLightUniforms();
            },
            (dir, color, intensity) => {
                this.lightManager.updateHemiLight(dir, color, intensity);
                this.shaderManager.reinjectLightUniforms();
            },
            (pos, color, intensity, anim, speed, freq, showHelper) => {
                this.lightManager.updatePointLight(pos, color, intensity);
                this.lightManager.animationType = anim;
                this.lightManager.orbitSpeed = speed;
                this.lightManager.pulseFrequency = freq;
                this.lightManager.toggleHelper(showHelper);

                this.shaderManager.reinjectLightUniforms();
            }
        );


        this.transformUI = this.uiManager.setupTransformControls(
            this.transformState,
            this.handlePhysicsChange,
            this.handleTransformChange,
            limits
        );

    }

    // ─── Factory assíncrona ───

    public static async create(
        canvas: HTMLCanvasElement,
        tweakpaneRightContainer: HTMLElement,
        tweakpaneLeftContainer: HTMLElement,
        signal?: AbortSignal
    ): Promise<SceneController> {
        const controller = new SceneController(canvas, tweakpaneRightContainer, tweakpaneLeftContainer);

        await controller.physicsManager.init();

        // Se o React já desmontou enquanto o Havok carregava, aborta
        if (signal?.aborted) {
            controller.dispose();
            throw new DOMException('Inicialização abortada', 'AbortError');
        }

        const limits = controller.cameraManager.calculateFrustumLimits();

        controller.environmentManager.resizeBoundaries(limits);

        await controller.switchModel('sphere');

        // Check novamente após o load do modelo
        if (signal?.aborted) {
            controller.dispose();
            throw new DOMException('Inicialização abortada', 'AbortError');
        }

        controller.startRenderLoop();

        return controller;
    }



    private startRenderLoop(): void {
        const startTime = performance.now();

        this.engine.runRenderLoop(() => {
            const elapsed = (performance.now() - startTime) / 1000;

            document.title = `Shader Viewer | FPS: ${this.engine.getFps().toFixed(0)}`;

            this.shaderManager.updateTime(elapsed);
            this.skyboxEffectManager.updateTime(elapsed);
            this.weatherManager.update(elapsed);

            if (this.transformState.physics && this.modelManager.currentEntity) {
                this.physicsManager.applySpring(this.modelManager.currentEntity.mesh);
                this.updateTransformUI();
            }

            this.scene.render();
        });

        window.addEventListener('resize', this.onResize);
    }




    private handlePhysicsChange = (enabled: boolean) => {
        const entity = this.modelManager.currentEntity;
        if (!entity) return;
        if (enabled) {
            entity.enablePhysics();
        } else {
            entity.disposePhysics();
        }
    };

    private handleTransformChange = () => {
        const entity = this.modelManager.currentEntity;
        if (!entity || this.transformState.physics) return;
        entity.mesh.position.set(this.transformState.pos.x, this.transformState.pos.y, this.transformState.pos.z);
        entity.mesh.rotationQuaternion = B.Quaternion.FromEulerAngles(
            B.Tools.ToRadians(this.transformState.rot.x),
            B.Tools.ToRadians(this.transformState.rot.y),
            B.Tools.ToRadians(this.transformState.rot.z)
        );
    };


    private updateTransformUI = () => {
        if (!this.transformState.physics || !this.modelManager.currentEntity) return;

        const mesh = this.modelManager.currentEntity.mesh;

        this.transformState.pos.x = mesh.position.x;
        this.transformState.pos.y = mesh.position.y;
        this.transformState.pos.z = mesh.position.z;

        if (mesh.rotationQuaternion) {
            const euler = mesh.rotationQuaternion.toEulerAngles();

            this.transformState.rot.x = B.Tools.ToDegrees(euler.x);
            this.transformState.rot.y = B.Tools.ToDegrees(euler.y);
            this.transformState.rot.z = B.Tools.ToDegrees(euler.z);

        }

        if (this.transformUI) this.transformUI.refresh();
    };


    // ─── Troca de modelo ───

    private async switchModel(modelId: ModelId) {
        const gen = ++this.switchGeneration;
        const config: ModelConfig = ModelConfigs[modelId];

        if (!config) return;

        const prevState = this.capturePreviousModelState();

        if (this.modelManager.currentEntity) {
            this.modelManager.currentEntity.restoreOriginalMaterials();
        }

        // Painel de parâmetros do modelo
        this.currentParams = {};
        this.uiManager.buildDynamicPanel(config, this.currentParams, (param, value) => {
            const entity = this.modelManager.currentEntity;
            if (param.onApply && entity) {
                param.onApply(entity.mesh, value as never);
                if (entity.hasPhysics) {
                    entity.rebuildPhysics();
                }
            }
        });

        let entity: ModelEntity;

        try {
            entity = await this.modelManager.loadModel(modelId);
        } catch (err) {
            console.error(`[SceneController] Falha ao carregar modelo '${modelId}':`, err);

            // Reverte: re-ativa o modelo anterior se possível
            if (this.modelManager.currentEntity) {
                this.modelManager.currentEntity.setEnabled(true);
                if (this.transformState.physics) {
                    this.modelManager.currentEntity.enablePhysics();
                }
            }

            return;
        }

        if (gen !== this.switchGeneration) {
            entity.setEnabled(false);
            return;
        }

        // Aplica defaults do modelo
        config.parameters.forEach(param => {
            if (param.onApply) {
                param.onApply(entity.mesh, this.currentParams[param.property] as never);
            }
        });

        this.applyInitialModelTransform(entity, config, prevState.position, prevState.rotationQuat);
        this.transferPhysicsState(entity, prevState.linVel, prevState.angVel);

        // Re-aplica o shader ativo
        if (this.shaderManager.activeMaterialId) {
            this.shaderManager.applyMaterial(this.shaderManager.activeMaterialId, entity.mesh);
        }
    }

    private capturePreviousModelState() {
        let linVel = B.Vector3.Zero();
        let angVel = B.Vector3.Zero();
        let position: B.Vector3 | null = null;
        let rotationQuat: B.Quaternion | null = null;

        if (this.modelManager.currentEntity) {
            const currentMesh = this.modelManager.currentEntity.mesh;
            linVel = this.modelManager.currentEntity.getLinearVelocity();
            angVel = this.modelManager.currentEntity.getAngularVelocity();
            position = currentMesh.position.clone();
            if (currentMesh.rotationQuaternion) {
                rotationQuat = currentMesh.rotationQuaternion.clone();
            }
        }

        return { linVel, angVel, position, rotationQuat };
    }

    private applyInitialModelTransform(entity: ModelEntity, config: ModelConfig, prevPosition: B.Vector3 | null, prevRotationQuat: B.Quaternion | null) {
        entity.mesh.position = B.Vector3.Zero();

        if (prevPosition) {
            entity.mesh.position.addInPlace(prevPosition);
        }

        let finalRotation = B.Quaternion.Identity();

        if (config.initialRotation) {
            const offsetQuat = B.Quaternion.FromEulerVector(config.initialRotation);
            finalRotation.multiplyInPlace(offsetQuat);
        }

        if (prevRotationQuat) {
            finalRotation = prevRotationQuat.multiply(finalRotation);
        }

        entity.mesh.rotationQuaternion = finalRotation;
    }

    private transferPhysicsState(entity: ModelEntity, prevLinVel: B.Vector3, prevAngVel: B.Vector3) {
        if (this.transformState.physics) {
            entity.enablePhysics();
        } else {
            if (!entity.mesh.rotationQuaternion) {
                entity.mesh.rotationQuaternion = B.Quaternion.FromEulerVector(entity.mesh.rotation);
            }
        }

        entity.setLinearVelocity(prevLinVel.scale(PhysicsConfigs.model.velocityTransferFactor));
        entity.setAngularVelocity(prevAngVel.scale(PhysicsConfigs.model.velocityTransferFactor));
    }

    // ─── Shaders ───

    private switchMaterialShader(shaderId: MaterialShaderId | 'none') {
        const entity = this.modelManager.currentEntity;
        if (!entity) return;

        this.activeMaterialPostProcesses.forEach(ppId => {
            this.shaderManager.disablePostProcess(ppId);
        });
        this.activeMaterialPostProcesses = [];

        entity.restoreOriginalMaterials();

        if (shaderId === 'none') {
            this.shaderManager.clearActiveMaterial();
            this.uiManager.clearShaderPanel();
            return;
        }

        if (!this.shaderParamsCache[shaderId]) {
            this.shaderParamsCache[shaderId] = {};
        }
        const currentParams = this.shaderParamsCache[shaderId];

        this.shaderManager.applyMaterial(shaderId, entity.mesh);

        const config = MaterialShaders[shaderId];
        this.uiManager.buildShaderPanel(
            config.title,
            config.uniforms,
            currentParams,
            (uniform, value) => {
                this.shaderManager.setMaterialUniform(uniform, value);
            }
        );

        if (config.postProcessDependencies) {
            config.postProcessDependencies.forEach(ppId => {
                const id = ppId as PostProcessShaderId;
                this.shaderManager.enablePostProcess(id);
                this.activeMaterialPostProcesses.push(id);
            });
        }

    }

    private togglePostProcess(shaderId: PostProcessShaderId, enabled: boolean): void {

        if (enabled) {

            // Lógica FIFO: Se atingiu o limite, desativa o mais antigo
            if (this.shaderManager.activePostProcessCount >= MAX_POST_PROCESSES) {
                const oldest = this.shaderManager.activePostProcessIds[0];
                if (oldest) {
                    this.togglePostProcess(oldest, false); // Desliga no motor
                    this.uiManager.forceUncheckPostProcess(oldest); // Desmarca na UI
                }
            }

            this.shaderManager.enablePostProcess(shaderId);

            const config = PostProcessShaders[shaderId];
            const proxy: Record<string, unknown> = {};
            this.ppParams.set(shaderId, proxy);
            this.uiManager.buildPostProcessPanel(
                shaderId,
                config.title,
                config.uniforms,
                proxy,
                (uniform, value) => {
                    this.shaderManager.setPostProcessUniform(shaderId, uniform, value);
                }
            );

        } else {
            this.shaderManager.disablePostProcess(shaderId);
            this.uiManager.clearPostProcessPanel(shaderId);
            this.ppParams.delete(shaderId);
        }

    }


    // ─── Skybox ───

    private async switchSkybox(id: SkyboxId | 'color'): Promise<void> {

        if (id === 'color') {

            const clearColor = this.scene.clearColor;

            this.environmentManager.setBackgroundColor(
                new B.Color3(clearColor.r, clearColor.g, clearColor.b)
            );

            return;
        }

        try {
            await this.environmentManager.setSkybox(id);
        } catch (err) {
            console.error(`[SceneController] Falha ao carregar skybox '${id}':`, err);
        }

    }


    // ─── Lifecycle ───

    private onResize = () => {
        // engine.resize() precisa ser imediato para o canvas não distorcer
        this.engine.resize();

        // Debounce para as operações pesadas (boundaries + UI)
        if (this.resizeTimeout) clearTimeout(this.resizeTimeout);

        this.resizeTimeout = setTimeout(() => {
            const limits = this.cameraManager.calculateFrustumLimits();

            this.environmentManager.resizeBoundaries(limits);

            this.transformUI = this.uiManager.setupTransformControls(
                this.transformState,
                this.handlePhysicsChange,
                this.handleTransformChange,
                limits
            );

            this.resizeTimeout = null;

        }, 150);

    };

    public dispose() {
        if (this.resizeTimeout) clearTimeout(this.resizeTimeout);

        this.uiManager.dispose();
        this.modelManager.dispose();
        this.shaderManager.dispose();
        this.environmentManager.dispose();
        this.skyboxEffectManager.dispose();
        this.weatherManager.dispose();
        this.interactionManager.dispose();
        this.physicsManager.dispose();
        this.lightManager.dispose();

        window.removeEventListener('resize', this.onResize);

        this.scene.dispose();
        this.engine.dispose();
    }

}
