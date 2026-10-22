import * as B from '../../../babylon/BabylonAdapter';
import type { PostProcessShaderConfig } from '../../Types';

import fragmentSource from './Dithering.fragment.glsl?raw';

export const DitheringConfig: PostProcessShaderConfig = {
    category: 'postprocess',
    label: 'Dithering',
    title: 'Parâmetros do Dithering',
    description: 'Pontilhado ordenado e quantização de cores na tela inteira.',

    create: (scene: B.Scene, camera: B.Camera) => {
        const shaderName = 'ditheringEffect';
        B.Effect.ShadersStore[`${shaderName}FragmentShader`] = fragmentSource;

        const pp = new B.PostProcess(
            'dithering',
            shaderName,
            {
                uniforms: [
                    'u_screenSize',
                    'u_pattern',
                    'u_ditherScale',
                    'u_colorMode',
                    'u_colorLevels',
                    'u_threshold',
                    'u_darkColor',
                    'u_lightColor',
                ],
                samplers: ['textureSampler'],
                size: 1.0,
                camera: camera,
                samplingMode: B.Texture.NEAREST_SAMPLINGMODE,
                engine: scene.getEngine(),
                reusable: false,
            }
        );

        pp.onApplyObservable.add((effect) => {
            effect.setFloat2('u_screenSize', pp.width, pp.height);
        });

        return pp;
    },

    uniforms: [
        {
            uniform: 'u_pattern',
            label: 'Padrão',
            description: 'Matriz de limiar usada para o pontilhado.',
            type: 'list',
            defaultValue: 1,
            options: {
                'Bayer 4x4': 0,
                'Bayer 8x8': 1,
                'Halftone': 2,
                'Blue Noise (IGN)': 3,
            },
        },
        {
            uniform: 'u_ditherScale',
            label: 'Escala do Ponto',
            description: 'Tamanho de cada célula do pontilhado em pixels.',
            type: 'float',
            defaultValue: 2.0,
            min: 1.0,
            max: 8.0,
            step: 1.0,
        },
        {
            uniform: 'u_colorMode',
            label: 'Modo de Cor',
            description: 'Alterna entre paleta RGB reduzida ou modo 1-Bit (2 cores).',
            type: 'list',
            defaultValue: 0,
            options: {
                'Colorido (RGB)': 0,
                'Duotone (1-Bit)': 1,
            },
        },
        {
            uniform: 'u_colorLevels',
            label: 'Níveis de Cor',
            description: 'Quantidade de tons por canal RGB.',
            type: 'float',
            defaultValue: 4.0,
            min: 2.0,
            max: 16.0,
            step: 1.0,
            visibleWhen: { uniform: 'u_colorMode', value: 0 },
        },
        {
            uniform: 'u_threshold',
            label: 'Limiar de Luz',
            description: 'Equilíbrio entre a cor escura e a cor clara.',
            type: 'float',
            defaultValue: 0.5,
            min: 0.0,
            max: 1.0,
            step: 0.01,
            visibleWhen: { uniform: 'u_colorMode', value: 1 },
        },
        {
            uniform: 'u_darkColor',
            label: 'Cor Escura',
            description: 'Cor aplicada às áreas de sombra.',
            type: 'color',
            defaultValue: { r: 0.08, g: 0.09, b: 0.12 },
            visibleWhen: { uniform: 'u_colorMode', value: 1 },
        },
        {
            uniform: 'u_lightColor',
            label: 'Cor Clara',
            description: 'Cor aplicada às áreas iluminadas.',
            type: 'color',
            defaultValue: { r: 0.92, g: 0.95, b: 0.88 },
            visibleWhen: { uniform: 'u_colorMode', value: 1 },
        },
    ],
};