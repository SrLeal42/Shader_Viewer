import * as B from '@babylonjs/core';
import { VertexEffects } from '../../shaders/Registry';

const DEPTH_VERTEX = `
    precision highp float;

    #include<vertexEffect>

    attribute vec3 position;
    attribute vec3 normal;

    uniform mat4 worldViewProjection;
    uniform mat4 world;
    uniform float u_time;

    varying float vDepth;

    void main() {
        vec3 deformed = applyVertexEffect(position, normal, u_time);
        vec4 clipPos = worldViewProjection * vec4(deformed, 1.0);
        vDepth = clipPos.z / clipPos.w;
        gl_Position = clipPos;
    }
`;

const DEPTH_FRAGMENT = `
    precision highp float;

    varying float vDepth;

    void main() {
        gl_FragColor = vec4(vDepth, vDepth, vDepth, 1.0);
    }
`;

export function createDepthEffectMaterial(scene: B.Scene): B.ShaderMaterial {
    B.Effect.ShadersStore['depthEffectVertexShader'] = DEPTH_VERTEX;
    B.Effect.ShadersStore['depthEffectFragmentShader'] = DEPTH_FRAGMENT;

    // Coleta todos os nomes de uniforms de todos os efeitos de vértice
    const effectUniforms: string[] = [];
    for (const [, config] of Object.entries(VertexEffects)) {
        for (const uName of config.extraUniforms) {
            if (!effectUniforms.includes(uName)) {
                effectUniforms.push(uName);
            }
        }
    }

    return new B.ShaderMaterial('depthEffectMat', scene, 'depthEffect', {
        attributes: ['position', 'normal'],
        uniforms: ['worldViewProjection', 'world', 'u_time', ...effectUniforms],
    });
}
