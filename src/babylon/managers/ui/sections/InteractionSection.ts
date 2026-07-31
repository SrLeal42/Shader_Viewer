import type { Pane } from 'tweakpane';

import { InteractionConfigs, type InteractionId } from '../../../../configs/InteractionConfigs';


export class InteractionSection {
    private pane: Pane;

    constructor(pane: Pane) {
        this.pane = pane;
    }

    public setup(
        initialInteraction: InteractionId,
        onChange: (id: InteractionId) => void
    ): void {
        const folder = this.pane.addFolder({ title: 'Interações' });

        const params = { tool: initialInteraction };

        const options = Object.fromEntries(
            Object.values(InteractionConfigs).map(cfg => [cfg.label, cfg.id])
        );

        folder.addBinding(params, 'tool', {
            options: options,
            label: 'Interação'
        }).on('change', (ev) => {
            onChange(ev.value as InteractionId);
        });
    }

    public dispose(): void {
        // O folder é gerenciado pelo Pane pai — não precisa de dispose manual
    }
}
