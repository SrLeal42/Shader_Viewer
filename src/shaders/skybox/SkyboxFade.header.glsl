// ─── Entradas / Saídas ───
in vec3 vPosition;
out vec4 outColor;

// ─── Uniforms do Skybox Base ───
uniform samplerCube texture1;
uniform samplerCube texture2;
uniform float u_mix;
uniform float u_rotationY1;
uniform float u_rotationY2;
uniform float u_rotationX1;
uniform float u_rotationX2;

uniform float u_visibility;
uniform vec3 u_bgColor;

uniform float u_tonemapStrength;

uniform float u_blur1;
uniform float u_blur2;
uniform float u_exposure;
uniform float u_saturation;
uniform float u_time;

// ─── Flags de Ativação dos Efeitos ───
uniform float u_enableWarp;
uniform float u_enableMeteors;
uniform float u_enableAurora;
uniform float u_enableBlackhole;
uniform float u_enableClouds;
uniform float u_enableLightning;
uniform float u_enableFireworks;
uniform float u_enableRainbow;
uniform float u_enableSunFlare;

// ─── Constantes ───
const float MAX_LOD = 7.0;

// ─── Funções Utilitárias (Rotação) ───
vec3 rotateY(vec3 v, float angle) {
    float s = sin(angle);
    float c = cos(angle);
    return vec3(c * v.x + s * v.z, v.y, -s * v.x + c * v.z);
}

vec3 rotateX(vec3 v, float angle) {
    float s = sin(angle);
    float c = cos(angle);
    return vec3(v.x, c * v.y - s * v.z, s * v.y + c * v.z);
}