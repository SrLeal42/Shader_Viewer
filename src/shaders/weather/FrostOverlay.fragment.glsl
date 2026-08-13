#version 300 es
precision highp float;

uniform sampler2D textureSampler;
uniform sampler2D frostSampler;

uniform float u_time;
uniform float u_intensity;
uniform float u_vignetteInner;
uniform float u_vignetteOuter;
uniform float u_pulseSpeed;
uniform float u_pulseAmplitude;

in vec2 vUV;
out vec4 fragColor;

void main() {
    vec3 scene = texture(textureSampler, vUV).rgb;

    vec4 frost = texture(frostSampler, vUV);

    // Vinheta baseada na distância ao centro da tela (configurável)
    float dist = distance(vUV, vec2(0.5));
    float vignette = smoothstep(u_vignetteInner, u_vignetteOuter, dist);

    // Pulsação suave para dar vida ao efeito (configurável, 0 = desativada)
    float pulse = (1.0 - u_pulseAmplitude) + u_pulseAmplitude * sin(u_time * u_pulseSpeed);

    // Mistura: o efeito aparece apenas nas bordas, com intensidade controlada
    float alpha = frost.a * vignette * u_intensity * pulse;
    vec3 finalColor = mix(scene, frost.rgb, alpha);

    fragColor = vec4(finalColor, 1.0);
}
