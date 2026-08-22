#version 300 es
precision highp float;

in vec3 position;
in vec3 normal;

uniform mat4 worldViewProjection;
uniform mat4 world;

out vec3 vNormal;
out vec3 vWorldPosition;

void main() {
    vNormal = normalize(mat3(world) * normal);
    vWorldPosition = (world * vec4(position, 1.0)).xyz;
    gl_Position = worldViewProjection * vec4(position, 1.0);
}
