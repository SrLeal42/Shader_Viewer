import * as B from '@babylonjs/core';

import vertexSource from './SkyboxFade.vertex.glsl?raw';
import fragmentSource from './SkyboxFade.fragment.glsl?raw';
import { SKYBOX_UNIFORMS } from '../../configs/Constants';


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
                SKYBOX_UNIFORMS.MIX, SKYBOX_UNIFORMS.ROTATION_1, SKYBOX_UNIFORMS.ROTATION_2,
                SKYBOX_UNIFORMS.VISIBILITY, SKYBOX_UNIFORMS.BG_COLOR, SKYBOX_UNIFORMS.TONEMAP_STRENGTH,
                SKYBOX_UNIFORMS.BLUR_1, SKYBOX_UNIFORMS.BLUR_2, SKYBOX_UNIFORMS.EXPOSURE, SKYBOX_UNIFORMS.SATURATION,
                SKYBOX_UNIFORMS.TIME, SKYBOX_UNIFORMS.ENABLE_WARP, SKYBOX_UNIFORMS.ENABLE_METEORS, SKYBOX_UNIFORMS.ENABLE_AURORA,
                SKYBOX_UNIFORMS.WARP_SPEED, SKYBOX_UNIFORMS.WARP_INTENSITY, SKYBOX_UNIFORMS.METEOR_SPEED_BASE, SKYBOX_UNIFORMS.METEOR_DENSITY,
                SKYBOX_UNIFORMS.METEOR_ANGLE, SKYBOX_UNIFORMS.AURORA_SPEED, SKYBOX_UNIFORMS.AURORA_INTENSITY, SKYBOX_UNIFORMS.AURORA_COLOR,
                SKYBOX_UNIFORMS.ENABLE_BLACKHOLE, SKYBOX_UNIFORMS.BH_MASS, SKYBOX_UNIFORMS.BH_RADIUS
            ],
            samplers: ["texture1", "texture2"]
        }
    );

    material.backFaceCulling = false;

    // Valores Iniciais
    material.setFloat(SKYBOX_UNIFORMS.MIX, 0.0);
    material.setFloat(SKYBOX_UNIFORMS.ROTATION_1, 0.0);
    material.setFloat(SKYBOX_UNIFORMS.ROTATION_2, 0.0);
    material.setFloat(SKYBOX_UNIFORMS.VISIBILITY, 0.0);
    material.setColor3(SKYBOX_UNIFORMS.BG_COLOR, B.Color3.Black());
    material.setFloat(SKYBOX_UNIFORMS.TONEMAP_STRENGTH, 0.3);

    // Efeitos visuais (defaults neutros)
    material.setFloat(SKYBOX_UNIFORMS.BLUR_1, 0.0);
    material.setFloat(SKYBOX_UNIFORMS.BLUR_2, 0.0);
    material.setFloat(SKYBOX_UNIFORMS.EXPOSURE, 1.0);
    material.setFloat(SKYBOX_UNIFORMS.SATURATION, 1.0);
    material.setFloat(SKYBOX_UNIFORMS.TIME, 0.0);

    // Efeitos visuais (flags on/off)
    material.setFloat(SKYBOX_UNIFORMS.ENABLE_WARP, 0.0);
    material.setFloat(SKYBOX_UNIFORMS.ENABLE_METEORS, 0.0);
    material.setFloat(SKYBOX_UNIFORMS.ENABLE_AURORA, 0.0);
    material.setFloat(SKYBOX_UNIFORMS.ENABLE_BLACKHOLE, 0.0);

    // Efeitos visuais (parâmetros iniciais seguros)
    material.setFloat(SKYBOX_UNIFORMS.WARP_SPEED, 0.15);
    material.setFloat(SKYBOX_UNIFORMS.WARP_INTENSITY, 0.2);
    material.setFloat(SKYBOX_UNIFORMS.METEOR_SPEED_BASE, 0.3);
    material.setFloat(SKYBOX_UNIFORMS.METEOR_DENSITY, 10.0);
    material.setFloat(SKYBOX_UNIFORMS.METEOR_ANGLE, 0.5);
    material.setFloat(SKYBOX_UNIFORMS.AURORA_SPEED, 0.1);
    material.setFloat(SKYBOX_UNIFORMS.AURORA_INTENSITY, 1.5);
    material.setColor3(SKYBOX_UNIFORMS.AURORA_COLOR, new B.Color3(0.1, 1.0, 0.5));
    material.setFloat(SKYBOX_UNIFORMS.BH_MASS, 0.5);
    material.setFloat(SKYBOX_UNIFORMS.BH_RADIUS, 0.05);

    return material;
}
