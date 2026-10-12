// ─── Constantes de compilação do efeito ASCII ───
/** Tamanho (px) de cada caractere na tela. */
export const ASCII_CELL_SIZE = 8;

/** Escala de luminância: do mais escuro (índice 0) ao mais claro. */
export const ASCII_LUMA_RAMP = ' .:-=+*#%@';

/**
 * Glifos de borda. A ORDEM É FIXA e deve casar com os buckets do Pass 1:
 * 0: '|' (vertical)  1: '\' (diagonal ↘)  2: '-' (horizontal)  3: '/' (diagonal ↗)
 */
export const ASCII_EDGE_GLYPHS = '|\\-/';

/** Brilho do skybox em ASCII. 0 = só o modelo, 1 = mesmo peso do modelo. */
export const ASCII_SKY_BRIGHTNESS = 0.3;

/** Multiplicador de cor aplicado aos glifos de borda (destaque da silhueta). */
export const ASCII_EDGE_COLOR_BOOST = 1.25;

/** Curva da luminância antes da quantização (1.0 = linear). */
export const ASCII_LUMA_GAMMA = 1.0;

/** Cores dos modos monocromáticos (RGB linear 0–1). */
export const ASCII_MONO_GREEN: readonly [number, number, number] = [0.2, 1.0, 0.35];
export const ASCII_MONO_AMBER: readonly [number, number, number] = [1.0, 0.7, 0.15];

/** Fonte do atlas. Web fonts são redesenhadas automaticamente ao carregar. */
export const ASCII_FONT_FAMILY = 'monospace';
export const ASCII_FONT_SCALE = 1.0;

// ─── Derivados (não editar) ───

export const ASCII_GLYPHS = ASCII_LUMA_RAMP + ASCII_EDGE_GLYPHS;

if (ASCII_EDGE_GLYPHS.length !== 4) {
    throw new Error('[ASCII] ASCII_EDGE_GLYPHS deve ter exatamente 4 glifos (| \\ - /).');
}
if (ASCII_GLYPHS.length > 255) {
    throw new Error('[ASCII] Máximo de 255 glifos (índice empacotado em 8 bits).');
}

const glslFloat = (n: number): string => (Number.isInteger(n) ? n.toFixed(1) : String(n));
const glslVec3 = (c: readonly number[]): string => `vec3(${c.map(glslFloat).join(', ')})`;

export function generateAsciiDefines(): string {
    return [
        `#define CELL_SIZE ${ASCII_CELL_SIZE}`,
        `#define LUMA_GLYPH_COUNT ${ASCII_LUMA_RAMP.length}`,
        `#define SKY_BRIGHTNESS ${glslFloat(ASCII_SKY_BRIGHTNESS)}`,
        `#define EDGE_COLOR_BOOST ${glslFloat(ASCII_EDGE_COLOR_BOOST)}`,
        `#define LUMA_GAMMA ${glslFloat(ASCII_LUMA_GAMMA)}`,
        `#define MONO_GREEN ${glslVec3(ASCII_MONO_GREEN)}`,
        `#define MONO_AMBER ${glslVec3(ASCII_MONO_AMBER)}`,
    ].join('\n');
}
