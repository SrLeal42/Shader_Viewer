import * as B from '@babylonjs/core';
import { CameraManager } from './managers/CameraManager';
import { UIManager } from './managers/UIManager';
import { ModelManager } from './managers/ModelManager';
import { ModelConfigs, type ModelId } from '../configs/ModelConfigs';

export class SceneController {
    private engine: B.Engine;
    public scene: B.Scene;

    private cameraManager: CameraManager;
    private uiManager: UIManager;
    private modelManager: ModelManager;

    private currentParams: Record<string, unknown> = {};
    private switchGeneration = 0; // Guard contra race condition

    constructor(canvas: HTMLCanvasElement, tweakpaneContainer: HTMLElement) {
        this.engine = new B.Engine(canvas, true, {
            preserveDrawingBuffer: true,
            stencil: true
        });
        this.scene = new B.Scene(this.engine);
        this.scene.clearColor = new B.Color4(0.1, 0.1, 0.12, 1);

        this.cameraManager = new CameraManager(this.scene, canvas);
        this.uiManager = new UIManager(tweakpaneContainer);
        this.modelManager = new ModelManager(this.scene);

        new B.HemisphericLight('light1', new B.Vector3(0, 1, 0), this.scene);

        this.uiManager.setupGlobalControls((id) => {
            this.switchModel(id);
        });

        this.switchModel('sphere');

        this.engine.runRenderLoop(() => {
            this.scene.render();
        });

        window.addEventListener('resize', this.onResize);
    }

    private async switchModel(modelId: ModelId) {
        const gen = ++this.switchGeneration;
        const config = ModelConfigs[modelId];

        if (!config) {
            console.warn(`Configuração não encontrada para: ${modelId}`);
            return;
        }

        this.currentParams = {};

        // 1. Monta a UI (instantâneo)
        this.uiManager.buildDynamicPanel(config, this.currentParams, (param, value) => {
            if (param.onApply && this.modelManager.currentMesh) {
                param.onApply(this.modelManager.currentMesh, value as never);
            }
        });

        // 2. Carrega o modelo (potencialmente assíncrono)
        const mesh = await this.modelManager.loadModel(modelId);

        // 3. Guard: se outra troca já foi disparada, descarta
        if (gen !== this.switchGeneration) {
            mesh.setEnabled(false);
            return;
        }

        // 4. Aplica defaults e enquadra câmera
        config.parameters.forEach(param => {
            if (param.onApply) {
                param.onApply(mesh, this.currentParams[param.property] as never);
            }
        });

        this.cameraManager.frameMesh(mesh);
    }

    private onResize = () => { this.engine.resize(); };

    public dispose() {
        this.uiManager.dispose();
        this.modelManager.dispose();
        window.removeEventListener('resize', this.onResize);
        this.scene.dispose();
        this.engine.dispose();
    }
}
