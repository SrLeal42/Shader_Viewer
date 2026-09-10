uniform float u_levitationHeight;
uniform float u_levitationSpeed;
uniform float u_levitationRotation;

void applyVertexEffect(inout vec3 pos, inout vec3 norm, float time) {
    float bob = sin(time * u_levitationSpeed) * u_levitationHeight;
    float angle = sin(time * u_levitationSpeed * 0.7) * u_levitationRotation;
    
    float s = sin(angle);
    float c = cos(angle);
    
    float nx = pos.x * c - pos.z * s;
    float nz = pos.x * s + pos.z * c;
    pos.x = nx;
    pos.z = nz;
    pos.y += bob;
    
    float nnx = norm.x * c - norm.z * s;
    float nnz = norm.x * s + norm.z * c;
    norm.x = nnx;
    norm.z = nnz;
}
