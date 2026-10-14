import type { WeatherPresetConfig } from './WeatherTypes';
import frostFragmentSource from '../../shaders/weather/FrostOverlay.fragment.glsl?raw';

export const AshesConfig: WeatherPresetConfig = {
    label: 'Cinzas',
    description: 'Névoa densa escura com cinzas flutuando caoticamente em várias direções.',

    particles: [
        {
            texturePath: '/textures/weather/ashes/ashes.png',
            spriteSheet: {
                cellWidth: 500,
                cellHeight: 500,
                totalCells: 3,
            },
            capacity: 800,
            emitRate: 150,
            lifetime: { min: 10.0, max: 16.0 },
            size: { min: 0.03, max: 0.11 },
            speed: { min: 0.2, max: 0.7 },
            direction: { x: 0.0, y: -0.3, z: 0.0 },
            directionSpread: { x: 0.9, y: 0.15, z: 0.8 },
            gravity: { x: 0.03, y: -0.12, z: 0.02 },
            color: {
                start: { r: 0.85, g: 0.82, b: 0.82, a: 0.9 },
                end: { r: 0.4, g: 0.38, b: 0.38, a: 0.0 },
            },
            emitterSize: { x: 12, y: 10, z: 12 },
            blendMode: 'standard',
        }
    ],

    fog: {
        color: { r: 0.26, g: 0.26, b: 0.28 },
        density: 0.38,
        maxOpacity: 0.68,
        start: 2.0,
        falloffCurve: 1.8,
    },

    cameraEffect: {
        fragmentSource: frostFragmentSource,
        uniforms: ['u_time', 'u_intensity', 'u_vignetteInner', 'u_vignetteOuter', 'u_pulseSpeed', 'u_pulseAmplitude'],
        textures: [
            { sampler: 'frostSampler', path: '/textures/weather/ashes/ashes_overlay.png' }
        ],
        overlay: {
            intensity: 0.75,
            vignetteInner: 0.35,
            vignetteOuter: 0.9,
            pulseSpeed: 0.4,
            pulseAmplitude: 0.1,
        }
    }
};
