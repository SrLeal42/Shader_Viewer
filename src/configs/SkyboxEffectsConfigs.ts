export type SkyboxEffectId = 'warp' | 'meteors' | 'aurora';

export interface SkyboxEffectConfig {
    id: SkyboxEffectId;
    title: string;
    uniforms?: Record<string, number | number[]>; // <--- Novo campo para guardar os valores
}

export const MAX_ACTIVE_EFFECTS = 3;

export const SkyboxEffectsConfigs: Record<SkyboxEffectId, SkyboxEffectConfig> = {
    warp: {
        id: 'warp',
        title: 'Distorção (Warp)',
        uniforms: {
            "u_warpSpeed": 0.1,
            "u_warpIntensity": 0.2
        }
    },
    meteors: {
        id: 'meteors',
        title: 'Chuva de Meteoros',
        uniforms: {
            "u_meteorSpeedBase": 0.3,
            "u_meteorDensity": 10.0,
            "u_meteorAngle": 0.5
        }
    },
    aurora: {
        id: 'aurora',
        title: 'Aurora Boreal',
        uniforms: {
            "u_auroraSpeed": 0.1,
            "u_auroraIntensity": 1.5,
            "u_auroraColor": [0.1, 1.0, 0.5] // Verde Neon.
        }
    }
};
