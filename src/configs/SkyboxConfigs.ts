export interface SkyboxConfig {
    label: string;
    path?: string;
    intensity?: number;
    rotationY?: number;
    rotationX?: number;
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
        label: 'Studio',
        path: '/skyboxes/studio.env',
        intensity: 1.0,
        rotationY: 0,
        rotationX: 0,
        tonemapStrength: 0.6,
        blur: 0.5,
        exposure: 0.7,
        saturation: 0.9,
    },
    sky: {
        label: 'Sky',
        path: '/skyboxes/sky.env',
        intensity: 0.8,
        rotationY: Math.PI,
        rotationX: 0,
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
        rotationX: 0,
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
        rotationX: 0,
        tonemapStrength: 0.2,
        blur: 0.1,
        exposure: 1.0,
        saturation: 1.0,
    },
    xangai: {
        label: 'Xangai',
        path: '/skyboxes/xangai.env',
        intensity: 1.0,
        rotationY: Math.PI / 1.15,
        rotationX: -0.35,
        tonemapStrength: 0.2,
        blur: 0.1,
        exposure: 1.0,
        saturation: 1.0,
    },
    cyberpunk: {
        label: 'Cyberpunk City',
        path: '/skyboxes/cyberpunk_city.env',
        intensity: 1.0,
        rotationY: Math.PI / 1.5,
        rotationX: -0.45,
        tonemapStrength: 0.2,
        blur: 0.1,
        exposure: 1.0,
        saturation: 1.3,
    },
    underwater: {
        label: 'Underwater',
        path: '/skyboxes/underwater.env',
        intensity: 1.0,
        rotationY: Math.PI,
        rotationX: 0,
        tonemapStrength: -0.5,
        blur: 0,
        exposure: 1.0,
        saturation: 1.2,
    },
    galaxy: {
        label: 'Galaxy',
        path: '/skyboxes/galaxy.env',
        intensity: 1.0,
        rotationY: Math.PI,
        rotationX: 0,
        tonemapStrength: 0.2,
        blur: 0.1,
        exposure: 1.0,
        saturation: 1.0,
    },
    cosmic_cluster: {
        label: 'Cosmic Cluster',
        path: '/skyboxes/cosmic_cluster.env',
        intensity: 1.0,
        rotationY: Math.PI,
        rotationX: 0,
        tonemapStrength: 0.2,
        blur: 0.1,
        exposure: 1.0,
        saturation: 1.0,
    }
    // Para adicionar um novo skybox:
    // 1. Converter o .hdr para .env via Babylon Sandbox (https://www.babylonjs.com/tools/ibl/)
    // 2. Colocar o .env em public/skyboxes/
    // 3. Adicionar uma entrada aqui
} as const satisfies Record<string, SkyboxConfig>;

export type SkyboxId = keyof typeof SkyboxConfigs;
