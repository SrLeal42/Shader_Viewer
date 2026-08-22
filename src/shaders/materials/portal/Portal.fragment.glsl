#version 300 es
precision highp float;

in vec3 vNormal;
in vec3 vWorldPosition;
out vec4 outColor;

// Padrão e camadas
uniform float u_pattern;
uniform float u_layers;

// Animação
uniform float u_scrollSpeed;
uniform float u_rotationSpeed;
uniform float u_parallaxDepth;

// Cores
uniform vec3 u_baseColor;
uniform vec3 u_accentColor;
uniform float u_brightness;

// Bordas
uniform float u_edgeGlow;
uniform vec3 u_edgeColor;

// Global
uniform vec3 u_cameraPos;
uniform float u_time;

// Luzes
uniform vec3 u_hemiDir;
uniform vec3 u_hemiColor;
uniform vec3 u_pointPos;
uniform vec3 u_pointColor;


// ═══════════════════════════════════════
//              NOISE BASE
// ═══════════════════════════════════════

float hash(float n) { return fract(sin(n) * 43758.5453123); }

float hash2(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
}

float noise(vec3 x) {
    vec3 p = floor(x);
    vec3 f = fract(x);
    f = f * f * (3.0 - 2.0 * f);
    float n = p.x + p.y * 57.0 + 113.0 * p.z;
    return mix(
        mix(mix(hash(n),       hash(n+1.0),   f.x),
            mix(hash(n+57.0),  hash(n+58.0),  f.x), f.y),
        mix(mix(hash(n+113.0), hash(n+114.0), f.x),
            mix(hash(n+170.0), hash(n+171.0), f.x), f.y),
        f.z
    );
}

float fbm(vec3 p) {
    float value = 0.0;
    float amplitude = 0.5;
    for (int i = 0; i < 5; i++) {
        value += amplitude * noise(p);
        p *= 2.0;
        amplitude *= 0.5;
    }
    return value;
}

vec2 rotate2D(vec2 uv, float angle) {
    float s = sin(angle), c = cos(angle);
    return mat2(c, -s, s, c) * uv;
}


// ═══════════════════════════════════════
//              PATTERNS
// ═══════════════════════════════════════

// ─── Nebula: Nuvens cósmicas fluidas ───
float nebula(vec2 uv, float time) {
    float n1 = fbm(vec3(uv * 2.0, time * 0.15));
    float n2 = fbm(vec3(uv * 3.5 + 100.0, time * 0.1));
    float combined = n1 * 0.6 + n2 * 0.4;
    return smoothstep(0.25, 0.75, combined);
}

// ─── Particules: Estrelas pulsantes em grid ───
float particules(vec2 uv, float time) {
    vec2 cell = floor(uv * 8.0);
    vec2 f = fract(uv * 8.0) - 0.5;

    float starSeed = hash2(cell);
    float hasStar = step(0.65, starSeed);
    float twinkle = 0.5 + 0.5 * sin(time * 2.0 + starSeed * 6.283);

    float dist = length(f);
    float star = hasStar * smoothstep(0.15, 0.0, dist) * twinkle;

    float bg = noise(vec3(uv * 4.0, time * 0.05)) * 0.15;

    return star + bg;
}

// ─── Vortex: Espiral dimensional ───
float vortex(vec2 uv, float time) {
    float angle = atan(uv.y, uv.x);
    float radius = length(uv);

    float spiral = sin(angle * 3.0 - radius * 6.0 + time * 1.5);
    spiral = smoothstep(-0.2, 0.8, spiral);

    float n = noise(vec3(uv * 3.0, time * 0.3));

    float fade = smoothstep(0.0, 0.3, radius) * smoothstep(3.0, 1.0, radius);

    return spiral * n * fade;
}

// ─── Void: Vazio com partículas esparsas ───
float voidPattern(vec2 uv, float time) {
    float n = noise(vec3(uv * 6.0, time * 0.08));
    n = pow(n, 5.0);

    float flow = fbm(vec3(uv * 1.5 + time * 0.02, time * 0.05));
    flow = smoothstep(0.5, 0.7, flow) * 0.1;

    return n * 0.8 + flow;
}

// ─── Seletor de padrão ───
float getPattern(vec2 uv, float time, float pattern) {
    if (pattern < 0.5) return nebula(uv, time);
    if (pattern < 1.5) return particules(uv, time);
    if (pattern < 2.5) return vortex(uv, time);
    return voidPattern(uv, time);
}


// ═══════════════════════════════════════
//                MAIN
// ═══════════════════════════════════════

void main() {
    vec3 normal = normalize(vNormal);
    vec3 viewDir = normalize(u_cameraPos - vWorldPosition);

    // ─── Multi-Layer Parallax ───
    vec3 portalColor = vec3(0.0);

    for (float i = 0.0; i < 16.0; i += 1.0) {
        if (i >= u_layers) break;

        float layerFactor = i / u_layers;

        // Escala: camadas mais profundas são mais amplas
        float scale = mix(1.5, 4.0, layerFactor);

        // Velocidade: camadas profundas se movem diferente
        float speed = u_scrollSpeed * (0.5 + layerFactor * u_parallaxDepth);

        // Rotação per-layer
        float rot = u_time * u_rotationSpeed * (0.3 + layerFactor * 0.5);

        // UV base a partir da posição mundo
        vec2 uv = vWorldPosition.xy * 0.3 * scale;

        // Rotação
        uv = rotate2D(uv, rot);

        // Scroll em direção única por camada (golden angle)
        float scrollAngle = layerFactor * 6.283 + i * 1.618;
        uv += vec2(cos(scrollAngle), sin(scrollAngle)) * u_time * speed * 0.1;

        // Parallax baseado na direção de visão
        uv += viewDir.xy * layerFactor * u_parallaxDepth * 0.15;

        // Amostra o padrão
        float p = getPattern(uv, u_time + i * 7.13, u_pattern);

        // Cor da camada (gradiente base → accent com profundidade)
        vec3 layerColor = mix(u_baseColor, u_accentColor, layerFactor);

        // Acumula com falloff de profundidade
        float alpha = (1.0 - layerFactor * 0.6) * p;
        portalColor += layerColor * alpha * u_brightness / u_layers;
    }

    // ─── Edge Glow (Fresnel sutil) ───
    float fresnel = 1.0 - max(dot(normal, viewDir), 0.0);
    fresnel = pow(fresnel, 8.0);
    portalColor += u_edgeColor * fresnel * u_edgeGlow;

    // ─── Specular (sutil, para presença com luzes) ───
    float shininess = 64.0;

    vec3 hemiHalf = normalize(normalize(u_hemiDir) + viewDir);
    float hemiSpec = pow(max(dot(normal, hemiHalf), 0.0), shininess);
    portalColor += hemiSpec * u_hemiColor * 0.3;

    vec3 toPoint = u_pointPos - vWorldPosition;
    float pointDist = length(toPoint);
    vec3 pointDir = toPoint / pointDist;
    float attenuation = 1.0 / (1.0 + 0.1 * pointDist * pointDist);
    vec3 pointHalf = normalize(pointDir + viewDir);
    float pointSpec = pow(max(dot(normal, pointHalf), 0.0), shininess);
    portalColor += pointSpec * u_pointColor * attenuation * 0.3;

    outColor = vec4(portalColor, 1.0);
}
