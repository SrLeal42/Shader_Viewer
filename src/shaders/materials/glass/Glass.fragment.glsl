#version 300 es
precision highp float;

in vec3 vNormal;
in vec3 vWorldPosition;
out vec4 outColor;

// Screen-space refraction (RTT da cena)
uniform sampler2D u_sceneTexture;
uniform vec2 u_screenSize;

// Cubemap do ambiente (reflexão)
uniform samplerCube u_envCubemap;
uniform float u_hasEnvCubemap;

// Parâmetros do vidro
uniform float u_ior;
uniform vec3  u_tintColor;
uniform float u_tintDensity;
uniform float u_roughness;
uniform float u_reflectivity;
uniform float u_fresnelPower;
uniform float u_refractionStrength;

// Global
uniform vec3 u_cameraPos;
uniform float u_time;

// Luzes
uniform vec3 u_hemiDir;
uniform vec3 u_hemiColor;
uniform vec3 u_pointPos;
uniform vec3 u_pointColor;

void main() {
    vec3 normal = normalize(vNormal);
    vec3 viewDir = normalize(u_cameraPos - vWorldPosition);

    // ─── Screen-space Refraction ───
    vec2 screenUV = gl_FragCoord.xy / u_screenSize;

    // Distorção baseada na normal da superfície
    vec2 distortion = normal.xy * u_refractionStrength;
    vec2 refractedUV = clamp(screenUV + distortion, 0.001, 0.999);

    vec3 refractedColor = texture(u_sceneTexture, refractedUV).rgb;

    // Aplica tint com densidade controlável
    refractedColor *= mix(vec3(1.0), u_tintColor, u_tintDensity);

    // ─── Cubemap Reflection ───
    vec3 reflectDir = reflect(-viewDir, normal);
    vec3 reflectedColor = vec3(0.0);

    if (u_hasEnvCubemap > 0.5) {
        // roughness → blur do cubemap via LOD
        float lod = u_roughness * 7.0;
        reflectedColor = textureLod(u_envCubemap, reflectDir, lod).rgb;
    }

    // ─── Fresnel (Schlick) ───
    float F0 = pow((u_ior - 1.0) / (u_ior + 1.0), 2.0);
    float cosTheta = max(dot(normal, viewDir), 0.0);
    float fresnel = F0 + (1.0 - F0) * pow(1.0 - cosTheta, u_fresnelPower);
    fresnel *= u_reflectivity;
    fresnel = clamp(fresnel, 0.0, 1.0);

    // Mistura refração e reflexão via Fresnel
    vec3 glassColor = mix(refractedColor, reflectedColor, fresnel);

    // ─── Specular Highlights (Blinn-Phong) ───
    float shininess = mix(512.0, 8.0, u_roughness);

    // Hemisférica
    vec3 hemiDir = normalize(u_hemiDir);
    vec3 hemiHalf = normalize(hemiDir + viewDir);
    float hemiSpec = pow(max(dot(normal, hemiHalf), 0.0), shininess);
    vec3 specular = hemiSpec * u_hemiColor;

    // Point light
    vec3 toPoint = u_pointPos - vWorldPosition;
    float pointDist = length(toPoint);
    vec3 pointDir = toPoint / pointDist;
    float attenuation = 1.0 / (1.0 + 0.1 * pointDist * pointDist);
    vec3 pointHalf = normalize(pointDir + viewDir);
    float pointSpec = pow(max(dot(normal, pointHalf), 0.0), shininess);
    specular += pointSpec * u_pointColor * attenuation;

    glassColor += specular;

    // ─── Output ───
    outColor = vec4(glassColor, 1.0);
}
