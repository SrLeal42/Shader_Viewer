import type { VertexEffectConfig } from '../../../Types';
import source from './twist.glsl?raw';

export const TwistEffectConfig: VertexEffectConfig = {
    label: 'Twist',
    description: 'Torção espiral no eixo Y.',
    source,
    extraUniforms: ['u_twistStrength', 'u_twistSpeed'],
    uniforms: [
        {
            uniform: 'u_twistStrength',
            label: 'Força',
            description: 'Intensidade da torção.',
            type: 'float',
            defaultValue: 2.0,
            min: 0.0, max: 10.0, step: 0.1
        },
        {
            uniform: 'u_twistSpeed',
            label: 'Velocidade',
            description: 'Velocidade da animação.',
            type: 'float',
            defaultValue: 1.0,
            min: 0.0, max: 5.0, step: 0.1
        }
    ]
};
