#ifndef AURORA_GLSL
#define AURORA_GLSL

// ─── Constantes Artísticas ───
const float HEIGHT_FADE_MIN = -0.1;
const float HEIGHT_FADE_LOW = 0.3;
const float HEIGHT_FADE_HIGH = 0.9;
const float HEIGHT_FADE_MAX = 0.5;
const float CURTAIN1_FREQ = 3.0;
const float CURTAIN1_SPEED_RATIO = 0.5;
const float CURTAIN2_FREQ = 7.0;
const float CURTAIN2_SPEED_RATIO = 1.2;
const float CURTAIN1_WEIGHT = 0.7;
const float CURTAIN2_WEIGHT = 0.3;
const float THRESHOLD_TRANSITION = 0.3;

vec3 applyAurora(vec3 dir, float time) {
    float h = smoothstep(HEIGHT_FADE_MIN, HEIGHT_FADE_LOW, dir.y) * smoothstep(HEIGHT_FADE_HIGH, HEIGHT_FADE_MAX, dir.y);
    
    float angle = atan(dir.z, dir.x);
    
    float curtain1 = noise(vec3(
        angle * CURTAIN1_FREQ + time * u_auroraSpeed * CURTAIN1_SPEED_RATIO,
        dir.y * 0.5,
        time * u_auroraSpeed
    ));
    
    float curtain2 = noise(vec3(
        angle * CURTAIN2_FREQ - time * u_auroraSpeed * CURTAIN2_SPEED_RATIO,
        dir.y * 0.3 + time * u_auroraSpeed * 0.3,
        time * u_auroraSpeed * 0.8
    ));
    
    float shape = curtain1 * CURTAIN1_WEIGHT + curtain2 * CURTAIN2_WEIGHT;
    
    float intensity = smoothstep(u_auroraThreshold, u_auroraThreshold + THRESHOLD_TRANSITION, shape) * h;
    
    float heightFactor = smoothstep(0.0, 1.0, dir.y);
    vec3 auroraColor = mix(u_auroraColor, u_auroraColorTop, heightFactor);
    
    return auroraColor * intensity * u_auroraIntensity;
}

#endif
