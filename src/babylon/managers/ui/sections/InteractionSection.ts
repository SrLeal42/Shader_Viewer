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

        const interactionBind = folder.addBinding(params, 'tool', {
            options: options,
            label: 'Interação'
        }).on('change', (ev) => {
            onChange(ev.value as InteractionId);

            const cfg = InteractionConfigs[ev.value as InteractionId];
            if (cfg && cfg.description) {
                interactionBind.element.title = cfg.description;
            }

        });
        const initialCfg = InteractionConfigs[initialInteraction];
        interactionBind.element.title = initialCfg?.description || "Selecione a ferramenta de interação com o modelo.";
    }

    public dispose(): void {
        // O folder é gerenciado pelo Pane pai — não precisa de dispose manual
    }
}
