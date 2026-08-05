#version 300 es
precision highp float;

uniform sampler2D textureSampler;

uniform float u_threshold;
uniform float u_radius;
uniform vec2 u_screenSize;

in vec2 vUV;
out vec4 fragColor;

// Pesos Gaussianos pré-calculados para sigma ≈ 1.414 (equivale ao exp(-d²/4) original)
// Kernel de raio 3: indices 0..3 representam distâncias 0, 1, 2, 3 do centro
// Soma total = 1.0 (normalizados)
const int KERNEL_RADIUS = 3;
const float weights[4] = float[4](0.2854, 0.2222, 0.1050, 0.0301);

float luminance(vec3 c) {
    return dot(c, vec3(0.2126, 0.7152, 0.0722));
}

void main() {
    // Tamanho de 1 pixel na horizontal
    float texelX = 1.0 / u_screenSize.x;

    vec3 bloom = vec3(0.0);

    for (int i = -KERNEL_RADIUS; i <= KERNEL_RADIUS; i++) {
        float offset = float(i) * texelX * u_radius;
        vec3 sampleColor = texture(textureSampler, vUV + vec2(offset, 0.0)).rgb;

        // Extrai apenas pixels brilhantes (acima do threshold)
        float lum = luminance(sampleColor);
        float brightness = smoothstep(u_threshold - 0.2, u_threshold + 0.2, lum);

        bloom += sampleColor * brightness * weights[abs(i)];
    }

    fragColor = vec4(bloom, 1.0);
}
