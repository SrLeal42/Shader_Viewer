import type { VertexEffectConfig } from '../../../Types';
import source from './wave.glsl?raw';

export const WaveEffectConfig: VertexEffectConfig = {
    label: 'Wave',
    description: 'Ondulação senoidal ao longo das normais.',
    source,
    extraUniforms: ['u_waveAmplitude', 'u_waveFrequency', 'u_waveSpeed'],
    uniforms: [
        {
            uniform: 'u_waveAmplitude',
            label: 'Amplitude',
            description: 'Altura da onda.',
            type: 'float',
            defaultValue: 0.1,
            min: 0.0, max: 1.0, step: 0.01
        },
        {
            uniform: 'u_waveFrequency',
            label: 'Frequência',
            description: 'Número de ondas.',
            type: 'float',
            defaultValue: 5.0,
            min: 1.0, max: 20.0, step: 0.5
        },
        {
            uniform: 'u_waveSpeed',
            label: 'Velocidade',
            description: 'Velocidade da animação.',
            type: 'float',
            defaultValue: 2.0,
            min: 0.0, max: 10.0, step: 0.1
        }
    ]
};
