import * as B from '@babylonjs/core';
import type { MaterialShaderConfig } from '../../Types';

import vertexSource from './Toon.vertex.glsl?raw';
import fragmentSource from './Toon.fragment.glsl?raw';

import { TOON_OUTLINE_UNIFORMS } from '../../../configs/Constants';


export const ToonConfig: MaterialShaderConfig = {
    label: 'Toon Shading',
    title: 'Parâmetros do Toon',
    description: "Material estilo desenho animado com outline e specular",
    category: 'material',

    postProcessDependencies: ['toon_edge'],

    create: (scene: B.Scene) => {
        B.Effect.ShadersStore['toonVertexShader'] = vertexSource;
        B.Effect.ShadersStore['toonFragmentShader'] = fragmentSource;

        return new B.ShaderMaterial('toonMat', scene, 'toon', {
            attributes: ['position', 'normal'],
            uniforms: [
                'worldViewProjection', 'world',
                'u_time', 'u_cameraPos',
                'u_color', 'u_levels', 'u_shadowMin',
                'u_hemiDir', 'u_hemiColor', 'u_pointPos', 'u_pointColor',
                'u_glossiness', 'u_specThreshold', 'u_specIntensity', 'u_specColor',
                'u_rimMin', 'u_rimMax', 'u_rimIntensity', 'u_rimColor'
            ],
        });
    },

    uniforms: [
        // --- Diffuse ---
        { uniform: 'u_color', label: 'Cor Base', type: 'color', defaultValue: { r: 0.8, g: 0.2, b: 0.3 } },
        { uniform: 'u_levels', label: 'Degraus', type: 'float', defaultValue: 5, min: 2, max: 10, step: 1 },
        { uniform: 'u_shadowMin', label: 'Sombra Min', type: 'float', defaultValue: 0.15, min: 0.0, max: 1.0, step: 0.05 },

        // --- Specular ---
        { uniform: 'u_specColor', label: 'Cor Specular', type: 'color', defaultValue: { r: 1.0, g: 1.0, b: 1.0 } },
        { uniform: 'u_specIntensity', label: 'Força Specular', type: 'float', defaultValue: 0.5, min: 0.0, max: 2.0, step: 0.1 },
        { uniform: 'u_glossiness', label: 'Glossiness', type: 'float', defaultValue: 50.0, min: 1.0, max: 128.0, step: 1.0 },
        { uniform: 'u_specThreshold', label: 'Corte Specular', type: 'float', defaultValue: 0.5, min: 0.0, max: 1.0, step: 0.01 },

        // --- Rim Light ---
        { uniform: 'u_rimColor', label: 'Cor do Rim', type: 'color', defaultValue: { r: 1.0, g: 1.0, b: 1.0 } },
        { uniform: 'u_rimIntensity', label: 'Força do Rim', type: 'float', defaultValue: 0.5, min: 0.0, max: 3.0, step: 0.1 },
        { uniform: 'u_rimMin', label: 'Rim Min', type: 'float', defaultValue: 0.6, min: 0.0, max: 1.0, step: 0.01 },
        { uniform: 'u_rimMax', label: 'Rim Max', type: 'float', defaultValue: 1.0, min: 0.0, max: 1.0, step: 0.01 },

        ...TOON_OUTLINE_UNIFORMS
    ]
};
