import * as B from '@babylonjs/core';
import {
    MaterialShaders, PostProcessShaders,
    type MaterialShaderId, type PostProcessShaderId
} from '../../shaders/Registry';
import type { ShaderUniform } from '../../shaders/Types';

export class ShaderManager {
    private scene: B.Scene;
    private camera: B.Camera;

    private light: B.HemisphericLight;

    // Material: mutuamente exclusivo
    private _activeMaterialId: MaterialShaderId | null = null;
    private materialCache = new Map<MaterialShaderId, B.ShaderMaterial>();

    // Post-process: empilhável
    private activePostProcesses = new Map<PostProcessShaderId, B.PostProcess>();
    private ppUniformValues = new Map<PostProcessShaderId, Record<string, unknown>>();

    constructor(scene: B.Scene, camera: B.Camera, light: B.HemisphericLight) {
        this.scene = scene;
        this.camera = camera;

        this.light = light;
    }

    // ─── Getters ───

    public get activeMaterialId(): MaterialShaderId | null {
        return this._activeMaterialId;
    }

    // ─── Material Shaders ───

    /** Aplica um material shader ao mesh e todos os seus filhos */
    public applyMaterial(shaderId: MaterialShaderId, mesh: B.AbstractMesh): void {

        // Cache hit ou cria novo
        if (!this.materialCache.has(shaderId)) {
            const config = MaterialShaders[shaderId];
            const material = config.create(this.scene);

            // Aplica os defaults dos uniforms
            config.uniforms.forEach(u => {
                this.setUniformOnMaterial(material, u, u.defaultValue);
            });

            this.materialCache.set(shaderId, material);
        }

        const material = this.materialCache.get(shaderId)!;

        // Aplica em todos os meshes (root + children)
        mesh.material = material;
        for (const child of mesh.getChildMeshes()) {
            child.material = material;
        }

        this._activeMaterialId = shaderId;

        // Seta a direção da luz uma vez (estática, não precisa de update por frame)
        material.setVector3('u_lightDir', this.light.direction);
    }

    /** Remove o shader ativo (a restauração do material original é responsabilidade do ModelManager) */
    public clearActiveMaterial(): void {
        this._activeMaterialId = null;
    }

    // ─── Post-Process Shaders ───

    public enablePostProcess(shaderId: PostProcessShaderId): void {
        if (this.activePostProcesses.has(shaderId)) return;

        const config = PostProcessShaders[shaderId];

        const pp = config.create(this.scene, this.camera);

        // Inicializa os valores com os defaults
        const values: Record<string, unknown> = {};

        config.uniforms.forEach(u => {
            values[u.uniform] = u.defaultValue;
        });

        this.ppUniformValues.set(shaderId, values);

        // onApply lê do map de valores atuais
        pp.onApply = (effect) => {
            const currentValues = this.ppUniformValues.get(shaderId);

            if (!currentValues) return;

            config.uniforms.forEach(u => {
                this.setUniformOnEffect(effect, u, currentValues[u.uniform]);
            });

        };

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
    public setMaterialUniform(uniform: ShaderUniform, value: unknown): void {
        if (!this._activeMaterialId) return;
        const mat = this.materialCache.get(this._activeMaterialId);
        if (!mat) return;

        this.setUniformOnMaterial(mat, uniform, value);
    }

    /** Seta um uniform num post-process ativo */
    public setPostProcessUniform(shaderId: PostProcessShaderId, uniform: ShaderUniform, value: unknown): void {
        const values = this.ppUniformValues.get(shaderId);

        if (!values) return;

        values[uniform.uniform] = value;
    }


    /** Atualiza u_time apenas nos shaders ativos (chamado no render loop) */
    public updateTime(time: number): void {
        // Apenas o material ativo
        if (this._activeMaterialId) {
            const mat = this.materialCache.get(this._activeMaterialId);
            mat?.setFloat('u_time', time);
        }

        // Todos os post-process ativos
        // (u_time nos PostProcess é setado via onApply, que roda automaticamente)
    }

    // ─── Helpers internos ───

    private setUniformOnMaterial(mat: B.ShaderMaterial, uniform: ShaderUniform, value: unknown): void {
        switch (uniform.type) {
            case 'float':
                mat.setFloat(uniform.uniform, value as number);
                break;
            case 'color': {
                const c = value as { r: number; g: number; b: number };
                mat.setColor3(uniform.uniform, new B.Color3(c.r, c.g, c.b));
                break;
            }
            case 'boolean':
                mat.setFloat(uniform.uniform, (value as boolean) ? 1.0 : 0.0);
                break;
        }
    }

    private setUniformOnEffect(effect: B.Effect, uniform: ShaderUniform, value: unknown): void {
        switch (uniform.type) {
            case 'float':
                effect.setFloat(uniform.uniform, value as number);
                break;
            case 'color': {
                const c = value as { r: number; g: number; b: number };
                effect.setColor3(uniform.uniform, new B.Color3(c.r, c.g, c.b));
                break;
            }
            case 'boolean':
                effect.setFloat(uniform.uniform, (value as boolean) ? 1.0 : 0.0);
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
    }
}
