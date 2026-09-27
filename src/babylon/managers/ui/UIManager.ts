import { Pane } from 'tweakpane';

import type { EventBus } from '../../core/EventBus';

import type { UIConfig, UIParameter } from '../../../types/UI';
import type { ShaderUniform } from '../../../shaders/Types';
import type { FrustumLimits } from '../../../types/Camera';

import type { InteractionId } from '../../../configs/InteractionConfigs';
import type { LightModeId } from '../../../configs/LightConfigs';

import { ModelSection } from './sections/ModelSection';
import { TransformSection } from './sections/TransformSection';
import { ShaderSection } from './sections/ShaderSection';
import { VertexEffectSection } from './sections/VertexEffectSection';
import { PostProcessSection } from './sections/PostProcessSection';
import { EnvironmentSection } from './sections/EnvironmentSection';
import { LightSection } from './sections/LightSection';
import { InteractionSection } from './sections/InteractionSection';


export class UIManager {
    private paneRight: Pane;
    private paneLeft: Pane;

    private eventBus: EventBus;

    private modelSection: ModelSection;
    private transformSection: TransformSection;
    private shaderSection: ShaderSection;
    private vertexEffectSection: VertexEffectSection;
    private postProcessSection: PostProcessSection;
    private environmentSection: EnvironmentSection;
    private lightSection: LightSection;
    private interactionSection: InteractionSection;

    constructor(tweakpaneRightContainer: HTMLElement, tweakpaneLeftContainer: HTMLElement, eventBus: EventBus) {
        this.eventBus = eventBus;

        this.paneRight = new Pane({ container: tweakpaneRightContainer });
        this.paneLeft = new Pane({ container: tweakpaneLeftContainer });

        // ─── Painel Direito ───
        const rootModel = this.paneRight.addFolder({ title: 'Modelo 3D' });
        const rootTransform = this.paneRight.addFolder({ title: 'Transformação' });
        const rootShader = this.paneRight.addFolder({ title: 'Materiais' });
        const rootVertexFx = this.paneRight.addFolder({ title: 'Efeitos de Vértice' });

        // ─── Painel Esquerdo ───
        this.environmentSection = new EnvironmentSection(this.paneLeft);
        this.lightSection = new LightSection(this.paneLeft);
        this.interactionSection = new InteractionSection(this.paneLeft);
        this.postProcessSection = new PostProcessSection(this.paneLeft);

        this.modelSection = new ModelSection(rootModel);
        this.transformSection = new TransformSection(rootTransform);
        this.shaderSection = new ShaderSection(rootShader);
        this.vertexEffectSection = new VertexEffectSection(rootVertexFx);


        this.eventBus.on('FORCE_POST_PROCESS_OFF', (id) => this.forceUncheckPostProcess(id));

    }


    // ─── Delegações para o painel Direito ───

    public setupGlobalControls(): void {
        this.modelSection.setup((id) => this.eventBus.emit('UI_MODEL_SELECTED', id));
    }

    public setupTransformControls(
        state: { pos: { x: number, y: number, z: number }, rot: { x: number, y: number, z: number }, physics: boolean },
        limits: FrustumLimits
    ) {
        return this.transformSection.setup(
            state,
            (enabled) => this.eventBus.emit('UI_PHYSICS_TOGGLED', enabled),
            () => this.eventBus.emit('UI_TRANSFORM_CHANGED'),
            limits
        );
    }

    public setupShaderControls(): void {
        this.shaderSection.setup((id) => this.eventBus.emit('UI_SHADER_SELECTED', id));
    }

    public setupVertexEffectControls(): void {
        this.vertexEffectSection.setup((id) => this.eventBus.emit('UI_VERTEX_EFFECT_SELECTED', id));
    }

    public setupPostProcessControls(): void {
        this.postProcessSection.setup((id, enabled) => this.eventBus.emit('UI_POST_PROCESS_TOGGLED', id, enabled));
    }

    public forceUncheckPostProcess(id: string): void {
        this.postProcessSection.forceUncheck(id);
    }

    public buildDynamicPanel(
        config: UIConfig,
        targetProxy: Record<string, unknown>,
        onChange: (param: UIParameter, value: unknown) => void
    ): void {
        this.modelSection.buildDynamicPanel(config, targetProxy, onChange);
    }

    public buildShaderPanel(
        title: string,
        uniforms: ShaderUniform[],
        targetProxy: Record<string, unknown>,
        onChange: (uniform: ShaderUniform, value: unknown) => void
    ): void {
        this.shaderSection.buildPanel(title, uniforms, targetProxy, onChange);
    }

    public buildVertexEffectPanel(
        title: string,
        uniforms: ShaderUniform[],
        targetProxy: Record<string, unknown>,
        onChange: (uniform: ShaderUniform, value: unknown) => void
    ): void {
        this.vertexEffectSection.buildPanel(title, uniforms, targetProxy, onChange);
    }

    public clearVertexEffectPanel(): void {
        this.vertexEffectSection.clearPanel();
    }

    public buildPostProcessPanel(
        id: string,
        title: string,
        uniforms: ShaderUniform[],
        targetProxy: Record<string, unknown>,
        onChange: (uniform: ShaderUniform, value: unknown) => void
    ): void {
        this.postProcessSection.buildPanel(id, title, uniforms, targetProxy, onChange);
    }

    public clearPostProcessPanel(id: string): void {
        this.postProcessSection.clearPanel(id);
    }

    public clearShaderPanel(): void {
        this.shaderSection.clearPanel();
    }


    // ─── Delegações para o painel Esquerdo ───

    public setupInteractionControls(initialInteraction: InteractionId): void {
        this.interactionSection.setup(initialInteraction, (id) => this.eventBus.emit('UI_INTERACTION_SELECTED', id));
    }

    public setupSkyboxControls(): void {
        this.environmentSection.setupSkybox(
            (id) => this.eventBus.emit('UI_SKYBOX_SELECTED', id),
            (color) => this.eventBus.emit('UI_SKYBOX_COLOR_CHANGED', color)
        );
    }

    public setupSkyboxEffectsControls(): void {
        this.environmentSection.setupEffects(
            (id, enabled) => this.eventBus.emit('UI_SKYBOX_EFFECT_TOGGLED', id, enabled),
            (callback) => {
                this.eventBus.on('FORCE_SKYBOX_EFFECT_OFF', callback);
            }
        );
    }

    public setupWeatherControls(): void {
        this.environmentSection.setupWeather((presetId) => this.eventBus.emit('UI_WEATHER_SELECTED', presetId));
    }

    public setupLightControls(initialMode: LightModeId): void {
        this.lightSection.setup(
            initialMode,
            (mode) => this.eventBus.emit('UI_LIGHT_MODE_CHANGED', mode),
            (dir, color, intensity) => this.eventBus.emit('UI_LIGHT_HEMI_CHANGED', dir, color, intensity),
            (pos, color, intensity, anim, speed, freq, showHelper) => this.eventBus.emit('UI_LIGHT_POINT_CHANGED', pos, color, intensity, anim, speed, freq, showHelper)
        );
    }

    // ─── Lifecycle ───

    public dispose(): void {
        this.modelSection.dispose();
        this.transformSection.dispose();
        this.shaderSection.dispose();
        this.vertexEffectSection.dispose();
        this.postProcessSection.dispose();
        this.environmentSection.dispose();
        this.lightSection.dispose();
        this.interactionSection.dispose();

        this.paneRight.dispose();
        this.paneLeft.dispose();
    }
}
