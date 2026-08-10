#version 300 es
precision highp float;

uniform sampler2D textureSampler;
uniform sampler2D depthSampler;

uniform vec3 u_fogColor;
uniform float u_fogDensity;
uniform float u_maxOpacity;
uniform float u_cameraMinZ;
uniform float u_cameraMaxZ;

in vec2 vUV;
out vec4 fragColor;

// Converte a profundidade não-linear do WebGL para distância em unidades
float linearizeDepth(float depth) {
    float zNdc = 2.0 * depth - 1.0;
    return (2.0 * u_cameraMaxZ * u_cameraMinZ) / (u_cameraMaxZ + u_cameraMinZ - zNdc * (u_cameraMaxZ - u_cameraMinZ));
}

void main() {
    vec3 sceneColor = texture(textureSampler, vUV).rgb;
    float depthVal = texture(depthSampler, vUV).r;
    
    // Calcula a distância real do pixel
    float distance = linearizeDepth(depthVal);
    
    // Fator Exponencial Quadrático (Menos névoa perto da lente, mais névoa no fundo)
    float fogFactor = 1.0 - exp(-pow(distance * u_fogDensity, 2.0));
    
    // Limita a densidade máxima para garantir a visibilidade do fundo
    fogFactor = clamp(fogFactor, 0.0, u_maxOpacity);
    
    vec3 finalColor = mix(sceneColor, u_fogColor, fogFactor);
    fragColor = vec4(finalColor, 1.0);
}
