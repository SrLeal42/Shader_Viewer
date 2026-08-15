export type SkyboxEffectId = 'warp' | 'meteors' | 'aurora' | 'blackhole';

export interface SkyboxEffectConfig {
    id: SkyboxEffectId;
    title: string;
    description?: string;
    uniforms?: Record<string, number | number[]>; // <--- Novo campo para guardar os valores
}

export const MAX_ACTIVE_EFFECTS = 3;

export const SkyboxEffectsConfigs: Record<SkyboxEffectId, SkyboxEffectConfig> = {
    warp: {
        id: 'warp',
        title: 'Distorção (Warp)',
        description: 'Cria um efeito de distorção no espaço.',
        uniforms: {
            "u_warpSpeed": 0.1,
            "u_warpIntensity": 0.2
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
            "u_auroraColor": [0.1, 0.9, 0.4],        // Verde (base)
            "u_auroraColorTop": [0.5, 0.1, 0.8],     // Roxo (topo)
            "u_auroraThreshold": 0.4                 // Limiar de visibilidade
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
    }
};
