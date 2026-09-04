#version 300 es
precision highp float;

#include<vertexEffect>

in vec3 position;
in vec3 normal;
in vec2 uv;

uniform mat4 worldViewProjection;
uniform mat4 world;
uniform float u_time;

out vec3 vNormal;
out vec3 vWorldPosition;
out vec2 vUV;

void main() {
    vec3 deformed = applyVertexEffect(position, normal, u_time);
    vNormal = normalize(mat3(world) * normal);
    vWorldPosition = (world * vec4(deformed, 1.0)).xyz;
    vUV = uv;
    gl_Position = worldViewProjection * vec4(deformed, 1.0);
}
