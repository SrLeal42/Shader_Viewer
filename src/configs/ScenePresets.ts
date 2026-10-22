import type { ModelId } from './ModelConfigs';
import type { SkyboxId } from './SkyboxConfigs';
import type { SkyboxEffectId } from './SkyboxEffectsConfigs';
import type { WeatherPresetId } from './weather/WeatherRegistry';
import type { LightModeId, PointAnimationType } from './LightConfigs';
import type { InteractionId } from './InteractionConfigs';
import type { MaterialShaderId, PostProcessShaderId, VertexEffectId } from '../shaders/Registry';

export interface ScenePreset {
    model: ModelId;
    skybox: SkyboxId | 'color';
    skyboxColor?: { r: number, g: number, b: number }; // Cor quando skybox for 'color'
    material: MaterialShaderId;

    // Modifica escala, posição e rotação inicial do modelo
    transform?: {
        position?: { x: number, y: number, z: number };
        rotation?: { x: number, y: number, z: number }; // Em graus
        physics?: boolean;
    };

    modelParams?: Record<string, unknown>;
    materialParams?: Record<string, unknown>;

    // Efeitos de Vértice
    vertexEffect?: VertexEffectId;
    vertexEffectParams?: Record<string, unknown>;

    // Pós-processamento e Efeitos de Skybox
    postProcesses?: Partial<Record<PostProcessShaderId, Record<string, unknown>>>;
    skyboxEffects?: SkyboxEffectId[];

    weather?: WeatherPresetId | 'none';

    light?: {
        mode?: LightModeId;
        hemi?: {
            direction?: { x: number, y: number, z: number };
            color?: { r: number, g: number, b: number };
            intensity?: number;
        };
        point?: {
            position?: { x: number, y: number, z: number };
            color?: { r: number, g: number, b: number };
            intensity?: number;
            showHelper?: boolean;
            animationType?: PointAnimationType;
            orbitSpeed?: number;
            pulseFrequency?: number;
        };
    };

    interaction?: InteractionId;
}


export const ScenePresets: Record<string, ScenePreset> = {

    default: {
        model: 'sphere',
        skybox: 'color',
        material: 'standard',
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
            },
            'deterioration': {
                "u_noiseStrength": 0.06,
                "u_noiseScale": 900.0,
                "u_desaturation": 0.0,
                "u_vignetteStrength": 0.0,
                "u_vignetteRadius": 0.2,
                "u_chromaticAberration": 0.001,
                "u_scanlineStrength": 0.0,
                "u_scanlineFrequency": 300.0,
            }
        }

    },

    deteriorated_sphere: {
        model: 'sphere',
        skybox: 'xangai',
        material: 'glass',
        transform: {
            position: { x: 0, y: 0, z: 0 },
            rotation: { x: 0, y: 0, z: 0 },
            physics: false
        },

        modelParams: { scale: 2 },

        materialParams: {
            "u_ior": 1.52,
            "u_refractionStrength": 0.14,
            "u_tintColor": { r: 0.30, g: 0.00, b: 1.00 },
            "u_tintDensity": 0.56,
            "u_roughness": 0.0,
            "u_reflectivity": 0.6,
            "u_fresnelPower": 5.5
        },
        postProcesses: {
            'bloom': {
                "u_threshold": 0.25,
                "u_intensity": 3.1,
                "u_radius": 3.0,
            },
            'pixelate': {
                "u_pixelSize": 3
            },
            'deterioration': {
                "u_noiseStrength": 0.05,
                "u_noiseScale": 1000.0,
                "u_desaturation": 0.2,
                "u_vignetteStrength": 0.5,
                "u_vignetteRadius": 0.2,
                "u_chromaticAberration": 0.002,
                "u_scanlineStrength": 0.1,
                "u_scanlineFrequency": 300.0,
                "u_scanlineSpeed": 0.5,
            }
        },
        skyboxEffects: ['meteors']

    },

    stormy_candelabra: {
        model: 'candelabra',
        skybox: 'cosmic_cluster',
        material: 'standard',
        weather: 'rain',
        light: {
            mode: 'both',
            hemi: { intensity: 0.3, color: { r: 0.4, g: 0.5, b: 0.7 } },
            point: {
                position: { x: 0, y: 2.5, z: 1.5 },
                color: { r: 1.0, g: 0.7, b: 0.3 },
                intensity: 1.8,
                animationType: 'pulse',
                pulseFrequency: 4.0,
                showHelper: false
            }
        },
        skyboxEffects: ['lightning'],
        postProcesses: {
            bloom: { u_intensity: 1.2, u_threshold: 0.7 }
        }
    },

    dithering_monkey: {
        model: 'suzanne',
        skybox: 'cosmic_cluster',
        material: 'portal',
        transform: {
            position: { x: 0, y: 0.2, z: 1.2 },
            rotation: { x: -5, y: 15, z: 0 },
            physics: false
        },

        modelParams: { scale: 1.8 },

        materialParams: {
            "u_pattern": 0,
            "u_layers": 8.0,
            "u_scrollSpeed": 0.3,
            "u_rotationSpeed": 0.15,
            "u_parallaxDepth": 3.0,
            "u_baseColor": {r: 1.00, g: 1.00, b: 1.00},
            "u_accentColor": {r: 0.86, g: 1.00, b: 0.00},
            "u_brightness": 1.4,
            "u_edgeGlow": 3.0,
            "u_edgeColor": {r: 1.00, g: 1.00, b: 1.00},
        },
        postProcesses: {
            'dithering': {
                "u_pattern": 1,
                "u_ditherScale": 2,
                "u_colorMode": 1,
                "u_threshold": 0.75,
                "u_darkColor": {r: 0.00, g: 0.00, b: 0.00},
                "u_lightColor": {r: 0.96, g: 1.00, b: 0.90},
            },
            'bloom': {
                "u_threshold": 0.90,
                "u_intensity": 1.9,
                "u_radius": 3.4,
            },
            'deterioration': {
                "u_noiseStrength": 0.00,
                "u_noiseScale": 1000.0,
                "u_desaturation": 0.0,
                "u_vignetteStrength": 0.59,
                "u_vignetteRadius": 0.23,
                "u_chromaticAberration": 0.0,
                "u_scanlineStrength": 0.15,
                "u_scanlineFrequency": 50.0,
                "u_scanlineSpeed": 0.5,
            }
        },
        skyboxEffects: ['warp', 'meteors', 'aurora']

    },

    dithering_planet: {
        model: 'sphere',
        skybox: 'galaxy',
        material: 'chrome',
        transform: {
            position: { x: 4.0, y: -0.7, z: -2.7 },
            rotation: { x: 0, y: 0, z: 0 },
            physics: false
        },

        modelParams: { scale: 2.0 },

        materialParams: {
            "u_metalColor": {r: 0.85, g: 0.85, b: 0.88},
            "u_roughness": 0.93,
            "u_lumThreshold": 0.05,
            "u_noiseScale": 0.1,
            "u_noiseStrength": 0.25,
            "u_noiseSpeed": 0.01,
            "u_reflectivity": 1.3,
            "u_fresnelPower": 4.0,
        },
        light: {
            mode: 'hemi',
            hemi: { intensity: 1.6, color: {r: 1.00, g: 1.00, b: 1.00} }
        },
        postProcesses: {
            'dithering': {
                "u_pattern": 1,
                "u_ditherScale": 2,
                "u_colorMode": 1,
                "u_threshold": 0.51,
                "u_darkColor": {r: 0.08, g: 0.09, b: 0.12},
                "u_lightColor": {r: 0.59, g: 0.40, b: 1.00},
            },
            'deterioration': {
                "u_noiseStrength": 0.04,
                "u_noiseScale": 1000.0,
                "u_desaturation": 0.0,
                "u_vignetteStrength": 0.50,
                "u_vignetteRadius": 0.20,
                "u_chromaticAberration": 0.0,
                "u_scanlineStrength": 0.10,
                "u_scanlineFrequency": 50.0,
                "u_scanlineSpeed": 0.1,
            }
        },
        skyboxEffects: ['warp', 'blackhole']

    }

};

export const ACTIVE_PRESET: keyof typeof ScenePresets = 'dithering_planet'; //'default'; 
