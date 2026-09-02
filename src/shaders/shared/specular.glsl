#ifndef SPECULAR_GLSL
#define SPECULAR_GLSL

// Blinn-Phong specular genérico
float computeSpecular(vec3 normal, vec3 viewDir, vec3 lightDir, float shininess) {
    vec3 halfDir = normalize(lightDir + viewDir);
    return pow(max(dot(normal, halfDir), 0.0), shininess);
}

#endif
