import * as B from '@babylonjs/core';
import type { MaterialShaderConfig } from '../../Types';

import vertexSource from './Glass.vertex.glsl?raw';
import fragmentSource from './Glass.fragment.glsl?raw';

export const GlassConfig: MaterialShaderConfig = {
    label: 'Vidro',
    title: 'Parâmetros do Vidro',
    description: 'Vidro com refração screen-space, reflexão via cubemap e Fresnel.',
    category: 'material',
    needsSceneTexture: true,
    needsEnvironmentCubemap: true,

    create: (scene: B.Scene) => {
        B.Effect.ShadersStore['glassVertexShader'] = vertexSource;
        B.Effect.ShadersStore['glassFragmentShader'] = fragmentSource;

        const material = new B.ShaderMaterial('glassMat', scene, 'glass', {
            attributes: ['position', 'normal'],
            uniforms: [
                'worldViewProjection', 'world',
                'u_time', 'u_cameraPos', 'u_screenSize',
                'u_ior', 'u_tintColor', 'u_tintDensity',
                'u_roughness', 'u_reflectivity', 'u_fresnelPower',
                'u_refractionStrength',
                'u_hasEnvCubemap',
                'u_hemiDir', 'u_hemiColor', 'u_pointPos', 'u_pointColor'
            ],
            samplers: ['u_sceneTexture', 'u_envCubemap']
        });

        // Vidro é visível dos dois lados
        material.backFaceCulling = false;

        return material;
    },

    uniforms: [
        {
            type: 'folder',
            label: 'Refração',
            children: [
                {
                    uniform: 'u_ior',
                    label: 'Índice de Refração',
                    description: 'IOR do material. Vidro = 1.52, Água = 1.33, Diamante = 2.42.',
                    type: 'float',
                    defaultValue: 1.52,
                    min: 1.0, max: 2.5, step: 0.01
                },
                {
                    uniform: 'u_refractionStrength',
                    label: 'Força da Distorção',
                    description: 'Quanto a imagem atrás do vidro é distorcida.',
                    type: 'float',
                    defaultValue: 0.08,
                    min: 0.0, max: 0.3, step: 0.01
                }
            ]
        },
        {
            type: 'folder',
            label: 'Aparência',
            children: [
                {
                    uniform: 'u_tintColor',
                    label: 'Cor do Vidro',
                    description: 'Tonalidade de cor aplicada na refração.',
                    type: 'color',
                    defaultValue: { r: 0.9, g: 0.95, b: 1.0 }
                },
                {
                    uniform: 'u_tintDensity',
                    label: 'Densidade do Tint',
                    description: 'O quão forte a cor do vidro é visível. 0 = cristal transparente.',
                    type: 'float',
                    defaultValue: 0.15,
                    min: 0.0, max: 1.0, step: 0.05
                },
                {
                    uniform: 'u_roughness',
                    label: 'Rugosidade',
                    description: 'Suaviza reflexões e highlights. 0 = polido, 1 = fosco.',
                    type: 'float',
                    defaultValue: 0.5,
                    min: 0.0, max: 1.0, step: 0.01
                }
            ]
        },
        {
            type: 'folder',
            label: 'Reflexão & Fresnel',
            children: [
                {
                    uniform: 'u_reflectivity',
                    label: 'Reflexividade',
                    description: 'Multiplicador da reflexão do ambiente.',
                    type: 'float',
                    defaultValue: 0.5,
                    min: 0.0, max: 2.0, step: 0.1
                },
                {
                    uniform: 'u_fresnelPower',
                    label: 'Potência do Fresnel',
                    description: 'Controla quanto as bordas ficam mais reflexivas que o centro.',
                    type: 'float',
                    defaultValue: 5.0,
                    min: 1.0, max: 10.0, step: 0.5
                }
            ]
        }
    ]

};
