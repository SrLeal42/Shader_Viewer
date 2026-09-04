import type * as B from '@babylonjs/core';
import type { SharedInclude, BaseVertex } from './shared/SharedIncludes';

// --- Uniforms expostos ao Tweakpane ---

interface BaseUniform {
    uniform: string;   // Nome do uniform no GLSL (ex: 'u_levels')
    label: string;     // Nome exibido no Tweakpane
    description?: string;
    targetPostProcess?: string;
}

interface FloatUniform extends BaseUniform {
    type: 'float';
    defaultValue: number;
    min: number;
    max: number;
    step: number;
}

interface ColorUniform extends BaseUniform {
    type: 'color';
    defaultValue: { r: number; g: number; b: number };
}

interface BooleanUniform extends BaseUniform {
    type: 'boolean';
    defaultValue: boolean;
}

export interface ListUniform extends BaseUniform {
    type: 'list';
    defaultValue: string | number;
    options: Record<string, string | number>;
}

export interface FolderUniform {
    type: 'folder';
    label: string;
    children: ShaderUniform[];
}

export type ValueUniform = FloatUniform | ColorUniform | BooleanUniform | ListUniform;
export type ShaderUniform = ValueUniform | FolderUniform;


// --- Configs por categoria ---

interface BaseShaderConfig {
    label: string;      // Label para o seletor (ex: 'Toon Shading')
    title: string;      // Título do folder no Tweakpane (ex: 'Parâmetros do Toon')
    description?: string;
    uniforms: ShaderUniform[];
}

// Contexto montado pelo ShaderManager e passado ao create()
export interface MaterialCreateContext {
    vertexSource: string;
    sharedUniforms: string[];
    attributes: string[];
}

export interface MaterialShaderConfig extends BaseShaderConfig {
    category: 'material';
    baseVertex?: BaseVertex;
    vertexSource?: string;              // Vertex customizado (ignora baseVertex)
    sharedIncludes?: SharedInclude[];
    create: (scene: B.Scene, ctx: MaterialCreateContext) => B.ShaderMaterial;
    postProcessDependencies?: string[];
    needsAlbedoTexture?: boolean;
    needsSceneTexture?: boolean;
    needsEnvironmentCubemap?: boolean;
}

export interface MaterialApplyContext {
    getAlbedo?: (mesh: B.AbstractMesh) => B.BaseTexture | null;
    getCubemap?: () => B.BaseTexture | null;
}

export interface VertexEffectConfig {
    label: string;
    description?: string;
    source: string;
    uniforms: ShaderUniform[];
    extraUniforms: string[];
}

export interface PostProcessShaderConfig extends BaseShaderConfig {
    category: 'postprocess';
    create: (scene: B.Scene, camera: B.Camera, getUniforms: () => Record<string, unknown>) => B.PostProcess;
    hidden?: boolean;
}


export function flattenUniforms(uniforms: ShaderUniform[]): ValueUniform[] {
    const result: ValueUniform[] = [];

    for (const u of uniforms) {
        if (u.type === 'folder') {
            result.push(...flattenUniforms(u.children));
        } else {
            result.push(u);
        }
    }

    return result;
}
