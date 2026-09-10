import type { VertexEffectConfig } from '../../../Types';
import source from './heartbeat.glsl?raw';

export const HeartbeatEffectConfig: VertexEffectConfig = {
    label: 'Coração',
    description: 'Dois batimentos rápidos e uma pausa (ritmo biológico).',
    source,
    extraUniforms: ['u_beatIntensity', 'u_beatSpeed'],
    uniforms: [
        { uniform: 'u_beatIntensity', label: 'Força', type: 'float', defaultValue: 0.5, min: 0.0, max: 2.0, step: 0.1 },
        { uniform: 'u_beatSpeed', label: 'Velocidade', type: 'float', defaultValue: 1.0, min: 0.0, max: 10.0, step: 0.1 }
    ]
};
