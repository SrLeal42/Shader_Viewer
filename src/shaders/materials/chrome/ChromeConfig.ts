import * as B from '@babylonjs/core';
import type { MaterialShaderConfig } from '../../Types';

import vertexSource from './Chrome.vertex.glsl?raw';
import fragmentSource from './Chrome.fragment.glsl?raw';

export const ChromeConfig: MaterialShaderConfig = {
    label: 'Cromo',
    title: 'Parâmetros do Cromo',
    description: 'Metal líquido reflexivo no estilo Chromecore.',
    category: 'material',
    needsSceneTexture: true,
    needsEnvironmentCubemap: true,

    create: (scene: B.Scene) => {
        B.Effect.ShadersStore['chromeVertexShader'] = vertexSource;
        B.Effect.ShadersStore['chromeFragmentShader'] = fragmentSource;

        const material = new B.ShaderMaterial('chromeMat', scene, 'chrome', {
            attributes: ['position', 'normal'],
            uniforms: [
                'worldViewProjection', 'world',
                'u_time', 'u_cameraPos', 'u_screenSize',
                'u_metalColor', 'u_roughness', 'u_reflectivity', 'u_fresnelPower',
                'u_noiseScale', 'u_noiseStrength', 'u_noiseSpeed',
                'u_lumThreshold',
                'u_hasEnvCubemap',
                'u_hemiDir', 'u_hemiColor', 'u_pointPos', 'u_pointColor'
            ],
            samplers: ['u_sceneTexture', 'u_envCubemap']
        });

        return material;
    },

    uniforms: [
        {
            type: 'folder',
            label: 'Aparência',
            children: [
                {
                    uniform: 'u_metalColor',
                    label: 'Cor do Metal',
                    description: 'Tinge o reflexo inteiro.',
                    type: 'color',
                    defaultValue: { r: 0.85, g: 0.85, b: 0.88 }
                },
                {
                    uniform: 'u_roughness',
                    label: 'Rugosidade',
                    description: 'Nivel de rugosidade do material.',
                    type: 'float',
                    defaultValue: 0.25,
                    min: 0.0, max: 1.0, step: 0.01
                },
                {
                    uniform: 'u_lumThreshold',
                    label: 'Limiar de Luminância',
                    description: 'Acima = reflexo puro, Abaixo = cor do metal. Controla o contraste metálico.',
                    type: 'float',
                    defaultValue: 0.05,
                    min: 0.0, max: 1.0, step: 0.01
                }
            ]
        },
        {
            type: 'folder',
            label: 'Metal Líquido',
            children: [
                {
                    uniform: 'u_noiseScale',
                    label: 'Escala do Ruído',
                    description: 'Tamanho das ondulações na superfície. Maior = mais detalhado.',
                    type: 'float',
                    defaultValue: 1.5,
                    min: 0.1, max: 20.0, step: 0.1
                },
                {
                    uniform: 'u_noiseStrength',
                    label: 'Força do Ruído',
                    description: 'Intensidade da distorção das normais. 0 = espelho liso.',
                    type: 'float',
                    defaultValue: 0.1,
                    min: 0.0, max: 1.0, step: 0.01
                },
                {
                    uniform: 'u_noiseSpeed',
                    label: 'Velocidade',
                    description: 'Velocidade da animação do metal líquido.',
                    type: 'float',
                    defaultValue: 0.1,
                    min: 0.0, max: 2.0, step: 0.01
                }
            ]
        },
        {
            type: 'folder',
            label: 'Reflexão',
            children: [
                {
                    uniform: 'u_reflectivity',
                    label: 'Intensidade do Reflexo',
                    description: 'Multiplicador da reflexão do ambiente.',
                    type: 'float',
                    defaultValue: 1.0,
                    min: 0.0, max: 2.0, step: 0.1
                },
                {
                    uniform: 'u_fresnelPower',
                    label: 'Brilho de Borda',
                    description: 'Controla quanto as bordas ficam mais brilhantes que o centro.',
                    type: 'float',
                    defaultValue: 3.0,
                    min: 1.0, max: 10.0, step: 0.5
                }
            ]
        }
    ]
};
