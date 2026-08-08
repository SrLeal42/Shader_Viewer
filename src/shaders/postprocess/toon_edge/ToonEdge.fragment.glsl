#version 300 es
precision highp float;

uniform sampler2D textureSampler; // Cena colorida
uniform sampler2D depthSampler;   // Mapa de Profundidade

uniform vec2 u_screenSize;
uniform float u_depthThreshold;
uniform vec3 u_edgeColor;
uniform float u_edgeWidth;

in vec2 vUV;
out vec4 fragColor;

float getDepth(vec2 uv) { return texture(depthSampler, uv).r; }

void main() {
    vec2 texel = u_edgeWidth / u_screenSize;

    // Amostragem em Cruz apenas para Profundidade (Apenas Silhueta Externa)
    float dCenter = getDepth(vUV);
    float dTop    = getDepth(vUV + vec2(0.0, texel.y));
    float dBottom = getDepth(vUV + vec2(0.0, -texel.y));
    float dLeft   = getDepth(vUV + vec2(-texel.x, 0.0));
    float dRight  = getDepth(vUV + vec2(texel.x, 0.0));

    // Diferença total de profundidade
    float depthDiff = abs(dCenter - dTop) + abs(dCenter - dBottom) + abs(dCenter - dLeft) + abs(dCenter - dRight);

    // Threshold
    float isEdge = step(u_depthThreshold, depthDiff);

    vec3 original = texture(textureSampler, vUV).rgb;
    
    // Pinta a borda ou mantém a cor original
    vec3 finalColor = mix(original, u_edgeColor, isEdge);

    fragColor = vec4(finalColor, 1.0);
}
