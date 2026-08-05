import * as B from '@babylonjs/core';
import type { PostProcessShaderConfig } from '../../Types';

import bloomBlurShader from './BloomBlur.fragment.glsl?raw';
import bloomCompositeShader from './BloomComposite.fragment.glsl?raw';

export const BloomConfig: PostProcessShaderConfig = {
    category: 'postprocess',
    label: 'Bloom',
    title: 'Parâmetros do Bloom',
    description: 'Adiciona um brilho espalhado aos pixels mais luminosos.',

    uniforms: [
        {
            uniform: 'u_threshold',
            label: 'Threshold (Limiar)',
            description: 'Luminância mínima para o objeto começar a emitir luz.',
            type: 'float',
            defaultValue: 0.8,
            min: 0.0,
            max: 2.0,
            step: 0.01
        },
        {
            uniform: 'u_intensity',
            label: 'Intensidade',
            description: 'A força do brilho adicionado.',
            type: 'float',
            defaultValue: 1.0,
            min: 0.0,
            max: 5.0,
            step: 0.1
        },
        {
            uniform: 'u_radius',
            label: 'Raio de Espalhamento',
            description: 'O quão longe o desfoque luminoso se espalha pelo ar.',
            type: 'float',
            defaultValue: 2.5,
            min: 0.1,
            max: 10.0,
            step: 0.1
        }
    ],

    create: (scene: B.Scene, camera: B.Camera, getUniforms: () => Record<string, unknown>) => {
        B.Effect.ShadersStore['bloomBlurFragmentShader'] = bloomBlurShader;
        B.Effect.ShadersStore['bloomCompositeFragmentShader'] = bloomCompositeShader;

        // Captura a cena original
        const origPass = new B.PassPostProcess(
            'bloomOrigPass',
            1.0,
            camera
        );

        // Extrai brilho e aplica desfoque horizontal
        const hBlur = new B.PostProcess(
            'bloomHBlur',
            'bloomBlur',
            ['u_threshold', 'u_radius', 'u_screenSize'],
            [],
            1.0,
            camera,
            B.Texture.BILINEAR_SAMPLINGMODE,
            scene.getEngine(),
            false
        );

        // Aplica desfoque vertical e soma com a cena original
        const vBlur = new B.PostProcess(
            'bloomVBlur',
            'bloomComposite',
            ['u_intensity', 'u_radius', 'u_screenSize'],
            ['origSampler'],
            1.0,
            camera,
            B.Texture.BILINEAR_SAMPLINGMODE,
            scene.getEngine(),
            false
        );

        hBlur.onApplyObservable.add((effect) => {
            const vals = getUniforms();
            effect.setFloat('u_threshold', vals['u_threshold'] as number);
            effect.setFloat('u_radius', vals['u_radius'] as number);
            effect.setFloat2('u_screenSize', hBlur.width, hBlur.height);
        });

        vBlur.onApplyObservable.add((effect) => {
            const vals = getUniforms();
            effect.setFloat('u_intensity', vals['u_intensity'] as number);
            effect.setFloat('u_radius', vals['u_radius'] as number);
            effect.setFloat2('u_screenSize', vBlur.width, vBlur.height);
            effect.setTextureFromPostProcess('origSampler', origPass);
        });

        // Limpa os PP intermediários quando o PP final for destruído
        vBlur.onDisposeObservable.add(() => {
            hBlur.dispose();
            origPass.dispose();
        });

        return vBlur;
    }
};
