import type { MaterialShaderConfig, PostProcessShaderConfig } from './Types';

// Material Shaders — mutuamente exclusivos
import { ToonConfig } from './materials/toon/ToonConfig';
import { PixelArtConfig } from './materials/pixelart/PixelArtConfig';
import { GlassConfig } from './materials/glass/GlassConfig';
import { PortalConfig } from './materials/portal/PortalConfig';


export const MaterialShaders = {
    toon: ToonConfig,
    pixelart: PixelArtConfig,
    glass: GlassConfig,
    portal: PortalConfig,
} as const satisfies Record<string, MaterialShaderConfig>;

// Post-Process Shaders — empilháveis
import { EdgeConfig } from './postprocess/edge/EdgeConfig';
import { BloomConfig } from './postprocess/bloom/BloomConfig';
import { ToonEdgeConfig } from './postprocess/toon_edge/ToonEdgeConfig';
import { PixelateConfig } from './postprocess/pixelate/PixelateConfig';
import { ReflectionConfig } from './postprocess/reflection/ReflectionConfig';

export const MAX_POST_PROCESSES = 5;

export const PostProcessShaders = {
    edge: EdgeConfig,
    bloom: BloomConfig,
    toon_edge: ToonEdgeConfig,
    pixelate: PixelateConfig,
    reflection: ReflectionConfig,
} as const satisfies Record<string, PostProcessShaderConfig>;

export type MaterialShaderId = keyof typeof MaterialShaders;
export type PostProcessShaderId = keyof typeof PostProcessShaders;
