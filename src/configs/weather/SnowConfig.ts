import type { WeatherPresetConfig } from './WeatherTypes';

import frostFragmentSource from '../../shaders/weather/FrostOverlay.fragment.glsl?raw';

export const SnowConfig: WeatherPresetConfig = {
    label: 'Neve',
    description: 'Flocos de neve caindo com névoa branca e gelo na câmera.',

    particles: [
        {
            texturePath: '/textures/weather/snow/flakes.png',
            capacity: 1300,
            emitRate: 300,
            lifetime: { min: 6, max: 9 },
            size: { min: 0.02, max: 0.08 },
            speed: { min: 0.3, max: 0.8 },
            direction: { x: 0, y: -1, z: 0 },
            gravity: { x: 0.05, y: -0.2, z: 0 },   // Leve vento lateral
            color: {
                start: { r: 1.0, g: 1.0, b: 1.0, a: 1.0 },
                end: { r: 0.9, g: 0.95, b: 1.0, a: 0.6 },
            },
            emitterSize: { x: 12, y: 10.5, z: 12 },
            blendMode: 'standard',
        }
    ],

    fog: {
        color: { r: 0.85, g: 0.88, b: 0.92 },
        density: .5,
        maxOpacity: 0.65,
    },

    cameraEffect: {
        fragmentSource: frostFragmentSource,
        uniforms: ['u_time', 'u_intensity'],
        textures: [
            { sampler: 'frostSampler', path: '/textures/weather/snow/frost_overlay.png' }
        ]
    }
};
