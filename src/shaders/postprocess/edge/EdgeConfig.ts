import * as B from '@babylonjs/core';
import type { PostProcessShaderConfig } from '../../Types';

import fragmentSource from './Edge.fragment.glsl?raw';
import { ENVIRONMENT_WALLS } from '../../../configs/Constants';

export const EdgeConfig: PostProcessShaderConfig = {
    label: 'Edge Detection (Geometria)',
    title: 'Parâmetros Edge Detection',
    description: 'Detecta bordas baseando-se na profundidade e nas normais, ignorando texturas e luzes.',
    category: 'postprocess',
    create: (scene: B.Scene, camera: B.Camera, getUniforms: () => Record<string, unknown>) => {
        B.Effect.ShadersStore['edgeFragmentShader'] = fragmentSource;
        // Lista de malhas que não devem gerar bordas (Céu e Barreiras Invisíveis da Física)
        const ignoredMeshes = ['skybox', ...ENVIRONMENT_WALLS];
        const predicate = (mesh: B.AbstractMesh) => !ignoredMeshes.includes(mesh.name);

        // Habilita o DepthRenderer (mais preciso para profundidade)
        const depthRenderer = scene.enableDepthRenderer(camera, false);
        depthRenderer.getDepthMap().renderListPredicate = predicate;

        // Habilita o GeometryBufferRenderer (para extrair as Normais)
        const gBuffer = scene.enableGeometryBufferRenderer();
        if (gBuffer) {
            gBuffer.getGBuffer().renderListPredicate = predicate;
        }

        const pp = new B.PostProcess('edgeDetection', 'edge', {
            uniforms: ['u_screenSize', 'u_depthThreshold', 'u_normalThreshold', 'u_edgeColor', 'u_edgeWidth', 'u_showOnlyEdges'],
            samplers: ['depthSampler', 'normalSampler'],
            size: 1.0,
            camera: camera,
            samplingMode: B.Texture.BILINEAR_SAMPLINGMODE,
            engine: scene.getEngine(),
            reusable: false
        });

        pp.onApplyObservable.add((effect) => {
            effect.setFloat2('u_screenSize', pp.width, pp.height);

            // Injeta as texturas de profundidade e normais no shader
            effect.setTexture('depthSampler', depthRenderer.getDepthMap());
            if (gBuffer) {
                // No GBuffer padrão do Babylon, a textura 1 contém as Normais
                effect.setTexture('normalSampler', gBuffer.getGBuffer().textures[1]);
            }
        });

        return pp;

    },
    uniforms: [
        {
            uniform: 'u_depthThreshold',
            label: 'Sensibilidade (Silhueta)',
            description: 'Sensibilidade para detectar sobreposição de objetos.',
            type: 'float',
            defaultValue: 0.05,
            min: 0.001, max: 0.5, step: 0.001,
        },
        {
            uniform: 'u_normalThreshold',
            label: 'Sensibilidade (Quinas)',
            description: 'Sensibilidade para detectar dobras e cantos.',
            type: 'float',
            defaultValue: 1.0,
            min: 0.01, max: 2.0, step: 0.01,
        },
        {
            uniform: 'u_edgeColor',
            label: 'Cor da Borda',
            description: 'Cor com a qual as bordas serão desenhadas.',
            type: 'color',
            defaultValue: { r: 0.0, g: 0.0, b: 0.0 }, // Preto
        },
        {
            uniform: 'u_edgeWidth',
            label: 'Espessura',
            description: 'Largura da detecção de bordas em pixels.',
            type: 'float',
            defaultValue: 1.0,
            min: 0.5,
            max: 3.0,
            step: 0.1,
        },
        {
            uniform: 'u_showOnlyEdges',
            label: 'Apenas Bordas',
            description: 'Ative para mostrar as bordas sobre um fundo branco, ocultando a cena original.',
            type: 'boolean',
            defaultValue: false,
        }
    ]
};
