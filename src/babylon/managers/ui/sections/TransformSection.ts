import type { Pane, FolderApi } from 'tweakpane';

import type { FrustumLimits } from '../../../../types/Camera';


export class TransformSection {
    private pane: Pane;
    private transformFolder: FolderApi | null = null;

    constructor(pane: Pane) {
        this.pane = pane;
    }

    public setup(
        state: { pos: { x: number, y: number, z: number }, rot: { x: number, y: number, z: number }, physics: boolean },
        onPhysicsChange: (enabled: boolean) => void,
        onTransformChange: () => void,
        limits: FrustumLimits
    ) {

        if (this.transformFolder) {
            this.transformFolder.dispose();
        }

        this.transformFolder = this.pane.addFolder({ title: 'Transformação', index: 1 });
        const folder = this.transformFolder;

        // Cria os controles visuais
        folder.addBinding(state, 'physics', { label: 'Física Ativada' })
            .on('change', (ev) => {
                onPhysicsChange(ev.value);
                posBinding.disabled = ev.value;
                rotBinding.disabled = ev.value;
            });

        const posBinding = folder.addBinding(state, 'pos', {
            label: 'Posição',
            disabled: state.physics,
            x: { min: limits.minX, max: limits.maxX },
            y: { min: limits.minY, max: limits.maxY },
            z: { min: limits.minZ, max: limits.maxZ },
            format: (v) => v.toFixed(3),
        }).on('change', () => {
            if (!state.physics) onTransformChange();
        });


        const rotBinding = folder.addBinding(state, 'rot', {
            label: 'Rotação',
            disabled: state.physics,
            x: { step: 1 },
            y: { step: 1 },
            z: { step: 1 }
        }).on('change', () => {
            if (!state.physics) onTransformChange();
        });

        folder.addBlade({ view: 'separator' });

        return {
            refresh: () => {
                posBinding.refresh();
                rotBinding.refresh();
            }
        };
    }


    public dispose(): void {
        if (this.transformFolder) {
            this.transformFolder.dispose();
            this.transformFolder = null;
        }
    }
}
