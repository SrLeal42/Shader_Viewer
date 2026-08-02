#version 300 es
precision highp float;

uniform sampler2D textureSampler; // Cena original (cor)
uniform sampler2D depthSampler;   // Profundidade (r)
uniform sampler2D normalSampler;  // Normais (rgb)

uniform vec2 u_screenSize;
uniform float u_depthThreshold;
uniform float u_normalThreshold;
uniform vec3 u_edgeColor;
uniform float u_edgeWidth;
uniform float u_showOnlyEdges;

in vec2 vUV;
out vec4 fragColor;

// Lê o valor de profundidade
float getDepth(vec2 uv) {
    return texture(depthSampler, uv).r;
}

// Lê a normal e remaneja para [-1, 1] se necessário
vec3 getNormal(vec2 uv) {
    return texture(normalSampler, uv).xyz * 2.0 - 1.0;
}

void main() {
    vec2 texel = u_edgeWidth / u_screenSize;

    // --- SOBEL NA PROFUNDIDADE ---
    float d_tl = getDepth(vUV + vec2(-texel.x,  texel.y));
    float d_tm = getDepth(vUV + vec2(    0.0,   texel.y));
    float d_tr = getDepth(vUV + vec2( texel.x,  texel.y));
    float d_ml = getDepth(vUV + vec2(-texel.x,      0.0));
    float d_mr = getDepth(vUV + vec2( texel.x,      0.0));
    float d_bl = getDepth(vUV + vec2(-texel.x, -texel.y));
    float d_bm = getDepth(vUV + vec2(    0.0,  -texel.y));
    float d_br = getDepth(vUV + vec2( texel.x, -texel.y));

    float d_gx = -d_tl - 2.0*d_ml - d_bl + d_tr + 2.0*d_mr + d_br;
    float d_gy = -d_tl - 2.0*d_tm - d_tr + d_bl + 2.0*d_bm + d_br;
    float depthEdge = sqrt(d_gx*d_gx + d_gy*d_gy);
    float isDepthEdge = step(u_depthThreshold, depthEdge);

    // --- SOBEL NAS NORMAIS ---
    vec3 n_tl = getNormal(vUV + vec2(-texel.x,  texel.y));
    vec3 n_tm = getNormal(vUV + vec2(    0.0,   texel.y));
    vec3 n_tr = getNormal(vUV + vec2( texel.x,  texel.y));
    vec3 n_ml = getNormal(vUV + vec2(-texel.x,      0.0));
    vec3 n_mr = getNormal(vUV + vec2( texel.x,      0.0));
    vec3 n_bl = getNormal(vUV + vec2(-texel.x, -texel.y));
    vec3 n_bm = getNormal(vUV + vec2(    0.0,  -texel.y));
    vec3 n_br = getNormal(vUV + vec2( texel.x, -texel.y));

    vec3 n_gx = -n_tl - 2.0*n_ml - n_bl + n_tr + 2.0*n_mr + n_br;
    vec3 n_gy = -n_tl - 2.0*n_tm - n_tr + n_bl + 2.0*n_bm + n_br;
    float normalEdge = sqrt(dot(n_gx, n_gx) + dot(n_gy, n_gy));
    float isNormalEdge = step(u_normalThreshold, normalEdge);

    // COMBINAÇÃO: É borda se for borda de profundidade OU de normal
    float isEdge = max(isDepthEdge, isNormalEdge);

    // OUTPUT
    vec3 original = texture(textureSampler, vUV).rgb;
    vec3 background = mix(original, vec3(1.0), u_showOnlyEdges);
    vec3 result = mix(background, u_edgeColor, isEdge);

    fragColor = vec4(result, 1.0);
}
