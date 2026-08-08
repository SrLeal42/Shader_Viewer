#version 300 es
precision highp float;

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

// Luzes
uniform vec3 u_hemiDir;
uniform vec3 u_hemiColor;
uniform vec3 u_pointPos;
uniform vec3 u_pointColor;

void main() {
    vec3 normal = normalize(vNormal);
    vec3 viewDir = normalize(u_cameraPos - vWorldPosition);

    // Cálculo das Luzes Base
    float hemiNdotL = dot(normal, normalize(u_hemiDir));
    vec3 hemiLight = max(hemiNdotL, 0.0) * u_hemiColor;

    vec3 pointDir = normalize(u_pointPos - vWorldPosition);
    float pointDist = length(u_pointPos - vWorldPosition);
    float attenuation = 1.0 / (1.0 + 0.1 * pointDist * pointDist);
    
    float pointNdotL = dot(normal, pointDir);
    vec3 pointLight = max(pointNdotL, 0.0) * u_pointColor * attenuation;

    vec3 totalLight = hemiLight + pointLight;
    
    // Toon Diffuse (Quantização preservando a cor da luz)
    float luminance = dot(totalLight, vec3(0.2126, 0.7152, 0.0722));
    float quantized = floor(luminance * u_levels) / u_levels;
    quantized = max(quantized, u_shadowMin); // Sombra base
    
    // Escala a cor da luz pela quantização
    float scale = quantized / max(luminance, 0.001);
    vec3 toonDiffuse = u_color * totalLight * scale;

    // Specular Toon (Brilho Estilizado)
    vec3 halfDir = normalize(pointDir + viewDir);
    float spec = pow(max(dot(normal, halfDir), 0.0), u_glossiness);
    // Smoothstep bem curto para criar o "corte" do anime sem aliasing
    float toonSpec = smoothstep(u_specThreshold - 0.01, u_specThreshold, spec);
    vec3 specContrib = u_specColor * toonSpec * u_specIntensity;

    // Rim Light (Brilho nas bordas)
    float rim = 1.0 - max(dot(viewDir, normal), 0.0);
    rim = smoothstep(u_rimMin, u_rimMax, rim);
    vec3 rimContrib = u_rimColor * rim * u_rimIntensity;

    // Composição Final
    outColor = vec4(toonDiffuse + specContrib + rimContrib, 1.0);
}
