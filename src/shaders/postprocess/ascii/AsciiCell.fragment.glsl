uniform sampler2D textureSampler;

uniform float u_edgeVoteThreshold;
uniform float u_exposure;
uniform float u_colorMode;

out vec4 fragColor;

const float CELL_AREA = float(CELL_SIZE * CELL_SIZE);
const vec3 LUMA_WEIGHTS = vec3(0.2126, 0.7152, 0.0722);
const ivec4 DIR_IDS = ivec4(1, 2, 3, 4);

void main() {
    ivec2 base = ivec2(gl_FragCoord.xy) * CELL_SIZE;
    ivec2 maxCoord = textureSize(textureSampler, 0) - 1;

    vec3 colorSum = vec3(0.0);
    vec4 votes = vec4(0.0);   // | \ - /
    float skyCount = 0.0;

    // Limites constantes → loop totalmente desenrolável pelo compilador
    for (int y = 0; y < CELL_SIZE; y++) {
        for (int x = 0; x < CELL_SIZE; x++) {
            vec4 s = texelFetch(textureSampler, min(base + ivec2(x, y), maxCoord), 0);
            colorSum += s.rgb;

            int code = int(s.a * 255.0 + 0.5);
            int sky = code / 5;
            int dir = code - sky * 5;

            skyCount += float(sky);
            votes += vec4(equal(ivec4(dir), DIR_IDS)); // votação sem branch
        }
    }

    vec3 avgColor = colorSum / CELL_AREA;
    float edgeTotal = votes.x + votes.y + votes.z + votes.w;

    // ─── Escolha do glifo ───
    int glyph;
    bool isEdge = edgeTotal / CELL_AREA >= u_edgeVoteThreshold;

    if (isEdge) {
        int best = 0;
        float bestV = votes.x;
        if (votes.y > bestV) { best = 1; bestV = votes.y; }
        if (votes.z > bestV) { best = 2; bestV = votes.z; }
        if (votes.w > bestV) { best = 3; }
        glyph = LUMA_GLYPH_COUNT + best;
    } else {
        float luma = pow(clamp(dot(avgColor, LUMA_WEIGHTS) * u_exposure, 0.0, 1.0), LUMA_GAMMA);
        glyph = min(int(luma * float(LUMA_GLYPH_COUNT)), LUMA_GLYPH_COUNT - 1);
    }

    // ─── Modo de cor ───
    int mode = int(u_colorMode + 0.5);
    vec3 color;
    if (mode == 1)      color = avgColor / max(max(avgColor.r, max(avgColor.g, avgColor.b)), 1e-4); // Saturada
    else if (mode == 2) color = MONO_GREEN;
    else if (mode == 3) color = MONO_AMBER;
    else                color = avgColor;                                                         // Original

    if (isEdge) color *= EDGE_COLOR_BOOST;

    // ─── Peso do skybox ───
    float modelFraction = 1.0 - skyCount / CELL_AREA;
    color *= mix(SKY_BRIGHTNESS, 1.0, modelFraction);

    // Saída: rgb = cor final da célula | a = índice do glifo / 255
    fragColor = vec4(color, float(glyph) / 255.0);
}
