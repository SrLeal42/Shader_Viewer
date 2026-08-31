varying vec2 vUV;
uniform sampler2D textureSampler;

// Noise
uniform float u_noiseStrength;
uniform float u_noiseScale;
uniform vec3  u_overlayColor;

// Cor
uniform float u_desaturation;

// Bordas
uniform float u_vignetteStrength;
uniform float u_vignetteRadius;

// Distorção
uniform float u_chromaticAberration;

// Linhas
uniform float u_scanlineStrength;
uniform float u_scanlineFrequency;

// ─── Hash Noise (Ultra leve, sem texturas) ───
float hash(vec2 p) {
    vec3 p3 = fract(vec3(p.xyx) * 0.1031);
    p3 += dot(p3, p3.yzx + 33.33);
    return fract((p3.x + p3.y) * p3.z);
}

void main(void) {

    // ─── Camada 4: Aberração Cromática ───
    // Precisa ser calculada PRIMEIRO porque altera a amostragem da textura
    vec3 color;
    if (u_chromaticAberration > 0.0) {
        float offset = u_chromaticAberration;
        float r = texture2D(textureSampler, vec2(vUV.x - offset, vUV.y)).r;
        float g = texture2D(textureSampler, vUV).g;
        float b = texture2D(textureSampler, vec2(vUV.x + offset, vUV.y)).b;
        color = vec3(r, g, b);
    } else {
        color = texture2D(textureSampler, vUV).rgb;
    }

    // ─── Camada 1: Noise sobre Cor Sólida ───
    if (u_noiseStrength > 0.0) {
        float n = hash(floor(vUV * u_noiseScale));
        // Cria a "camada suja": cor sólida + variação de noise
        vec3 overlay = u_overlayColor + (n - 0.5) * 0.6;
        color = mix(color, overlay, u_noiseStrength);
    }

    // ─── Camada 2: Desaturação ───
    if (u_desaturation > 0.0) {
        float luminance = dot(color, vec3(0.299, 0.587, 0.114));
        color = mix(color, vec3(luminance), u_desaturation);
    }

    // ─── Camada 3: Vinheta ───
    if (u_vignetteStrength > 0.0) {
        vec2 center = vUV - 0.5;
        float dist = length(center);
        float vignette = smoothstep(u_vignetteRadius, u_vignetteRadius + 0.4, dist);
        color *= 1.0 - vignette * u_vignetteStrength;
    }

    // ─── Camada 5: Scanlines ───
    if (u_scanlineStrength > 0.0) {
        float scanline = sin(vUV.y * u_scanlineFrequency) * 0.5 + 0.5;
        color *= 1.0 - u_scanlineStrength * (1.0 - scanline);
    }

    gl_FragColor = vec4(color, 1.0);
}
