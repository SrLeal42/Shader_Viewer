#version 300 es
precision highp float;

in vec3 vNormal;
out vec4 outColor;

void main() {
    vec3 normal = normalize(vNormal);
    // Remapeia a normal do range [-1, 1] para [0, 1] para ser salva na textura RGB
    outColor = vec4(normal * 0.5 + 0.5, 1.0);
}
