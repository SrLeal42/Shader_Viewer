export interface SkyboxConfig {
    label: string;
    path?: string;
    intensity?: number;
    rotationY?: number;
    tonemapStrength?: number;// 0.0 (sem tonemapping) a 1.0 (Reinhard completo). Default: 0.3
    blur?: number;        // 0.0 (nítido) a 1.0 (máximo desfoque). Default: 0.0
    exposure?: number;    // Multiplicador de brilho. Default: 1.0
    saturation?: number;  // 0.0 (preto e branco) a 1.0 (cor original). Default: 1.0
}

export const SkyboxConfigs = {
    color: {
        label: 'Cor Sólida',
        path: '',
        tonemapStrength: 0.0, // Mantemos em 0 para não lavar a cor sólida por padrão
        blur: 0.0,
        exposure: 1.0,
        saturation: 1.0,
    },
    studio: {
        label: 'Estúdio',
        path: '/skyboxes/studio.env',
        intensity: 1.0,
        rotationY: 0,
        tonemapStrength: 0.6,
        blur: 0.5,
        exposure: 0.7,
        saturation: 0.9,
    },
    sky: {
        label: 'Céu',
        path: '/skyboxes/sky.env',
        intensity: 0.8,
        rotationY: Math.PI,
        tonemapStrength: 0.2,
        blur: 0.1,
        exposure: 1.0,
        saturation: 1.0,
    },
    frutiger_classic: {
        label: 'Frutiger Aero (Classic)',
        path: '/skyboxes/frutiger_aero_classic.env',
        intensity: 0.8,
        rotationY: Math.PI,
        tonemapStrength: 0.2,
        blur: 0.1,
        exposure: 1.0,
        saturation: 1.0,
    },
    frutiger_winter: {
        label: 'Frutiger Aero (Winter)',
        path: '/skyboxes/frutiger_aero_winter.env',
        intensity: 0.8,
        rotationY: Math.PI,
        tonemapStrength: 0.2,
        blur: 0.1,
        exposure: 1.0,
        saturation: 1.0,
    },
    // Para adicionar um novo skybox:
    // 1. Converter o .hdr para .env via Babylon Sandbox (https://www.babylonjs.com/tools/ibl/)
    // 2. Colocar o .env em public/skyboxes/
    // 3. Adicionar uma entrada aqui
} as const satisfies Record<string, SkyboxConfig>;

export type SkyboxId = keyof typeof SkyboxConfigs;
