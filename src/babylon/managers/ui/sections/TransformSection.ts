import type { FolderApi } from 'tweakpane';

import type { FrustumLimits } from '../../../../types/Camera';


export class TransformSection {
    private folder: FolderApi;

    constructor(folder: FolderApi) {
        this.folder = folder;
    }

    public setup(
        state: { pos: { x: number, y: number, z: number }, rot: { x: number, y: number, z: number }, physics: boolean },
        onPhysicsChange: (enabled: boolean) => void,
        onTransformChange: () => void,
        limits: FrustumLimits
    ) {

        // Remove todos os controles antigos de dentro da pasta raiz para não duplicar no resize
        const children = [...this.folder.children];
        for (const child of children) {
            child.dispose();
        }

        const folder = this.folder;

        // Cria os controles visuais
        const physicsBinding = folder.addBinding(state, 'physics', { label: 'Física Ativada' })
            .on('change', (ev) => {
                onPhysicsChange(ev.value);
                posBinding.disabled = ev.value;
                rotBinding.disabled = ev.value;
            });
        physicsBinding.element.title = "Ativa a gravidade e colisões. Desativa o movimento manual do objeto.";

        const posBinding = folder.addBinding(state, 'pos', {
            label: 'Posição',
            disabled: state.physics,
            x: { min: limits.minX, max: limits.maxX, step: 0.1 },
            y: { min: limits.minY, max: limits.maxY, step: 0.1 },
            z: { min: limits.minZ, max: limits.maxZ, step: 0.1 },
            format: (v) => v.toFixed(3),
        }).on('change', () => {
            if (!state.physics) onTransformChange();
        });
        posBinding.element.title = "Move o objeto no espaço 3D.";

        const rotBinding = folder.addBinding(state, 'rot', {
            label: 'Rotação',
            disabled: state.physics,
            x: { step: 1 },
            y: { step: 1 },
            z: { step: 1 }
        }).on('change', () => {
            if (!state.physics) onTransformChange();
        });
        rotBinding.element.title = "Gira o objeto nos eixos X, Y e Z (em graus).";

        folder.addBlade({ view: 'separator' });

        return {
            refresh: () => {
                posBinding.refresh();
                rotBinding.refresh();
            }
        };
    }


    public dispose(): void {
        // A pasta raiz (this.folder) é gerenciada pelo UIManager.
        // Como o TransformSection reaproveita a pasta, não precisamos dar dispose() nela aqui,
        // apenas removeríamos os filhos se fosse necessário, mas o setup() já faz isso.
    }
}
