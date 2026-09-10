uniform float u_twistStrength;
uniform float u_twistSpeed;

void applyVertexEffect(inout vec3 pos, inout vec3 norm, float time) {
    float angle = pos.y * u_twistStrength + time * u_twistSpeed;
    float s = sin(angle);
    float c = cos(angle);
    
    // Rotaciona a Posição
    float newX = pos.x * c - pos.z * s;
    float newZ = pos.x * s + pos.z * c;
    pos.x = newX;
    pos.z = newZ;
    
    // Rotaciona a Normal
    float nx = norm.x * c - norm.z * s;
    float nz = norm.x * s + norm.z * c;
    norm.x = nx;
    norm.z = nz;
}
