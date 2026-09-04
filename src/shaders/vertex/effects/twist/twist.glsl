uniform float u_twistStrength;
uniform float u_twistSpeed;

vec3 applyVertexEffect(vec3 pos, vec3 normal, float time) {
    float angle = pos.y * u_twistStrength + time * u_twistSpeed;
    float s = sin(angle);
    float c = cos(angle);
    return vec3(pos.x * c - pos.z * s, pos.y, pos.x * s + pos.z * c);
}
