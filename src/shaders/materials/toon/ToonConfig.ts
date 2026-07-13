import * as B from '@babylonjs/core';
import type { MaterialShaderConfig } from '../../Types';

import vertexSource from './toon.vertex.glsl?raw';
import fragmentSource from './toon.fragment.glsl?raw';

export const ToonConfig: MaterialShaderConfig = {
    label: 'Toon Shading',
    title: 'Parâmetros do Toon',
    category: 'material',

    create: (scene: B.Scene) => {
        // Registra os shaders no store interno do Babylon
        B.Effect.ShadersStore['toonVertexShader'] = vertexSource;
        B.Effect.ShadersStore['toonFragmentShader'] = fragmentSource;

        return new B.ShaderMaterial('toonMat', scene, 'toon', {
            attributes: ['position', 'normal'],
            uniforms: [
                'worldViewProjection', 'world',                // Babylon preenche automaticamente
                'u_time', 'u_color', 'u_levels', 'u_lightDir'  // Nossos uniforms customizados
            ],
        });
    },

    uniforms: [
        {
            uniform: 'u_levels',
            label: 'Níveis de Sombra',
            type: 'float',
            defaultValue: 7,
            min: 2, max: 15, step: 1,
        },
        {
            uniform: 'u_color',
            label: 'Cor Base',
            type: 'color',
            defaultValue: { r: 0.8, g: 0.2, b: 0.3 },
        }
    ]
};
