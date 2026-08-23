import type { Pane, FolderApi } from 'tweakpane';

import { SkyboxConfigs, type SkyboxId } from '../../../../configs/SkyboxConfigs';
import { SkyboxEffectsConfigs, MAX_ACTIVE_EFFECTS, type SkyboxEffectId } from '../../../../configs/SkyboxEffectsConfigs';

import { EnvironmentConfigs } from '../../../../configs/EnvironmentConfigs';
import { ScenePresets, ACTIVE_PRESET } from '../../../../configs/ScenePresets';

import { WeatherPresets, type WeatherPresetId } from '../../../../configs/weather/WeatherRegistry';

export class EnvironmentSection {
    private pane: Pane;
    private skyboxColorFolder: FolderApi | null = null;

    constructor(pane: Pane) {
        this.pane = pane;
    }

    public setupSkybox(
        onSkyboxChange: (id: SkyboxId | 'color') => void,
        onColorChange: (color: { r: number; g: number; b: number }) => void
    ): void {

        const folder = this.pane.addFolder({ title: 'Ambiente' });

        // Constrói as options dinamicamente: { 'Cor': 'color', 'Estúdio': 'studio', ... }
        const options: Record<string, string> = {};
        for (const [id, config] of Object.entries(SkyboxConfigs)) {
            options[config.label] = id;
        }

        const params = { skybox: ScenePresets[ACTIVE_PRESET].skybox as string };

        const skyboxBinding = folder.addBinding(params, 'skybox', {
            options,
            label: 'Fundo'
        }).on('change', (ev) => {

            const id = ev.value as SkyboxId | 'color';

            onSkyboxChange(id);

            // Mostra/esconde o color picker
            if (this.skyboxColorFolder) {
                this.skyboxColorFolder.hidden = id !== 'color';
            }

        });
        skyboxBinding.element.title = "Altera o plano de fundo.";

        // Sub-folder com color picker (visível apenas quando "Cor" está selecionado)
        const clearColor = EnvironmentConfigs.background.color;
        const colorState = {
            bg: { r: clearColor.r, g: clearColor.g, b: clearColor.b }
        };

        this.skyboxColorFolder = folder.addFolder({ title: 'Cor de Fundo' });

        this.skyboxColorFolder.hidden = params.skybox !== 'color';

        const colorBinding = this.skyboxColorFolder.addBinding(colorState, 'bg', {
            label: 'Cor',
            color: { type: 'float' },
        }).on('change', (ev) => {
            onColorChange(ev.value as { r: number; g: number; b: number });
        });
        colorBinding.element.title = "Cor sólida para o fundo.";

    }


    public setupEffects(
        onEffectToggle: (id: SkyboxEffectId, enabled: boolean) => void,
        registerForceOffCallback: (callback: (id: SkyboxEffectId) => void) => void
    ): void {
        // Criamos uma pasta no painel esquerdo para os efeitos
        const folder = this.pane.addFolder({ title: `Efeitos Ambiente MAX(${MAX_ACTIVE_EFFECTS})` });

        const params: Record<string, boolean> = {};
        const bindings: Record<string, any> = {};

        // Varre o arquivo de Configs que criamos e cria um switch para cada efeito
        for (const [id, config] of Object.entries(SkyboxEffectsConfigs)) {
            const presetEffects = ScenePresets[ACTIVE_PRESET].skyboxEffects;
            const isActive = presetEffects ? presetEffects.includes(id as SkyboxEffectId) : false;

            params[id] = isActive;

            bindings[id] = folder.addBinding(params, id, { label: config.title })
                .on('change', (ev) => {
                    onEffectToggle(id as SkyboxEffectId, ev.value as boolean);
                });

            if (config.description) {
                bindings[id].element.title = config.description;
            }

        }

        // Escuta o "aviso" do Manager caso ele desligue um efeito antigo (Limitação da fila FIFO)
        registerForceOffCallback((effectId) => {
            params[effectId] = false;
            if (bindings[effectId]) {
                bindings[effectId].refresh(); // Faz o Tweakpane desmarcar a caixinha visualmente
            }
        });

    }


    public setupWeather(
        onChange: (presetId: WeatherPresetId | 'none') => void
    ): void {
        const folder = this.pane.addFolder({ title: 'Clima' });

        const options: Record<string, string> = { 'Nenhum': 'none' };
        for (const [id, config] of Object.entries(WeatherPresets)) {
            options[config.label] = id;
        }

        const params = { weather: 'none' as string };

        const binding = folder.addBinding(params, 'weather', {
            options,
            label: 'Efeito de Clima'
        }).on('change', (ev) => {
            onChange(ev.value as WeatherPresetId | 'none');
        });

        binding.element.title = 'Selecione um efeito climático para a cena.';
    }


    public dispose(): void {
        this.skyboxColorFolder = null;
    }
}
