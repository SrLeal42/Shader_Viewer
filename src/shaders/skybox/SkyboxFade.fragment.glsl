// ─── SkyboxFade: Composição Final ───
void main() {
    vec3 dir = normalize(vPosition);
 
    // ─── Efeitos de Distorção (alteram 'dir' ANTES do sampling) ───

    // Buraco Negro
    if (u_enableBlackhole > 0.5) {
        vec4 bhResult = applyBlackhole(dir, u_time); 
        
        if (bhResult.w < 0.0) {
            outColor = vec4(0.0, 0.0, 0.0, 1.0);
            return;
        }
        
        dir = bhResult.xyz; 
    }

    // Warp
    if (u_enableWarp > 0.5) {
        dir = applyWarp(dir, u_time);
    }
 
    // ─── Amostragem do Cubemap ───

    vec3 finalBackground;
    
    if (u_visibility > 0.0) {
        vec3 dir1 = dir;
        vec3 dir2 = dir;
    
        if (u_rotationX1 != 0.0) dir1 = rotateX(dir1, u_rotationX1);
        if (u_rotationY1 != 0.0) dir1 = rotateY(dir1, u_rotationY1);
        if (u_rotationX2 != 0.0) dir2 = rotateX(dir2, u_rotationX2);
        if (u_rotationY2 != 0.0) dir2 = rotateY(dir2, u_rotationY2);
    
        vec4 color1 = textureLod(texture1, dir1, u_blur1 * MAX_LOD);
        vec4 color2 = textureLod(texture2, dir2, u_blur2 * MAX_LOD);
    
        vec3 skyColor = mix(color1.rgb, color2.rgb, u_mix);
    
        finalBackground = mix(u_bgColor, skyColor, u_visibility);
    } else {
        finalBackground = u_bgColor;
    }

    if (u_enableMeteors > 0.5) {
        finalBackground += applyMeteors(dir, u_time);
    }

    if (u_enableClouds > 0.5) {
        finalBackground = applyClouds(dir, u_time, finalBackground);
    }

    if (u_enableAurora > 0.5) {
        finalBackground += applyAurora(dir, u_time);
    }

    if (u_enableFireworks > 0.5) {
        finalBackground += applyFireworks(dir, u_time);
    }


    if (u_enableLightning > 0.5) {
        finalBackground = applyLightning(u_time, finalBackground);
    }

    // ─── Pós-Processamento (Exposição, Tonemapping, Saturação) ───
 
    finalBackground *= u_exposure;
    
    vec3 tonemapped = finalBackground / (1.0 + finalBackground);
    finalBackground = mix(finalBackground, tonemapped, u_tonemapStrength);
    
    float luma = dot(finalBackground, vec3(0.2126, 0.7152, 0.0722));
    finalBackground = mix(vec3(luma), finalBackground, u_saturation);
    
    outColor = vec4(finalBackground, 1.0);
}
