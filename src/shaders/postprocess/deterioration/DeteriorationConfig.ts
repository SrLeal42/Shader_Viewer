import * as B from '@babylonjs/core';
import type { PostProcessShaderConfig } from '../../Types';

import fragmentSource from './Deterioration.fragment.glsl?raw';

export const DeteriorationConfig: PostProcessShaderConfig = {
    category: 'postprocess',
    label: 'Deterioração',
    title: 'Parâmetros de Deterioração',
    description: 'Efeito combinado de envelhecimento: noise, desaturação, vinheta, aberração cromática e scanlines.',

    create: (scene: B.Scene, camera: B.Camera, _getUniforms: () => Record<string, unknown>) => {
        B.Effect.ShadersStore['deteriorationFragmentShader'] = fragmentSource;

        const pp = new B.PostProcess('deterioration', 'deterioration', {
            uniforms: [
                'u_noiseStrength', 'u_noiseScale', 'u_overlayColor',
                'u_desaturation',
                'u_vignetteStrength', 'u_vignetteRadius',
                'u_chromaticAberration',
                'u_scanlineStrength', 'u_scanlineFrequency',
                'u_scanlineSpeed', 'u_time'
            ],
            samplers: [],
            size: 1.0,
            camera: camera,
            samplingMode: B.Texture.BILINEAR_SAMPLINGMODE,
            engine: scene.getEngine(),
            reusable: false
        });

        let time = 0;
        pp.onApplyObservable.add((effect) => {
            time += scene.getEngine().getDeltaTime() / 1000.0;
            effect.setFloat('u_time', time);
        });

        return pp;
    },

    uniforms: [
        {
            type: 'folder',
            label: 'Noise',
            children: [
                {
                    uniform: 'u_noiseStrength',
                    label: 'Intensidade',
                    description: 'Força do noise sobre a imagem (0 = desligado).',
                    type: 'float',
                    defaultValue: 0.05,
                    min: 0.0, max: 1.0, step: 0.01
                },
                {
                    uniform: 'u_noiseScale',
                    label: 'Escala',
                    description: 'Tamanho dos grãos (valores maiores = grãos menores).',
                    type: 'float',
                    defaultValue: 1000.0,
                    min: 100.0, max: 1500.0, step: 1.0
                },
                {
                    uniform: 'u_overlayColor',
                    label: 'Cor de Fundo',
                    description: 'A cor sólida que aparece por baixo do noise.',
                    type: 'color',
                    defaultValue: { r: 0.5, g: 0.5, b: 0.5 }
                }
            ]
        },
        {
            type: 'folder',
            label: 'Cor',
            children: [
                {
                    uniform: 'u_desaturation',
                    label: 'Desaturação',
                    description: 'Remove as cores da imagem (0 = colorido, 1 = preto e branco).',
                    type: 'float',
                    defaultValue: 0.2,
                    min: 0.0, max: 1.0, step: 0.01
                }
            ]
        },
        {
            type: 'folder',
            label: 'Bordas',
            children: [
                {
                    uniform: 'u_vignetteStrength',
                    label: 'Intensidade da Vinheta',
                    description: 'Escurecimento nas bordas da tela (0 = desligado).',
                    type: 'float',
                    defaultValue: 0.5,
                    min: 0.0, max: 2.0, step: 0.01
                },
                {
                    uniform: 'u_vignetteRadius',
                    label: 'Raio',
                    description: 'Distância do centro onde o escurecimento começa.',
                    type: 'float',
                    defaultValue: 0.2,
                    min: 0.1, max: 1.5, step: 0.01
                }
            ]
        },
        {
            type: 'folder',
            label: 'Distorção',
            children: [
                {
                    uniform: 'u_chromaticAberration',
                    label: 'Aberração Cromática',
                    description: 'Separação dos canais RGB (0 = desligado).',
                    type: 'float',
                    defaultValue: 0.002,
                    min: 0.0, max: 0.02, step: 0.001
                }
            ]
        },
        {
            type: 'folder',
            label: 'Linhas',
            children: [
                {
                    uniform: 'u_scanlineStrength',
                    label: 'Intensidade Scanlines',
                    description: 'Linhas horizontais estilo CRT (0 = desligado).',
                    type: 'float',
                    defaultValue: 0.1,
                    min: 0.0, max: 1.0, step: 0.01
                },
                {
                    uniform: 'u_scanlineFrequency',
                    label: 'Frequência',
                    description: 'Quantidade de linhas (valores maiores = linhas mais finas).',
                    type: 'float',
                    defaultValue: 300.0,
                    min: 50.0, max: 2000.0, step: 10.0
                },
                {
                    uniform: 'u_scanlineSpeed',
                    label: 'Velocidade',
                    description: 'Velocidade do movimento das linhas (0 = parado).',
                    type: 'float',
                    defaultValue: 1.0,
                    min: -5.0, max: 5.0, step: 0.1
                }
            ]
        }
    ]

};
