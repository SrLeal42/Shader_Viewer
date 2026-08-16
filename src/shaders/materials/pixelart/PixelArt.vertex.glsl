#version 300 es
precision highp float;

in vec3 position;
in vec3 normal;
in vec2 uv;

uniform mat4 worldViewProjection;
uniform mat4 world;

out vec3 vNormal;
out vec3 vWorldPosition;
out vec2 vUV;

void main() {
    vNormal = normalize(mat3(world) * normal);
    vWorldPosition = (world * vec4(position, 1.0)).xyz;
    vUV = uv;
    gl_Position = worldViewProjection * vec4(position, 1.0);
}
