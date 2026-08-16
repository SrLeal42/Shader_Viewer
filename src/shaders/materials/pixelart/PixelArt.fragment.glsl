#version 300 es
precision highp float;

in vec3 vNormal;
in vec3 vWorldPosition;
in vec2 vUV;
out vec4 outColor;

// Textura original do modelo
uniform sampler2D u_albedo;
uniform float u_hasAlbedo;

// Paleta
uniform float u_colorLevels;
uniform float u_saturation;

// Iluminação
uniform float u_lightSteps;
uniform float u_shadowMin;

// Dithering
uniform float u_ditherStrength;
uniform float u_ditherScale;
uniform float u_ditherPattern;

// Global
uniform vec3 u_cameraPos;
uniform float u_time;

// Luzes
uniform vec3 u_hemiDir;
uniform vec3 u_hemiColor;
uniform vec3 u_pointPos;
uniform vec3 u_pointColor;

// ─── Bayer 4x4 Ordered Dithering ───
float bayer4x4(vec2 pos) {
    int x = int(mod(pos.x, 4.0));
    int y = int(mod(pos.y, 4.0));
    int index = x + y * 4;

    float bayer[16] = float[16](
         0.0/16.0,  8.0/16.0,  2.0/16.0, 10.0/16.0,
        12.0/16.0,  4.0/16.0, 14.0/16.0,  6.0/16.0,
         3.0/16.0, 11.0/16.0,  1.0/16.0,  9.0/16.0,
        15.0/16.0,  7.0/16.0, 13.0/16.0,  5.0/16.0
    );

    return bayer[index];
}

// ─── Bayer 8x8 Ordered Dithering ───
float bayer8x8(vec2 pos) {
    int x = int(mod(pos.x, 8.0));
    int y = int(mod(pos.y, 8.0));
    int index = x + y * 8;

    float bayer[64] = float[64](
        0.0/64.0, 32.0/64.0,  8.0/64.0, 40.0/64.0,  2.0/64.0, 34.0/64.0, 10.0/64.0, 42.0/64.0,
       48.0/64.0, 16.0/64.0, 56.0/64.0, 24.0/64.0, 50.0/64.0, 18.0/64.0, 58.0/64.0, 26.0/64.0,
       12.0/64.0, 44.0/64.0,  4.0/64.0, 36.0/64.0, 14.0/64.0, 46.0/64.0,  6.0/64.0, 38.0/64.0,
       60.0/64.0, 28.0/64.0, 52.0/64.0, 20.0/64.0, 62.0/64.0, 30.0/64.0, 54.0/64.0, 22.0/64.0,
        3.0/64.0, 35.0/64.0, 11.0/64.0, 43.0/64.0,  1.0/64.0, 33.0/64.0,  9.0/64.0, 41.0/64.0,
       51.0/64.0, 19.0/64.0, 59.0/64.0, 27.0/64.0, 49.0/64.0, 17.0/64.0, 57.0/64.0, 25.0/64.0,
       15.0/64.0, 47.0/64.0,  7.0/64.0, 39.0/64.0, 13.0/64.0, 45.0/64.0,  5.0/64.0, 37.0/64.0,
       63.0/64.0, 31.0/64.0, 55.0/64.0, 23.0/64.0, 61.0/64.0, 29.0/64.0, 53.0/64.0, 21.0/64.0
    );

    return bayer[index];
}

// ─── Halftone ───
float halftone(vec2 pos) {
    vec2 p = fract(pos / 4.0) - 0.5;
    float dist = length(p);
    return smoothstep(0.4, 0.6, dist);
}

// ─── Crosshatch ───
float crosshatch(vec2 pos) {
    float x = pos.x;
    float y = pos.y;
    float line1 = mod(x + y, 4.0) < 1.0 ? 1.0 : 0.0;
    float line2 = mod(x - y, 4.0) < 1.0 ? 1.0 : 0.0;
    return max(line1, line2) * 0.5 + 0.25;
}

float getDither(vec2 pos, float pattern) {
    if (pattern < 0.5) return bayer4x4(pos);
    if (pattern < 1.5) return bayer8x8(pos);
    if (pattern < 2.5) return halftone(pos);
    return crosshatch(pos);
}

// ─── Quantização de cor ───
vec3 quantizeColor(vec3 color, float levels) {
    return floor(color * levels + 0.5) / levels;
}

// ─── Ajuste de saturação ───
vec3 adjustSaturation(vec3 color, float sat) {
    float luma = dot(color, vec3(0.2126, 0.7152, 0.0722));
    return mix(vec3(luma), color, sat);
}

void main() {
    vec3 normal = normalize(vNormal);

    // ─── Cor base (textura original ou fallback) ───
    vec3 baseColor = u_hasAlbedo > 0.5
        ? texture(u_albedo, vUV).rgb
        : vec3(0.75);

    // ─── Iluminação (hemi + point) ───
    float hemiNdotL = dot(normal, normalize(u_hemiDir));
    vec3 hemiLight = max(hemiNdotL, 0.0) * u_hemiColor;

    vec3 pointDir = normalize(u_pointPos - vWorldPosition);
    float pointDist = length(u_pointPos - vWorldPosition);
    float attenuation = 1.0 / (1.0 + 0.1 * pointDist * pointDist);
    float pointNdotL = dot(normal, pointDir);
    vec3 pointLight = max(pointNdotL, 0.0) * u_pointColor * attenuation;

    vec3 totalLight = hemiLight + pointLight;
    float luminance = dot(totalLight, vec3(0.2126, 0.7152, 0.0722));

    // Quantiza a iluminação em degraus duros
    float quantizedLight = floor(luminance * u_lightSteps) / u_lightSteps;
    quantizedLight = max(quantizedLight, u_shadowMin);

    float scale = quantizedLight / max(luminance, 0.001);
    vec3 litColor = baseColor * totalLight * scale;

    // ─── Saturação ───
    litColor = adjustSaturation(litColor, u_saturation);

    // ─── Dithering (antes da quantização final) ───
    float dither = getDither(gl_FragCoord.xy / u_ditherScale, u_ditherPattern);
    dither = (dither - 0.5) * u_ditherStrength / u_colorLevels;
    litColor += dither;

    // ─── Quantização final da paleta ───
    vec3 finalColor = quantizeColor(litColor, u_colorLevels);

    outColor = vec4(finalColor, 1.0);
}
