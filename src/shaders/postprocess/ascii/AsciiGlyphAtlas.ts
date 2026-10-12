import * as B from '../../../babylon/BabylonAdapter';

import { ASCII_CELL_SIZE, ASCII_FONT_FAMILY, ASCII_FONT_SCALE, ASCII_GLYPHS } from './AsciiConstants';

/**
 * Desenha todos os glifos numa única linha (CELL_SIZE × CELL_SIZE cada) via Canvas2D
 * e envia para a GPU. Branco = tinta, preto = vazio (o shader usa o canal R como máscara).
 */
export function createGlyphAtlas(scene: B.Scene): B.DynamicTexture {
    const cell = ASCII_CELL_SIZE;
    const width = ASCII_GLYPHS.length * cell;

    const atlas = new B.DynamicTexture(
        'asciiGlyphAtlas',
        { width, height: cell },
        scene,
        false,
        B.Texture.NEAREST_SAMPLINGMODE
    );
    atlas.wrapU = B.Texture.CLAMP_ADDRESSMODE;
    atlas.wrapV = B.Texture.CLAMP_ADDRESSMODE;

    const font = `${Math.round(cell * ASCII_FONT_SCALE)}px ${ASCII_FONT_FAMILY}`;
    let disposed = false;
    atlas.onDisposeObservable.addOnce(() => { disposed = true; });

    const draw = (): void => {
        const ctx = atlas.getContext() as CanvasRenderingContext2D;;
        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, width, cell);
        ctx.fillStyle = '#fff';
        ctx.font = font;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';


        for (let i = 0; i < ASCII_GLYPHS.length; i++) {
            ctx.fillText(ASCII_GLYPHS[i], i * cell + cell * 0.5, cell * 0.5);
        }

        // invertY = true → linha 0 da textura = base do canvas,
        // casando com gl_FragCoord (eixo Y para cima) no Pass 3.
        atlas.update(true);
    };

    draw();

    // Web fonts podem não estar prontas no primeiro draw: redesenha quando carregarem.
    document.fonts?.load(font)
        .then(() => { if (!disposed) draw(); })
        .catch(() => { /* mantém o fallback já desenhado */ });

    return atlas;
}
