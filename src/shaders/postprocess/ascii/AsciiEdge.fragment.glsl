uniform sampler2D textureSampler; // Cena
uniform sampler2D depthSampler;   // DepthNormalManager (R)
uniform sampler2D normalSampler;  // DepthNormalManager (RGB)

uniform float u_depthThreshold;
uniform float u_normalThreshold;

in vec2 vUV;
out vec4 fragColor;

const float PI = 3.14159265;
const float SKY_DEPTH = 0.9999;

float D(vec2 o) { return texture(depthSampler, vUV + o).r; }
vec3  N(vec2 o) { return texture(normalSampler, vUV + o).xyz * 2.0 - 1.0; }

void main() {
    vec2 t = 1.0 / vec2(textureSize(depthSampler, 0));

    // ─── Sobel na profundidade (eixo Y para cima) ───
    float d_tl = D(vec2(-t.x,  t.y)), d_tm = D(vec2(0.0,  t.y)), d_tr = D(vec2( t.x,  t.y));
    float d_ml = D(vec2(-t.x, 0.0)),                             d_mr = D(vec2( t.x, 0.0));
    float d_bl = D(vec2(-t.x, -t.y)), d_bm = D(vec2(0.0, -t.y)), d_br = D(vec2( t.x, -t.y));

    float dgx = (d_tr + 2.0 * d_mr + d_br) - (d_tl + 2.0 * d_ml + d_bl);
    float dgy = (d_tl + 2.0 * d_tm + d_tr) - (d_bl + 2.0 * d_bm + d_br);

    // ─── Sobel nas normais ───
    vec3 n_tl = N(vec2(-t.x,  t.y)), n_tm = N(vec2(0.0,  t.y)), n_tr = N(vec2( t.x,  t.y));
    vec3 n_ml = N(vec2(-t.x, 0.0)),                             n_mr = N(vec2( t.x, 0.0));
    vec3 n_bl = N(vec2(-t.x, -t.y)), n_bm = N(vec2(0.0, -t.y)), n_br = N(vec2( t.x, -t.y));

    vec3 ngx = (n_tr + 2.0 * n_mr + n_br) - (n_tl + 2.0 * n_ml + n_bl);
    vec3 ngy = (n_tl + 2.0 * n_tm + n_tr) - (n_bl + 2.0 * n_bm + n_br);

    // Magnitudes (mesma semântica do Edge.fragment.glsl → thresholds intercambiáveis)
    float depthMag  = length(vec2(dgx, dgy));
    float nJxx = dot(ngx, ngx), nJyy = dot(ngy, ngy), nJxy = dot(ngx, ngy);
    float normalMag = sqrt(nJxx + nJyy);

    int dir = 0;
    if (depthMag > u_depthThreshold || normalMag > u_normalThreshold) {
        // Tensor de estrutura combinado: cada fonte normalizada pelo seu threshold.
        // Dá a orientação do gradiente módulo π, sem ambiguidade de sinal (ideal p/ normais vec3).
        float wd = 1.0 / (u_depthThreshold * u_depthThreshold);
        float wn = 1.0 / (u_normalThreshold * u_normalThreshold);
        float Jxx = dgx * dgx * wd + nJxx * wn;
        float Jyy = dgy * dgy * wd + nJyy * wn;
        float Jxy = dgx * dgy * wd + nJxy * wn;

        float theta = 0.5 * atan(2.0 * Jxy, Jxx - Jyy + 1e-8);   // (-π/2, π/2)
        float a = mod(theta + PI * 0.125, PI);                   // (0, π), buckets centrados

        // Gradiente ⟂ borda: 0 → '|'  1 → '\'  2 → '-'  3 → '/'
        dir = 1 + min(int(a / (PI * 0.25)), 3);
    }

    int sky = texture(depthSampler, vUV).r >= SKY_DEPTH ? 1 : 0;

    // Saída: rgb = cor original | a = código empacotado (dir 0–4 + céu × 5) / 255
    fragColor = vec4(texture(textureSampler, vUV).rgb, float(dir + sky * 5) / 255.0);

}
