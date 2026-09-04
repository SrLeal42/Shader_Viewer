import type { VertexEffectConfig } from '../../../Types';
import source from './none.glsl?raw';

export const NoneEffectConfig: VertexEffectConfig = {
    label: 'Nenhum',
    description: 'Sem deformação de vértice.',
    source,
    extraUniforms: [],
    uniforms: []
};
