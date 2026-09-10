#version 300 es
precision highp float;

#include<vertexEffect>

in vec3 position;
in vec3 normal;

uniform mat4 worldViewProjection;
uniform mat4 world;
uniform float u_time;

out vec3 vNormal;
out vec3 vWorldPosition;

void main() {
    // Criamos variáveis mutáveis a partir dos atributos originais
    vec3 deformedPos = position;
    vec3 deformedNormal = normal;
    
    // O hook agora modifica as duas variáveis por referência (inout)
    applyVertexEffect(deformedPos, deformedNormal, u_time);
    
    // Passamos os dados deformados adiante
    vNormal = normalize(mat3(world) * deformedNormal);
    vWorldPosition = (world * vec4(deformedPos, 1.0)).xyz;
        
    gl_Position = worldViewProjection * vec4(deformedPos, 1.0);
}
