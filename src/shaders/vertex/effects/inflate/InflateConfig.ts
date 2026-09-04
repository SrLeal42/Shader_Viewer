import type { VertexEffectConfig } from '../../../Types';
import source from './inflate.glsl?raw';

export const InflateEffectConfig: VertexEffectConfig = {
    label: 'Inflate',
    description: 'Inflação/respiração pulsante ao longo das normais.',
    source,
    extraUniforms: ['u_inflateAmount', 'u_inflateSpeed'],
    uniforms: [
        {
            uniform: 'u_inflateAmount',
            label: 'Intensidade',
            description: 'Quanto o modelo infla.',
            type: 'float',
            defaultValue: 0.15,
            min: 0.0, max: 1.0, step: 0.01
        },
        {
            uniform: 'u_inflateSpeed',
            label: 'Velocidade',
            description: 'Velocidade da pulsação.',
            type: 'float',
            defaultValue: 2.0,
            min: 0.0, max: 10.0, step: 0.1
        }
    ]
};
