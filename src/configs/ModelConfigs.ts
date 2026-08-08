import * as B from '@babylonjs/core';
import type { UIConfig } from '../types/UI';

// --- Model Config: unifica registry + configuração + loader ---

export interface ModelConfig extends UIConfig {
    label: string; // Label para o seletor de modelo (ex: 'Esfera')
    loader: (scene: B.Scene) => Promise<B.AbstractMesh>;
    colliderType: number; // PhysicsShapeType (número para compatibilidade com as const)
    description?: string;
    initialRotation?: B.Vector3; // Em radianos/Euler
}

// Helpers para não duplicar código
const createGLBLoader = (filename: string) => async (scene: B.Scene) => {
    const result = await B.SceneLoader.ImportMeshAsync('', '/models/', filename, scene);
    return result.meshes[0];
};

const createScaleParam = (baseScale: number, maxScale: number = 3) => ({
    property: 'scale',
    label: 'Escala Global',
    type: 'float' as const,
    defaultValue: 1,
    min: 0.1, max: maxScale, step: 0.1,
    onApply: (mesh: B.AbstractMesh, value: number) => {
        mesh.scaling.setAll(baseScale * value);
    }
});

export const ModelConfigs = {
    sphere: {
        label: 'Esfera',
        title: 'Propriedades da Esfera',
        colliderType: B.PhysicsShapeType.SPHERE,
        description: 'Esfera',
        loader: async (scene: B.Scene) =>
            B.MeshBuilder.CreateSphere('sphere', { diameter: 2, segments: 32 }, scene),
        parameters: [
            {
                property: 'scale',
                label: 'Escala Global',
                type: 'float' as const,
                defaultValue: 0.5,
                min: 0.1, max: 2, step: 0.1,
                onApply: (mesh: B.AbstractMesh, value: number) => {
                    mesh.scaling.setAll(value);
                }
            }
        ]
    },
    box: {
        label: 'Caixa',
        title: 'Propriedades da Caixa',
        colliderType: B.PhysicsShapeType.BOX,
        description: 'Caixa',
        loader: async (scene: B.Scene) =>
            B.MeshBuilder.CreateBox('box', { size: 1 }, scene),
        parameters: [
            {
                property: 'width',
                label: 'Largura (X)',
                type: 'float' as const,
                defaultValue: 1,
                min: 0.1, max: 3, step: 0.1,
                onApply: (mesh: B.AbstractMesh, value: number) => { mesh.scaling.x = value; }
            },
            {
                property: 'height',
                label: 'Altura (Y)',
                type: 'float' as const,
                defaultValue: 1,
                min: 0.1, max: 3, step: 0.1,
                onApply: (mesh: B.AbstractMesh, value: number) => { mesh.scaling.y = value; }
            },
            {
                property: 'deepth',
                label: 'Profundide (Z)',
                type: 'float' as const,
                defaultValue: 1,
                min: 0.1, max: 3, step: 0.1,
                onApply: (mesh: B.AbstractMesh, value: number) => { mesh.scaling.z = value; }
            }
        ]
    },
    suzanne: {
        label: 'Suzanne',
        title: 'Propriedades da Suzanne',
        colliderType: B.PhysicsShapeType.CONVEX_HULL,
        // initialRotation: new B.Vector3(0, Math.PI, 0),
        description: 'Suzanner',
        loader: createGLBLoader('suzanne.glb'),
        parameters: [createScaleParam(0.6)]
    },
    candelabra: {
        label: 'Candelabro',
        title: 'Propriedades do Candelabro',
        colliderType: B.PhysicsShapeType.CONVEX_HULL,
        description: 'Candelabro',
        loader: createGLBLoader('candelabra.glb'),
        parameters: [createScaleParam(0.02, 5)]
    },
    axis: {
        label: 'Eixos',
        title: 'Propriedades do Eixos',
        colliderType: B.PhysicsShapeType.CONVEX_HULL,
        description: 'Eixos',
        loader: createGLBLoader('axis.glb'),
        parameters: [createScaleParam(1)]
    },

} as const satisfies Record<string, ModelConfig>;

export type ModelId = keyof typeof ModelConfigs;
