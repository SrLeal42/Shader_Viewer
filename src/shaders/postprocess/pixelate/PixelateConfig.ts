import * as B from '@babylonjs/core';
import type { PostProcessShaderConfig } from '../../Types';

import fragmentSource from './Pixelate.fragment.glsl?raw';

export const PixelateConfig: PostProcessShaderConfig = {
    category: 'postprocess',
    label: 'Pixelação',
    title: 'Parâmetros da Pixelação',
    description: 'Reduz a resolução da tela inteira para um visual retrô.',

    uniforms: [
        {
            uniform: 'u_pixelSize',
            label: 'Tamanho do Pixel',
            description: 'Tamanho de cada "pixel" em pixels reais da tela.',
            type: 'float',
            defaultValue: 4.0,
            min: 1.0, max: 16.0, step: 1.0
        }
    ],

    create: (scene: B.Scene, camera: B.Camera, getUniforms: () => Record<string, unknown>) => {
        const shaderName = 'pixelateEffect';
        B.Effect.ShadersStore[`${shaderName}FragmentShader`] = fragmentSource;

        const pp = new B.PostProcess(
            'pixelate',
            shaderName,
            {
                uniforms: ['u_pixelSize', 'u_screenSize'],
                samplers: ['textureSampler'],
                size: 1.0,
                camera: camera,
                samplingMode: B.Texture.NEAREST_SAMPLINGMODE,
                engine: scene.getEngine(),
                reusable: false
            }
        );

        pp.onApplyObservable.add((effect) => {
            const vals = getUniforms();
            effect.setFloat('u_pixelSize', vals['u_pixelSize'] as number);
            effect.setFloat2('u_screenSize', pp.width, pp.height);
        });

        return pp;
    }
};
