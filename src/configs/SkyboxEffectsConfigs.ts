export interface SkyboxEffectConfig {
    id: string;
    title: string;
    description?: string;
    uniforms?: Record<string, number | number[]>;
}

export const MAX_ACTIVE_EFFECTS = 3;

export const SkyboxEffectsConfigs = {
    warp: {
        id: 'warp',
        title: 'Distorção (Warp)',
        description: 'Cria um efeito de distorção no espaço.',
        uniforms: {
            "u_warpSpeed": 0.1,
            "u_warpIntensity": 0.05
        }
    },
    meteors: {
        id: 'meteors',
        title: 'Chuva de Meteoros',
        description: 'Adiciona estrelas cadentes brilhantes cruzando o céu de forma aleatória.',
        uniforms: {
            "u_meteorSpeedBase": 0.3,
            "u_meteorDensity": 10.0,
            "u_meteorAngle": 0.5
        }
    },
    aurora: {
        id: 'aurora',
        title: 'Aurora Boreal',
        description: 'Gera ondas luminosas dinâmicas no fundo, criando um efeito de aurora.',
        uniforms: {
            "u_auroraSpeed": 0.2,
            "u_auroraIntensity": 1.6,
            "u_auroraColor": [0.1, 0.9, 0.4],
            "u_auroraColorTop": [0.5, 0.1, 0.8],
            "u_auroraThreshold": 0.4
        }
    },
    blackhole: {
        id: 'blackhole',
        title: 'Buraco Negro',
        description: 'Lente gravitacional simulando a dobra do espaço-tempo ao redor de uma singularidade.',
        uniforms: {
            "u_bhMass": 2.0,
            "u_bhRadius": 0.12
        }
    },
    clouds: {
        id: 'clouds',
        title: 'Nuvens',
        description: 'Nuvens procedurais geradas via Fractal Brownian Motion (FBM).',
        uniforms: {
            "u_cloudSpeed": 0.023,
            "u_cloudLateralSpeed": 0.5,
            "u_cloudDensity": 0.55,
            "u_cloudColor": [1.0, 1.0, 1.0],
            "u_cloudHeight": 0.4
        }
    },
    lightning: {
        id: 'lightning',
        title: 'Relâmpagos',
        description: 'Flashes elétricos que iluminam o céu inteiro de forma intermitente.',
        uniforms: {
            "u_lightningFrequency": 1.5,
            "u_lightningIntensity": 2.0
        }
    },
    fireworks: {
        id: 'fireworks',
        title: 'Fogos de Artifício',
        description: 'Explosões coloridas de luz surgindo em posições aleatórias no céu.',
        uniforms: {
            "u_fireworkFrequency": 1.2,
            "u_fireworkIntensity": 0.5,
            "u_fireworkSpeed": 0.2,
            "u_fireworkWobble": 0.002
        }
    }
} as const satisfies Record<string, SkyboxEffectConfig>;

export type SkyboxEffectId = keyof typeof SkyboxEffectsConfigs;
