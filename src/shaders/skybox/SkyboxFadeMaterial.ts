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
                "u_blur1", "u_blur2", "u_exposure", "u_saturation",
                "u_time", "u_enableWarp", "u_enableMeteors", "u_enableAurora",
                "u_warpSpeed", "u_warpIntensity", "u_meteorSpeedBase", "u_meteorDensity",
                "u_meteorAngle", "u_auroraSpeed", "u_auroraIntensity", "u_auroraColor"
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
    material.setFloat("u_time", 0.0);

    // Efeitos visuais (flags on/off)
    material.setFloat("u_enableWarp", 0.0);
    material.setFloat("u_enableMeteors", 0.0);
    material.setFloat("u_enableAurora", 0.0);

    // Efeitos visuais (parâmetros iniciais seguros)
    material.setFloat("u_warpSpeed", 0.15);
    material.setFloat("u_warpIntensity", 0.2);
    material.setFloat("u_meteorSpeedBase", 0.3);
    material.setFloat("u_meteorDensity", 10.0);
    material.setFloat("u_meteorAngle", 0.5);
    material.setFloat("u_auroraSpeed", 0.1);
    material.setFloat("u_auroraIntensity", 1.5);
    material.setColor3("u_auroraColor", new B.Color3(0.1, 1.0, 0.5));

    return material;
}
