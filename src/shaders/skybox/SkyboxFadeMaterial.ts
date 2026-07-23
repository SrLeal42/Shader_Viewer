import * as B from '@babylonjs/core';

import vertexSource from './SkyboxFade.vertex.glsl?raw';
import fragmentSource from './SkyboxFade.fragment.glsl?raw'


export function createSkyboxFadeMaterial(name: string, scene: B.Scene): B.ShaderMaterial {
    const material = new B.ShaderMaterial(
        name,
        scene,
        {
            vertexSource: vertexSource,
            fragmentSource: fragmentSource
        },
        {
            attributes: ["position"],
            uniforms: ["worldViewProjection", "u_mix", "u_rotation1", "u_rotation2", "u_visibility", "u_bgColor"],
            samplers: ["texture1", "texture2"]
        }
    );

    material.backFaceCulling = false;

    // Valores Iniciais
    material.setFloat("u_mix", 0.0);
    material.setFloat("u_rotation1", 0.0);
    material.setFloat("u_rotation2", 0.0);
    material.setFloat("u_visibility", 0.0);
    material.setColor3("u_bgColor", B.Color3.Black());

    return material;
}
