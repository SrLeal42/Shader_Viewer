import * as B from '@babylonjs/core';
import { CameraManager } from './managers/CameraManager';
import { UIManager } from './managers/UIManager';
import { ModelManager } from './managers/ModelManager';
import { ModelConfigs } from '../configs/ModelConfigs';

export class SceneController {
    private engine: B.Engine;
    public scene: B.Scene;

    private cameraManager: CameraManager;
    private uiManager: UIManager;
    private modelManager: ModelManager;

    // Proxy flexível, não tem mais propriedades hardcoded (any ou record)
    private currentParams: Record<string, any> = {};

    constructor(canvas: HTMLCanvasElement) {
        this.engine = new B.Engine(canvas, true, { preserveDrawingBuffer: true, stencil: true });
        this.scene = new B.Scene(this.engine);
        this.scene.clearColor = new B.Color4(0.1, 0.1, 0.12, 1);

        this.cameraManager = new CameraManager(this.scene, canvas);
        this.uiManager = new UIManager();
        this.modelManager = new ModelManager(this.scene);

        new B.HemisphericLight('light1', new B.Vector3(0, 1, 0), this.scene);

        this.uiManager.setupGlobalControls((type) => {
            this.switchModel(type);
        });

        this.switchModel('sphere');

        this.engine.runRenderLoop(() => {
            this.scene.render();
        });

        window.addEventListener('resize', this.onResize);
    }

    private async switchModel(modelId: string) {
        const config = ModelConfigs[modelId];

        if (!config) {
            console.warn(`Configuração não encontrada para: ${modelId}`);
            return;
        }

        this.currentParams = {};
        // 1. Constrói a UI e preenche this.currentParams com os defaultValue
        this.uiManager.buildDynamicPanel(config, this.currentParams, (param, value) => {
            if (param.onApply && this.modelManager.currentMesh) {
                param.onApply(this.modelManager.currentMesh, value);
            }
        });

        // 2. Carrega o modelo de forma assíncrona
        const mesh = await this.modelManager.loadModel(modelId);

        // 3. Sincroniza a malha recém-carregada com os valores padrões que a UI definiu
        config.parameters.forEach(param => {
            if (param.onApply) {
                param.onApply(mesh, this.currentParams[param.property]);
            }
        });

    }

    private onResize = () => { this.engine.resize(); };

    public dispose() {
        this.uiManager.dispose();
        window.removeEventListener('resize', this.onResize);
        this.scene.dispose();
        this.engine.dispose();
    }
}
