uniform float u_waveAmplitude;
uniform float u_waveFrequency;
uniform float u_waveSpeed;

vec3 applyVertexEffect(vec3 pos, vec3 normal, float time) {
    float wave = sin(pos.y * u_waveFrequency + time * u_waveSpeed) * u_waveAmplitude;
    return pos + normal * wave;
}
