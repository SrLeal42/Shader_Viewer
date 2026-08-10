#version 300 es
precision highp float;

uniform sampler2D textureSampler;
uniform sampler2D frostSampler;

uniform float u_time;
uniform float u_intensity;

in vec2 vUV;
out vec4 fragColor;

void main() {
    vec3 scene = texture(textureSampler, vUV).rgb;

    vec4 frost = texture(frostSampler, vUV);

    // Vinheta baseada na distância ao centro da tela
    float dist = distance(vUV, vec2(0.5));
    float vignette = smoothstep(0.4, 0.85, dist);

    // Pulsação suave para dar vida ao efeito
    float pulse = 0.85 + 0.15 * sin(u_time * 0.5);

    // Mistura: o gelo aparece apenas nas bordas, com intensidade controlada
    float alpha = frost.a * vignette * u_intensity * pulse;
    vec3 finalColor = mix(scene, frost.rgb, alpha);

    fragColor = vec4(finalColor, 1.0);
}
