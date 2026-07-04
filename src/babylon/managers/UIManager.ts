import { Pane, FolderApi } from 'tweakpane';
import type { UIConfig, UIParameter } from '../../types/UI';

export class UIManager {
    private pane: Pane;
    private dynamicFolder: FolderApi | null = null;

    constructor() {
        const container = document.getElementById('tweakpane-container');
        this.pane = new Pane({ title: 'Controles Principais', container: container || undefined });
    }

    // 1. Controle Fixo: Trocar de Modelo
    public setupGlobalControls(onModelSelect: (type: 'sphere' | 'box') => void) {
        const params = { model: 'sphere' };

        this.pane.addBinding(params, 'model', {
            options: { Esfera: 'sphere', Caixa: 'box' },
            label: 'Modelo 3D'
        }).on('change', (ev) => {
            onModelSelect(ev.value as 'sphere' | 'box');
        });

        this.pane.addBlade({ view: 'separator' }); // Uma linha divisória
    }

    // 2. Controle Dinâmico: Lê a UIConfig e gera os sliders
    public buildDynamicPanel(
        config: UIConfig,
        targetProxy: any,
        onChange: (param: UIParameter, value: any) => void) {

        if (this.dynamicFolder) {
            this.dynamicFolder.dispose();
        }

        this.dynamicFolder = this.pane.addFolder({ title: config.title });

        config.parameters.forEach((param: UIParameter) => {

            if (targetProxy[param.property] === undefined) {
                targetProxy[param.property] = param.defaultValue;
            }

            this.dynamicFolder!.addBinding(targetProxy, param.property, {
                label: param.label,
                min: param.min,
                max: param.max,
                step: param.step,
            }).on('change', (ev) => {
                onChange(param, ev.value); // Devolve o objeto 'param' inteiro
            });

        });

    }

    public dispose() {
        this.pane.dispose();
    }
}
