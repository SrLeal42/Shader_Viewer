import * as B from '../../../babylon/BabylonAdapter';
import { type MaterialShaderConfig } from '../../Types';
import { STANDARD_DEFAULT_COLOR } from '../../../configs/Constants';
import { BaseVertex, SharedInclude } from '../../shared/SharedIncludes'

import fragmentSource from './Standard.fragment.glsl?raw';

export const StandardConfig: MaterialShaderConfig = {
    label: 'Nenhum',
    title: 'Parâmetros do Modelo Original',
    description: 'Material padrão com iluminação básica.',
    category: 'material',
    baseVertex: BaseVertex.UV, // Usa o vertex que possui #include<vertexEffect> e suporta UVs
    sharedIncludes: [SharedInclude.LIGHTING, SharedInclude.SPECULAR],
    needsAlbedoTexture: true,
    needsSceneTexture: false,
    needsEnvironmentCubemap: false,

    uniforms: [],

    create: (scene: B.Scene, ctx) => {
        B.Effect.ShadersStore[`${ctx.shaderName}VertexShader`] = ctx.vertexSource;
        B.Effect.ShadersStore[`${ctx.shaderName}FragmentShader`] = fragmentSource;

        const material = new B.ShaderMaterial(`${ctx.shaderName}Mat`, scene, ctx.shaderName, {
            attributes: ctx.attributes,
            uniforms: [
                'world', 'worldView', 'worldViewProjection', 'view', 'projection', 'vEyePosition', 'u_time',
                ...ctx.sharedUniforms,
                'u_cameraPos',
                'u_defaultColor'
            ],
            samplers: ['u_albedo'],
            needAlphaBlending: false,
            needAlphaTesting: false
        });

        material.setColor3(
            'u_defaultColor',
            new B.Color3(STANDARD_DEFAULT_COLOR.r, STANDARD_DEFAULT_COLOR.g, STANDARD_DEFAULT_COLOR.b)
        );

        // Passamos a posição da câmera sempre que a cena for renderizada
        material.onBindObservable.add((_) => {
            if (scene.activeCamera) {
                material.setVector3('u_cameraPos', scene.activeCamera.globalPosition);
            }
        });

        return material;
    }

};
