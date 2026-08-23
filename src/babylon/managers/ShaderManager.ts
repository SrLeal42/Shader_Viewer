import * as B from '@babylonjs/core';

import {
    MaterialShaders, PostProcessShaders,
    type MaterialShaderId, type PostProcessShaderId
} from '../../shaders/Registry';

import { flattenUniforms, type ValueUniform, type MaterialApplyContext } from '../../shaders/Types';

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
    private fallbackTexture!: B.Texture;
    private fallbackCubemap!: B.RawCubeTexture;

    // Screen-space refraction (RTT)
    private sceneRTT: B.RenderTargetTexture | null = null;
    // private sceneRTTMesh: B.AbstractMesh | null = null;

    // Callback armazenado para re-injeção dinâmica do cubemap
    private getCubemapCallback: (() => B.BaseTexture | null) | null = null;


    constructor(scene: B.Scene, camera: B.Camera, lightManager: LightManager) {
        this.scene = scene;
        this.camera = camera;

        this.lightManager = lightManager;

        this.createFallbackTextures();
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
        context?: MaterialApplyContext
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



        // ─── Injeção de textura albedo ───
        if (config.needsAlbedoTexture && context?.getAlbedo) {

            let albedo = context.getAlbedo(mesh);
            if (!albedo) {
                for (const child of children) {
                    albedo = context.getAlbedo(child);
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

        // ─── Screen-space refraction (RTT da cena sem o modelo) ───
        this.disposeSceneRTT(); // Limpa RTT anterior se houver
        if (config.needsSceneTexture) {

            const engine = this.scene.getEngine();
            const rtt = new B.RenderTargetTexture(
                'glassSceneRTT',
                { width: engine.getRenderWidth(), height: engine.getRenderHeight() },
                this.scene,
                false // generateMipMaps
            );
            // this.sceneRTTMesh = mesh;

            // A cada frame, repopula o renderList com TODOS os meshes
            // exceto o modelo com vidro e seus filhos
            const childSet = new Set<B.AbstractMesh>(children);
            rtt.onBeforeRenderObservable.add(() => {
                rtt.renderList!.length = 0;
                for (const sceneMesh of this.scene.meshes) {
                    if (sceneMesh !== mesh && !childSet.has(sceneMesh)) {
                        rtt.renderList!.push(sceneMesh);
                    }
                }
            });

            this.scene.customRenderTargets.push(rtt);
            this.sceneRTT = rtt;

            material.setTexture('u_sceneTexture', rtt);
            material.setVector2('u_screenSize', new B.Vector2(
                engine.getRenderWidth(), engine.getRenderHeight()
            ));
        }

        // ─── Cubemap do ambiente para reflexão ───
        this.getCubemapCallback = context?.getCubemap ?? null;

        if (config.needsEnvironmentCubemap) {

            const cubemap = context?.getCubemap?.();
            if (cubemap) {
                material.setTexture('u_envCubemap', cubemap);
                material.setFloat('u_hasEnvCubemap', 1.0);
            } else {
                material.setTexture('u_envCubemap', this.fallbackCubemap);
                material.setFloat('u_hasEnvCubemap', 0.0);
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
        this.disposeSceneRTT();
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

                // Atualiza screenSize para shaders com screen-space refraction
                const config = MaterialShaders[this._activeMaterialId];
                if (config.needsSceneTexture) {
                    const engine = this.scene.getEngine();
                    mat.setVector2('u_screenSize', new B.Vector2(engine.getRenderWidth(), engine.getRenderHeight()));
                }

                // Re-injeta cubemap dinamicamente (acompanha troca de skybox)
                if (config.needsEnvironmentCubemap && this.getCubemapCallback) {

                    const cubemap = this.getCubemapCallback();
                    if (cubemap) {
                        mat.setTexture('u_envCubemap', cubemap);
                        mat.setFloat('u_hasEnvCubemap', 1.0);
                    } else {
                        mat.setTexture('u_envCubemap', this.fallbackCubemap);
                        mat.setFloat('u_hasEnvCubemap', 0.0);
                    }

                }

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

    /** Lê um objeto do Tweakpane e injeta todos os valores válidos no Material atual */
    public injectMaterialUniforms(proxy: Record<string, unknown>): void {
        if (!this._activeMaterialId) return;

        const config = MaterialShaders[this._activeMaterialId];

        if (!config) return;

        flattenUniforms(config.uniforms).forEach(u => {
            if (proxy[u.uniform] !== undefined) {
                this.setMaterialUniform(u, proxy[u.uniform]);
            }
        });

    }

    /** Lê um objeto do Tweakpane e injeta todos os valores válidos no Post-Process especificado */
    public injectPostProcessUniforms(shaderId: PostProcessShaderId, proxy: Record<string, unknown>): void {
        const config = PostProcessShaders[shaderId];

        if (!config) return;

        flattenUniforms(config.uniforms).forEach(u => {
            if (proxy[u.uniform] !== undefined) {
                this.setPostProcessUniform(shaderId, u, proxy[u.uniform]);
            }
        });

    }


    private createFallbackTextures(): void {

        // Textura 2D 1x1 branca (para samplers 2D não definidos)
        const dt = new B.DynamicTexture('fallbackTex', { width: 1, height: 1 }, this.scene, false);
        const ctx = dt.getContext();
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, 1, 1);
        dt.update();
        this.fallbackTexture = dt;

        // CubeTexture 1x1 preta (para samplerCube não definidos)
        const black = new Uint8Array([0, 0, 0, 255]);
        this.fallbackCubemap = new B.RawCubeTexture(
            this.scene,
            [black, black, black, black, black, black],
            1
        );
    }

    // ─── Cleanup ───

    private disposeSceneRTT(): void {
        if (this.sceneRTT) {
            const idx = this.scene.customRenderTargets.indexOf(this.sceneRTT);
            if (idx !== -1) this.scene.customRenderTargets.splice(idx, 1);
            this.sceneRTT.dispose();
            this.sceneRTT = null;
            // this.sceneRTTMesh = null;
        }
        this.getCubemapCallback = null;
    }

    public dispose(): void {

        for (const mat of this.materialCache.values()) mat.dispose();

        for (const pp of this.activePostProcesses.values()) pp.dispose();

        this.materialCache.clear();

        this.activePostProcesses.clear();

        this.ppUniformValues.clear();

        this.disposeSceneRTT();

        this._activeMaterialId = null;

        this.fallbackTexture.dispose();

        this.fallbackCubemap.dispose();
    }

}
