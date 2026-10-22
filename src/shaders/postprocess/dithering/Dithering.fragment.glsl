#version 300 es
precision highp float;

in vec2 vUV;
out vec4 fragColor;

uniform sampler2D textureSampler;
uniform vec2 u_screenSize;

uniform float u_pattern;
uniform float u_ditherScale;
uniform float u_colorMode;

uniform float u_colorLevels;

uniform float u_threshold;
uniform vec3 u_darkColor;
uniform vec3 u_lightColor;

const vec3 LUMA_WEIGHTS = vec3(0.2126, 0.7152, 0.0722);

// ─── Bayer 4x4 Ordered Dithering ───
float bayer4x4(vec2 pos) {
    int x = int(mod(pos.x, 4.0));
    int y = int(mod(pos.y, 4.0));
    int index = x + y * 4;

    const float bayer[16] = float[16](
         0.0/16.0,  8.0/16.0,  2.0/16.0, 10.0/16.0,
        12.0/16.0,  4.0/16.0, 14.0/16.0,  6.0/16.0,
         3.0/16.0, 11.0/16.0,  1.0/16.0,  9.0/16.0,
        15.0/16.0,  7.0/16.0, 13.0/16.0,  5.0/16.0
    );

    return (bayer[index] * 16.0 + 0.5) / 16.0;
}

// ─── Bayer 8x8 Ordered Dithering ───
float bayer8x8(vec2 pos) {
    int x = int(mod(pos.x, 8.0));
    int y = int(mod(pos.y, 8.0));
    int index = x + y * 8;

    const float bayer[64] = float[64](
         0.0/64.0, 32.0/64.0,  8.0/64.0, 40.0/64.0,  2.0/64.0, 34.0/64.0, 10.0/64.0, 42.0/64.0,
        48.0/64.0, 16.0/64.0, 56.0/64.0, 24.0/64.0, 50.0/64.0, 18.0/64.0, 58.0/64.0, 26.0/64.0,
        12.0/64.0, 44.0/64.0,  4.0/64.0, 36.0/64.0, 14.0/64.0, 46.0/64.0,  6.0/64.0, 38.0/64.0,
        60.0/64.0, 28.0/64.0, 52.0/64.0, 20.0/64.0, 62.0/64.0, 30.0/64.0, 54.0/64.0, 22.0/64.0,
         3.0/64.0, 35.0/64.0, 11.0/64.0, 43.0/64.0,  1.0/64.0, 33.0/64.0,  9.0/64.0, 41.0/64.0,
        51.0/64.0, 19.0/64.0, 59.0/64.0, 27.0/64.0, 49.0/64.0, 17.0/64.0, 57.0/64.0, 25.0/64.0,
        15.0/64.0, 47.0/64.0,  7.0/64.0, 39.0/64.0, 13.0/64.0, 45.0/64.0,  5.0/64.0, 37.0/64.0,
        63.0/64.0, 31.0/64.0, 55.0/64.0, 23.0/64.0, 61.0/64.0, 29.0/64.0, 53.0/64.0, 21.0/64.0
    );

    return (bayer[index] * 64.0 + 0.5) / 64.0;
}

// ─── Halftone ───
float halftone(vec2 pos) {
    // Rotaciona a grade em 45° para estética clássica de impressão
    const float s = 0.70710678;
    const float c = 0.70710678;
    
    vec2 rotPos = mat2(c, -s, s, c) * pos;
    vec2 cell = fract(rotPos / 4.0) - 0.5;
    
    return clamp(length(cell) * 1.41421356, 0.0, 1.0);
}

// ─── Interleaved Gradient Noise ───
float ignNoise(vec2 pos) {
    return fract(52.9829189 * fract(dot(pos, vec2(0.06711056, 0.00583715))));
}

float getDitherThreshold(vec2 cellPos, float pattern) {
    if (pattern < 0.5) return bayer4x4(cellPos);
    if (pattern < 1.5) return bayer8x8(cellPos);
    if (pattern < 2.5) return halftone(cellPos);
    return ignNoise(cellPos);
}

void main() {
    // Coordenada na grade reduzida pela escala do ponto
    vec2 cellCoord = floor(gl_FragCoord.xy / u_ditherScale);

    // Amostra o centro exato do macro-pixel para alinhar cor e matriz
    vec2 snappedUV = (cellCoord + 0.5) * u_ditherScale / u_screenSize;
    vec3 color = texture(textureSampler, clamp(snappedUV, 0.0, 1.0)).rgb;

    // Valor do limiar no intervalo (0.0, 1.0)
    float dither = getDitherThreshold(cellCoord, u_pattern);

    vec3 finalColor;

    if (u_colorMode < 0.5) {
        // ─── Modo 0: Colorido (Quantização RGB) ───
        float levels = max(u_colorLevels - 1.0, 1.0);
        finalColor = floor(color * levels + dither) / levels;
    } else {
        // ─── Modo 1: Duotone (1-Bit) ───
        float luma = dot(color, LUMA_WEIGHTS);
        // Ajusta a luminância pelo slider de limiar (0.5 = neutro)
        float adjustedLuma = clamp(luma + (0.5 - u_threshold), 0.0, 1.0);
        float bit = step(dither, adjustedLuma);
        finalColor = mix(u_darkColor, u_lightColor, bit);
    }

    fragColor = vec4(finalColor, 1.0);
}