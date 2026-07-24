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
            uniforms: [
                "worldViewProjection",
                "u_mix", "u_rotation1", "u_rotation2",
                "u_visibility", "u_bgColor", "u_tonemapStrength",
                "u_blur1", "u_blur2", "u_exposure", "u_saturation"
            ],
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
    material.setFloat("u_tonemapStrength", 0.3);

    // Efeitos visuais (defaults neutros)
    material.setFloat("u_blur1", 0.0);
    material.setFloat("u_blur2", 0.0);
    material.setFloat("u_exposure", 1.0);
    material.setFloat("u_saturation", 1.0);

    return material;
}
