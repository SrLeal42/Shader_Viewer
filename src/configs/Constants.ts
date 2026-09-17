import type { ShaderUniform } from '../shaders/Types';

export const ENVIRONMENT_WALLS = [
    'floor',
    'ceil',
    'left',
    'right',
    'front',
    'back'
];

export const STANDARD_DEFAULT_COLOR = { r: 0.75, g: 0.75, b: 0.75 };

export const SKYBOX_UNIFORMS = {
    MIX: 'u_mix',

    ROTATION_Y_1: 'u_rotationY1',
    ROTATION_Y_2: 'u_rotationY2',

    ROTATION_X_1: 'u_rotationX1',
    ROTATION_X_2: 'u_rotationX2',

    VISIBILITY: 'u_visibility',

    BG_COLOR: 'u_bgColor',

    TONEMAP_STRENGTH: 'u_tonemapStrength',

    BLUR_1: 'u_blur1',
    BLUR_2: 'u_blur2',

    EXPOSURE: 'u_exposure',

    SATURATION: 'u_saturation',

    TIME: 'u_time',

    ENABLE_WARP: 'u_enableWarp',
    ENABLE_METEORS: 'u_enableMeteors',
    ENABLE_AURORA: 'u_enableAurora',
    ENABLE_BLACKHOLE: 'u_enableBlackhole',
    ENABLE_CLOUDS: 'u_enableClouds',
    ENABLE_LIGHTNING: 'u_enableLightning',
    ENABLE_FIREWORKS: 'u_enableFireworks',
    ENABLE_RAINBOW: 'u_enableRainbow',
    ENABLE_SUN_FLARE: 'u_enableSunFlare',

    WARP_SPEED: 'u_warpSpeed',
    WARP_INTENSITY: 'u_warpIntensity',

    METEOR_SPEED_BASE: 'u_meteorSpeedBase',
    METEOR_DENSITY: 'u_meteorDensity',
    METEOR_ANGLE: 'u_meteorAngle',

    AURORA_SPEED: 'u_auroraSpeed',
    AURORA_INTENSITY: 'u_auroraIntensity',
    AURORA_COLOR: 'u_auroraColor',
    AURORA_COLOR_TOP: 'u_auroraColorTop',
    AURORA_THRESHOLD: 'u_auroraThreshold',

    BH_MASS: 'u_bhMass',
    BH_RADIUS: 'u_bhRadius',

    CLOUD_SPEED: 'u_cloudSpeed',
    CLOUD_LATERAL_SPEED: 'u_cloudLateralSpeed',
    CLOUD_DENSITY: 'u_cloudDensity',
    CLOUD_COLOR: 'u_cloudColor',
    CLOUD_HEIGHT: 'u_cloudHeight',

    LIGHTNING_FREQUENCY: 'u_lightningFrequency',
    LIGHTNING_INTENSITY: 'u_lightningIntensity',

    FIREWORK_FREQUENCY: 'u_fireworkFrequency',
    FIREWORK_INTENSITY: 'u_fireworkIntensity',
    FIREWORK_SPEED: 'u_fireworkSpeed',
    FIREWORK_WOBBLE: 'u_fireworkWobble',

    RAINBOW_SPEED: 'u_rainbowSpeed',
    RAINBOW_INTENSITY: 'u_rainbowIntensity',
    RAINBOW_WIDTH: 'u_rainbowWidth',
    RAINBOW_RADIUS: 'u_rainbowRadius',

    SUN_SIZE: 'u_sunSize',
    SUN_INTENSITY: 'u_sunIntensity',
    SUN_SPEED: 'u_sunSpeed',
    SUN_COLOR: 'u_sunColor',
    SUN_RAYS: 'u_sunRays',
    SUN_PROMINENCE_SCALE: 'u_sunProminenceScale',
    SUN_PROMINENCE_FREQ: 'u_sunProminenceFreq',
    SUN_POSITION_ANGLE: 'u_sunPositionAngle',
    SUN_POSITION_HEIGHT: 'u_sunPositionHeight',

};


export const TOON_OUTLINE_UNIFORMS: ShaderUniform[] = [
    {
        uniform: 'u_edgeWidth',
        label: 'Espessura Outline',
        description: 'Largura da linha de contorno em pixels.',
        targetPostProcess: 'toon_edge',
        type: 'float',
        defaultValue: 0.5,
        min: 0.1, max: 5.0, step: 0.1,
    },
    {
        uniform: 'u_edgeColor',
        label: 'Cor do Outline',
        description: 'Cor sólida do contorno anime.',
        targetPostProcess: 'toon_edge',
        type: 'color',
        defaultValue: { r: 0.0, g: 0.0, b: 0.0 }, // Preto
    },
    {
        uniform: 'u_depthThreshold',
        label: 'Sensibilidade (Silhueta)',
        description: 'Sensibilidade para detectar a borda externa.',
        targetPostProcess: 'toon_edge',
        type: 'float',
        defaultValue: 0.05,
        min: 0.001, max: 0.1, step: 0.001,
    }
];
