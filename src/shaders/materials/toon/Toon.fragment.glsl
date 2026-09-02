#version 300 es
precision highp float;

#include<lighting>

in vec3 vNormal;
in vec3 vWorldPosition;
out vec4 outColor;

// Diffuse
uniform vec3 u_color;
uniform float u_levels;
uniform float u_shadowMin;

// Specular
uniform float u_glossiness;
uniform float u_specThreshold;
uniform float u_specIntensity;
uniform vec3 u_specColor;

// Rim Light
uniform float u_rimMin;
uniform float u_rimMax;
uniform float u_rimIntensity;
uniform vec3 u_rimColor;

// Global
uniform float u_time;
uniform vec3 u_cameraPos;

// NOTA: u_hemiDir, u_hemiColor, u_pointPos, u_pointColor, SH
// são declarados automaticamente pelo lighting.glsl (SharedInclude)

void main() {
    vec3 normal = normalize(vNormal);
    vec3 viewDir = normalize(u_cameraPos - vWorldPosition);

    // Cálculo das Luzes Base (usando funções do lighting.glsl)
    float hemiNdotL = dot(normal, normalize(u_hemiDir));
    vec3 hemiLight = max(hemiNdotL, 0.0) * u_hemiColor;

    PointLightData pl = getPointLight(vWorldPosition);
    float pointNdotL = dot(normal, pl.direction);
    vec3 pointLight = max(pointNdotL, 0.0) * u_pointColor * pl.attenuation;

    // Iluminação ambiente do Skybox via Spherical Harmonics
    vec3 ambientSH = evaluateSH(normal);

    vec3 totalLight = hemiLight + pointLight + ambientSH;
    
    // Toon Diffuse (Quantização preservando a cor da luz)
    float luminance = getLuminance(totalLight);
    float quantized = floor(luminance * u_levels) / u_levels;
    quantized = max(quantized, u_shadowMin);
    
    float scale = quantized / max(luminance, 0.001);
    vec3 toonDiffuse = u_color * totalLight * scale;

    // Specular Toon (Brilho Estilizado)
    vec3 halfDir = normalize(pl.direction + viewDir);
    float spec = pow(max(dot(normal, halfDir), 0.0), u_glossiness);
    float toonSpec = smoothstep(u_specThreshold - 0.01, u_specThreshold, spec);
    vec3 specContrib = u_specColor * toonSpec * u_specIntensity;

    // Rim Light (Brilho nas bordas)
    float rim = 1.0 - max(dot(viewDir, normal), 0.0);
    rim = smoothstep(u_rimMin, u_rimMax, rim);
    vec3 rimContrib = u_rimColor * rim * u_rimIntensity;

    // Composição Final
    outColor = vec4(toonDiffuse + specContrib + rimContrib, 1.0);
}
