import * as B from '@babylonjs/core';
import type { MaterialShaderConfig } from '../../Types';

import vertexSource from './PixelArt.vertex.glsl?raw';
import fragmentSource from './PixelArt.fragment.glsl?raw';

export const PixelArtConfig: MaterialShaderConfig = {
    label: 'Pixel Art',
    title: 'Parâmetros do Pixel Art',
    description: 'Transforma o modelo em pixel art com paleta limitada e dithering.',
    category: 'material',
    needsAlbedoTexture: true,

    create: (scene: B.Scene) => {
        B.Effect.ShadersStore['pixelartVertexShader'] = vertexSource;
        B.Effect.ShadersStore['pixelartFragmentShader'] = fragmentSource;

        return new B.ShaderMaterial('pixelartMat', scene, 'pixelart', {
            attributes: ['position', 'normal', 'uv'],
            uniforms: [
                'worldViewProjection', 'world',
                'u_time', 'u_cameraPos',
                'u_hasAlbedo',
                'u_colorLevels', 'u_saturation',
                'u_lightSteps', 'u_shadowMin',
                'u_ditherStrength', 'u_ditherScale', 'u_ditherPattern',
                'u_hemiDir', 'u_hemiColor', 'u_pointPos', 'u_pointColor'
            ],
            samplers: ['u_albedo']
        });
    },

    uniforms: [
        {
            type: 'folder',
            label: 'Paleta de Cores',
            children: [
                {
                    uniform: 'u_colorLevels',
                    label: 'Níveis de Cor',
                    description: 'Quantidade de tons por canal RGB. Menos = mais retrô.',
                    type: 'float',
                    defaultValue: 6,
                    min: 2, max: 16, step: 1
                },
                {
                    uniform: 'u_saturation',
                    label: 'Saturação',
                    description: 'Boost de saturação para cores mais vibrantes.',
                    type: 'float',
                    defaultValue: 1.3,
                    min: 0.0, max: 3.0, step: 0.1
                }
            ]
        },
        {
            type: 'folder',
            label: 'Iluminação',
            children: [
                {
                    uniform: 'u_lightSteps',
                    label: 'Degraus de Luz',
                    description: 'Quantidade de faixas de iluminação visíveis.',
                    type: 'float',
                    defaultValue: 3,
                    min: 2, max: 8, step: 1
                },
                {
                    uniform: 'u_shadowMin',
                    label: 'Sombra Mínima',
                    description: 'O quão escuro as áreas de sombra podem ficar.',
                    type: 'float',
                    defaultValue: 0.15,
                    min: 0.0, max: 1.0, step: 0.05
                }
            ]
        },
        {
            type: 'folder',
            label: 'Dithering',
            children: [
                {
                    uniform: 'u_ditherPattern',
                    label: 'Padrão',
                    description: 'Qual padrão visual usar para o dithering.',
                    type: 'list',
                    defaultValue: 0,
                    options: {
                        'Bayer 4x4': 0,
                        'Bayer 8x8': 1,
                        'Halftone': 2,
                        'Crosshatch': 3
                    }
                },
                {
                    uniform: 'u_ditherStrength',
                    label: 'Intensidade',
                    description: 'Força do padrão de pontilhado. 0 = desligado.',
                    type: 'float',
                    defaultValue: 0.5,
                    min: 0.0, max: 2.0, step: 0.1
                },
                {
                    uniform: 'u_ditherScale',
                    label: 'Escala do Padrão',
                    description: 'Tamanho dos pontos do dithering.',
                    type: 'float',
                    defaultValue: 2.0,
                    min: 0.5, max: 4.0, step: 0.5
                }
            ]
        }
    ]
};
