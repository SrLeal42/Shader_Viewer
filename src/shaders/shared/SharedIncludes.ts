import * as B from '@babylonjs/core';

import lightingSource from './lighting.glsl?raw';
import specularSource from './specular.glsl?raw';
import noiseSource from './noise.glsl?raw';

import vertexBaseSource from '../vertex/base/vertex_base.glsl?raw';
import vertexUVSource from '../vertex/base/vertex_uv.glsl?raw';

// ─── Constants: Snippets compartilhados para o Fragment Shader ───

export const SharedInclude = {
    LIGHTING: 'lighting',
    SPECULAR: 'specular',
    NOISE: 'noise',
} as const;

export type SharedInclude = typeof SharedInclude[keyof typeof SharedInclude];

interface SharedIncludeDefinition {
    source: string;
    uniforms: string[];
}

export const SHARED_INCLUDE_REGISTRY: Record<SharedInclude, SharedIncludeDefinition> = {
    [SharedInclude.LIGHTING]: {
        source: lightingSource,
        uniforms: [
            'u_hemiDir', 'u_hemiColor', 'u_pointPos', 'u_pointColor',
            'u_shX', 'u_shY', 'u_shZ',
            'u_shXX', 'u_shYY', 'u_shZZ',
            'u_shXY', 'u_shYZ', 'u_shZX',
        ],
    },
    [SharedInclude.SPECULAR]: {
        source: specularSource,
        uniforms: [],
    },
    [SharedInclude.NOISE]: {
        source: noiseSource,
        uniforms: [],
    },
};

// ─── Constants: Vertex Shaders base ───

export const BaseVertex = {
    STANDARD: 'standard',
    UV: 'uv',
} as const;

export type BaseVertex = typeof BaseVertex[keyof typeof BaseVertex];

interface BaseVertexDefinition {
    source: string;
    attributes: string[];
}

export const BASE_VERTEX_REGISTRY: Record<BaseVertex, BaseVertexDefinition> = {
    [BaseVertex.STANDARD]: {
        source: vertexBaseSource,
        attributes: ['position', 'normal'],
    },
    [BaseVertex.UV]: {
        source: vertexUVSource,
        attributes: ['position', 'normal', 'uv'],
    },
};

// ─── Helpers ───

/** 
 * Chama essa função uma vez para registrar
 * todos os snippets no sistema nativo de includes do BabylonJS.
 */
export function registerSharedIncludesInBabylon() {
    for (const [key, def] of Object.entries(SHARED_INCLUDE_REGISTRY)) {
        B.Effect.IncludesShadersStore[key] = def.source;
    }
}

/** Resolve apenas a lista de uniforms para o array do ShaderMaterial */
export function resolveSharedUniforms(includes?: SharedInclude[]): string[] {
    if (!includes || includes.length === 0) return [];
    const uniformSet = new Set<string>();
    for (const include of includes) {
        const def = SHARED_INCLUDE_REGISTRY[include as SharedInclude];
        for (const u of def.uniforms) {
            uniformSet.add(u);
        }
    }
    return Array.from(uniformSet);
}

/** Resolve o vertex shader base (default: STANDARD) */
export function resolveBaseVertex(baseVertex?: BaseVertex): BaseVertexDefinition {
    return BASE_VERTEX_REGISTRY[baseVertex ?? BaseVertex.STANDARD];
}