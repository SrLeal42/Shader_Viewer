uniform float u_waveAmplitude;
uniform float u_waveFrequency;
uniform float u_waveSpeed;

void applyVertexEffect(inout vec3 pos, inout vec3 norm, float time) {
    // O ângulo atual da onda
    float angle = pos.y * u_waveFrequency + time * u_waveSpeed;
    
    // Deformação da Posição (Seno)
    float wave = sin(angle) * u_waveAmplitude;
    
    float lenXZ = length(pos.xz);
    if (lenXZ > 0.001) {
        vec2 dir2D = pos.xz / lenXZ;
        pos.x += dir2D.x * wave;
        pos.z += dir2D.y * wave;
        
        // Deformação da Normal (Cosseno / Derivada)
        // A derivada nos diz o quão "inclinada" a onda está neste exato ponto Y
        float slope = cos(angle) * u_waveAmplitude * u_waveFrequency;
        
        // Inclinamos a normal no eixo Y proporcionalmente à força do slope
        // nas direções X e Z.
        norm.y -= (dir2D.x * slope * norm.x) + (dir2D.y * slope * norm.z);
        
        // Como alteramos o tamanho do vetor da normal, precisamos normalizá-lo novamente
        norm = normalize(norm);
    }
}
