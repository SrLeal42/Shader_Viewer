import * as B from '../BabylonAdapter';

import { EventBus } from '../core/EventBus';

import { ModelController } from './ModelController';
import { ShaderController } from './ShaderController';

import { CameraManager } from '../managers/CameraManager';
import { UIManager } from '../managers/ui/UIManager';
import { PhysicsManager } from '../managers/PhysicsManager';
import { ModelManager } from '../managers/ModelManager';
import { ShaderManager } from '../managers/ShaderManager';
import { EnvironmentManager } from '../managers/EnvironmentManager';
import { SkyboxEffectManager } from '../managers/SkyboxEffectManager';
import { InteractionManager } from '../managers/InteractionManager';
import { LightManager } from '../managers/LightManagers';
import { WeatherManager } from '../managers/WeatherManager';
import { DepthNormalManager } from '../managers/DepthNormalManager';

import { ScenePresets, ACTIVE_PRESET } from '../../configs/ScenePresets';



export class SceneController {

    private engine: B.Engine;
    public scene: B.Scene;

    public eventBus: EventBus;

    private modelController: ModelController;
    private shaderController: ShaderController;

    public cameraManager: CameraManager;
    private uiManager: UIManager;

    private physicsManager: PhysicsManager;

    private environmentManager: EnvironmentManager;
    private skyboxEffectManager: SkyboxEffectManager;
    private weatherManager: WeatherManager;
    private lightManager: LightManager;
    private depthNormalManager: DepthNormalManager;

    private interactionManager: InteractionManager;

    private resizeTimeout: ReturnType<typeof setTimeout> | null = null;


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

        this.eventBus = new EventBus();

        // ─── Managers ───
        this.cameraManager = new CameraManager(this.scene, canvas);
        const limits = this.cameraManager.calculateFrustumLimits();
        this.uiManager = new UIManager(tweakpaneRightContainer, tweakpaneLeftContainer, this.eventBus);
        this.physicsManager = new PhysicsManager(this.scene);
        this.environmentManager = new EnvironmentManager(this.scene, this.eventBus);
        this.skyboxEffectManager = new SkyboxEffectManager(this.environmentManager.activeSkyboxMaterial, this.eventBus);
        this.lightManager = new LightManager(this.scene, this.eventBus);
        this.depthNormalManager = new DepthNormalManager(this.scene);
        this.weatherManager = new WeatherManager(this.scene, this.cameraManager.camera, this.depthNormalManager, this.eventBus);

        const modelManager = new ModelManager(this.scene);
        const shaderManager = new ShaderManager(this.scene, this.cameraManager.camera, this.lightManager, this.depthNormalManager);

        // ─── Controllers ───
        this.modelController = new ModelController(
            modelManager,
            this.physicsManager,
            this.depthNormalManager,
            this.uiManager,
            this.eventBus
        );

        this.shaderController = new ShaderController(
            shaderManager,
            this.environmentManager,
            this.uiManager,
            this.eventBus,
            () => this.modelController.currentEntity
        );

        this.interactionManager = new InteractionManager(
            this.scene,
            this.cameraManager.camera,
            () => this.modelController.currentEntity,
            this.eventBus
        );
        this.interactionManager.setActive('finger');

        // ─── Inicialização da UI ───
        this.uiManager.setupGlobalControls();
        this.uiManager.setupShaderControls();
        this.uiManager.setupVertexEffectControls();
        this.uiManager.setupInteractionControls('finger');
        this.uiManager.setupSkyboxControls();
        this.uiManager.setupSkyboxEffectsControls();
        this.uiManager.setupWeatherControls();
        this.uiManager.setupLightControls(this.lightManager.currentMode);
        this.uiManager.setupPostProcessControls();

        this.modelController.setupTransformUI(limits);

        // ─── EventBus: Orquestração entre Controllers ───
        this.eventBus.on('UI_MODEL_SELECTED', async (id) => {
            const entity = await this.modelController.switchModel(id);
            if (entity) {
                this.shaderController.reapplyToEntity(entity);
            }
        });

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
        const preset = ScenePresets[ACTIVE_PRESET];

        // Aplica Transformações e Física
        await controller.modelController.switchModel(preset.model, preset.modelParams);

        if (signal?.aborted) {
            controller.dispose();
            throw new DOMException('Inicialização abortada', 'AbortError');
        }

        // Bloco de transformação/física:
        if (preset.transform && controller.modelController.currentEntity) {
            controller.modelController.applyPresetTransform(preset.transform);
        }

        controller.eventBus.emit('UI_SKYBOX_SELECTED', preset.skybox);
        // Aplica o Shader e seus Parâmetros
        if (controller.modelController.currentEntity) {
            controller.shaderController.applyPresetMaterial(
                preset.material,
                controller.modelController.currentEntity,
                preset.materialParams
            );
        }

        // Liga Efeitos de Pós-Processamento
        if (preset.postProcesses) {
            controller.shaderController.applyPresetPostProcesses(preset.postProcesses);
        }

        if (preset.skyboxEffects) {
            preset.skyboxEffects.forEach(effectId => {
                controller.skyboxEffectManager.setEffect(effectId, true);
            });
        }

        if (preset.skyboxEffects) {
            preset.skyboxEffects.forEach(effectId => {
                controller.skyboxEffectManager.setEffect(effectId, true);
            });
        }

        controller.startRenderLoop();

        return controller;
    }



    private startRenderLoop(): void {
        const startTime = performance.now();

        this.engine.runRenderLoop(() => {
            const elapsed = (performance.now() - startTime) / 1000;

            document.title = `Shader Viewer | FPS: ${this.engine.getFps().toFixed(0)}`;

            this.shaderController.updateTime(elapsed);
            this.skyboxEffectManager.updateTime(elapsed);
            this.weatherManager.update(elapsed);

            this.modelController.updatePhysicsTick();

            this.scene.render();
        });

        window.addEventListener('resize', this.onResize);
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

            this.modelController.setupTransformUI(limits);

            this.depthNormalManager.resize();

            this.shaderController.resize();

            this.resizeTimeout = null;

        }, 150);

    };

    public dispose() {

        if (this.resizeTimeout) clearTimeout(this.resizeTimeout);

        this.uiManager.dispose();
        this.modelController.dispose();
        this.shaderController.dispose();
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
