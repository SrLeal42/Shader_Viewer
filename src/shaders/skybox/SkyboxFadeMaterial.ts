import * as B from '@babylonjs/core';

import headerSource from './SkyboxFade.header.glsl?raw';
import mainSource from './SkyboxFade.fragment.glsl?raw';
import vertexSource from './SkyboxFade.vertex.glsl?raw';

import hashSource from '../shared/hash.glsl?raw';

import skyboxNoiseSource from './effects/skybox_noise.glsl?raw';
import warpSource from './effects/warp.glsl?raw';
import meteorsSource from './effects/meteors.glsl?raw';
import auroraSource from './effects/aurora.glsl?raw';
import blackholeSource from './effects/blackhole.glsl?raw';
import cloudsSource from './effects/clouds.glsl?raw';
import lightningSource from './effects/lightning.glsl?raw';
import fireworksSource from './effects/fireworks.glsl?raw';

import { SKYBOX_UNIFORMS } from '../../configs/Constants';

// ─── Montagem do Fragment Shader via Concatenação ───
const fragmentSource = [
    '#version 300 es',
    'precision highp float;',
    headerSource,
    hashSource,
    skyboxNoiseSource,
    warpSource,
    meteorsSource,
    auroraSource,
    blackholeSource,
    cloudsSource,
    lightningSource,
    fireworksSource,
    mainSource,
].join('\n');


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
                SKYBOX_UNIFORMS.MIX, SKYBOX_UNIFORMS.ROTATION_Y_1, SKYBOX_UNIFORMS.ROTATION_Y_2,
                SKYBOX_UNIFORMS.ROTATION_X_1, SKYBOX_UNIFORMS.ROTATION_X_2,
                SKYBOX_UNIFORMS.VISIBILITY, SKYBOX_UNIFORMS.BG_COLOR, SKYBOX_UNIFORMS.TONEMAP_STRENGTH,
                SKYBOX_UNIFORMS.BLUR_1, SKYBOX_UNIFORMS.BLUR_2, SKYBOX_UNIFORMS.EXPOSURE, SKYBOX_UNIFORMS.SATURATION,
                SKYBOX_UNIFORMS.TIME,
                // Flags
                SKYBOX_UNIFORMS.ENABLE_WARP, SKYBOX_UNIFORMS.ENABLE_METEORS,
                SKYBOX_UNIFORMS.ENABLE_AURORA, SKYBOX_UNIFORMS.ENABLE_BLACKHOLE,
                SKYBOX_UNIFORMS.ENABLE_CLOUDS, SKYBOX_UNIFORMS.ENABLE_LIGHTNING,
                SKYBOX_UNIFORMS.ENABLE_FIREWORKS,
                // Parâmetros
                SKYBOX_UNIFORMS.WARP_SPEED, SKYBOX_UNIFORMS.WARP_INTENSITY,
                SKYBOX_UNIFORMS.METEOR_SPEED_BASE, SKYBOX_UNIFORMS.METEOR_DENSITY, SKYBOX_UNIFORMS.METEOR_ANGLE,
                SKYBOX_UNIFORMS.AURORA_SPEED, SKYBOX_UNIFORMS.AURORA_INTENSITY, SKYBOX_UNIFORMS.AURORA_COLOR,
                SKYBOX_UNIFORMS.AURORA_COLOR_TOP, SKYBOX_UNIFORMS.AURORA_THRESHOLD,
                SKYBOX_UNIFORMS.BH_MASS, SKYBOX_UNIFORMS.BH_RADIUS,
                SKYBOX_UNIFORMS.CLOUD_SPEED, SKYBOX_UNIFORMS.CLOUD_DENSITY,
                SKYBOX_UNIFORMS.CLOUD_COLOR, SKYBOX_UNIFORMS.CLOUD_HEIGHT,
                SKYBOX_UNIFORMS.LIGHTNING_FREQUENCY, SKYBOX_UNIFORMS.LIGHTNING_INTENSITY,
                SKYBOX_UNIFORMS.FIREWORK_FREQUENCY, SKYBOX_UNIFORMS.FIREWORK_INTENSITY,
                SKYBOX_UNIFORMS.FIREWORK_SPEED, SKYBOX_UNIFORMS.FIREWORK_WOBBLE,
            ],
            samplers: ["texture1", "texture2"]
        }
    );

    material.backFaceCulling = false;

    // ─── Valores Iniciais do Skybox Base ───
    material.setFloat(SKYBOX_UNIFORMS.MIX, 0.0);
    material.setFloat(SKYBOX_UNIFORMS.ROTATION_Y_1, 0.0);
    material.setFloat(SKYBOX_UNIFORMS.ROTATION_Y_2, 0.0);
    material.setFloat(SKYBOX_UNIFORMS.ROTATION_X_1, 0.0);
    material.setFloat(SKYBOX_UNIFORMS.ROTATION_X_2, 0.0);
    material.setFloat(SKYBOX_UNIFORMS.VISIBILITY, 0.0);
    material.setColor3(SKYBOX_UNIFORMS.BG_COLOR, B.Color3.Black());
    material.setFloat(SKYBOX_UNIFORMS.TONEMAP_STRENGTH, 0.3);
    material.setFloat(SKYBOX_UNIFORMS.BLUR_1, 0.0);
    material.setFloat(SKYBOX_UNIFORMS.BLUR_2, 0.0);
    material.setFloat(SKYBOX_UNIFORMS.EXPOSURE, 1.0);
    material.setFloat(SKYBOX_UNIFORMS.SATURATION, 1.0);
    material.setFloat(SKYBOX_UNIFORMS.TIME, 0.0);

    // ─── Flags (todos desligados por padrão) ───
    material.setFloat(SKYBOX_UNIFORMS.ENABLE_WARP, 0.0);
    material.setFloat(SKYBOX_UNIFORMS.ENABLE_METEORS, 0.0);
    material.setFloat(SKYBOX_UNIFORMS.ENABLE_AURORA, 0.0);
    material.setFloat(SKYBOX_UNIFORMS.ENABLE_BLACKHOLE, 0.0);
    material.setFloat(SKYBOX_UNIFORMS.ENABLE_CLOUDS, 0.0);
    material.setFloat(SKYBOX_UNIFORMS.ENABLE_LIGHTNING, 0.0);
    material.setFloat(SKYBOX_UNIFORMS.ENABLE_FIREWORKS, 0.0);

    // ─── Parâmetros Iniciais Seguros ───
    material.setFloat(SKYBOX_UNIFORMS.WARP_SPEED, 0.15);
    material.setFloat(SKYBOX_UNIFORMS.WARP_INTENSITY, 0.2);
    material.setFloat(SKYBOX_UNIFORMS.METEOR_SPEED_BASE, 0.3);
    material.setFloat(SKYBOX_UNIFORMS.METEOR_DENSITY, 10.0);
    material.setFloat(SKYBOX_UNIFORMS.METEOR_ANGLE, 0.5);
    material.setFloat(SKYBOX_UNIFORMS.AURORA_SPEED, 0.1);
    material.setFloat(SKYBOX_UNIFORMS.AURORA_INTENSITY, 1.5);
    material.setColor3(SKYBOX_UNIFORMS.AURORA_COLOR, new B.Color3(0.1, 1.0, 0.5));
    material.setColor3(SKYBOX_UNIFORMS.AURORA_COLOR_TOP, new B.Color3(0.5, 0.1, 0.8));
    material.setFloat(SKYBOX_UNIFORMS.AURORA_THRESHOLD, 0.4);
    material.setFloat(SKYBOX_UNIFORMS.BH_MASS, 0.5);
    material.setFloat(SKYBOX_UNIFORMS.BH_RADIUS, 0.05);
    material.setFloat(SKYBOX_UNIFORMS.CLOUD_SPEED, 0.05);
    material.setFloat(SKYBOX_UNIFORMS.CLOUD_LATERAL_SPEED, 0.3);
    material.setFloat(SKYBOX_UNIFORMS.CLOUD_DENSITY, 0.5);
    material.setColor3(SKYBOX_UNIFORMS.CLOUD_COLOR, B.Color3.White());
    material.setFloat(SKYBOX_UNIFORMS.CLOUD_HEIGHT, 0.4);
    material.setFloat(SKYBOX_UNIFORMS.LIGHTNING_FREQUENCY, 1.5);
    material.setFloat(SKYBOX_UNIFORMS.LIGHTNING_INTENSITY, 2.0);
    material.setFloat(SKYBOX_UNIFORMS.FIREWORK_FREQUENCY, 0.8);
    material.setFloat(SKYBOX_UNIFORMS.FIREWORK_INTENSITY, 1.5);
    material.setFloat(SKYBOX_UNIFORMS.FIREWORK_SPEED, 1.0);
    material.setFloat(SKYBOX_UNIFORMS.FIREWORK_WOBBLE, 0.015);

    return material;
}
