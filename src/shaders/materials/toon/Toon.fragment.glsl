precision highp float;

varying vec3 vNormal;
varying vec3 vWorldPosition;

// Uniforms controlados pelo Tweakpane
uniform vec3 u_color;
uniform float u_levels;
uniform float u_time;

// Direção da luz (fixa por agora)
const vec3 lightDir = normalize(vec3(0.0, 1.0, 0.0));

void main() {
    // Cálculo de intensidade difusa
    float NdotL = dot(normalize(vNormal), lightDir);
    float intensity = max(NdotL, 0.0);

    // Quantiza a intensidade em "degraus" (efeito toon)
    intensity = floor(intensity * u_levels) / u_levels;

    // Garante que mesmo a sombra mais escura tenha alguma visibilidade
    intensity = max(intensity, 0.15);

    vec3 finalColor = u_color * intensity;
    gl_FragColor = vec4(finalColor, 1.0);
}
