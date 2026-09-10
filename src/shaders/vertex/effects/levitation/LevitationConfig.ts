import type { VertexEffectConfig } from '../../../Types';
import source from './levitation.glsl?raw';

export const LevitationEffectConfig: VertexEffectConfig = {
    label: 'Levitação',
    description: 'Flutuação mágica e rotação suave em loop.',
    source,
    extraUniforms: ['u_levitationHeight', 'u_levitationSpeed', 'u_levitationRotation'],
    uniforms: [
        { uniform: 'u_levitationHeight', label: 'Altura', type: 'float', defaultValue: 0.5, min: 0.0, max: 5.0, step: 0.1 },
        { uniform: 'u_levitationSpeed', label: 'Velocidade', type: 'float', defaultValue: 2.0, min: 0.0, max: 10.0, step: 0.1 },
        { uniform: 'u_levitationRotation', label: 'Giro', type: 'float', defaultValue: 0.3, min: 0.0, max: 3.14, step: 0.01 }
    ]
};
