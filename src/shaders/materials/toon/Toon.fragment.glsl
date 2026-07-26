precision highp float;

varying vec3 vNormal;
varying vec3 vWorldPosition;

uniform vec3 u_color;
uniform float u_levels;
uniform float u_time;

// Luzes
uniform vec3 u_hemiDir;
uniform vec3 u_hemiColor;
uniform vec3 u_pointPos;
uniform vec3 u_pointColor;

void main() {
    vec3 normal = normalize(vNormal);

    // Cálculo da Luz Hemisférica (Global)
    float hemiNdotL = dot(normal, normalize(u_hemiDir));
    vec3 hemiLight = max(hemiNdotL, 0.0) * u_hemiColor;

    // Cálculo da Luz de Ponto (Local)
    vec3 pointDir = normalize(u_pointPos - vWorldPosition);
    float pointDist = length(u_pointPos - vWorldPosition);
    
    // Decaimento físico da luz (Atenuação inversamente proporcional ao quadrado da distância)
    float attenuation = 1.0 / (1.0 + 0.1 * pointDist * pointDist);
    
    float pointNdotL = dot(normal, pointDir);
    vec3 pointLight = max(pointNdotL, 0.0) * u_pointColor * attenuation;

    // Soma das luzes e aplicação do efeito Toon (Degraus)
    vec3 totalLight = hemiLight + pointLight;
    
    // Baseado na luminância total para criar os níveis
    float totalIntensity = (totalLight.r + totalLight.g + totalLight.b) / 3.0;
    
    totalIntensity = floor(totalIntensity * u_levels) / u_levels;
    totalIntensity = max(totalIntensity, 0.15); // Sombra base mínima

    vec3 finalColor = u_color * totalIntensity;
    gl_FragColor = vec4(finalColor, 1.0);
}
