#version 300 es
precision highp float;

in vec2 vUV;
out vec4 outColor;

uniform sampler2D textureSampler;
uniform vec2 u_screenSize;
uniform float u_pixelSize;

void main() {
    vec2 grid = u_screenSize / u_pixelSize;
    vec2 snappedUV = floor(vUV * grid) / grid;
    outColor = texture(textureSampler, snappedUV);
}
