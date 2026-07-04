import * as B from '@babylonjs/core';
import type { UIConfig } from '../types/UI';

export const ModelConfigs: Record<string, UIConfig> = {
    sphere: {
        title: 'Propriedades da Esfera',
        parameters: [
            {
                property: 'scale',
                label: 'Escala Global',
                type: 'float',
                defaultValue: .5,
                min: 0.1, max: 3, step: 0.1,
                // Lógica isolada aqui
                onApply: (mesh: B.Mesh, value: number) => {
                    mesh.scaling = new B.Vector3(value, value, value);
                }
            }
        ]
    },
    box: {
        title: 'Propriedades da Caixa',
        parameters: [
            {
                property: 'width',
                label: 'Largura (X)',
                type: 'float',
                defaultValue: 1,
                min: 0.1, max: 3, step: 0.1,
                onApply: (mesh: B.Mesh, value: number) => { mesh.scaling.x = value; }
            },
            {
                property: 'height',
                label: 'Altura (Y)',
                type: 'float',
                defaultValue: 1,
                min: 0.1, max: 3, step: 0.1,
                onApply: (mesh: B.Mesh, value: number) => { mesh.scaling.y = value; }
            }
        ]
    }
};
