import * as B from '../BabylonAdapter';

import { type SkyboxEffectId, MAX_ACTIVE_EFFECTS, SkyboxEffectsConfigs } from '../../configs/SkyboxEffectsConfigs';
import type { EventBus } from '../core/EventBus';

export class SkyboxEffectManager {
    private material: B.ShaderMaterial;

    // Lista ordenada (Fila/FIFO) dos efeitos ativos
    private activeQueue: SkyboxEffectId[] = [];

    private eventBus: EventBus;

    constructor(skyboxMaterial: B.ShaderMaterial, eventBus: EventBus) {
        this.material = skyboxMaterial;
        this.eventBus = eventBus;

        eventBus.on('UI_SKYBOX_EFFECT_TOGGLED', (id, enabled) => {
            this.setEffect(id, enabled);
        });
    }

    public setEffect(effect: SkyboxEffectId, enabled: boolean) {
        const index = this.activeQueue.indexOf(effect);

        if (enabled) {
            if (index !== -1) return; // Já está ativo

            // Se atingimos o limite, desligamos o mais antigo
            if (this.activeQueue.length >= MAX_ACTIVE_EFFECTS) {
                const oldest = this.activeQueue.shift();
                if (oldest) {
                    this.applyToShader(oldest, false);
                    this.eventBus.emit('FORCE_SKYBOX_EFFECT_OFF', oldest); // Avisa a UI
                }
            }

            this.activeQueue.push(effect);
            this.applyToShader(effect, true);

        } else {
            if (index !== -1) {
                this.activeQueue.splice(index, 1);
                this.applyToShader(effect, false);
            }
        }
    }

    private applyToShader(effect: SkyboxEffectId, state: boolean) {
        // Liga/Desliga o efeito principal
        const uniformName = `u_enable${effect.charAt(0).toUpperCase() + effect.slice(1)}`;
        this.material.setFloat(uniformName, state ? 1.0 : 0.0);

        // Se estiver ligando, injeta os valores configurados no arquivo de Config
        if (state) {

            const config = SkyboxEffectsConfigs[effect];
            if (config.uniforms) {
                for (const [key, value] of Object.entries(config.uniforms)) {
                    if (typeof value === 'number') {
                        this.material.setFloat(key, value);
                    } else if (Array.isArray(value) && value.length === 3) {
                        this.material.setColor3(key, new B.Color3(value[0], value[1], value[2]));
                    }
                }
            }

        }


    }

    public updateTime(elapsed: number) {
        if (this.activeQueue.length > 0) {
            this.material.setFloat("u_time", elapsed);
        }
    }

    public dispose() {
        this.activeQueue = [];
    }

}
