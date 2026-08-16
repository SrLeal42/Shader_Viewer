import * as B from '@babylonjs/core';

import {
    MaterialShaders, PostProcessShaders,
    type MaterialShaderId, type PostProcessShaderId
} from '../../shaders/Registry';

import { flattenUniforms, type ValueUniform } from '../../shaders/Types';

import type { LightManager } from './LightManagers';


export class ShaderManager {
    private scene: B.Scene;
    private camera: B.Camera;

    private lightManager: LightManager;

    // Material: mutuamente exclusivo
    private _activeMaterialId: MaterialShaderId | null = null;
    private materialCache = new Map<MaterialShaderId, B.ShaderMaterial>();

    private _activeUniforms: string[] = [];

    // Post-process: empilhável
    private activePostProcesses = new Map<PostProcessShaderId, B.PostProcess>();
    private ppUniformValues = new Map<PostProcessShaderId, Record<string, unknown>>();

    // Fallback para texturas não definidas (evita GL_INVALID_OPERATION feedback loop)
    private fallbackTexture: B.Texture;


    constructor(scene: B.Scene, camera: B.Camera, lightManager: LightManager) {
        this.scene = scene;
        this.camera = camera;

        this.lightManager = lightManager;

        // Cria uma textura 1x1 branca como fallback
        const dt = new B.DynamicTexture("fallbackTex", {width: 1, height: 1}, scene, false);
        const ctx = dt.getContext();
        ctx.fillStyle = "white";
        ctx.fillRect(0, 0, 1, 1);
        dt.update();
        this.fallbackTexture = dt;
    }

    // ─── Getters ───

    public get activeMaterialId(): MaterialShaderId | null {
        return this._activeMaterialId;
    }

    public get activePostProcessIds(): PostProcessShaderId[] {
        return Array.from(this.activePostProcesses.keys());
    }

    public get activePostProcessCount(): number {
        return this.activePostProcesses.size;
    }

    // ─── Material Shaders ───

    /** Aplica um material shader ao mesh e todos os seus filhos */
    public applyMaterial(
        shaderId: MaterialShaderId,
        mesh: B.AbstractMesh,
        getAlbedo?: (mesh: B.AbstractMesh) => B.BaseTexture | null
    ): void {

        const config = MaterialShaders[shaderId];

        // Achata a árvore antes de ler
        const flatUniforms = flattenUniforms(config.uniforms);
        if (!this.materialCache.has(shaderId)) {
            const material = config.create(this.scene);
            flatUniforms.forEach(u => this.applyUniform(material, u, u.defaultValue));
            this.materialCache.set(shaderId, material);
        }

        const material = this.materialCache.get(shaderId)!;
        mesh.material = material;

        const children = mesh.getChildMeshes();
        for (const child of children) {
            child.material = material;
        }


        // ─── Injeção de textura albedo (para shaders que preservam a textura original) ───
        if (config.needsAlbedoTexture && getAlbedo) {
            // Tenta extrair do mesh principal
            let albedo = getAlbedo(mesh);

            // Se o root não tem textura, tenta o primeiro filho que tiver
            if (!albedo) {
                for (const child of children) {
                    albedo = getAlbedo(child);
                    if (albedo) break;
                }
            }

            if (albedo) {
                material.setTexture('u_albedo', albedo);
                material.setFloat('u_hasAlbedo', 1.0);
            } else {
                material.setTexture('u_albedo', this.fallbackTexture);
                material.setFloat('u_hasAlbedo', 0.0);
            }
        }

        this._activeUniforms = [];
        flatUniforms.forEach(u => {
            this._activeUniforms.push(u.uniform);
        });

        this._activeMaterialId = shaderId;
        this.lightManager.injectLightUniforms(material);
    }

    /** Remove o shader ativo (a restauração do material original é responsabilidade do ModelManager) */
    public clearActiveMaterial(): void {
        this._activeMaterialId = null;
    }

    /** Chamado pelo SceneController quando o usuário move os sliders de luz na UI */
    public reinjectLightUniforms(): void {
        if (!this._activeMaterialId) return;
        const mat = this.materialCache.get(this._activeMaterialId);
        if (mat) {
            this.lightManager.injectLightUniforms(mat);
        }
    }


    // ─── Post-Process Shaders ───

    public enablePostProcess(shaderId: PostProcessShaderId): void {
        if (this.activePostProcesses.has(shaderId)) return;

        const config = PostProcessShaders[shaderId];

        // Inicializa os valores com os defaults
        const values: Record<string, unknown> = {};

        const flatUniforms = flattenUniforms(config.uniforms);
        flatUniforms.forEach(u => {
            values[u.uniform] = u.defaultValue;
        });

        this.ppUniformValues.set(shaderId, values);

        const pp = config.create(this.scene, this.camera, () => this.ppUniformValues.get(shaderId)!);

        // onApply lê do map de valores atuais
        pp.onApplyObservable.add((effect) => {
            const currentValues = this.ppUniformValues.get(shaderId);

            if (!currentValues) return;

            flatUniforms.forEach(u => {
                this.applyUniform(effect, u, currentValues[u.uniform]);
            });
        });

        this.activePostProcesses.set(shaderId, pp);
    }

    public disablePostProcess(shaderId: PostProcessShaderId): void {
        const pp = this.activePostProcesses.get(shaderId);

        if (!pp) return;

        pp.dispose();

        this.activePostProcesses.delete(shaderId);
        this.ppUniformValues.delete(shaderId);
    }

    // ─── Uniforms ───

    /** Seta um uniform no material shader ativo */
    public setMaterialUniform(uniform: ValueUniform, value: unknown): void {
        if (!this._activeMaterialId) return;

        if (uniform.targetPostProcess) {
            this.setPostProcessUniform(uniform.targetPostProcess as any, uniform, value);
            return;
        }

        const mat = this.materialCache.get(this._activeMaterialId);

        if (!mat) return;

        this.applyUniform(mat, uniform, value);
    }

    /** Seta um uniform num post-process ativo */
    public setPostProcessUniform(shaderId: PostProcessShaderId, uniform: ValueUniform, value: unknown): void {
        const values = this.ppUniformValues.get(shaderId);

        if (!values) return;

        values[uniform.uniform] = value;
    }


    /** Atualiza u_time apenas nos shaders ativos (chamado no render loop) */
    public updateTime(time: number): void {
        if (this._activeMaterialId) {
            const mat = this.materialCache.get(this._activeMaterialId);
            if (mat) {
                mat.setFloat('u_time', time);
                mat.setVector3('u_cameraPos', this.camera.position);

                if (this.lightManager.isDirty) {
                    this.lightManager.injectLightUniforms(mat);
                }
            }
        }
    }

    // ─── Helpers internos ───

    private applyUniform(target: B.ShaderMaterial | B.Effect, uniform: ValueUniform, value: unknown): void {
        switch (uniform.type) {
            case 'float':
                target.setFloat(uniform.uniform, value as number);
                break;
            case 'color': {
                const c = value as { r: number; g: number; b: number };
                target.setColor3(uniform.uniform, new B.Color3(c.r, c.g, c.b));
                break;
            }
            case 'boolean':
                target.setFloat(uniform.uniform, (value as boolean) ? 1.0 : 0.0);
                break;
            case 'list':
                target.setFloat(uniform.uniform, value as number);
                break;
        }
    }

    // ─── Cleanup ───

    public dispose(): void {
        for (const mat of this.materialCache.values()) mat.dispose();

        for (const pp of this.activePostProcesses.values()) pp.dispose();

        this.materialCache.clear();

        this.activePostProcesses.clear();

        this.ppUniformValues.clear();

        this._activeMaterialId = null;

        this.fallbackTexture.dispose();
    }
}
