uniform float u_inflateAmount;
uniform float u_inflateSpeed;

void applyVertexEffect(inout vec3 pos, inout vec3 norm, float time) {
    float pulse = sin(time * u_inflateSpeed) * 0.5 + 0.5;
    vec3 dir = pos / max(length(pos), 0.001); 
    
    pos += dir * pulse * u_inflateAmount;
}
