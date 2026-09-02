import * as B from '@babylonjs/core';
import type { MaterialShaderConfig, MaterialCreateContext } from '../../Types';
import { SharedInclude } from '../../shared/SharedIncludes';

import fragmentSource from './Toon.fragment.glsl?raw';

import { TOON_OUTLINE_UNIFORMS } from '../../../configs/Constants';

export const ToonConfig: MaterialShaderConfig = {
    label: 'Toon Shading',
    title: 'Parâmetros do Toon',
    description: "Material estilo desenho animado com outline e specular",
    category: 'material',
    sharedIncludes: [SharedInclude.LIGHTING],

    postProcessDependencies: ['toon_edge'],

    create: (scene: B.Scene, ctx: MaterialCreateContext) => {
        B.Effect.ShadersStore['toonVertexShader'] = ctx.vertexSource;
        B.Effect.ShadersStore['toonFragmentShader'] = fragmentSource;

        return new B.ShaderMaterial('toonMat', scene, 'toon', {
            attributes: ctx.attributes,
            uniforms: [
                'worldViewProjection', 'world',
                'u_time', 'u_cameraPos',
                'u_color', 'u_levels', 'u_shadowMin',
                'u_glossiness', 'u_specThreshold', 'u_specIntensity', 'u_specColor',
                'u_rimMin', 'u_rimMax', 'u_rimIntensity', 'u_rimColor',
                ...ctx.sharedUniforms
            ],
        });
    },

    uniforms: [
        {
            type: 'folder',
            label: 'Cores Base (Diffuse)',
            children: [
                { uniform: 'u_color', label: 'Cor Base', description: 'A cor principal do material.', type: 'color', defaultValue: { r: 0.8, g: 0.2, b: 0.3 } },
                { uniform: 'u_levels', label: 'Degraus', description: 'Define quantas faixas/tons de sombra o material terá.', type: 'float', defaultValue: 5, min: 2, max: 10, step: 1 },
                { uniform: 'u_shadowMin', label: 'Sombra Min', description: 'O quão escuro o material pode ficar nas áreas com menos iluminação.', type: 'float', defaultValue: 0.15, min: 0.0, max: 1.0, step: 0.05 },
            ]
        },
        {
            type: 'folder',
            label: 'Reflexo (Specular)',
            children: [
                { uniform: 'u_specColor', label: 'Cor Specular', description: 'A cor do brilho gerado pelas fontes de luz.', type: 'color', defaultValue: { r: 1.0, g: 1.0, b: 1.0 } },
                { uniform: 'u_specIntensity', label: 'Força Specular', description: 'Multiplicador de intensidade do reflexo specular.', type: 'float', defaultValue: 0.5, min: 0.0, max: 2.0, step: 0.1 },
                { uniform: 'u_glossiness', label: 'Glossiness', description: 'O quão "apertado" (pequeno) é o reflexo da luz na superfície.', type: 'float', defaultValue: 50.0, min: 1.0, max: 128.0, step: 1.0 },
                { uniform: 'u_specThreshold', label: 'Corte Specular', description: 'O limite (threshold) para o brilho aparecer de forma sólida.', type: 'float', defaultValue: 0.5, min: 0.0, max: 1.0, step: 0.01 },
            ]
        },
        {
            type: 'folder',
            label: 'Iluminação de Borda (Rim Light)',
            children: [
                { uniform: 'u_rimColor', label: 'Cor do Rim', description: 'A cor da luz de preenchimento que aparece nas bordas externas.', type: 'color', defaultValue: { r: 1.0, g: 1.0, b: 1.0 } },
                { uniform: 'u_rimIntensity', label: 'Força do Rim', description: 'A intensidade/brilho dessa luz de borda.', type: 'float', defaultValue: 0.5, min: 0.0, max: 3.0, step: 0.1 },
                { uniform: 'u_rimMin', label: 'Rim Min', description: 'Controla a partir de onde a luz de borda começa a aparecer no objeto.', type: 'float', defaultValue: 0.6, min: 0.0, max: 1.0, step: 0.01 },
                { uniform: 'u_rimMax', label: 'Rim Max', description: 'Controla a expansão máxima da luz de borda.', type: 'float', defaultValue: 1.0, min: 0.0, max: 1.0, step: 0.01 },
            ]
        },
        {
            type: 'folder',
            label: 'Contorno (Sobel Outline)',
            children: [
                ...TOON_OUTLINE_UNIFORMS
            ]
        }
    ]

};
