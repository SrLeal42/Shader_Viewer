uniform float u_inflateAmount;
uniform float u_inflateSpeed;

vec3 applyVertexEffect(vec3 pos, vec3 normal, float time) {
    float pulse = sin(time * u_inflateSpeed) * 0.5 + 0.5;
    return pos + normal * pulse * u_inflateAmount;
}
