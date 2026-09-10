import type { VertexEffectConfig } from '../../../Types';
import source from './glitch.glsl?raw';

export const GlitchEffectConfig: VertexEffectConfig = {
    label: 'Glitch',
    description: 'Fatiamento horizontal e interrupções estilo VHS.',
    source,
    extraUniforms: ['u_glitchIntensity', 'u_glitchSpeed', 'u_glitchSlices'],
    uniforms: [
        { uniform: 'u_glitchIntensity', label: 'Intensidade', type: 'float', defaultValue: 0.05, min: 0.0, max: 2.0, step: 0.01 },
        { uniform: 'u_glitchSpeed', label: 'Velocidade', type: 'float', defaultValue: 10.0, min: 1.0, max: 30.0, step: 1.0 },
        { uniform: 'u_glitchSlices', label: 'Fatias', type: 'float', defaultValue: 20.0, min: 5.0, max: 100.0, step: 1.0 }
    ]
};
