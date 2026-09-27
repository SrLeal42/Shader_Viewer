import * as B from '../BabylonAdapter';

import type { MaterialShaderId, VertexEffectId } from '../../shaders/Registry';
import type { ModelId } from '../../configs/ModelConfigs';
import type { ModelEntity } from '../entities/ModelEntity';
import type { SkyboxId } from '../../configs/SkyboxConfigs';
import type { SkyboxEffectId } from '../../configs/SkyboxEffectsConfigs';
import type { WeatherPresetId } from '../../configs/weather/WeatherRegistry';
import type { LightModeId } from '../../configs/LightConfigs';
import type { InteractionId } from '../../configs/InteractionConfigs';
import type { PostProcessShaderId } from '../../shaders/Registry';
import type { PointAnimationType } from '../../configs/LightConfigs';

export interface AppEvents {
    'MODEL_CHANGED': (mesh: B.AbstractMesh) => void;
    'MODEL_LOADED': (entity: ModelEntity) => void;
    'MATERIAL_SELECTED': (shaderId: MaterialShaderId) => void;
    'VERTEX_EFFECT_SELECTED': (effectId: VertexEffectId) => void;
    'TIME_TICK': (time: number, deltaTime: number) => void;
    'UI_MODEL_SELECTED': (modelId: ModelId) => void;
    'UI_SHADER_SELECTED': (shaderId: MaterialShaderId) => void;
    'UI_VERTEX_EFFECT_SELECTED': (effectId: VertexEffectId) => void;
    'UI_SKYBOX_SELECTED': (id: SkyboxId | 'color') => void;
    'UI_WEATHER_SELECTED': (presetId: WeatherPresetId | 'none') => void;
    'UI_LIGHT_MODE_CHANGED': (mode: LightModeId) => void;
    'UI_INTERACTION_SELECTED': (id: InteractionId) => void;
    'UI_POST_PROCESS_TOGGLED': (id: PostProcessShaderId, enabled: boolean) => void;
    'UI_SKYBOX_EFFECT_TOGGLED': (id: SkyboxEffectId, enabled: boolean) => void;
    'UI_SKYBOX_COLOR_CHANGED': (color: { r: number, g: number, b: number }) => void;
    'UI_PHYSICS_TOGGLED': (enabled: boolean) => void;
    'UI_TRANSFORM_CHANGED': () => void;
    'UI_LIGHT_HEMI_CHANGED': (dir: { x: number, y: number, z: number }, color: { r: number, g: number, b: number }, intensity: number) => void;
    'UI_LIGHT_POINT_CHANGED': (pos: { x: number, y: number, z: number }, color: { r: number, g: number, b: number }, intensity: number, anim: PointAnimationType, speed: number, freq: number, showHelper: boolean) => void;
    'FORCE_POST_PROCESS_OFF': (id: PostProcessShaderId) => void;
    'FORCE_SKYBOX_EFFECT_OFF': (id: SkyboxEffectId) => void;
    'PHYSICS_TICK_UPDATE': () => void;
    'CUBEMAP_CHANGED': (cubemap: B.BaseTexture | null) => void;
}

export class EventBus {
    // Dicionário guardando quem quer ouvir cada evento
    private listeners: { [K in keyof AppEvents]?: Array<AppEvents[K]> } = {};

    // Função para "Ligar o rádio" (Se inscrever)
    public on<K extends keyof AppEvents>(event: K, listener: AppEvents[K]): void {
        if (!this.listeners[event]) {
            this.listeners[event] = [];
        }
        this.listeners[event]!.push(listener);
    }

    // Função para "Gritar no megafone" (Emitir)
    // O TypeScript garante que 'args' seja exatamente o que está no contrato!
    public emit<K extends keyof AppEvents>(event: K, ...args: Parameters<AppEvents[K]>): void {
        const eventListeners = this.listeners[event];
        if (eventListeners) {
            for (const listener of eventListeners) {
                // Chama quem estava ouvindo
                (listener as (...args: any[]) => void)(...args);
            }
        }
    }
}
