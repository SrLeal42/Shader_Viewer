import * as B from '@babylonjs/core';
import type { UIConfig } from '../types/UI';

// --- Model Config: unifica registry + configuração + loader ---

export interface ModelConfig extends UIConfig {
    label: string; // Label para o seletor de modelo (ex: 'Esfera')
    loader: (scene: B.Scene) => Promise<B.AbstractMesh>;
}

export const ModelConfigs = {
    sphere: {
        label: 'Esfera',
        title: 'Propriedades da Esfera',
        loader: async (scene: B.Scene) =>
            B.MeshBuilder.CreateSphere('sphere', { diameter: 2, segments: 32 }, scene),
        parameters: [
            {
                property: 'scale',
                label: 'Escala Global',
                type: 'float' as const,
                defaultValue: 0.5,
                min: 0.1, max: 3, step: 0.1,
                onApply: (mesh: B.AbstractMesh, value: number) => {
                    mesh.scaling.setAll(value);
                }
            }
        ]
    },
    box: {
        label: 'Caixa',
        title: 'Propriedades da Caixa',
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
            }
        ]
    },
    suzanne: {
        label: 'Suzanne',
        title: 'Propriedades da Suzanne',
        loader: async (scene: B.Scene) => {
            const result = await B.SceneLoader.ImportMeshAsync(
                '',           // nome do mesh (vazio = todos)
                '/models/',   // path da pasta
                'suzanne.glb', // nome do arquivo
                scene
            );

            const root = result.meshes[0];

            return root;
        },
        parameters: [
            {
                property: 'scale',
                label: 'Escala Global',
                type: 'float' as const,
                defaultValue: 1,
                min: 0.1, max: 3, step: 0.1,
                onApply: (mesh: B.AbstractMesh, value: number) => {
                    const baseScale = 0.6; // O modelo precisa ser reduzido 10x

                    mesh.scaling.setAll(baseScale * value); // Escala absoluta baseada no fator
                }
            }
        ]
    },
    candelabra: {
        label: 'Candelabra',
        title: 'Propriedades do Candelabro',
        loader: async (scene: B.Scene) => {
            const result = await B.SceneLoader.ImportMeshAsync(
                '',
                '/models/',
                'candelabra.glb',
                scene
            );

            const root = result.meshes[0];

            return root;
        },
        parameters: [
            {
                property: 'scale',
                label: 'Escala Global',
                type: 'float' as const,
                defaultValue: 1,
                min: 0.1, max: 5, step: 0.1,
                onApply: (mesh: B.AbstractMesh, value: number) => {
                    const baseScale = 0.02;

                    mesh.scaling.setAll(baseScale * value);
                }
            }
        ]
    },

} as const satisfies Record<string, ModelConfig>;

export type ModelId = keyof typeof ModelConfigs;
