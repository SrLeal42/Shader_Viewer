export const ENVIRONMENT_WALLS = [
    'floor',
    'ceil',
    'left',
    'right',
    'front',
    'back'
];

export const SKYBOX_UNIFORMS = {
    MIX: 'u_mix',

    ROTATION_1: 'u_rotation1',
    ROTATION_2: 'u_rotation2',

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

    WARP_SPEED: 'u_warpSpeed',
    WARP_INTENSITY: 'u_warpIntensity',

    METEOR_SPEED_BASE: 'u_meteorSpeedBase',
    METEOR_DENSITY: 'u_meteorDensity',
    METEOR_ANGLE: 'u_meteorAngle',

    AURORA_SPEED: 'u_auroraSpeed',
    AURORA_INTENSITY: 'u_auroraIntensity',
    AURORA_COLOR: 'u_auroraColor',

    BH_MASS: 'u_bhMass',
    BH_RADIUS: 'u_bhRadius'
};
