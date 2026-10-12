import * as B from '../../../babylon/BabylonAdapter';
import type { PostProcessShaderConfig } from '../../Types';

import { generateAsciiDefines } from './AsciiConstants';
import { createGlyphAtlas } from './AsciiGlyphAtlas';

import asciiSource from './Ascii.fragment.glsl?raw';

const buildFragment = (body: string): string => [
    generateAsciiDefines(),
    body,
].join('\n');

export const AsciiConfig: PostProcessShaderConfig = {
    category: 'postprocess',
    label: 'ASCII',
    title: 'Parâmetros do ASCII',
    description: 'Converte a imagem em caracteres coloridos com bordas geométricas.',

    create: (scene, camera, _getUniforms, customDepthTexture, customNormalTexture) => {
        B.Effect.ShadersStore['asciiFragmentShader'] = buildFragment(asciiSource);

        const atlas = createGlyphAtlas(scene);

        const pp = new B.PostProcess('asciiProcess', 'ascii', {
            uniforms: [
                'u_screenSize',
                'u_depthThreshold',
                'u_normalThreshold',
                'u_exposure',
                'u_colorMode',
            ],
            samplers: ['depthSampler', 'normalSampler', 'glyphAtlas'],
            size: 1.0,
            camera,
            samplingMode: B.Texture.NEAREST_SAMPLINGMODE,
            engine: scene.getEngine(),
            reusable: false,
        });

        pp.onApplyObservable.add((effect) => {
            effect.setFloat2('u_screenSize', pp.width, pp.height);
            effect.setTexture('glyphAtlas', atlas);
            if (customDepthTexture) effect.setTexture('depthSampler', customDepthTexture);
            if (customNormalTexture) effect.setTexture('normalSampler', customNormalTexture);
        });

        pp.onDisposeObservable.add(() => {
            atlas.dispose();
        });

        return pp;
    },

    uniforms: [
        {
            type: 'folder',
            label: 'Bordas',
            children: [
                {
                    uniform: 'u_depthThreshold',
                    label: 'Sensibilidade (Silhueta)',
                    description: 'Diferença de profundidade mínima para marcar silhueta.',
                    type: 'float',
                    defaultValue: 0.05,
                    min: 0.001, max: 0.1, step: 0.001,
                },
                {
                    uniform: 'u_normalThreshold',
                    label: 'Sensibilidade (Quinas)',
                    description: 'Variação de normal mínima para marcar dobras.',
                    type: 'float',
                    defaultValue: 1.0,
                    min: 0.01, max: 2.0, step: 0.01,
                },
            ],
        },
        {
            type: 'folder',
            label: 'Caracteres',
            children: [
                {
                    uniform: 'u_exposure',
                    label: 'Exposição',
                    description: 'Ajuste de brilho na escala de caracteres.',
                    type: 'float',
                    defaultValue: 1.0,
                    min: 0.1, max: 4.0, step: 0.05,
                },
                {
                    uniform: 'u_colorMode',
                    label: 'Modo de Cor',
                    description: 'Original: cor real | Saturada: cores vivas | Terminal: monocromático.',
                    type: 'list',
                    defaultValue: 0,
                    options: {
                        'Original': 0,
                        'Saturada': 1,
                        'Terminal Verde': 2,
                        'Terminal Âmbar': 3,
                    },
                },
            ],
        },
    ],
};
