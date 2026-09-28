import type { ShaderManager } from '../managers/ShaderManager';
import type { EnvironmentManager } from '../managers/EnvironmentManager';
import type { UIManager } from '../managers/ui/UIManager';
import type { EventBus } from '../core/EventBus';
import type { ModelEntity } from '../entities/ModelEntity';

import {
    MaterialShaders, PostProcessShaders, VertexEffects,
    type MaterialShaderId, type PostProcessShaderId, type VertexEffectId,
    MAX_POST_PROCESSES
} from '../../shaders/Registry';

import type { ValueUniform } from '../../shaders/Types';

export class ShaderController {

    private shaderManager: ShaderManager;
    private environmentManager: EnvironmentManager;
    private uiManager: UIManager;

    // ─── Estado de Shaders ───

    private shaderParamsCache: Record<string, Record<string, unknown>> = {};
    private vertexEffectParams: Record<string, unknown> = {};
    private ppParams = new Map<PostProcessShaderId, Record<string, unknown>>();
    private activeMaterialPostProcesses: PostProcessShaderId[] = [];


    constructor(
        shaderManager: ShaderManager,
        environmentManager: EnvironmentManager,
        uiManager: UIManager,
        eventBus: EventBus,
        getEntity: () => ModelEntity | null
    ) {
        this.shaderManager = shaderManager;
        this.environmentManager = environmentManager;
        this.uiManager = uiManager;

        eventBus.on('UI_SHADER_SELECTED', (id) => {
            const entity = getEntity();
            if (entity) this.switchMaterial(id, entity);
        });

        eventBus.on('UI_VERTEX_EFFECT_SELECTED', (id) => {
            const entity = getEntity();
            if (entity) this.switchVertexEffect(id, entity);
        });

        eventBus.on('UI_POST_PROCESS_TOGGLED', (id, enabled) => {
            this.togglePostProcess(id, enabled);
        });

    }


    // ─── Getters Públicos ───

    public get currentVertexEffectParams(): Record<string, unknown> {
        return this.vertexEffectParams;
    }


    // ─── Re-aplicar shader no modelo atual (chamado após switchModel) ───

    public reapplyToEntity(entity: ModelEntity): void {
        if (!this.shaderManager.activeMaterialId) return;

        this.shaderManager.applyMaterial(
            this.shaderManager.activeMaterialId,
            entity.mesh,
            {
                getAlbedo: (m) => entity.getOriginalAlbedoTexture(m),
                getCubemap: () => this.environmentManager.getCurrentCubemap()
            }
        );

    }


    // ─── Material Shader ───

    public switchMaterial(shaderId: MaterialShaderId, entity: ModelEntity): void {

        this.activeMaterialPostProcesses.forEach(ppId => {
            this.shaderManager.disablePostProcess(ppId);
        });
        this.activeMaterialPostProcesses = [];

        if (!this.shaderParamsCache[shaderId]) {
            this.shaderParamsCache[shaderId] = {};
        }

        const currentParams = this.shaderParamsCache[shaderId];

        this.shaderManager.applyMaterial(shaderId, entity.mesh, {
            getAlbedo: (m) => entity.getOriginalAlbedoTexture(m),
            getCubemap: () => this.environmentManager.getCurrentCubemap()
        });

        if (Object.keys(this.vertexEffectParams).length > 0) {
            this.shaderManager.injectVertexEffectUniforms(this.vertexEffectParams);
        }

        const config = MaterialShaders[shaderId];

        this.uiManager.clearShaderPanel();

        this.uiManager.buildShaderPanel(
            config.title,
            config.uniforms,
            currentParams,
            (uniform, value) => {
                this.shaderManager.setMaterialUniform(uniform as ValueUniform, value);
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


    // ─── Vertex Effect ───

    public switchVertexEffect(effectId: VertexEffectId, entity: ModelEntity): void {

        this.vertexEffectParams = {};
        this.uiManager.clearVertexEffectPanel();

        this.shaderManager.setVertexEffect(effectId, entity.mesh, {
            getAlbedo: (m) => entity.getOriginalAlbedoTexture(m),
            getCubemap: () => this.environmentManager.getCurrentCubemap()
        });

        if (this.shaderManager.activeMaterialId) {
            const matParams = this.shaderParamsCache[this.shaderManager.activeMaterialId];
            if (matParams) {
                this.shaderManager.injectMaterialUniforms(matParams);
            }
        }

        const config = VertexEffects[effectId];
        if (config.uniforms.length > 0) {
            this.uiManager.buildVertexEffectPanel(
                config.label,
                config.uniforms,
                this.vertexEffectParams,
                (uniform, value) => {
                    this.shaderManager.setMaterialUniform(uniform as ValueUniform, value);
                }
            );
        }

    }


    // ─── Post-Process ───

    public togglePostProcess(shaderId: PostProcessShaderId, enabled: boolean): void {

        if (enabled) {

            // Lógica FIFO: Se atingiu o limite, desativa o mais antigo
            if (this.shaderManager.activePostProcessCount >= MAX_POST_PROCESSES) {
                const oldest = this.shaderManager.activePostProcessIds[0];
                if (oldest) {
                    this.togglePostProcess(oldest, false);
                    this.uiManager.forceUncheckPostProcess(oldest);
                }
            }

            this.shaderManager.enablePostProcess(shaderId);

            const config = PostProcessShaders[shaderId];
            let proxy = this.ppParams.get(shaderId);
            if (!proxy) {
                proxy = {};
                this.ppParams.set(shaderId, proxy);
            }

            this.ppParams.set(shaderId, proxy);
            this.uiManager.buildPostProcessPanel(
                shaderId,
                config.title,
                config.uniforms,
                proxy,
                (uniform, value) => {
                    this.shaderManager.setPostProcessUniform(shaderId, uniform as ValueUniform, value);
                }
            );

        } else {
            this.shaderManager.disablePostProcess(shaderId);
            this.uiManager.clearPostProcessPanel(shaderId);
            this.ppParams.delete(shaderId);
        }

    }


    // ─── Preset (chamado pelo SceneController.create) ───

    public applyPresetMaterial(shaderId: MaterialShaderId, entity: ModelEntity, materialParams?: Record<string, unknown>): void {

        if (materialParams) {
            this.shaderParamsCache[shaderId] = { ...materialParams };
        }

        this.switchMaterial(shaderId, entity);

        if (materialParams) {
            this.shaderManager.injectMaterialUniforms(this.shaderParamsCache[shaderId]);
        }

    }

    public applyPresetPostProcesses(postProcesses: Record<string, Record<string, unknown>>): void {

        for (const [ppId, params] of Object.entries(postProcesses)) {
            this.ppParams.set(ppId as PostProcessShaderId, { ...params });
            this.togglePostProcess(ppId as PostProcessShaderId, true);

            this.shaderManager.injectPostProcessUniforms(
                ppId as PostProcessShaderId,
                this.ppParams.get(ppId as PostProcessShaderId)!
            );
        }

    }


    // ─── Dispose ───

    public updateTime(elapsed: number): void {
        this.shaderManager.updateTime(elapsed, this.vertexEffectParams);
    }

    public resize(): void {
        this.shaderManager.resize();
    }


    // ─── Dispose ───

    public dispose(): void {
        this.shaderManager.dispose();
    }

}
