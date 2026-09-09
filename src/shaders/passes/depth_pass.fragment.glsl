#version 300 es
precision highp float;

out vec4 outColor;

void main() {
    // gl_FragCoord.z já contém a profundidade no range linearizado/normalizado [0.0, 1.0]
    float depth = gl_FragCoord.z;
    outColor = vec4(depth, depth, depth, 1.0);
}
