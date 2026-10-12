import * as B from '../../../babylon/BabylonAdapter';
import type { PostProcessShaderConfig } from '../../Types';

import { ASCII_CELL_SIZE, generateAsciiDefines } from './AsciiConstants';
import { createGlyphAtlas } from './AsciiGlyphAtlas';

import edgeSource from './AsciiEdge.fragment.glsl?raw';
import cellSource from './AsciiCell.fragment.glsl?raw';
import renderSource from './AsciiRender.fragment.glsl?raw';

const buildFragment = (body: string): string => [
    '#version 300 es',
    'precision highp float;',
    'precision highp int;',
    generateAsciiDefines(),
    body,
].join('\n');

export const AsciiConfig: PostProcessShaderConfig = {
    category: 'postprocess',
    label: 'ASCII',
    title: 'Parâmetros do ASCII',
    description: 'Converte a imagem em caracteres coloridos.',

    /**
     * ATENÇÃO — semântica do Babylon: o `size` de um PostProcess define a sua textura de ENTRADA.
     * Cada passe desenha dentro da textura do passe SEGUINTE (postProcessManager._finalizeFrame).
     *
     *   Cena ──► [edgePass: 1.0] ──► [cellPass: 1.0] ──► [renderPass: 1/CELL] ──► Tela
     *             entrada = cena      entrada = Pass 1    entrada = Pass 2 (grade de células)
     */
    create: (scene, camera, getUniforms, customDepthTexture, customNormalTexture) => {
        B.Effect.ShadersStore['asciiEdgeFragmentShader'] = buildFragment(edgeSource);
        B.Effect.ShadersStore['asciiCellFragmentShader'] = buildFragment(cellSource);
        B.Effect.ShadersStore['asciiRenderFragmentShader'] = buildFragment(renderSource);

        const engine = scene.getEngine();
        const nearest = B.Texture.NEAREST_SAMPLINGMODE;

        // Pass 1 — Bordas direcionais. Entrada: cena em resolução cheia.
        const edgePass = new B.PostProcess('asciiEdge', 'asciiEdge', {
            uniforms: ['u_depthThreshold', 'u_normalThreshold'],
            samplers: ['depthSampler', 'normalSampler'],
            size: 1.0,
            camera,
            samplingMode: nearest,
            engine,
            reusable: false,
        });

        // Pass 2 — Redução por célula. Entrada: saída do Pass 1 (resolução cheia).
        // Desenha na textura do renderPass → roda com 1 fragmento por célula.
        const cellPass = new B.PostProcess('asciiCell', 'asciiCell', {
            uniforms: ['u_edgeVoteThreshold', 'u_exposure', 'u_colorMode'],
            samplers: [],
            size: 1.0,
            camera,
            samplingMode: nearest,
            engine,
            reusable: false,
        });

        // Pass 3 — Render dos glifos. Entrada: grade de células (1 texel por caractere).
        const renderPass = new B.PostProcess('asciiRender', 'asciiRender', {
            uniforms: [],
            samplers: ['glyphAtlas'],
            size: 1 / ASCII_CELL_SIZE,
            camera,
            samplingMode: nearest,
            engine,
            reusable: false,
        });

        const atlas = createGlyphAtlas(scene);

        edgePass.onApplyObservable.add((effect) => {
            const v = getUniforms();
            effect.setFloat('u_depthThreshold', v['u_depthThreshold'] as number);
            effect.setFloat('u_normalThreshold', v['u_normalThreshold'] as number);
            if (customDepthTexture) effect.setTexture('depthSampler', customDepthTexture);
            if (customNormalTexture) effect.setTexture('normalSampler', customNormalTexture);
        });

        cellPass.onApplyObservable.add((effect) => {
            const v = getUniforms();
            effect.setFloat('u_edgeVoteThreshold', v['u_edgeVoteThreshold'] as number);
            effect.setFloat('u_exposure', v['u_exposure'] as number);
            effect.setFloat('u_colorMode', v['u_colorMode'] as number);
        });

        renderPass.onApplyObservable.add((effect) => {
            effect.setTexture('glyphAtlas', atlas);
        });

        // O ShaderManager só conhece o passe final: ele libera os intermediários e o atlas.
        renderPass.onDisposeObservable.add(() => {
            edgePass.dispose();
            cellPass.dispose();
            atlas.dispose();
        });

        return renderPass;
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
                {
                    uniform: 'u_edgeVoteThreshold',
                    label: 'Votação de Borda',
                    description: 'Fração mínima de pixels de borda na célula para usar | \\ - /.',
                    type: 'float',
                    defaultValue: 0.15,
                    min: 0.01, max: 1.0, step: 0.01,
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
                    description: 'Desloca a luminância na escala de caracteres.',
                    type: 'float',
                    defaultValue: 1.0,
                    min: 0.1, max: 4.0, step: 0.05,
                },
                {
                    uniform: 'u_colorMode',
                    label: 'Modo de Cor',
                    description: 'Original: média dos pixels | Saturada: matiz em brilho máximo | Terminal: monocromático.',
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
