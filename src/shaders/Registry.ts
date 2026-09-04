import type { MaterialShaderConfig, PostProcessShaderConfig, VertexEffectConfig } from './Types';

// Material Shaders — mutuamente exclusivos
import { ToonConfig } from './materials/toon/ToonConfig';
import { PixelArtConfig } from './materials/pixelart/PixelArtConfig';
import { GlassConfig } from './materials/glass/GlassConfig';
import { PortalConfig } from './materials/portal/PortalConfig';
import { ChromeConfig } from './materials/chrome/ChromeConfig';
import { IridescentConfig } from './materials/iridescent/IridescentConfig';

export const MaterialShaders = {
    toon: ToonConfig,
    pixelart: PixelArtConfig,
    glass: GlassConfig,
    portal: PortalConfig,
    chrome: ChromeConfig,
    iridescent: IridescentConfig,
} as const satisfies Record<string, MaterialShaderConfig>;

// Post-Process Shaders — empilháveis
import { EdgeConfig } from './postprocess/edge/EdgeConfig';
import { BloomConfig } from './postprocess/bloom/BloomConfig';
import { ToonEdgeConfig } from './postprocess/toon_edge/ToonEdgeConfig';
import { PixelateConfig } from './postprocess/pixelate/PixelateConfig';
import { ReflectionConfig } from './postprocess/reflection/ReflectionConfig';
import { DeteriorationConfig } from './postprocess/deterioration/DeteriorationConfig';

export const MAX_POST_PROCESSES = 5;

export const PostProcessShaders = {
    edge: EdgeConfig,
    bloom: BloomConfig,
    toon_edge: ToonEdgeConfig,
    pixelate: PixelateConfig,
    reflection: ReflectionConfig,
    deterioration: DeteriorationConfig,
} as const satisfies Record<string, PostProcessShaderConfig>;

// Vertex Effects — mutuamente exclusivos
import { NoneEffectConfig } from './vertex/effects/none/NoneConfig';
import { WaveEffectConfig } from './vertex/effects/wave/WaveConfig';
import { TwistEffectConfig } from './vertex/effects/twist/TwistConfig';
import { InflateEffectConfig } from './vertex/effects/inflate/InflateConfig';

export const VertexEffects = {
    none: NoneEffectConfig,
    wave: WaveEffectConfig,
    twist: TwistEffectConfig,
    inflate: InflateEffectConfig,
} as const satisfies Record<string, VertexEffectConfig>;

export type MaterialShaderId = keyof typeof MaterialShaders;
export type PostProcessShaderId = keyof typeof PostProcessShaders;
export type VertexEffectId = keyof typeof VertexEffects;
