uniform float u_glitchIntensity;
uniform float u_glitchSpeed;
uniform float u_glitchSlices;

float rand(vec2 co){
    return fract(sin(dot(co.xy ,vec2(12.9898,78.233))) * 43758.5453);
}

void applyVertexEffect(inout vec3 pos, inout vec3 norm, float time) {
    float sliceY = floor(pos.y * u_glitchSlices);
    float timeStep = floor(time * u_glitchSpeed);
    
    float noise = rand(vec2(sliceY, timeStep));
    
    // 85% de chance de NÃO acontecer o glitch no frame atual
    if (noise > 0.85) {
        float shift = (rand(vec2(sliceY, timeStep + 1.0)) - 0.5) * 2.0;
        pos.x += shift * u_glitchIntensity;
    }
}
