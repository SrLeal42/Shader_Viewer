import type { WeatherPresetConfig } from './WeatherTypes';
import frostFragmentSource from '../../shaders/weather/FrostOverlay.fragment.glsl?raw';

export const SandstormConfig: WeatherPresetConfig = {
    label: 'Tempestade de Areia',
    description: 'Ventos fortes deslocando areia na horizontal com névoa densa ocre.',

    particles: [
        {
            particleShape: 'circle',
            capacity: 2200,
            emitRate: 650,
            lifetime: { min: 1.8, max: 3.2 },
            size: { min: 0.025, max: 0.055 },
            speed: { min: 5.0, max: 9.5 },
            direction: { x: 1.0, y: -0.15, z: 0.15 }, // Desloca muito mais para o lado (X) que para baixo (Y)
            directionSpread: { x: 0.2, y: 0.12, z: 0.25 },
            gravity: { x: 1.8, y: -1.3, z: 0.2 }, // Vento lateral empurrando forte
            color: {
                start: { r: 0.88, g: 0.72, b: 0.48, a: 0.85 },
                end: { r: 0.72, g: 0.56, b: 0.35, a: 0.2 },
            },
            emitterSize: { x: 20, y: 1, z: 14 },
            blendMode: 'standard',
        }
    ],

    fog: {
        color: { r: 0.78, g: 0.62, b: 0.42 },
        density: 0.32,
        maxOpacity: 0.82,
        start: 1.8,
        falloffCurve: 1.5,
    },

    cameraEffect: {
        fragmentSource: frostFragmentSource,
        uniforms: ['u_time', 'u_intensity', 'u_vignetteInner', 'u_vignetteOuter', 'u_pulseSpeed', 'u_pulseAmplitude'],
        textures: [
            { sampler: 'frostSampler', path: '/textures/weather/sand/sand_overlay.png' }
        ],
        overlay: {
            intensity: 0.9,
            vignetteInner: 0.25,
            vignetteOuter: 0.85,
            pulseSpeed: 0.6,
            pulseAmplitude: 0.15,
        }
    }
};
