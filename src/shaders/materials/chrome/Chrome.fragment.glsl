#version 300 es
precision highp float;

#include<lighting>
#include<specular>
#include<noise>

in vec3 vNormal;
in vec3 vWorldPosition;
out vec4 outColor;

// Screen-space reflection (RTT)
uniform sampler2D u_sceneTexture;
uniform vec2 u_screenSize;

// Cubemap do ambiente
uniform samplerCube u_envCubemap;
uniform float u_hasEnvCubemap;

// Parâmetros do Cromo
uniform vec3  u_metalColor;
uniform float u_roughness;
uniform float u_reflectivity;
uniform float u_fresnelPower;

// Normal Perturbation (Metal Líquido)
uniform float u_noiseScale;
uniform float u_noiseStrength;
uniform float u_noiseSpeed;

// Luminância
uniform float u_lumThreshold;

// Global
uniform vec3 u_cameraPos;
uniform float u_time;

void main() {
    vec3 normal = normalize(vNormal);
    vec3 viewDir = normalize(u_cameraPos - vWorldPosition);

    // ─── Normal Perturbation (usa snoise do noise.glsl) ───
    vec3 noisePos = vWorldPosition * u_noiseScale + u_time * u_noiseSpeed;
    vec3 perturbation = vec3(
        snoise(noisePos),
        snoise(noisePos + vec3(43.0, 17.0, 31.0)),
        snoise(noisePos + vec3(71.0, 53.0, 97.0))
    );
    vec3 perturbedNormal = normalize(normal + perturbation * u_noiseStrength);

    // ─── Reflexão Screen-Space (RTT) ───
    vec2 screenUV = gl_FragCoord.xy / u_screenSize;
    vec2 distortion = perturbedNormal.xy * 0.15;
    vec2 reflectedScreenUV = clamp(screenUV + distortion, 0.001, 0.999);
    vec3 rttColor = texture(u_sceneTexture, reflectedScreenUV).rgb;

    // ─── Reflexão Cubemap ───
    vec3 reflectDir = reflect(-viewDir, perturbedNormal);
    vec3 cubemapColor = vec3(0.0);

    if (u_hasEnvCubemap > 0.5) {
        float lod = u_roughness * 7.0;
        cubemapColor = textureLod(u_envCubemap, reflectDir, lod).rgb;
    }

    vec3 reflectedColor = max(rttColor, cubemapColor) * u_reflectivity;

    // ─── Separação por Luminância (usa getLuminance do lighting.glsl) ───
    float lum = getLuminance(reflectedColor);
    float lumMask = smoothstep(u_lumThreshold - 0.1, u_lumThreshold + 0.1, lum);
    vec3 chromeColor = mix(u_metalColor, reflectedColor, lumMask);

    // ─── Fresnel (Schlick) ───
    float cosTheta = max(dot(perturbedNormal, viewDir), 0.0);
    float fresnel = pow(1.0 - cosTheta, u_fresnelPower);
    fresnel = clamp(fresnel, 0.0, 1.0);
    chromeColor = mix(chromeColor, reflectedColor, fresnel);

    // ─── Specular (usa computeSpecular do specular.glsl) ───
    float shininess = mix(1024.0, 8.0, u_roughness);

    vec3 hemiDir = normalize(u_hemiDir);
    float hemiSpec = computeSpecular(perturbedNormal, viewDir, hemiDir, shininess);
    vec3 specular = hemiSpec * u_hemiColor;

    PointLightData pl = getPointLight(vWorldPosition);
    float pointSpec = computeSpecular(perturbedNormal, viewDir, pl.direction, shininess);
    specular += pointSpec * u_pointColor * pl.attenuation;

    chromeColor += specular;

    outColor = vec4(chromeColor, 1.0);
}
