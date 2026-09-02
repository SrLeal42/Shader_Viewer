import * as B from '@babylonjs/core';
import type { MaterialShaderConfig, MaterialCreateContext } from '../../Types';

import fragmentSource from './Portal.fragment.glsl?raw';

export const PortalConfig: MaterialShaderConfig = {
    label: 'Portal Cósmico',
    title: 'Parâmetros do Portal',
    description: 'Portal dimensional com parallax multi-camada procedural.',
    category: 'material',

    create: (scene: B.Scene, ctx: MaterialCreateContext) => {
        B.Effect.ShadersStore['portalVertexShader'] = ctx.vertexSource;
        B.Effect.ShadersStore['portalFragmentShader'] = fragmentSource;

        return new B.ShaderMaterial('portalMat', scene, 'portal', {
            attributes: ctx.attributes,
            uniforms: [
                'worldViewProjection', 'world',
                'u_time', 'u_cameraPos',
                'u_pattern', 'u_layers',
                'u_scrollSpeed', 'u_rotationSpeed', 'u_parallaxDepth',
                'u_baseColor', 'u_accentColor', 'u_brightness',
                'u_edgeGlow', 'u_edgeColor',
                'u_hemiDir', 'u_hemiColor', 'u_pointPos', 'u_pointColor'
            ]
        });
    },

    uniforms: [
        {
            type: 'folder',
            label: 'Padrão',
            children: [
                {
                    uniform: 'u_pattern',
                    label: 'Estilo',
                    description: 'Padrão visual do portal.',
                    type: 'list',
                    defaultValue: 0,
                    options: {
                        'Nebula': 0,
                        'Particules': 1,
                        'Vortex': 2,
                        'Void': 3
                    }
                },
                {
                    uniform: 'u_layers',
                    label: 'Camadas',
                    description: 'Número de camadas de parallax.',
                    type: 'float',
                    defaultValue: 8,
                    min: 2, max: 16, step: 1
                }
            ]
        },
        {
            type: 'folder',
            label: 'Animação',
            children: [
                {
                    uniform: 'u_scrollSpeed',
                    label: 'Velocidade',
                    description: 'Velocidade do movimento das camadas.',
                    type: 'float',
                    defaultValue: 0.5,
                    min: 0.0, max: 3.0, step: 0.1
                },
                {
                    uniform: 'u_rotationSpeed',
                    label: 'Rotação',
                    description: 'Velocidade de rotação entre camadas.',
                    type: 'float',
                    defaultValue: 0.15,
                    min: 0.0, max: 2.0, step: 0.05
                },
                {
                    uniform: 'u_parallaxDepth',
                    label: 'Profundidade',
                    description: 'Diferença de velocidade entre camadas. Mais = mais 3D.',
                    type: 'float',
                    defaultValue: 1.5,
                    min: 0.5, max: 3.0, step: 0.1
                }
            ]
        },
        {
            type: 'folder',
            label: 'Cores',
            children: [
                {
                    uniform: 'u_baseColor',
                    label: 'Cor Primária',
                    description: 'Cor das camadas mais próximas.',
                    type: 'color',
                    defaultValue: { r: 0.23, g: 0.04, b: 0.37 }
                },
                {
                    uniform: 'u_accentColor',
                    label: 'Cor Secundária',
                    description: 'Cor das camadas mais profundas.',
                    type: 'color',
                    defaultValue: { r: 0.0, g: 0.83, b: 1.0 }
                },
                {
                    uniform: 'u_brightness',
                    label: 'Brilho',
                    description: 'Brilho geral do efeito.',
                    type: 'float',
                    defaultValue: 1.5,
                    min: 0.5, max: 5.0, step: 0.1
                }
            ]
        },
        {
            type: 'folder',
            label: 'Bordas',
            children: [
                {
                    uniform: 'u_edgeGlow',
                    label: 'Brilho da Borda',
                    description: 'Intensidade do Fresnel nas bordas.',
                    type: 'float',
                    defaultValue: 0.5,
                    min: 0.0, max: 3.0, step: 0.1
                },
                {
                    uniform: 'u_edgeColor',
                    label: 'Cor da Borda',
                    description: 'Cor do brilho nas bordas.',
                    type: 'color',
                    defaultValue: { r: 0.5, g: 0.2, b: 1.0 }
                }
            ]
        }
    ]
};
