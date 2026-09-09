#version 300 es
precision highp float;

#include<lighting>
#include<specular>

in vec3 vNormal;
in vec3 vWorldPosition;
in vec2 vUV;
out vec4 outColor;

uniform sampler2D u_albedo;
uniform float u_hasAlbedo;
uniform vec3 u_cameraPos;
uniform vec3 u_defaultColor;

void main() {
    vec3 normal = normalize(vNormal);
    vec3 viewDir = normalize(u_cameraPos - vWorldPosition);

    // Cor base: textura original (se existir) ou cinza claro padrão
    vec3 baseColor = u_hasAlbedo > 0.5
        ? texture(u_albedo, vUV).rgb
        : u_defaultColor;

    // Iluminação
    vec3 hemiLight = max(dot(normal, normalize(u_hemiDir)), 0.0) * u_hemiColor;
    PointLightData pl = getPointLight(vWorldPosition);
    vec3 pointLight = max(dot(normal, pl.direction), 0.0) * u_pointColor * pl.attenuation;
    vec3 ambientSH = evaluateSH(normal);

    vec3 totalLight = hemiLight + pointLight + ambientSH;
    vec3 diffuse = baseColor * totalLight;

    // Specular (brilho básico)
    float shininess = 64.0;
    float hemiSpec = computeSpecular(normal, viewDir, normalize(u_hemiDir), shininess);
    float pointSpec = computeSpecular(normal, viewDir, pl.direction, shininess);
    vec3 spec = hemiSpec * u_hemiColor + pointSpec * u_pointColor * pl.attenuation;

    outColor = vec4(diffuse + spec * 0.5, 1.0);
}
