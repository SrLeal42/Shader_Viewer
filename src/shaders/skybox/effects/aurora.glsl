#ifndef AURORA_GLSL
#define AURORA_GLSL

vec3 applyAurora(vec3 dir, float time) {
    float h = smoothstep(-0.1, 0.3, dir.y) * smoothstep(0.9, 0.5, dir.y);
    
    float angle = atan(dir.z, dir.x);
    
    float curtain1 = noise(vec3(
        angle * 3.0 + time * u_auroraSpeed * 0.5,
        dir.y * 0.5,
        time * u_auroraSpeed
    ));
    
    float curtain2 = noise(vec3(
        angle * 7.0 - time * u_auroraSpeed * 1.2,
        dir.y * 0.3 + time * u_auroraSpeed * 0.3,
        time * u_auroraSpeed * 0.8
    ));
    
    float shape = curtain1 * 0.7 + curtain2 * 0.3;
    
    float intensity = smoothstep(u_auroraThreshold, u_auroraThreshold + 0.3, shape) * h;
    
    float heightFactor = smoothstep(0.0, 1.0, dir.y);
    vec3 auroraColor = mix(u_auroraColor, u_auroraColorTop, heightFactor);
    
    return auroraColor * intensity * u_auroraIntensity;
}

#endif
