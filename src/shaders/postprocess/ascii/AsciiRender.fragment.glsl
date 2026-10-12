uniform sampler2D textureSampler;
uniform sampler2D glyphAtlas;

out vec4 fragColor;

void main() {
    ivec2 pixel = ivec2(gl_FragCoord.xy);
    ivec2 cell = pixel / CELL_SIZE;

    // Faixa residual quando a resolução não é múltipla de CELL_SIZE
    if (any(greaterThanEqual(cell, textureSize(textureSampler, 0)))) {
        fragColor = vec4(0.0, 0.0, 0.0, 1.0);
        return;
    }

    vec4 data = texelFetch(textureSampler, cell, 0);
    int glyph = int(data.a * 255.0 + 0.5);
    ivec2 local = pixel - cell * CELL_SIZE;

    float mask = texelFetch(glyphAtlas, ivec2(glyph * CELL_SIZE + local.x, local.y), 0).r;

    fragColor = vec4(data.rgb * mask, 1.0);
}
