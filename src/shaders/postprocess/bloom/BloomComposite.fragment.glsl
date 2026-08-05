#version 300 es
precision highp float;

uniform sampler2D textureSampler; // Saída do pass horizontal (bright pixels h-blurred)
uniform sampler2D origSampler;    // Cena original (capturada antes do bloom)

uniform float u_intensity;
uniform float u_radius;
uniform vec2 u_screenSize;

in vec2 vUV;
out vec4 fragColor;

// Mesmos pesos do pass horizontal para manter a simetria do kernel 2D
const int KERNEL_RADIUS = 3;
const float weights[4] = float[4](0.2854, 0.2222, 0.1050, 0.0301);

void main() {
    // Tamanho de 1 pixel na vertical
    float texelY = 1.0 / u_screenSize.y;

    vec3 bloom = vec3(0.0);

    for (int i = -KERNEL_RADIUS; i <= KERNEL_RADIUS; i++) {
        float offset = float(i) * texelY * u_radius;
        bloom += texture(textureSampler, vUV + vec2(0.0, offset)).rgb * weights[abs(i)];
    }

    // Composição: cena original + bloom
    vec3 original = texture(origSampler, vUV).rgb;
    vec3 finalColor = original + bloom * u_intensity;

    fragColor = vec4(finalColor, 1.0);
}
