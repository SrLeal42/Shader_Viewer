import { ToonConfig } from './materials/toon/ToonConfig';
import type { MaterialShaderConfig, PostProcessShaderConfig } from './Types';

// Material Shaders — mutuamente exclusivos
export const MaterialShaders = {
    toon: ToonConfig,
} as const satisfies Record<string, MaterialShaderConfig>;

// Post-Process Shaders — empilháveis
// export const PostProcessShaders = {
//     // Adicionaremos aqui conforme implementar (dithering, ascii, edge)
// } as const satisfies Record<string, PostProcessShaderConfig>;

export const PostProcessShaders: Record<string, PostProcessShaderConfig> = {
};

export type MaterialShaderId = keyof typeof MaterialShaders;
export type PostProcessShaderId = keyof typeof PostProcessShaders;
