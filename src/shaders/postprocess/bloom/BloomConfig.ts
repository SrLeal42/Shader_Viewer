import * as B from '@babylonjs/core';
import type { PostProcessShaderConfig } from '../../Types';

import bloomFragmentShader from './Bloom.fragment.glsl?raw';

B.Effect.ShadersStore['customBloomFragmentShader'] = bloomFragmentShader;

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
            step: 0.05
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

    create: (scene: B.Scene, camera: B.Camera) => {
        const postProcess = new B.PostProcess(
            'customBloomPostProcess',
            'customBloom', // Puxa do ShadersStore criado lá no topo
            ['u_threshold', 'u_intensity', 'u_radius', 'u_screenSize'], // Uniforms
            [], // Samplers adicionais
            1, // 0.5 = Roda na metade da resolução
            camera,
            B.Texture.BILINEAR_SAMPLINGMODE,
            scene.getEngine(),
            false
        );

        // Atualiza a dimensão da tela no shader sempre que for renderizar (usado no Aspect Ratio)
        postProcess.onApplyObservable.add((effect) => {
            effect.setFloat2('u_screenSize', postProcess.width, postProcess.height);
        });

        return postProcess;
    }
};
