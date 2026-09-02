#version 300 es
precision highp float;

#include<lighting>
#include<specular>

in vec3 vNormal;
in vec3 vWorldPosition;
out vec4 outColor;

// Parâmetros da UI
uniform vec3  u_baseColor;
uniform float u_iridescenceStrength;
uniform float u_iridescenceScale;
uniform float u_shininess;

// Global
uniform vec3 u_cameraPos;

// NOTA: Luzes, SH e computeSpecular vêm dos SharedIncludes

// ─── Cosine Palette (Inigo Quilez) ───
vec3 palette(in float t) {
    vec3 a = vec3(0.5, 0.5, 0.5);
    vec3 b = vec3(0.5, 0.5, 0.5);
    vec3 c = vec3(1.0, 1.0, 1.0);
    vec3 d = vec3(0.0, 0.33, 0.67);
    return a + b * cos(6.28318 * (c * t + d));
}

void main() {
    vec3 normal = normalize(vNormal);
    vec3 viewDir = normalize(u_cameraPos - vWorldPosition);

    // ─── Vetores e Intensidades da Luz ───
    vec3 hemiDir = normalize(u_hemiDir);
    float hemiDiff = max(dot(normal, hemiDir), 0.0);
    float hemiIntensity = length(u_hemiColor);

    PointLightData pl = getPointLight(vWorldPosition);
    float pointDiff = max(dot(normal, pl.direction), 0.0);
    float pointIntensity = length(u_pointColor) * pl.attenuation;

    // ─── Iluminação Difusa + Ambiente SH ───
    vec3 ambientSH = evaluateSH(normal);
    vec3 diffuseHemi = u_baseColor * u_hemiColor * (hemiDiff * 0.7 + 0.3);
    vec3 diffusePoint = u_baseColor * u_pointColor * pointDiff * pl.attenuation;
    vec3 diffuse = diffuseHemi + diffusePoint + u_baseColor * ambientSH * 0.3;

    // ─── Efeito Furta-Cor (Iridescence) ───
    float viewAngle = max(dot(normal, viewDir), 0.0);
    
    float lightAngle = 0.0;
    if (hemiIntensity + pointIntensity > 0.0) {
        lightAngle = (hemiDiff * hemiIntensity + pointDiff * pointIntensity) / (hemiIntensity + pointIntensity);
    }
    
    float t = (1.0 - viewAngle) + (lightAngle * 0.5);
    vec3 iridescentColor = palette(t * u_iridescenceScale);

    // Máscara de Luz
    float lightMask = smoothstep(0.1, 0.6, lightAngle);
    float finalStrength = u_iridescenceStrength * lightMask;
    vec3 finalColor = mix(diffuse, diffuse + iridescentColor, finalStrength);

    // ─── Specular (usando computeSpecular do specular.glsl) ───
    float shininess = mix(16.0, 512.0, u_shininess); 

    float hemiSpec = computeSpecular(normal, viewDir, hemiDir, shininess);
    vec3 specular = hemiSpec * u_hemiColor;
    
    float pointSpec = computeSpecular(normal, viewDir, pl.direction, shininess);
    specular += pointSpec * u_pointColor * pl.attenuation;

    finalColor += specular * u_shininess; 

    outColor = vec4(finalColor, 1.0);
}
