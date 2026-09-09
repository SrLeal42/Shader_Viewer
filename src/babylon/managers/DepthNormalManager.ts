import * as B from '@babylonjs/core';
import depthFragment from '../../shaders/passes/depth_pass.fragment.glsl?raw';
import normalFragment from '../../shaders/passes/normal_pass.fragment.glsl?raw';
import { resolveBaseVertex } from '../../shaders/shared/SharedIncludes';
import { VertexEffects, type VertexEffectId } from '../../shaders/Registry';
import { ENVIRONMENT_WALLS } from '../../configs/Constants';

export class DepthNormalManager {
    private scene: B.Scene;

    private depthRTT: B.RenderTargetTexture;
    private normalRTT: B.RenderTargetTexture;

    private depthMaterial: B.ShaderMaterial | null = null;
    private normalMaterial: B.ShaderMaterial | null = null;

    private targetMesh: B.AbstractMesh | null = null;

    constructor(scene: B.Scene) {
        this.scene = scene;

        const engine = scene.getEngine();
        const width = engine.getRenderWidth();
        const height = engine.getRenderHeight();

        // 1. Cria a RTT de Profundidade
        this.depthRTT = new B.RenderTargetTexture(
            'customDepthRTT',
            { width, height },
            scene,
            false, // generateMipMaps
            true, // doNotChangeAspectRatio
            B.Constants.TEXTURETYPE_FLOAT,
            false, // isCube
            B.Texture.BILINEAR_SAMPLINGMODE,
            true, // generateDepthBuffer
            true, // generateStencilBuffer
            false, // isMulti
            B.Constants.TEXTUREFORMAT_R // Só precisamos de 1 canal para depth
        );
        this.depthRTT.clearColor = new B.Color4(1.0, 1.0, 1.0, 1.0); // Fundo infinito (profundidade 1.0)

        // 2. Cria a RTT de Normais
        this.normalRTT = new B.RenderTargetTexture(
            'customNormalRTT',
            { width, height },
            scene,
            false,
            true,
            B.Constants.TEXTURETYPE_FLOAT, // Precisão para normais
            false,
            B.Texture.BILINEAR_SAMPLINGMODE,
            true,
            true,
            false,
            B.Constants.TEXTUREFORMAT_RGBA
        );

        // Fundo neutro. Uma normal [0,0,1] remapeada fica [0.5, 0.5, 1.0]
        this.normalRTT.clearColor = new B.Color4(0.5, 0.5, 1.0, 1.0);

        // Render List Dinâmica: Ocultar Céu e Paredes invisíveis
        const ignoredMeshes = ['skybox', ...ENVIRONMENT_WALLS];
        const predicate = (mesh: B.AbstractMesh) => !ignoredMeshes.includes(mesh.name);

        this.depthRTT.renderListPredicate = predicate;
        this.normalRTT.renderListPredicate = predicate;

        scene.customRenderTargets.push(this.depthRTT, this.normalRTT);

        // Inicializa com material vazio ('none')
        this.rebuildMaterials('none');
    }

    public getDepthTexture(): B.RenderTargetTexture { return this.depthRTT; }
    public getNormalTexture(): B.RenderTargetTexture { return this.normalRTT; }

    public setTargetMesh(mesh: B.AbstractMesh) {

        if (this.targetMesh && this.depthMaterial && this.normalMaterial) {
            // Remove overrides antigos da mesh e dos seus filhos
            this.depthRTT.setMaterialForRendering(this.targetMesh, undefined);
            this.normalRTT.setMaterialForRendering(this.targetMesh, undefined);
            for (const child of this.targetMesh.getChildMeshes()) {
                this.depthRTT.setMaterialForRendering(child, undefined);
                this.normalRTT.setMaterialForRendering(child, undefined);
            }
        }

        this.targetMesh = mesh;

        this.applyMaterialsToTarget();

    }

    public rebuildMaterials(effectId: VertexEffectId) {

        if (this.depthMaterial) this.depthMaterial.dispose(true, true);

        if (this.normalMaterial) this.normalMaterial.dispose(true, true);

        // Usamos sempre BaseVertex.UV pois ele tem os atributos position, normal (e opcionalmente uv) necessários para deformações
        const vertexDef = resolveBaseVertex('uv');
        const effectConfig = VertexEffects[effectId];
        const effectUniforms = effectConfig.extraUniforms || [];

        B.Effect.ShadersStore['customDepthVertexShader'] = vertexDef.source;
        B.Effect.ShadersStore['customDepthFragmentShader'] = depthFragment;

        this.depthMaterial = new B.ShaderMaterial('depthMaterial', this.scene, 'customDepth', {
            attributes: vertexDef.attributes,
            uniforms: ['world', 'worldViewProjection', 'u_time', ...effectUniforms],
        });

        B.Effect.ShadersStore['customNormalVertexShader'] = vertexDef.source;
        B.Effect.ShadersStore['customNormalFragmentShader'] = normalFragment;

        this.normalMaterial = new B.ShaderMaterial('normalMaterial', this.scene, 'customNormal', {
            attributes: vertexDef.attributes,
            uniforms: ['world', 'worldViewProjection', 'u_time', ...effectUniforms],
        });

        this.applyMaterialsToTarget();

    }


    private applyMaterialsToTarget() {

        if (!this.targetMesh || !this.depthMaterial || !this.normalMaterial) return;

        // Ao definir setMaterialForRendering, a RTT forçará esse material apenas nestas meshes, 
        // mantendo as outras intocadas (se não estiverem ignoradas).
        this.depthRTT.setMaterialForRendering(this.targetMesh, this.depthMaterial);
        this.normalRTT.setMaterialForRendering(this.targetMesh, this.normalMaterial);

        for (const child of this.targetMesh.getChildMeshes()) {
            this.depthRTT.setMaterialForRendering(child, this.depthMaterial);
            this.normalRTT.setMaterialForRendering(child, this.normalMaterial);
        }

    }


    public updateTime(time: number, effectUniforms: Record<string, unknown>) {

        if (this.depthMaterial) {
            this.depthMaterial.setFloat('u_time', time);
            for (const [key, value] of Object.entries(effectUniforms)) {
                if (typeof value === 'number') this.depthMaterial.setFloat(key, value);
            }
        }

        if (this.normalMaterial) {
            this.normalMaterial.setFloat('u_time', time);
            for (const [key, value] of Object.entries(effectUniforms)) {
                if (typeof value === 'number') this.normalMaterial.setFloat(key, value);
            }
        }

    }

    public dispose() {

        this.depthRTT.dispose();

        this.normalRTT.dispose();

        if (this.depthMaterial) this.depthMaterial.dispose(true, true);

        if (this.normalMaterial) this.normalMaterial.dispose(true, true);

    }

}
