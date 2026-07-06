import * as B from '@babylonjs/core';

import { CameraManager } from './managers/CameraManager';
import { UIManager } from './managers/UIManager';
import { ModelManager } from './managers/ModelManager';
import { ShaderManager } from './managers/ShaderManager';

import { ModelConfigs, type ModelId } from '../configs/ModelConfigs';

import { MaterialShaders, type MaterialShaderId, type PostProcessShaderId } from '../shaders/Registry';

export class SceneController {
    private engine: B.Engine;
    public scene: B.Scene;

    private cameraManager: CameraManager;
    private uiManager: UIManager;

    private modelManager: ModelManager;
    private currentParams: Record<string, unknown> = {};

    private shaderManager: ShaderManager;
    private shaderParams: Record<string, unknown> = {};

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
        this.shaderManager = new ShaderManager(this.scene, this.cameraManager.camera);

        new B.HemisphericLight('light1', new B.Vector3(0, 1, 0), this.scene);

        this.uiManager.setupGlobalControls((id) => {
            this.switchModel(id);
        });

        this.uiManager.setupShaderControls(
            (shaderId) => this.switchMaterialShader(shaderId),
            (shaderId, enabled) => this.togglePostProcess(shaderId, enabled)
        );

        this.switchModel('sphere');

        const startTime = performance.now();
        this.engine.runRenderLoop(() => {
            const elapsed = (performance.now() - startTime) / 1000;
            this.shaderManager.updateTime(elapsed);
            this.scene.render();
        });

        window.addEventListener('resize', this.onResize);
    }

    private async switchModel(modelId: ModelId) {
        const gen = ++this.switchGeneration;
        const config = ModelConfigs[modelId];
        if (!config) return;

        // Restaura materiais originais do modelo ANTERIOR antes de escondê-lo
        if (this.modelManager.currentModelId) {
            this.modelManager.restoreOriginalMaterials(this.modelManager.currentModelId);
        }

        this.currentParams = {};
        this.uiManager.buildDynamicPanel(config, this.currentParams, (param, value) => {
            if (param.onApply && this.modelManager.currentMesh) {
                param.onApply(this.modelManager.currentMesh, value as never);
            }
        });

        const mesh = await this.modelManager.loadModel(modelId);

        if (gen !== this.switchGeneration) {
            mesh.setEnabled(false);
            return;
        }

        // Aplica defaults do modelo
        config.parameters.forEach(param => {
            if (param.onApply) {
                param.onApply(mesh, this.currentParams[param.property] as never);
            }
        });

        // Normaliza posição
        const boundingInfo = mesh.getHierarchyBoundingVectors();
        const center = boundingInfo.max.add(boundingInfo.min).scale(0.5);
        mesh.position.x -= center.x;
        mesh.position.z -= center.z;
        mesh.position.y -= boundingInfo.min.y;

        // Re-aplica o shader ativo (se houver) no novo modelo
        if (this.shaderManager.activeMaterialId) {
            this.shaderManager.applyMaterial(this.shaderManager.activeMaterialId, mesh);
        }
    }

    private switchMaterialShader(shaderId: MaterialShaderId | 'none') {
        const mesh = this.modelManager.currentMesh;

        if (!mesh) return;

        // 1. Restaura materiais originais do modelo atual
        if (this.modelManager.currentModelId) {
            this.modelManager.restoreOriginalMaterials(this.modelManager.currentModelId);
        }

        // 2. Limpa panel de uniforms
        this.shaderParams = {};
        if (shaderId === 'none') {
            // Apenas limpa — materiais originais já foram restaurados
            this.shaderManager.clearActiveMaterial();
            this.uiManager.clearShaderPanel();
            return;
        }

        // 3. Aplica o novo shader
        this.shaderManager.applyMaterial(shaderId, mesh);

        // 4. Monta o panel de uniforms no Tweakpane
        const config = MaterialShaders[shaderId];
        this.uiManager.buildShaderPanel(
            config.title,
            config.uniforms,
            this.shaderParams,
            (uniform, value) => {
                this.shaderManager.setMaterialUniform(uniform, value);
            }
        );
    }

    private togglePostProcess(shaderId: PostProcessShaderId, enabled: boolean) {
        if (enabled) {
            this.shaderManager.enablePostProcess(shaderId);
        } else {
            this.shaderManager.disablePostProcess(shaderId);
        }
    }



    private onResize = () => { this.engine.resize(); };

    public dispose() {
        this.uiManager.dispose();
        this.modelManager.dispose();
        this.shaderManager.dispose();

        window.removeEventListener('resize', this.onResize);

        this.scene.dispose();
        this.engine.dispose();
    }

}
