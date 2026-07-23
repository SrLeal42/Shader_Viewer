export interface SkyboxConfig {
    label: string;
    path: string;
    intensity?: number;
    rotationY?: number;
}

export const SkyboxConfigs = {
    studio: {
        label: 'Estúdio',
        path: '/skyboxes/studio.env',
        intensity: 1.0,
        rotationY: 0,
    },
    sunset: {
        label: 'Céu',
        path: '/skyboxes/sunset.env',
        intensity: 0.8,
        rotationY: 0,
    },
    // Para adicionar um novo skybox:
    // 1. Converter o .hdr para .env via Babylon Sandbox (https://www.babylonjs.com/tools/ibl/)
    // 2. Colocar o .env em public/skyboxes/
    // 3. Adicionar uma entrada aqui
} as const satisfies Record<string, SkyboxConfig>;

export type SkyboxId = keyof typeof SkyboxConfigs;
