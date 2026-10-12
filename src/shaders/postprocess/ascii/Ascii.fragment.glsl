#version 300 es
precision highp float;
precision highp int;

in vec2 vUV;
out vec4 fragColor;

uniform sampler2D textureSampler; // Cena colorida
uniform sampler2D depthSampler;   // Depth RTT
uniform sampler2D normalSampler;  // Normal RTT
uniform sampler2D glyphAtlas;     // Atlas de glifos

uniform vec2 u_screenSize;
uniform float u_depthThreshold;
uniform float u_normalThreshold;
uniform float u_exposure;
uniform float u_colorMode;

const float PI = 3.14159265359;
const float SKY_DEPTH = 0.9999;
const vec3 LUMA_WEIGHTS = vec3(0.2126, 0.7152, 0.0722);

void main() {
    // ─── 1. Determina a Célula ───
    vec2 cellSize = vec2(float(CELL_SIZE));
    vec2 pixelPos = gl_FragCoord.xy;
    
    // Coordenada inteira da célula e centro UV da célula
    vec2 cellIndex = floor(pixelPos / cellSize);
    vec2 cellCenterPx = cellIndex * cellSize + cellSize * 0.5;
    vec2 cellUV = cellCenterPx / u_screenSize;
    
    // Posição local dentro da célula [0 .. CELL_SIZE - 1]
    ivec2 local = ivec2(pixelPos - cellIndex * cellSize);
    
    // ─── 2. Amostragem da Cor Média da Célula (5 amostras) ───
    vec2 halfStep = (cellSize * 0.25) / u_screenSize;
    vec3 cCenter = texture(textureSampler, cellUV).rgb;
    vec3 cTL     = texture(textureSampler, cellUV + vec2(-halfStep.x,  halfStep.y)).rgb;
    vec3 cTR     = texture(textureSampler, cellUV + vec2( halfStep.x,  halfStep.y)).rgb;
    vec3 cBL     = texture(textureSampler, cellUV + vec2(-halfStep.x, -halfStep.y)).rgb;
    vec3 cBR     = texture(textureSampler, cellUV + vec2( halfStep.x, -halfStep.y)).rgb;
    vec3 avgColor = (cCenter * 2.0 + cTL + cTR + cBL + cBR) / 6.0;

    // ─── 3. Detecção de Borda Geométrica na Célula (Sobel 3x3) ───
    vec2 texel = (cellSize * 0.45) / u_screenSize; // Avalia o gradiente abrangendo a célula
    
    float d_tl = texture(depthSampler, cellUV + vec2(-texel.x,  texel.y)).r;
    float d_tm = texture(depthSampler, cellUV + vec2(    0.0,   texel.y)).r;
    float d_tr = texture(depthSampler, cellUV + vec2( texel.x,  texel.y)).r;
    float d_ml = texture(depthSampler, cellUV + vec2(-texel.x,      0.0)).r;
    float d_mr = texture(depthSampler, cellUV + vec2( texel.x,      0.0)).r;
    float d_bl = texture(depthSampler, cellUV + vec2(-texel.x, -texel.y)).r;
    float d_bm = texture(depthSampler, cellUV + vec2(    0.0,  -texel.y)).r;
    float d_br = texture(depthSampler, cellUV + vec2( texel.x, -texel.y)).r;

    float dgx = (d_tr + 2.0 * d_mr + d_br) - (d_tl + 2.0 * d_ml + d_bl);
    float dgy = (d_tl + 2.0 * d_tm + d_tr) - (d_bl + 2.0 * d_bm + d_br);
    float depthMag = length(vec2(dgx, dgy));

    vec3 n_tl = texture(normalSampler, cellUV + vec2(-texel.x,  texel.y)).xyz * 2.0 - 1.0;
    vec3 n_tm = texture(normalSampler, cellUV + vec2(    0.0,   texel.y)).xyz * 2.0 - 1.0;
    vec3 n_tr = texture(normalSampler, cellUV + vec2( texel.x,  texel.y)).xyz * 2.0 - 1.0;
    vec3 n_ml = texture(normalSampler, cellUV + vec2(-texel.x,      0.0)).xyz * 2.0 - 1.0;
    vec3 n_mr = texture(normalSampler, cellUV + vec2( texel.x,      0.0)).xyz * 2.0 - 1.0;
    vec3 n_bl = texture(normalSampler, cellUV + vec2(-texel.x, -texel.y)).xyz * 2.0 - 1.0;
    vec3 n_bm = texture(normalSampler, cellUV + vec2(    0.0,  -texel.y)).xyz * 2.0 - 1.0;
    vec3 n_br = texture(normalSampler, cellUV + vec2( texel.x, -texel.y)).xyz * 2.0 - 1.0;

    vec3 ngx = (n_tr + 2.0 * n_mr + n_br) - (n_tl + 2.0 * n_ml + n_bl);
    vec3 ngy = (n_tl + 2.0 * n_tm + n_tr) - (n_bl + 2.0 * n_bm + n_br);
    float nJxx = dot(ngx, ngx);
    float nJyy = dot(ngy, ngy);
    float nJxy = dot(ngx, ngy);
    float normalMag = sqrt(nJxx + nJyy);

    bool isEdge = (depthMag > u_depthThreshold) || (normalMag > u_normalThreshold);
    int glyph;

    if (isEdge) {
        float wd = 1.0 / (u_depthThreshold * u_depthThreshold);
        float wn = 1.0 / (u_normalThreshold * u_normalThreshold);
        float Jxx = dgx * dgx * wd + nJxx * wn;
        float Jyy = dgy * dgy * wd + nJyy * wn;
        float Jxy = dgx * dgy * wd + nJxy * wn;

        float theta = 0.5 * atan(2.0 * Jxy, Jxx - Jyy + 1e-8);
        float a = mod(theta + PI * 0.125, PI);

        // Buckets de orientação da borda:
        // 0: '|'  1: '\'  2: '-'  3: '/'
        int dir = min(int(a / (PI * 0.25)), 3);
        glyph = LUMA_GLYPH_COUNT + dir;
    } else {
        float luma = pow(clamp(dot(avgColor, LUMA_WEIGHTS) * u_exposure, 0.0, 1.0), LUMA_GAMMA);
        glyph = min(int(luma * float(LUMA_GLYPH_COUNT)), LUMA_GLYPH_COUNT - 1);
    }

    // ─── 4. Leitura da Máscara do Glifo no Atlas ───
    float mask = texelFetch(glyphAtlas, ivec2(glyph * CELL_SIZE + local.x, local.y), 0).r;

    // ─── 5. Cores, Boost de Borda e Skybox ───
    int mode = int(u_colorMode + 0.5);
    vec3 finalColor;
    if (mode == 1) {
        float maxC = max(avgColor.r, max(avgColor.g, avgColor.b));
        finalColor = maxC > 0.01 ? (avgColor / maxC) : avgColor;
    } else if (mode == 2) {
        finalColor = MONO_GREEN;
    } else if (mode == 3) {
        finalColor = MONO_AMBER;
    } else {
        finalColor = avgColor;
    }

    if (isEdge) {
        finalColor *= EDGE_COLOR_BOOST;
    }

    // Atenuação no Skybox
    float centerDepth = texture(depthSampler, cellUV).r;
    if (centerDepth >= SKY_DEPTH) {
        finalColor *= SKY_BRIGHTNESS;
    }

    fragColor = vec4(finalColor * mask, 1.0);
}
