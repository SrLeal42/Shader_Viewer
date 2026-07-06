precision highp float;

// Attributes
attribute vec3 position;
attribute vec3 normal;

// Uniforms do Babylon (nomes padrão)
uniform mat4 worldViewProjection;
uniform mat4 world;

// Varyings para o fragment
varying vec3 vNormal;
varying vec3 vWorldPosition;

void main() {
    vNormal = normalize(mat3(world) * normal);
    vWorldPosition = (world * vec4(position, 1.0)).xyz;
    gl_Position = worldViewProjection * vec4(position, 1.0);
}
