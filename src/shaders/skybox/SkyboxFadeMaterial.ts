import * as B from '../../babylon/BabylonAdapter';

import { SkyboxEffectsConfigs } from '../../configs/SkyboxEffectsConfigs';

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
import fbmSource from '../shared/fbm.glsl?raw';
import rainbowSource from './effects/rainbow.glsl?raw';
import sunflareSource from './effects/sunflare.glsl?raw';


import { SKYBOX_UNIFORMS } from '../../configs/Constants';


function formatGlslNumber(n: number): string {
    const s = n.toString();
    return s.includes('.') || s.includes('e') ? s : `${s}.0`;
}

function generateSkyboxDefines(): string {
    const lines: string[] = ['// ─── Constantes Artísticas Injetadas via TypeScript ───'];
    for (const config of Object.values(SkyboxEffectsConfigs)) {
        if (!config.uniforms) continue;
        for (const [key, val] of Object.entries(config.uniforms)) {
            if (typeof val === 'number') {
                lines.push(`#define ${key} ${formatGlslNumber(val)}`);
            } else if (Array.isArray(val) && val.length === 3) {
                lines.push(`#define ${key} vec3(${val.map(formatGlslNumber).join(', ')})`);
            }
        }
    }
    return lines.join('\n');
}



// ─── Montagem do Fragment Shader via Concatenação ───
const fragmentSource = [
    '#version 300 es',
    'precision highp float;',
    generateSkyboxDefines(),
    headerSource,
    hashSource,
    skyboxNoiseSource,
    fbmSource,
    warpSource,
    meteorsSource,
    auroraSource,
    blackholeSource,
    cloudsSource,
    lightningSource,
    fireworksSource,
    rainbowSource,
    sunflareSource,
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
                // Flags de Ativação
                SKYBOX_UNIFORMS.ENABLE_WARP, SKYBOX_UNIFORMS.ENABLE_METEORS,
                SKYBOX_UNIFORMS.ENABLE_AURORA, SKYBOX_UNIFORMS.ENABLE_BLACKHOLE,
                SKYBOX_UNIFORMS.ENABLE_CLOUDS, SKYBOX_UNIFORMS.ENABLE_LIGHTNING,
                SKYBOX_UNIFORMS.ENABLE_FIREWORKS, SKYBOX_UNIFORMS.ENABLE_RAINBOW,
                SKYBOX_UNIFORMS.ENABLE_SUN_FLARE,
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
    material.setFloat(SKYBOX_UNIFORMS.ENABLE_RAINBOW, 0.0);
    material.setFloat(SKYBOX_UNIFORMS.ENABLE_SUN_FLARE, 0.0);

    return material;
}
