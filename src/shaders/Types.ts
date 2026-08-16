import type * as B from '@babylonjs/core';

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

export interface MaterialShaderConfig extends BaseShaderConfig {
    category: 'material';
    create: (scene: B.Scene) => B.ShaderMaterial;
    postProcessDependencies?: string[];
    needsAlbedoTexture?: boolean;
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
