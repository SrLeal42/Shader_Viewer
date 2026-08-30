import type { ModelId } from './ModelConfigs';
import type { SkyboxId } from './SkyboxConfigs';
import type { SkyboxEffectId } from './SkyboxEffectsConfigs'; // 

import type { MaterialShaderId, PostProcessShaderId } from '../shaders/Registry';

export interface ScenePreset {
    model: ModelId;
    skybox: SkyboxId | 'color';
    material: MaterialShaderId | 'none';

    // Modifica escala, posição e rotação inicial do modelo
    transform?: {
        position?: { x: number, y: number, z: number };
        rotation?: { x: number, y: number, z: number }; // Em graus
        physics?: boolean;
    };

    modelParams?: Record<string, unknown>;

    // Define valores customizados para os sliders do Material
    materialParams?: Record<string, unknown>;

    // Liga Efeitos Post-Process e define seus parâmetros customizados
    postProcesses?: Partial<Record<PostProcessShaderId, Record<string, unknown>>>;

    // Liga Efeitos de Ambiente (Skybox Effects) e define seus parâmetros customizados
    skyboxEffects?: SkyboxEffectId[];
}

export const ScenePresets: Record<string, ScenePreset> = {

    default: {
        model: 'sphere',
        skybox: 'color',
        material: 'none',
    },

    cosmic_monkey: {
        model: 'suzanne',
        skybox: 'cosmic_cluster',
        material: 'glass',
        transform: {
            position: { x: 1.1, y: -0.5, z: 1.5 },
            rotation: { x: -7, y: 15, z: 0 },
            physics: false
        },

        modelParams: { scale: 3 },

        materialParams: {
            "u_ior": 1.5,
            "u_refractionStrength": 0.05,
            "u_tintDensity": 1.0,
            "u_roughness": 0.5,
            "u_reflectivity": 0.5,
            "u_fresnelPower": 4.5
        },
        postProcesses: {
            'bloom': {
                "u_threshold": 0.8,
                "u_intensity": 1.0,
                "u_radius": 3.0,
            }
        },
        skyboxEffects: ['warp', 'meteors']

    },

    chrome_monkey: {
        model: 'suzanne',
        skybox: 'cyberpunk',
        material: 'chrome',
        transform: {
            position: { x: 1.1, y: -0.5, z: 2.0 },
            rotation: { x: -14, y: 20, z: 0 },
            physics: false
        },

        modelParams: { scale: 3 },

        materialParams: {
            "u_metalColor": { r: 0.65, g: 0.24, b: 1.00 },
            "u_roughness": 0.25,
            "u_lumThreshold": 0.05,
            "u_noiseScale": 1.5,
            "u_noiseStrength": 0.1,
            "u_noiseSpeed": 0.1,
            "u_reflectivity": 1.5,
            "u_fresnelPower": 3.0,
        },
        postProcesses: {
            'bloom': {
                "u_threshold": 0.35,
                "u_intensity": 1.6,
                "u_radius": 3.9,
            },
            'reflection': {
                "u_threshold": 0.23,
                "u_amplitude": 0.01,
                "u_frequency": 100.0,
                "u_bandFrequency": 37.0,
                "u_bandSpeed": 1.0,
            }
        }

    }
};

export const ACTIVE_PRESET: keyof typeof ScenePresets = 'default'; 
