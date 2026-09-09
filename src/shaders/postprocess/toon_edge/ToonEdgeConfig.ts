import * as B from '@babylonjs/core';
import type { PostProcessShaderConfig } from '../../Types';
import { TOON_OUTLINE_UNIFORMS } from '../../../configs/Constants';

import fragmentSource from './ToonEdge.fragment.glsl?raw';

export const ToonEdgeConfig: PostProcessShaderConfig = {
    label: 'Toon Anime Outline',
    title: 'Parâmetros Outline',
    description: 'Borda dedicada para o Toon Shader',
    category: 'postprocess',
    hidden: true, // Garante que não apareça na lista de checkboxes do usuário
    create: (
        scene: B.Scene,
        camera: B.Camera,
        _getUniforms: () => Record<string, unknown>,
        customDepthTexture?: B.RenderTargetTexture,
        _customNormalTexture?: B.RenderTargetTexture
    ) => {
        B.Effect.ShadersStore['toonEdgeFragmentShader'] = fragmentSource;
        const pp = new B.PostProcess('toonEdgeProcess', 'toonEdge', {
            uniforms: ['u_screenSize', 'u_depthThreshold', 'u_edgeColor', 'u_edgeWidth'],
            samplers: ['depthSampler'],
            size: 1.0,
            camera: camera,
            samplingMode: B.Texture.BILINEAR_SAMPLINGMODE,
            engine: scene.getEngine(),
            reusable: false
        });
        pp.onApplyObservable.add((effect) => {
            effect.setFloat2('u_screenSize', pp.width, pp.height);

            // Injeta a NOSSA textura customizada de profundidade no shader!
            if (customDepthTexture) {
                effect.setTexture('depthSampler', customDepthTexture);
            }
        });
        return pp;
    },
    uniforms: TOON_OUTLINE_UNIFORMS
};

