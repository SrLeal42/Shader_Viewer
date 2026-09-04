import { Pane } from 'tweakpane';

import type { UIConfig, UIParameter } from '../../../types/UI';
import type { ShaderUniform } from '../../../shaders/Types';
import type { FrustumLimits } from '../../../types/Camera';

import type { ModelId } from '../../../configs/ModelConfigs';
import type { InteractionId } from '../../../configs/InteractionConfigs';
import type { SkyboxId } from '../../../configs/SkyboxConfigs';
import type { SkyboxEffectId } from '../../../configs/SkyboxEffectsConfigs';
import type { LightModeId, PointAnimationType } from '../../../configs/LightConfigs';
import type { MaterialShaderId, PostProcessShaderId, VertexEffectId } from '../../../shaders/Registry';
import type { WeatherPresetId } from '../../../configs/weather/WeatherRegistry';

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

    private modelSection: ModelSection;
    private transformSection: TransformSection;
    private shaderSection: ShaderSection;
    private vertexEffectSection: VertexEffectSection;
    private postProcessSection: PostProcessSection;
    private environmentSection: EnvironmentSection;
    private lightSection: LightSection;
    private interactionSection: InteractionSection;

    constructor(tweakpaneRightContainer: HTMLElement, tweakpaneLeftContainer: HTMLElement) {
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
    }


    // ─── Delegações para o painel Direito ───

    public setupGlobalControls(onModelSelect: (id: ModelId) => void): void {
        this.modelSection.setup(onModelSelect);
    }

    public setupTransformControls(
        state: { pos: { x: number, y: number, z: number }, rot: { x: number, y: number, z: number }, physics: boolean },
        onPhysicsChange: (enabled: boolean) => void,
        onTransformChange: () => void,
        limits: FrustumLimits
    ) {
        return this.transformSection.setup(state, onPhysicsChange, onTransformChange, limits);
    }

    public setupShaderControls(
        onMaterialSelect: (id: MaterialShaderId | 'none') => void
    ): void {
        this.shaderSection.setup(onMaterialSelect);
    }

    public setupVertexEffectControls(
        onEffectChange: (id: VertexEffectId) => void
    ): void {
        this.vertexEffectSection.setup(onEffectChange);
    }

    public setupPostProcessControls(
        onPostProcessToggle: (id: PostProcessShaderId, enabled: boolean) => void
    ): void {
        this.postProcessSection.setup(onPostProcessToggle);
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

    public setupInteractionControls(
        initialInteraction: InteractionId,
        onChange: (id: InteractionId) => void
    ): void {
        this.interactionSection.setup(initialInteraction, onChange);
    }

    public setupSkyboxControls(
        onSkyboxChange: (id: SkyboxId | 'color') => void,
        onColorChange: (color: { r: number; g: number; b: number }) => void
    ): void {
        this.environmentSection.setupSkybox(onSkyboxChange, onColorChange);
    }

    public setupSkyboxEffectsControls(
        onEffectToggle: (id: SkyboxEffectId, enabled: boolean) => void,
        registerForceOffCallback: (callback: (id: SkyboxEffectId) => void) => void
    ): void {
        this.environmentSection.setupEffects(onEffectToggle, registerForceOffCallback);
    }

    public setupWeatherControls(
        onChange: (presetId: WeatherPresetId | 'none') => void
    ): void {
        this.environmentSection.setupWeather(onChange);
    }

    public setupLightControls(
        initialMode: LightModeId,
        onModeChange: (mode: LightModeId) => void,
        onHemiChange: (dir: { x: number, y: number, z: number }, color: { r: number, g: number, b: number }, intensity: number) => void,
        onPointChange: (pos: { x: number, y: number, z: number }, color: { r: number, g: number, b: number }, intensity: number, anim: PointAnimationType, speed: number, freq: number, showHelper: boolean) => void
    ): void {
        this.lightSection.setup(initialMode, onModeChange, onHemiChange, onPointChange);
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
