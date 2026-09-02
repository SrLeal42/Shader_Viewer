import * as B from '@babylonjs/core';
import type { MaterialShaderConfig, MaterialCreateContext } from '../../Types';
import { SharedInclude } from '../../shared/SharedIncludes';

import fragmentSource from './Iridescent.fragment.glsl?raw';

export const IridescentConfig: MaterialShaderConfig = {
    label: 'Furta-Cor',
    title: 'Parâmetros Furta-Cor',
    description: 'Efeito holográfico e bolha de sabão que muda de cor com a luz e o ângulo.',
    category: 'material',
    needsSceneTexture: false,
    needsEnvironmentCubemap: false,
    sharedIncludes: [SharedInclude.LIGHTING, SharedInclude.SPECULAR],

    create: (scene: B.Scene, ctx: MaterialCreateContext) => {
        B.Effect.ShadersStore['iridescentVertexShader'] = ctx.vertexSource;
        B.Effect.ShadersStore['iridescentFragmentShader'] = fragmentSource;

        const material = new B.ShaderMaterial('iridescentMat', scene, 'iridescent', {
            attributes: ctx.attributes,
            uniforms: [
                'worldViewProjection', 'world',
                'u_cameraPos',
                'u_baseColor', 'u_iridescenceStrength', 'u_iridescenceScale', 'u_shininess',
                ...ctx.sharedUniforms
            ]
        });

        return material;
    },

    uniforms: [
        {
            type: 'folder',
            label: 'Base & Superfície',
            children: [
                {
                    uniform: 'u_baseColor',
                    label: 'Cor Sólida',
                    description: 'Cor de fundo (Preto = Bolha de sabão, Branco = Pérola).',
                    type: 'color',
                    defaultValue: { r: 1.0, g: 1.0, b: 1.0 }
                },
                {
                    uniform: 'u_shininess',
                    label: 'Polimento',
                    description: 'Controla o brilho branco da luz (0 = fosco, 1 = plástico polido).',
                    type: 'float',
                    defaultValue: 0.85,
                    min: 0.0, max: 1.0, step: 0.01
                }
            ]
        },
        {
            type: 'folder',
            label: 'Arco-Íris',
            children: [
                {
                    uniform: 'u_iridescenceStrength',
                    label: 'Intensidade Furta-Cor',
                    description: 'Quão forte é o efeito colorido brilhando sobre a cor base.',
                    type: 'float',
                    defaultValue: 0.75,
                    min: 0.0, max: 1.0, step: 0.01
                },
                {
                    uniform: 'u_iridescenceScale',
                    label: 'Quantidade de Faixas',
                    description: 'Multiplicador das faixas de cor. Valores maiores criam arco-íris repetidos.',
                    type: 'float',
                    defaultValue: 1.5,
                    min: 0.1, max: 5.0, step: 0.1
                }
            ]
        }
    ]
};
