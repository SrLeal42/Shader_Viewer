uniform float u_glitchIntensity;
uniform float u_glitchSpeed;
uniform float u_glitchSlices;

// ─── Constantes Artísticas ───
const float GLITCH_CHANCE_THRESHOLD = 0.85;
const float SHIFT_CENTER = 0.5;
const float SHIFT_SCALE = 2.0;

float rand(vec2 co){
    return fract(sin(dot(co.xy ,vec2(12.9898,78.233))) * 43758.5453);
}

void applyVertexEffect(inout vec3 pos, inout vec3 norm, float time) {
    float sliceY = floor(pos.y * u_glitchSlices);
    float timeStep = floor(time * u_glitchSpeed);
    
    float noise = rand(vec2(sliceY, timeStep));
    
    // 85% de chance de NÃO acontecer o glitch no frame atual
    if (noise > GLITCH_CHANCE_THRESHOLD) {
        float shift = (rand(vec2(sliceY, timeStep + 1.0)) - SHIFT_CENTER) * SHIFT_SCALE;
        pos.x += shift * u_glitchIntensity;
    }
}
