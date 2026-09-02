#ifndef LIGHTING_GLSL
#define LIGHTING_GLSL

// ─── Uniforms de Luz (injetados automaticamente pelo ShaderManager) ───
uniform vec3 u_hemiDir;
uniform vec3 u_hemiColor;
uniform vec3 u_pointPos;
uniform vec3 u_pointColor;

// ─── Spherical Harmonics L2 (iluminação difusa do Skybox) ───
uniform vec3 u_shX;
uniform vec3 u_shY;
uniform vec3 u_shZ;
uniform vec3 u_shXX;
uniform vec3 u_shYY;
uniform vec3 u_shZZ;
uniform vec3 u_shXY;
uniform vec3 u_shYZ;
uniform vec3 u_shZX;

// Avalia a irradiância do ambiente para uma dada normal
vec3 evaluateSH(vec3 n) {
    return max(
        u_shX * n.x + u_shY * n.y + u_shZ * n.z +
        u_shXX * (n.x * n.x) + u_shYY * (n.y * n.y) + u_shZZ * (n.z * n.z) +
        u_shXY * (n.x * n.y) + u_shYZ * (n.y * n.z) + u_shZX * (n.z * n.x),
        vec3(0.0)
    );
}

// Estrutura de resultado de um ponto de luz
struct PointLightData {
    vec3 direction;
    float attenuation;
};

// Calcula direção e atenuação de um ponto de luz
PointLightData getPointLight(vec3 worldPos) {
    vec3 toPoint = u_pointPos - worldPos;
    float dist = length(toPoint);
    return PointLightData(
        toPoint / dist,
        1.0 / (1.0 + 0.1 * dist * dist)
    );
}

// Luminância padrão (Rec. 709)
float getLuminance(vec3 color) {
    return dot(color, vec3(0.2126, 0.7152, 0.0722));
}

#endif
