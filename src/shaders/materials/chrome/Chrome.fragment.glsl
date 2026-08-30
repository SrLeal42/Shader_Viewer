#version 300 es
precision highp float;

in vec3 vNormal;
in vec3 vWorldPosition;
out vec4 outColor;

// Screen-space reflection (RTT da cena — captura efeitos dinâmicos)
uniform sampler2D u_sceneTexture;
uniform vec2 u_screenSize;

// Cubemap do ambiente (reflexão estática/fallback)
uniform samplerCube u_envCubemap;
uniform float u_hasEnvCubemap;

// Parâmetros do Cromo
uniform vec3  u_metalColor;
uniform float u_roughness;
uniform float u_reflectivity;
uniform float u_fresnelPower;

// Normal Perturbation (Metal Líquido)
uniform float u_noiseScale;
uniform float u_noiseStrength;
uniform float u_noiseSpeed;

// Separação por Luminância
uniform float u_lumThreshold;

// Global
uniform vec3 u_cameraPos;
uniform float u_time;

// Luzes
uniform vec3 u_hemiDir;
uniform vec3 u_hemiColor;
uniform vec3 u_pointPos;
uniform vec3 u_pointColor;

// ─── Simplex Noise 3D (Ashima Arts / Stefan Gustavson) ───
vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 permute(vec4 x) { return mod289(((x * 34.0) + 10.0) * x); }
vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }

float snoise(vec3 v) {
    const vec2 C = vec2(1.0 / 6.0, 1.0 / 3.0);
    const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);

    vec3 i = floor(v + dot(v, C.yyy));
    vec3 x0 = v - i + dot(i, C.xxx);

    vec3 g = step(x0.yzx, x0.xyz);
    vec3 l = 1.0 - g;
    vec3 i1 = min(g.xyz, l.zxy);
    vec3 i2 = max(g.xyz, l.zxy);

    vec3 x1 = x0 - i1 + C.xxx;
    vec3 x2 = x0 - i2 + C.yyy;
    vec3 x3 = x0 - D.yyy;

    i = mod289(i);
    vec4 p = permute(permute(permute(
        i.z + vec4(0.0, i1.z, i2.z, 1.0))
      + i.y + vec4(0.0, i1.y, i2.y, 1.0))
      + i.x + vec4(0.0, i1.x, i2.x, 1.0));

    float n_ = 0.142857142857;
    vec3 ns = n_ * D.wyz - D.xzx;

    vec4 j = p - 49.0 * floor(p * ns.z * ns.z);

    vec4 x_ = floor(j * ns.z);
    vec4 y_ = floor(j - 7.0 * x_);

    vec4 x = x_ * ns.x + ns.yyyy;
    vec4 y = y_ * ns.x + ns.yyyy;
    vec4 h = 1.0 - abs(x) - abs(y);

    vec4 b0 = vec4(x.xy, y.xy);
    vec4 b1 = vec4(x.zw, y.zw);

    vec4 s0 = floor(b0) * 2.0 + 1.0;
    vec4 s1 = floor(b1) * 2.0 + 1.0;
    vec4 sh = -step(h, vec4(0.0));

    vec4 a0 = b0.xzyw + s0.xzyw * sh.xxyy;
    vec4 a1 = b1.xzyw + s1.xzyw * sh.zzww;

    vec3 p0 = vec3(a0.xy, h.x);
    vec3 p1 = vec3(a0.zw, h.y);
    vec3 p2 = vec3(a1.xy, h.z);
    vec3 p3 = vec3(a1.zw, h.w);

    vec4 norm = taylorInvSqrt(vec4(dot(p0, p0), dot(p1, p1), dot(p2, p2), dot(p3, p3)));
    p0 *= norm.x;
    p1 *= norm.y;
    p2 *= norm.z;
    p3 *= norm.w;

    vec4 m = max(0.5 - vec4(dot(x0, x0), dot(x1, x1), dot(x2, x2), dot(x3, x3)), 0.0);
    m = m * m;
    return 105.0 * dot(m * m, vec4(dot(p0, x0), dot(p1, x1), dot(p2, x2), dot(p3, x3)));
}

void main() {
    vec3 normal = normalize(vNormal);
    vec3 viewDir = normalize(u_cameraPos - vWorldPosition);

    // ─── Normal Perturbation (Metal Líquido) ───
    // Gera micro-ondulações orgânicas na superfície usando ruído animado
    vec3 noisePos = vWorldPosition * u_noiseScale + u_time * u_noiseSpeed;
    vec3 perturbation = vec3(
        snoise(noisePos),
        snoise(noisePos + vec3(43.0, 17.0, 31.0)),
        snoise(noisePos + vec3(71.0, 53.0, 97.0))
    );
    vec3 perturbedNormal = normalize(normal + perturbation * u_noiseStrength);

    // ─── Reflexão Screen-Space (RTT — captura efeitos dinâmicos do Skybox) ───
    vec2 screenUV = gl_FragCoord.xy / u_screenSize;
    vec2 distortion = perturbedNormal.xy * 0.15;
    vec2 reflectedScreenUV = clamp(screenUV + distortion, 0.001, 0.999);
    vec3 rttColor = texture(u_sceneTexture, reflectedScreenUV).rgb;

    // ─── Reflexão Cubemap (estática — cobre ângulos que o RTT não alcança) ───
    vec3 reflectDir = reflect(-viewDir, perturbedNormal);
    vec3 cubemapColor = vec3(0.0);

    if (u_hasEnvCubemap > 0.5) {
        float lod = u_roughness * 7.0;
        cubemapColor = textureLod(u_envCubemap, reflectDir, lod).rgb;
    }

    // ─── Combina RTT + Cubemap ───
    // max() garante que sempre usemos a fonte mais brilhante de cada canal
    vec3 reflectedColor = max(rttColor, cubemapColor) * u_reflectivity;

    // ─── Separação por Luminância ───
    // Áreas brilhantes do reflexo → reflexo puro (espelho)
    // Áreas escuras do reflexo → cor base do metal (prata, ouro, etc.)
    float lum = dot(reflectedColor, vec3(0.2126, 0.7152, 0.0722));
    float lumMask = smoothstep(u_lumThreshold - 0.1, u_lumThreshold + 0.1, lum);
    vec3 chromeColor = mix(u_metalColor, reflectedColor, lumMask);

    // ─── Fresnel (Schlick) — Brilho de Borda ───
    float cosTheta = max(dot(perturbedNormal, viewDir), 0.0);
    float fresnel = pow(1.0 - cosTheta, u_fresnelPower);
    fresnel = clamp(fresnel, 0.0, 1.0);

    // Bordas ficam mais reflexivas (reflexo puro sobrepõe a cor metálica)
    chromeColor = mix(chromeColor, reflectedColor, fresnel);

    // ─── Specular Highlights (Blinn-Phong) ───
    float shininess = mix(1024.0, 8.0, u_roughness);

    // Hemisférica
    vec3 hemiDir = normalize(u_hemiDir);
    vec3 hemiHalf = normalize(hemiDir + viewDir);
    float hemiSpec = pow(max(dot(perturbedNormal, hemiHalf), 0.0), shininess);
    vec3 specular = hemiSpec * u_hemiColor;

    // Point light
    vec3 toPoint = u_pointPos - vWorldPosition;
    float pointDist = length(toPoint);
    vec3 pointDir = toPoint / pointDist;
    float attenuation = 1.0 / (1.0 + 0.1 * pointDist * pointDist);
    vec3 pointHalf = normalize(pointDir + viewDir);
    float pointSpec = pow(max(dot(perturbedNormal, pointHalf), 0.0), shininess);
    specular += pointSpec * u_pointColor * attenuation;

    chromeColor += specular;

    // ─── Output ───
    outColor = vec4(chromeColor, 1.0);
    
}
