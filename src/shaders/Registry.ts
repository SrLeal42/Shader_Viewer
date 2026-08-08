import type { MaterialShaderConfig, PostProcessShaderConfig } from './Types';

// Material Shaders — mutuamente exclusivos
import { ToonConfig } from './materials/toon/ToonConfig';

export const MaterialShaders = {
    toon: ToonConfig,
} as const satisfies Record<string, MaterialShaderConfig>;

// Post-Process Shaders — empilháveis
import { EdgeConfig } from './postprocess/edge/EdgeConfig';
import { BloomConfig } from './postprocess/bloom/BloomConfig';
import { ToonEdgeConfig } from './postprocess/toon_edge/ToonEdgeConfig';

export const MAX_POST_PROCESSES = 5;

export const PostProcessShaders = {
    edge: EdgeConfig,
    bloom: BloomConfig,
    toon_edge: ToonEdgeConfig,
} as const satisfies Record<string, PostProcessShaderConfig>;

export type MaterialShaderId = keyof typeof MaterialShaders;
export type PostProcessShaderId = keyof typeof PostProcessShaders;
