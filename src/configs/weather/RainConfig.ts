import type { WeatherPresetConfig } from './WeatherTypes';
import frostFragmentSource from '../../shaders/weather/FrostOverlay.fragment.glsl?raw';

export const RainConfig: WeatherPresetConfig = {
    label: 'Chuva',
    description: 'Gotas rápidas inclinadas pelo vento com névoa fina e respingos na câmera.',

    particles: [
        {
            particleShape: 'drop',
            capacity: 2500,
            emitRate: 900,
            lifetime: { min: 0.7, max: 1.2 },
            size: { min: 0.08, max: 0.12 },
            scaleX: { min: 0.1, max: 0.15 },
            scaleY: { min: 1.5, max: 2.8 }, // Gotas alongadas
            speed: { min: 8.0, max: 13.0 }, // Queda rápida
            direction: { x: 0.35, y: -1.0, z: 0.1 }, // Ângulo do vento
            directionSpread: { x: 0.1, y: 0.05, z: 0.1 },
            gravity: { x: 0.8, y: -8.0, z: 0.2 },
            color: {
                start: { r: 0.75, g: 0.85, b: 1.0, a: 0.8 },
                end: { r: 0.6, g: 0.75, b: 0.9, a: 0.15 },
            },
            emitterSize: { x: 14, y: 12, z: 14 },
            blendMode: 'standard',
        }
    ],

    fog: {
        color: { r: 0.65, g: 0.72, b: 0.82 },
        density: 0.06,
        maxOpacity: 0.45,
        start: 3.5,
        falloffCurve: 1.2,
    },

    cameraEffect: {
        fragmentSource: frostFragmentSource,
        uniforms: ['u_time', 'u_intensity', 'u_vignetteInner', 'u_vignetteOuter', 'u_pulseSpeed', 'u_pulseAmplitude'],
        textures: [
            { sampler: 'frostSampler', path: '/textures/weather/rain/rain_overlay.png' }
        ],
        overlay: {
            intensity: 0.85,
            vignetteInner: 0.35,
            vignetteOuter: 0.9,
            pulseSpeed: 0.3,
            pulseAmplitude: 0.1,
        }
    }
};
