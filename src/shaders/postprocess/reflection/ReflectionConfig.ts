import * as B from '@babylonjs/core';
import type { PostProcessShaderConfig } from '../../Types';
import fragmentSource from './Reflection.fragment.glsl?raw';

export const ReflectionConfig: PostProcessShaderConfig = {
    label: 'Reflexo',
    title: 'Parâmetros do Espelho',
    description: 'Cria um reflexo distorcido na parte inferior da tela.',
    category: 'postprocess',
    create: (scene: B.Scene, camera: B.Camera, _getUniforms: () => Record<string, unknown>) => {
        B.Effect.ShadersStore['reflectionFragmentShader'] = fragmentSource;

        const pp = new B.PostProcess(
            'reflectionPP',
            'reflection',
            ['u_threshold', 'u_amplitude', 'u_frequency', 'u_time', 'u_bandFrequency', 'u_bandSpeed'],
            null,
            1.0,
            camera,
            B.Texture.BILINEAR_SAMPLINGMODE,
            scene.getEngine(),
            false
        );

        let time = 0;
        pp.onApplyObservable.add((effect) => {
            // O ShaderManager já injeta os valores da UI automaticamente.
            // Aqui, nós apenas injetamos o Relógio para animar as ondas continuamente!
            time += scene.getEngine().getDeltaTime() * 0.001; // milissegundos para segundos
            effect.setFloat('u_time', time);
        });

        return pp;
    },
    uniforms: [
        {
            uniform: 'u_threshold',
            label: 'Corte (Altura)',
            type: 'float',
            defaultValue: 0.45,
            min: 0.1, max: 1.0, step: 0.01
        },
        {
            uniform: 'u_amplitude',
            label: 'Força da Onda',
            type: 'float',
            defaultValue: 0.02,
            min: 0.0, max: 0.1, step: 0.001
        },
        {
            uniform: 'u_frequency',
            label: 'Frequência das Ondas',
            type: 'float',
            defaultValue: 70.0,
            min: 0.0, max: 100.0, step: 0.1
        },
        {
            uniform: 'u_bandFrequency',
            label: 'Tamanho do Intervalo',
            type: 'float',
            defaultValue: 25.0,
            min: 1.0, max: 50.0, step: 0.1
        },
        {
            uniform: 'u_bandSpeed',
            label: 'Velocidade de Afastamento',
            type: 'float',
            defaultValue: 3.0,
            min: 0.0, max: 10.0, step: 0.1
        }
    ]

};
