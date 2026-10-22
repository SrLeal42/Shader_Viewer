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
import { LightManager } from '../managers/LightManager';
import { WeatherManager } from '../managers/WeatherManager';
import { DepthNormalManager } from '../managers/DepthNormalManager';

import { ScenePresets, ACTIVE_PRESET, type ScenePreset } from '../../configs/ScenePresets';


export interface PerformanceMetrics {
    fps: number;
    frameTimeMs: number;
    drawCalls: number;
    triangles: number;
    activeMeshes: number;
    totalMeshes: number;
    activeParticles: number;
    totalParticlesCapacity: number;
    particlesTimeMs: number;
    physicsTimeMs: number;
}


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

    private instrumentation: B.SceneInstrumentation;


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

        // Inicializa o monitoramento de desempenho
        this.instrumentation = new B.SceneInstrumentation(this.scene);
        this.instrumentation.captureParticlesRenderTime = true;
        this.instrumentation.captureFrameTime = true;
        this.instrumentation.capturePhysicsTime = true;

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
        this.uiManager.setupAllPanels({
            initialInteraction: 'finger',
            initialLightMode: this.lightManager.currentMode
        });

        this.modelController.setupTransformUI(limits);

    }



    public getPerformanceMetrics(): PerformanceMetrics {
        let activeParticles = 0;
        let totalParticlesCapacity = 0;

        for (const ps of this.scene.particleSystems) {
            activeParticles += ps.getActiveCount();
            totalParticlesCapacity += ps.getCapacity();

        }

        return {
            fps: Math.round(this.engine.getFps()),
            frameTimeMs: this.instrumentation.frameTimeCounter.current,
            drawCalls: this.instrumentation.drawCallsCounter.current,
            triangles: Math.round(this.scene.getActiveIndices() / 3),
            activeMeshes: this.scene.getActiveMeshes().length,
            totalMeshes: this.scene.meshes.length,
            activeParticles,
            totalParticlesCapacity,
            particlesTimeMs: this.instrumentation.particlesRenderTimeCounter.current,
            physicsTimeMs: this.instrumentation.physicsTimeCounter.current
        };

    }

    // ─── Factory assíncrona ───

    public static async create(
        canvas: HTMLCanvasElement,
        tweakpaneRightContainer: HTMLElement,
        tweakpaneLeftContainer: HTMLElement,
        signal?: AbortSignal
    ): Promise<SceneController> {
        
        await Promise.resolve();
        
        if (signal?.aborted) {
            throw new DOMException('Inicialização abortada', 'AbortError');
        }
        
        const controller = new SceneController(canvas, tweakpaneRightContainer, tweakpaneLeftContainer);
        
        await controller.physicsManager.init();
        
        if (signal?.aborted) {
            controller.dispose();
            throw new DOMException('Inicialização abortada', 'AbortError');
        }

        const limits = controller.cameraManager.calculateFrustumLimits();

        controller.environmentManager.resizeBoundaries(limits);

        const initialPreset = ScenePresets[ACTIVE_PRESET];
        if (initialPreset) {
            await controller.applyPreset(initialPreset, signal);
        }

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

            this.shaderController.updateTime(elapsed);
            this.skyboxEffectManager.updateTime(elapsed);
            this.weatherManager.update(elapsed);

            this.modelController.updatePhysicsTick();

            this.scene.render();
        });

        window.addEventListener('resize', this.onResize);
    }


    /**
    * Aplica um preset completo na cena.
    * Pode ser chamado tanto no startup quanto em runtime para trocar de preset!
    */
    public async applyPreset(preset: ScenePreset, signal?: AbortSignal): Promise<void> {

        await this.modelController.switchModel(preset.model, preset.modelParams);
        if (signal?.aborted) return;

        if (preset.transform && this.modelController.currentEntity) {
            this.modelController.applyPresetTransform(preset.transform);
        }

        if (preset.skybox === 'color') {
            const clear = this.scene.clearColor;
            const c = preset.skyboxColor ?? { r: clear.r, g: clear.g, b: clear.b };
            this.environmentManager.setBackgroundColor(new B.Color3(c.r, c.g, c.b));
            this.eventBus.emit('CUBEMAP_CHANGED', null);
        } else {
            await this.environmentManager.setSkybox(preset.skybox);
            if (signal?.aborted) return;
            this.eventBus.emit('CUBEMAP_CHANGED', this.environmentManager.getCurrentCubemap());
        }

        const entity = this.modelController.currentEntity;
        if (entity) {
            this.shaderController.applyPresetMaterial(
                preset.material,
                entity,
                preset.materialParams
            );

            if (preset.vertexEffect) {
                this.shaderController.switchVertexEffect(preset.vertexEffect, entity);
            }
        }

        if (preset.postProcesses) {
            this.shaderController.applyPresetPostProcesses(preset.postProcesses);
        }

        if (preset.skyboxEffects) {
            preset.skyboxEffects.forEach(effectId => {
                this.skyboxEffectManager.setEffect(effectId, true);
            });
        }

        if (preset.weather && preset.weather !== 'none') {
            this.eventBus.emit('UI_WEATHER_SELECTED', preset.weather);
        }

        if (preset.light) {
            if (preset.light.mode) {
                this.lightManager.setMode(preset.light.mode);
            }

            if (preset.light.hemi) {
                const h = preset.light.hemi;
                this.lightManager.updateHemiLight(
                    h.direction ?? { x: 0, y: 1, z: 1 },
                    h.color ?? { r: 1, g: 1, b: 1 },
                    h.intensity ?? 1.0
                );
            }

            if (preset.light.point) {
                const p = preset.light.point;
                this.lightManager.updatePointLight(
                    p.position ?? { x: 0, y: 2, z: 3 },
                    p.color ?? { r: 1, g: 1, b: 1 },
                    p.intensity ?? 1.0
                );
                if (p.animationType) this.lightManager.animationType = p.animationType;
                if (p.orbitSpeed !== undefined) this.lightManager.orbitSpeed = p.orbitSpeed;
                if (p.pulseFrequency !== undefined) this.lightManager.pulseFrequency = p.pulseFrequency;
                if (p.showHelper !== undefined) this.lightManager.toggleHelper(p.showHelper);
            }

            this.uiManager.applyLightPreset(preset.light);
        }

        if (preset.interaction) {
            this.interactionManager.setActive(preset.interaction);
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

            this.modelController.setupTransformUI(limits);

            this.depthNormalManager.resize();

            this.shaderController.resize();

            this.resizeTimeout = null;

        }, 150);

    };

    public dispose() {

        if (this.resizeTimeout) clearTimeout(this.resizeTimeout);

        this.eventBus.clear();

        this.instrumentation.dispose();

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
